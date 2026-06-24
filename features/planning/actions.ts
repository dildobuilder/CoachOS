"use server";

import { isRedirectError } from "next/dist/client/components/redirect";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTrainerProfile } from "@/features/trainer/queries";
import {
  applyPatternSchema,
  assignPatternSchema,
  createPlanFromTemplateSchema,
  patternExerciseUpdateSchema,
  patternSetSchema,
  planPatternSchema,
  plannedExerciseUpdateSchema,
  plannedSetSchema,
  schedulePlannedWorkoutSchema,
  savePlanTemplateSchema,
  trainingPlanSchema
} from "@/features/planning/schemas";
import { getTrainingPlanTemplate } from "@/features/planning/queries";
import { validateIntensityValue } from "@/features/workouts/schemas";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { getReadableErrorMessage, isTransientNetworkError } from "@/lib/errors";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

const conflictMessage = "На это время уже запланировано событие. Выберите другое время.";

function planFormDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    starts_on: formData.get("starts_on"),
    duration_weeks: formData.get("duration_weeks"),
    training_weekdays: formData.getAll("training_weekdays"),
    split_type: formData.get("split_type") || "custom",
    notes: formData.get("notes")
  };
}

function setFormDataToObject(formData: FormData) {
  return {
    weight: formData.get("weight"),
    reps: formData.get("reps"),
    intensity_value: formData.get("intensity_value"),
    notes: formData.get("notes"),
    set_count: formData.get("set_count") || 1
  };
}

function scheduleFormDataToObject(formData: FormData) {
  return {
    date: formData.get("date"),
    starts_at_time: formData.get("starts_at_time"),
    duration_hours: formData.get("duration_hours"),
    title: formData.get("title"),
    notes: formData.get("notes")
  };
}

function patternFormDataToObject(formData: FormData) {
  return {
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description")
  };
}

function assignPatternFormDataToObject(formData: FormData) {
  return {
    weekday: formData.get("weekday"),
    pattern_id: formData.get("pattern_id")
  };
}

function templateFormDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    use_case: formData.get("use_case")
  };
}

function createFromTemplateFormDataToObject(formData: FormData) {
  return {
    template_id: formData.get("template_id"),
    name: formData.get("name"),
    starts_on: formData.get("starts_on"),
    duration_weeks: formData.get("duration_weeks"),
    training_weekdays: formData.getAll("training_weekdays")
  };
}

export async function createTrainingPlan(clientId: string, formData: FormData) {
  try {
    const parsed = trainingPlanSchema.safeParse(planFormDataToObject(formData));

    if (!parsed.success) {
      redirect(`/clients/${clientId}/plans/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
    }

    const trainerId = await getUserId(`/clients/${clientId}/plans/new`);
    await ensureClientOwnership(clientId, trainerId);
    const supabase = createSupabaseClient();
    const startsOn = parsed.data.starts_on;
    const endsOn = addDays(startsOn, parsed.data.duration_weeks * 7 - 1);
    await deactivateOtherClientPlans(supabase, clientId, trainerId);
    const planInsert: TablesInsert<"training_plans"> = {
      trainer_id: trainerId,
      client_id: clientId,
      name: parsed.data.name,
      duration_weeks: parsed.data.duration_weeks,
      starts_on: startsOn,
      ends_on: endsOn,
      sessions_per_week: parsed.data.sessions_per_week,
      training_weekdays: parsed.data.training_weekdays,
      split_type: parsed.data.split_type,
      notes: parsed.data.notes
    };
    const { data: plan, error } = await supabase.from("training_plans").insert(planInsert).select("*").single();

    if (error || !plan) {
      redirect(`/clients/${clientId}/plans/new?error=${encodeURIComponent(error?.message ?? "План не создан")}`);
    }

    const workouts = generatePlannedWorkouts(plan, parsed.data.training_weekdays).map((workout) => ({
      ...workout,
      trainer_id: trainerId,
      training_plan_id: plan.id,
      client_id: clientId
    })) satisfies TablesInsert<"planned_workouts">[];
    const { error: workoutsError } = await supabase.from("planned_workouts").insert(workouts);

    if (workoutsError) {
      redirect(`/clients/${clientId}/plans/${plan.id}?error=${encodeURIComponent(workoutsError.message)}`);
    }

    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}/plans`);
    revalidatePath(`/clients/${clientId}/calendar`);
    redirect(`/clients/${clientId}/plans/${plan.id}`);
  } catch (error) {
    redirectActionError(error, `/clients/${clientId}/plans/new`);
  }
}

export async function updateTrainingPlan(planId: string, formData: FormData) {
  try {
    const parsed = trainingPlanSchema.safeParse(planFormDataToObject(formData));
    const plan = await getTrainingPlanForAction(planId);

    if (!parsed.success) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "РћС€РёР±РєР°")}`);
    }

    const trainerId = await getUserId(`/clients/${plan.client_id}/plans/${plan.id}/edit`);
    const supabase = createSupabaseClient();
    const startsOn = parsed.data.starts_on;
    const endsOn = addDays(startsOn, parsed.data.duration_weeks * 7 - 1);
    const { error } = await supabase
      .from("training_plans")
      .update({
        name: parsed.data.name,
        duration_weeks: parsed.data.duration_weeks,
        starts_on: startsOn,
        ends_on: endsOn,
        sessions_per_week: parsed.data.sessions_per_week,
        training_weekdays: parsed.data.training_weekdays,
        split_type: parsed.data.split_type,
        notes: parsed.data.notes ?? null
      } satisfies TablesUpdate<"training_plans">)
      .eq("id", plan.id)
      .eq("trainer_id", trainerId);

    if (error) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}/edit?error=${encodeURIComponent(error.message)}`);
    }

    const { error: cancelError } = await supabase
      .from("planned_workouts")
      .update({ status: "cancelled" } satisfies TablesUpdate<"planned_workouts">)
      .eq("training_plan_id", plan.id)
      .eq("trainer_id", trainerId)
      .eq("status", "planned")
      .is("calendar_event_id", null);

    if (cancelError) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}/edit?error=${encodeURIComponent(cancelError.message)}`);
    }

    const updatedPlan = {
      ...plan,
      name: parsed.data.name,
      duration_weeks: parsed.data.duration_weeks,
      starts_on: startsOn,
      ends_on: endsOn,
      sessions_per_week: parsed.data.sessions_per_week,
      training_weekdays: parsed.data.training_weekdays,
      split_type: parsed.data.split_type,
      notes: parsed.data.notes ?? null
    };
    const generatedWorkouts = generatePlannedWorkouts(updatedPlan, parsed.data.training_weekdays).map((workout) => ({
      ...workout,
      trainer_id: trainerId,
      training_plan_id: plan.id,
      client_id: plan.client_id
    })) satisfies TablesInsert<"planned_workouts">[];
    const { data: protectedWorkouts, error: protectedError } = await supabase
      .from("planned_workouts")
      .select("planned_date")
      .eq("training_plan_id", plan.id)
      .eq("trainer_id", trainerId)
      .neq("status", "cancelled");

    if (protectedError) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}/edit?error=${encodeURIComponent(protectedError.message)}`);
    }

    const protectedDates = new Set((protectedWorkouts ?? []).map((workout) => workout.planned_date));
    const workoutsToInsert = generatedWorkouts.filter((workout) => !protectedDates.has(workout.planned_date));

    if (workoutsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("planned_workouts").insert(workoutsToInsert);

      if (insertError) {
        redirect(`/clients/${plan.client_id}/plans/${plan.id}/edit?error=${encodeURIComponent(insertError.message)}`);
      }
    }

    revalidatePath(`/clients/${plan.client_id}`);
    revalidatePath(`/clients/${plan.client_id}/plans`);
    revalidatePath(`/clients/${plan.client_id}/plans/${plan.id}`);
    revalidatePath(`/clients/${plan.client_id}/calendar`);
    redirect(`/clients/${plan.client_id}/plans/${plan.id}`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function activateTrainingPlan(planId: string) {
  try {
    const trainerId = await getUserId("/clients");
    const plan = await getTrainingPlanForAction(planId);
    await ensureClientOwnership(plan.client_id, trainerId);

    if (plan.status === "archived") {
      redirect(`/clients/${plan.client_id}/plans?error=${encodeURIComponent("Архивный план нельзя сделать активным.")}`);
    }

    const supabase = createSupabaseClient();
    await deactivateOtherClientPlans(supabase, plan.client_id, trainerId, plan.id);
    const { error } = await supabase
      .from("training_plans")
      .update({ status: "active" } satisfies TablesUpdate<"training_plans">)
      .eq("id", plan.id)
      .eq("trainer_id", trainerId);

    if (error) {
      redirect(`/clients/${plan.client_id}/plans?error=${encodeURIComponent(error.message)}`);
    }

    revalidateClientPlanningPaths(plan.client_id);
    redirect(`/clients/${plan.client_id}/plans`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export const makeTrainingPlanActive = activateTrainingPlan;

export async function archiveTrainingPlan(planId: string) {
  try {
    const trainerId = await getUserId("/dashboard");
    const plan = await getTrainingPlanForAction(planId);
    await ensureClientOwnership(plan.client_id, trainerId);
    const supabase = createSupabaseClient();
    const { error: workoutsError } = await supabase
      .from("planned_workouts")
      .update({ status: "cancelled" } satisfies TablesUpdate<"planned_workouts">)
      .eq("training_plan_id", planId)
      .eq("trainer_id", trainerId)
      .eq("status", "planned");

    if (workoutsError) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent(workoutsError.message)}`);
    }

    const { error } = await supabase
      .from("training_plans")
      .update({ status: "archived" } satisfies TablesUpdate<"training_plans">)
      .eq("id", planId)
      .eq("trainer_id", trainerId);

    if (error) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent(error.message)}`);
    }

    revalidateClientPlanningPaths(plan.client_id);
    redirect(`/clients/${plan.client_id}/plans`);
  } catch (error) {
    redirectActionError(error, "/dashboard");
  }
}

export async function completeTrainingPlan(planId: string) {
  try {
    const trainerId = await getUserId("/clients");
    const plan = await getTrainingPlanForAction(planId);
    await ensureClientOwnership(plan.client_id, trainerId);

    if (plan.status === "archived") {
      redirect(`/clients/${plan.client_id}/plans?error=${encodeURIComponent("Архивный план нельзя завершить.")}`);
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("training_plans")
      .update({ status: "completed" } satisfies TablesUpdate<"training_plans">)
      .eq("id", plan.id)
      .eq("trainer_id", trainerId);

    if (error) {
      redirect(`/clients/${plan.client_id}/plans?error=${encodeURIComponent(error.message)}`);
    }

    revalidateClientPlanningPaths(plan.client_id);
    redirect(`/clients/${plan.client_id}/plans`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function createTrainingPlanPattern(planId: string, formData: FormData) {
  try {
    const parsed = planPatternSchema.safeParse(patternFormDataToObject(formData));
    const plan = await getTrainingPlanForAction(planId);

    if (!parsed.success) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
    }

    const trainerId = await getUserId(`/clients/${plan.client_id}/plans/${plan.id}`);
    const position = await getNextPatternPosition(planId);
    const supabase = createSupabaseClient();
    const { data: pattern, error } = await supabase
      .from("training_plan_patterns")
      .insert({
        trainer_id: trainerId,
        training_plan_id: planId,
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description,
        position
      } satisfies TablesInsert<"training_plan_patterns">)
      .select("id")
      .single();

    if (error || !pattern) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent(error?.message ?? "Pattern not created")}`);
    }

    revalidatePath(`/clients/${plan.client_id}/plans/${plan.id}`);
    redirect(`/clients/${plan.client_id}/plans/${plan.id}/patterns/${pattern.id}`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function updateTrainingPlanPattern(patternId: string, formData: FormData) {
  try {
    const parsed = planPatternSchema.safeParse(patternFormDataToObject(formData));
    const pattern = await getPatternForAction(patternId);

    if (!parsed.success) {
      redirect(patternErrorPath(pattern, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("training_plan_patterns")
      .update({
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description
      } satisfies TablesUpdate<"training_plan_patterns">)
      .eq("id", patternId);

    if (error) {
      redirect(patternErrorPath(pattern, error.message));
    }

    revalidatePath(patternPath(pattern));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function archiveTrainingPlanPattern(patternId: string) {
  try {
    const pattern = await getPatternForAction(patternId);
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("training_plan_patterns")
      .update({ status: "archived" } satisfies TablesUpdate<"training_plan_patterns">)
      .eq("id", patternId);

    if (error) {
      redirect(patternErrorPath(pattern, error.message));
    }

    revalidatePath(`/clients/${pattern.client_id}/plans/${pattern.training_plan_id}`);
    redirect(`/clients/${pattern.client_id}/plans/${pattern.training_plan_id}`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function addExerciseToPattern(patternId: string, exerciseId: string) {
  try {
    const trainerId = await getUserId("/clients");
    const pattern = await getPatternForAction(patternId);
    const exercise = await getExerciseForPlanning(exerciseId);
    const position = await getNextPatternExercisePosition(patternId);
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("pattern_exercises").insert({
      trainer_id: trainerId,
      pattern_id: patternId,
      exercise_id: exercise.id,
      name_snapshot: exercise.name,
      position,
      intensity_type: exercise.primary_category === "Мобилити" ? "none" : exercise.default_intensity_type,
      notes: exercise.short_description
    } satisfies TablesInsert<"pattern_exercises">);

    if (error) {
      redirect(patternErrorPath(pattern, error.message));
    }

    revalidatePath(patternPath(pattern));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function updatePatternExercise(patternExerciseId: string, formData: FormData) {
  try {
    const parsed = patternExerciseUpdateSchema.safeParse({
      intensity_type: formData.get("intensity_type") || "none",
      notes: formData.get("notes")
    });
    const { exercise, pattern } = await getPatternExerciseForAction(patternExerciseId);

    if (!parsed.success) {
      redirect(patternErrorPath(pattern, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("pattern_exercises")
      .update({
        intensity_type: parsed.data.intensity_type,
        notes: parsed.data.notes
      } satisfies TablesUpdate<"pattern_exercises">)
      .eq("id", exercise.id);

    if (error) {
      redirect(patternErrorPath(pattern, error.message));
    }

    revalidatePath(patternPath(pattern));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function deletePatternExercise(patternExerciseId: string) {
  try {
    const { exercise, pattern } = await getPatternExerciseForAction(patternExerciseId);
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("pattern_exercises").delete().eq("id", exercise.id);

    if (error) {
      redirect(patternErrorPath(pattern, error.message));
    }

    revalidatePath(patternPath(pattern));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function addPatternSet(patternExerciseId: string, formData: FormData) {
  try {
    const parsed = patternSetSchema.safeParse(setFormDataToObject(formData));
    const { exercise, pattern } = await getPatternExerciseForAction(patternExerciseId);

    if (!parsed.success) {
      redirect(patternErrorPath(pattern, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const trainerId = await getUserId(patternPath(pattern));
    const position = await getNextPatternSetPosition(patternExerciseId);
    const intensityValue = validateIntensityValue(exercise.intensity_type, parsed.data.intensity_value);
    const supabase = createSupabaseClient();
    const setInserts: TablesInsert<"pattern_sets">[] = Array.from({ length: parsed.data.set_count }, (_, index) => ({
      trainer_id: trainerId,
      pattern_exercise_id: patternExerciseId,
      position: position + index,
      weight: parsed.data.weight,
      reps: parsed.data.reps,
      intensity_value: intensityValue,
      notes: parsed.data.notes
    }));
    const { error } = await supabase.from("pattern_sets").insert(setInserts);

    if (error) {
      redirect(patternErrorPath(pattern, error.message));
    }

    revalidatePath(patternPath(pattern));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function updatePatternSet(patternSetId: string, formData: FormData) {
  try {
    const parsed = patternSetSchema.safeParse(setFormDataToObject(formData));
    const { set, exercise, pattern } = await getPatternSetForAction(patternSetId);

    if (!parsed.success) {
      redirect(patternErrorPath(pattern, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const intensityValue = validateIntensityValue(exercise.intensity_type, parsed.data.intensity_value);
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("pattern_sets")
      .update({
        weight: parsed.data.weight,
        reps: parsed.data.reps,
        intensity_value: intensityValue,
        notes: parsed.data.notes,
        position: set.position
      } satisfies TablesUpdate<"pattern_sets">)
      .eq("id", patternSetId);

    if (error) {
      redirect(patternErrorPath(pattern, error.message));
    }

    revalidatePath(patternPath(pattern));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function deletePatternSet(patternSetId: string) {
  try {
    const { set, pattern } = await getPatternSetForAction(patternSetId);
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("pattern_sets").delete().eq("id", set.id);

    if (error) {
      redirect(patternErrorPath(pattern, error.message));
    }

    revalidatePath(patternPath(pattern));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function assignPatternToWeekday(planId: string, formData: FormData) {
  try {
    const parsed = assignPatternSchema.safeParse(assignPatternFormDataToObject(formData));
    const plan = await getTrainingPlanForAction(planId);

    if (!parsed.success) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
    }

    const pattern = await getPatternForAction(parsed.data.pattern_id);

    if (pattern.training_plan_id !== planId) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent("Pattern belongs to another plan")}`);
    }

    const workouts = await getPlanWorkoutsForWeekday(planId, parsed.data.weekday);
    await replacePlannedWorkoutContentFromPattern(pattern, workouts.filter((workout) => workout.status === "planned"));

    revalidatePath(`/clients/${plan.client_id}/plans/${plan.id}`);
    revalidatePath(`/clients/${plan.client_id}/calendar`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function applyPatternToPlannedWorkouts(patternId: string, formData: FormData) {
  try {
    const parsed = applyPatternSchema.safeParse({ scope: formData.get("scope") || "future_only" });
    const pattern = await getPatternForAction(patternId);

    if (!parsed.success) {
      redirect(patternErrorPath(pattern, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const workouts = await getEligibleWorkoutsForPatternApply(pattern, parsed.data.scope);
    await replacePlannedWorkoutContentFromPattern(pattern, workouts);

    revalidatePath(patternPath(pattern));
    revalidatePath(`/clients/${pattern.client_id}/plans/${pattern.training_plan_id}`);
    revalidatePath(`/clients/${pattern.client_id}/calendar`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function addExerciseToPlannedWorkout(plannedWorkoutId: string, exerciseId: string) {
  try {
    const trainerId = await getUserId(`/clients`);
    const workout = await ensurePlannedWorkoutEditable(plannedWorkoutId);
    const exercise = await getExerciseForPlanning(exerciseId);
    const nextPosition = await getNextPlannedExercisePosition(plannedWorkoutId);
    const supabase = createSupabaseClient();
    const exerciseInsert: TablesInsert<"planned_exercises"> = {
      trainer_id: trainerId,
      planned_workout_id: plannedWorkoutId,
      exercise_id: exercise.id,
      name_snapshot: exercise.name,
      position: nextPosition,
      intensity_type: exercise.primary_category === "Мобилити" ? "none" : exercise.default_intensity_type,
      notes: exercise.short_description
    };
    const { error } = await supabase.from("planned_exercises").insert(exerciseInsert);

    if (error) {
      redirect(plannedWorkoutErrorPath(workout, error.message));
    }

    revalidatePath(plannedWorkoutPath(workout));
  } catch (error) {
    redirectActionError(error, `/clients`);
  }
}

export async function updatePlannedExercise(plannedExerciseId: string, formData: FormData) {
  try {
    const parsed = plannedExerciseUpdateSchema.safeParse({
      intensity_type: formData.get("intensity_type") || "none",
      notes: formData.get("notes")
    });
    const exercise = await getPlannedExerciseForAction(plannedExerciseId);
    const workout = await ensurePlannedWorkoutEditable(exercise.planned_workout_id);

    if (!parsed.success) {
      redirect(plannedWorkoutErrorPath(workout, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("planned_exercises")
      .update({
        intensity_type: parsed.data.intensity_type,
        notes: parsed.data.notes
      } satisfies TablesUpdate<"planned_exercises">)
      .eq("id", plannedExerciseId);

    if (error) {
      redirect(plannedWorkoutErrorPath(workout, error.message));
    }

    revalidatePath(plannedWorkoutPath(workout));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function deletePlannedExercise(plannedExerciseId: string) {
  try {
    const exercise = await getPlannedExerciseForAction(plannedExerciseId);
    const workout = await ensurePlannedWorkoutEditable(exercise.planned_workout_id);
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("planned_exercises").delete().eq("id", plannedExerciseId);

    if (error) {
      redirect(plannedWorkoutErrorPath(workout, error.message));
    }

    revalidatePath(plannedWorkoutPath(workout));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function addPlannedSet(plannedExerciseId: string, formData: FormData) {
  try {
    const parsed = plannedSetSchema.safeParse(setFormDataToObject(formData));
    const exercise = await getPlannedExerciseForAction(plannedExerciseId);
    const workout = await ensurePlannedWorkoutEditable(exercise.planned_workout_id);

    if (!parsed.success) {
      redirect(plannedWorkoutErrorPath(workout, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const trainerId = await getUserId(plannedWorkoutPath(workout));
    const intensityValue = validateIntensityValue(exercise.intensity_type, parsed.data.intensity_value);
    const position = await getNextPlannedSetPosition(plannedExerciseId);
    const supabase = createSupabaseClient();
    const setInserts: TablesInsert<"planned_sets">[] = Array.from({ length: parsed.data.set_count }, (_, index) => ({
      trainer_id: trainerId,
      planned_exercise_id: plannedExerciseId,
      position: position + index,
      weight: parsed.data.weight,
      reps: parsed.data.reps,
      intensity_value: intensityValue,
      notes: parsed.data.notes
    }));
    const { error } = await supabase.from("planned_sets").insert(setInserts);

    if (error) {
      redirect(plannedWorkoutErrorPath(workout, error.message));
    }

    revalidatePath(plannedWorkoutPath(workout));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function updatePlannedSet(plannedSetId: string, formData: FormData) {
  try {
    const parsed = plannedSetSchema.safeParse(setFormDataToObject(formData));
    const { set, exercise } = await getPlannedSetForAction(plannedSetId);
    const workout = await ensurePlannedWorkoutEditable(exercise.planned_workout_id);

    if (!parsed.success) {
      redirect(plannedWorkoutErrorPath(workout, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const intensityValue = validateIntensityValue(exercise.intensity_type, parsed.data.intensity_value);
    const supabase = createSupabaseClient();
    const setUpdate: TablesUpdate<"planned_sets"> = {
      weight: parsed.data.weight,
      reps: parsed.data.reps,
      intensity_value: intensityValue,
      notes: parsed.data.notes,
      position: set.position
    };
    const { error } = await supabase.from("planned_sets").update(setUpdate).eq("id", plannedSetId);

    if (error) {
      redirect(plannedWorkoutErrorPath(workout, error.message));
    }

    revalidatePath(plannedWorkoutPath(workout));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function deletePlannedSet(plannedSetId: string) {
  try {
    const { exercise } = await getPlannedSetForAction(plannedSetId);
    const workout = await ensurePlannedWorkoutEditable(exercise.planned_workout_id);
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("planned_sets").delete().eq("id", plannedSetId);

    if (error) {
      redirect(plannedWorkoutErrorPath(workout, error.message));
    }

    revalidatePath(plannedWorkoutPath(workout));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function schedulePlannedWorkout(plannedWorkoutId: string, formData: FormData) {
  try {
    const parsed = schedulePlannedWorkoutSchema.safeParse(scheduleFormDataToObject(formData));
    const trainerId = await getUserId("/clients");
    const workout = await getPlannedWorkoutForAction(plannedWorkoutId);

    if (!parsed.success) {
      redirect(plannedWorkoutErrorPath(workout, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    if (workout.calendar_event_id) {
      redirect(plannedWorkoutErrorPath(workout, "Для этой плановой тренировки уже назначено событие."));
    }

    const profile = await getTrainerProfile();
    const timezone = profile?.timezone || "Europe/Moscow";
    const startsAt = formDateTimeToUtc(parsed.data.date, parsed.data.starts_at_time, timezone);
    const endsAt = new Date(startsAt.getTime() + parsed.data.duration_hours * 60 * 60 * 1000);

    if (endsAt <= startsAt) {
      redirect(plannedWorkoutErrorPath(workout, "Время окончания должно быть позже начала"));
    }

    const hasConflict = await hasCalendarConflict({
      trainerId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString()
    });

    if (hasConflict) {
      redirect(plannedWorkoutErrorPath(workout, conflictMessage));
    }

    const supabase = createSupabaseClient();
    const eventInsert: TablesInsert<"calendar_events"> = {
      trainer_id: trainerId,
      client_id: workout.client_id,
      type: "client_training",
      title: parsed.data.title ?? workout.name,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "scheduled",
      notes: parsed.data.notes
    };
    const { data: event, error } = await supabase.from("calendar_events").insert(eventInsert).select("id").single();

    if (error || !event) {
      redirect(plannedWorkoutErrorPath(workout, error?.message ?? "Событие не создано"));
    }

    const { error: updateError } = await supabase
      .from("planned_workouts")
      .update({
        calendar_event_id: event.id,
        status: "scheduled"
      } satisfies TablesUpdate<"planned_workouts">)
      .eq("id", plannedWorkoutId)
      .is("calendar_event_id", null);

    if (updateError) {
      redirect(plannedWorkoutErrorPath(workout, updateError.message));
    }

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${workout.client_id}/calendar`);
    revalidatePath(plannedWorkoutPath(workout));
    redirect(plannedWorkoutPath(workout));
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function cancelPlannedWorkout(plannedWorkoutId: string) {
  try {
    const workout = await ensurePlannedWorkoutEditable(plannedWorkoutId);
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("planned_workouts")
      .update({ status: "cancelled" } satisfies TablesUpdate<"planned_workouts">)
      .eq("id", plannedWorkoutId);

    if (error) {
      redirect(plannedWorkoutErrorPath(workout, error.message));
    }

    revalidatePath(`/clients/${workout.client_id}/calendar`);
    redirect(`/clients/${workout.client_id}/calendar`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function saveTrainingPlanAsTemplate(planId: string, formData: FormData) {
  try {
    const parsed = savePlanTemplateSchema.safeParse(templateFormDataToObject(formData));
    const plan = await getTrainingPlanForAction(planId);

    if (!parsed.success) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
    }

    const trainerId = await getUserId(`/clients/${plan.client_id}/plans/${plan.id}`);
    const supabase = createSupabaseClient();
    const { data: template, error } = await supabase
      .from("training_plan_templates")
      .insert({
        trainer_id: trainerId,
        source_type: "custom",
        name: parsed.data.name,
        description: parsed.data.description,
        duration_weeks: plan.duration_weeks,
        sessions_per_week: plan.sessions_per_week,
        split_type: plan.split_type,
        suggested_weekdays: plan.training_weekdays,
        category: parsed.data.category,
        use_case: parsed.data.use_case,
        status: "active"
      } satisfies TablesInsert<"training_plan_templates">)
      .select("id")
      .single();

    if (error || !template) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent(error?.message ?? "Template not created")}`);
    }

    await copyPlanPatternsToTemplate(plan.id, template.id, trainerId);
    revalidatePath(`/clients/${plan.client_id}/plans/${plan.id}`);
    redirect(`/clients/${plan.client_id}/plans/${plan.id}?success=${encodeURIComponent("Шаблон сохранен")}`);
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

export async function createPlanFromTemplate(clientId: string, formData: FormData) {
  try {
    const parsed = createPlanFromTemplateSchema.safeParse(createFromTemplateFormDataToObject(formData));

    if (!parsed.success) {
      redirect(`/clients/${clientId}/plans/templates?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
    }

    const trainerId = await getUserId(`/clients/${clientId}/plans/templates`);
    await ensureClientOwnership(clientId, trainerId);
    const template = await getTrainingPlanTemplate(parsed.data.template_id);
    const startsOn = parsed.data.starts_on;
    const endsOn = addDays(startsOn, parsed.data.duration_weeks * 7 - 1);
    const supabase = createSupabaseClient();
    await deactivateOtherClientPlans(supabase, clientId, trainerId);
    const { data: plan, error } = await supabase
      .from("training_plans")
      .insert({
        trainer_id: trainerId,
        client_id: clientId,
        name: parsed.data.name ?? template.name,
        duration_weeks: parsed.data.duration_weeks,
        starts_on: startsOn,
        ends_on: endsOn,
        sessions_per_week: parsed.data.sessions_per_week,
        training_weekdays: parsed.data.training_weekdays,
        split_type: template.split_type,
        notes: template.description
      } satisfies TablesInsert<"training_plans">)
      .select("*")
      .single();

    if (error || !plan) {
      redirect(`/clients/${clientId}/plans/templates?error=${encodeURIComponent(error?.message ?? "Plan not created")}`);
    }

    const patternMap = await copyTemplatePatternsToPlan(template, plan, trainerId);
    const workouts = generatePlannedWorkouts(plan, parsed.data.training_weekdays).map((workout) => {
      const templatePattern = template.template_patterns[(workout.day_number - 1) % Math.max(template.template_patterns.length, 1)];
      const patternId = templatePattern ? patternMap.get(templatePattern.id) ?? null : null;

      return {
        ...workout,
        trainer_id: trainerId,
        training_plan_id: plan.id,
        client_id: clientId,
        pattern_id: patternId
      };
    }) satisfies TablesInsert<"planned_workouts">[];
    const { data: createdWorkouts, error: workoutsError } = await supabase
      .from("planned_workouts")
      .insert(workouts)
      .select("*");

    if (workoutsError) {
      redirect(`/clients/${clientId}/plans/${plan.id}?error=${encodeURIComponent(workoutsError.message)}`);
    }

    for (const workout of createdWorkouts ?? []) {
      if (workout.pattern_id) {
        const pattern = await getPatternForAction(workout.pattern_id);
        await replacePlannedWorkoutContentFromPattern(pattern, [workout]);
      }
    }

    revalidatePath(`/clients/${clientId}/plans`);
    revalidatePath(`/clients/${clientId}/calendar`);
    redirect(`/clients/${clientId}/plans/${plan.id}`);
  } catch (error) {
    redirectActionError(error, `/clients/${clientId}/plans/templates`);
  }
}

export async function archiveTrainingPlanTemplate(templateId: string) {
  try {
    const trainerId = await getUserId("/clients");
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("training_plan_templates")
      .update({ status: "archived" } satisfies TablesUpdate<"training_plan_templates">)
      .eq("id", templateId)
      .eq("trainer_id", trainerId)
      .eq("source_type", "custom");

    if (error) {
      redirect(`/clients?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/clients");
  } catch (error) {
    redirectActionError(error, "/clients");
  }
}

type PatternForAction = Tables<"training_plan_patterns"> & {
  client_id: string;
};

type PatternExerciseForAction = {
  exercise: Tables<"pattern_exercises">;
  pattern: PatternForAction;
};

async function getUserId(errorPath: string) {
  const supabase = createSupabaseClient();
  let response;

  try {
    response = await supabase.auth.getUser();
  } catch (error) {
    redirect(`${errorPath}?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
  }

  const {
    data: { user },
    error
  } = response;

  if (error && isTransientNetworkError(error.message)) {
    redirect(`${errorPath}?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
  }

  if (error || !user) {
    redirect("/login");
  }

  return user.id;
}

async function deactivateOtherClientPlans(
  supabase: ReturnType<typeof createSupabaseClient>,
  clientId: string,
  trainerId: string,
  exceptPlanId?: string
) {
  let query = supabase
    .from("training_plans")
    .update({ status: "inactive" } satisfies TablesUpdate<"training_plans">)
    .eq("client_id", clientId)
    .eq("trainer_id", trainerId)
    .eq("status", "active");

  if (exceptPlanId) {
    query = query.neq("id", exceptPlanId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}

function revalidateClientPlanningPaths(clientId: string) {
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/calendar`);
  revalidatePath(`/clients/${clientId}/plans`);
  revalidatePath("/calendar");
}

async function getPatternForAction(patternId: string): Promise<PatternForAction> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("training_plan_patterns")
    .select("*, training_plans(client_id)")
    .eq("id", patternId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Pattern not found");
  }

  return {
    ...(data as Tables<"training_plan_patterns"> & { training_plans: { client_id: string } | null }),
    client_id: (data as { training_plans: { client_id: string } | null }).training_plans?.client_id ?? ""
  };
}

async function getPatternExerciseForAction(patternExerciseId: string): Promise<PatternExerciseForAction> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("pattern_exercises")
    .select("*")
    .eq("id", patternExerciseId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Pattern exercise not found");
  }

  return {
    exercise: data,
    pattern: await getPatternForAction(data.pattern_id)
  };
}

async function getPatternSetForAction(patternSetId: string) {
  const supabase = createSupabaseClient();
  const { data: set, error } = await supabase.from("pattern_sets").select("*").eq("id", patternSetId).maybeSingle();

  if (error || !set) {
    throw new Error(error?.message ?? "Pattern set not found");
  }

  const result = await getPatternExerciseForAction(set.pattern_exercise_id);

  return {
    set,
    exercise: result.exercise,
    pattern: result.pattern
  };
}

async function ensureClientOwnership(clientId: string, trainerId: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("trainer_id", trainerId)
    .neq("status", "archived")
    .maybeSingle();

  if (error || !data) {
    redirect(`/clients?error=${encodeURIComponent(error?.message ?? "Клиент не найден")}`);
  }
}

async function getTrainingPlanForAction(planId: string): Promise<Tables<"training_plans">> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("training_plans").select("*").eq("id", planId).maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Plan not found");
  }

  return data;
}

async function getPlannedWorkoutForAction(plannedWorkoutId: string): Promise<Tables<"planned_workouts">> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("planned_workouts").select("*").eq("id", plannedWorkoutId).maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Planned workout not found");
  }

  return data;
}

async function ensurePlannedWorkoutEditable(plannedWorkoutId: string): Promise<Tables<"planned_workouts">> {
  const workout = await getPlannedWorkoutForAction(plannedWorkoutId);

  if (["in_progress", "completed", "cancelled"].includes(workout.status)) {
    redirect(plannedWorkoutErrorPath(workout, "Эту плановую тренировку уже нельзя редактировать."));
  }

  return workout;
}

async function getPlannedExerciseForAction(plannedExerciseId: string): Promise<Tables<"planned_exercises">> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("planned_exercises").select("*").eq("id", plannedExerciseId).maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Planned exercise not found");
  }

  return data;
}

async function getPlannedSetForAction(plannedSetId: string) {
  const supabase = createSupabaseClient();
  const { data: set, error } = await supabase.from("planned_sets").select("*").eq("id", plannedSetId).maybeSingle();

  if (error || !set) {
    throw new Error(error?.message ?? "Planned set not found");
  }

  return {
    set,
    exercise: await getPlannedExerciseForAction(set.planned_exercise_id)
  };
}

async function getExerciseForPlanning(exerciseId: string): Promise<Tables<"exercises">> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Exercise not found");
  }

  return data;
}

async function getNextPlannedExercisePosition(plannedWorkoutId: string) {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("planned_exercises")
    .select("position")
    .eq("planned_workout_id", plannedWorkoutId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? 0) + 1;
}

async function getNextPatternPosition(planId: string) {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("training_plan_patterns")
    .select("position")
    .eq("training_plan_id", planId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? 0) + 1;
}

async function getNextPatternExercisePosition(patternId: string) {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("pattern_exercises")
    .select("position")
    .eq("pattern_id", patternId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? 0) + 1;
}

async function getNextPatternSetPosition(patternExerciseId: string) {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("pattern_sets")
    .select("position")
    .eq("pattern_exercise_id", patternExerciseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? 0) + 1;
}

async function getNextPlannedSetPosition(plannedExerciseId: string) {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("planned_sets")
    .select("position")
    .eq("planned_exercise_id", plannedExerciseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? 0) + 1;
}

async function getPlanWorkoutsForWeekday(planId: string, weekday: number): Promise<Tables<"planned_workouts">[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("training_plan_id", planId)
    .order("planned_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((workout) => getIsoWeekday(workout.planned_date) === weekday);
}

async function getEligibleWorkoutsForPatternApply(pattern: PatternForAction, scope: "future_only" | "all_not_started") {
  const supabase = createSupabaseClient();
  let query = supabase
    .from("planned_workouts")
    .select("*")
    .eq("training_plan_id", pattern.training_plan_id)
    .eq("pattern_id", pattern.id)
    .eq("status", "planned")
    .order("planned_date", { ascending: true });

  if (scope === "future_only") {
    query = query.gte("planned_date", todayDate());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function replacePlannedWorkoutContentFromPattern(pattern: PatternForAction, workouts: Tables<"planned_workouts">[]) {
  const eligibleWorkouts = workouts.filter((workout) => workout.status === "planned");

  if (eligibleWorkouts.length === 0) {
    return;
  }

  const supabase = createSupabaseClient();
  const { data: patternExercises, error } = await supabase
    .from("pattern_exercises")
    .select("*, pattern_sets(*)")
    .eq("pattern_id", pattern.id)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  for (const workout of eligibleWorkouts) {
    const { data: existingExercises, error: existingError } = await supabase
      .from("planned_exercises")
      .select("id")
      .eq("planned_workout_id", workout.id);

    if (existingError) {
      throw new Error(existingError.message);
    }

    if ((existingExercises ?? []).length > 0) {
      const { error: deleteError } = await supabase
        .from("planned_exercises")
        .delete()
        .in(
          "id",
          (existingExercises ?? []).map((exercise) => exercise.id)
        );

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }

    const { error: workoutUpdateError } = await supabase
      .from("planned_workouts")
      .update({ pattern_id: pattern.id, name: pattern.name } satisfies TablesUpdate<"planned_workouts">)
      .eq("id", workout.id);

    if (workoutUpdateError) {
      throw new Error(workoutUpdateError.message);
    }

    for (const patternExercise of patternExercises ?? []) {
      const { data: plannedExercise, error: exerciseError } = await supabase
        .from("planned_exercises")
        .insert({
          trainer_id: pattern.trainer_id,
          planned_workout_id: workout.id,
          exercise_id: patternExercise.exercise_id,
          name_snapshot: patternExercise.name_snapshot,
          position: patternExercise.position,
          intensity_type: patternExercise.intensity_type,
          notes: patternExercise.notes
        } satisfies TablesInsert<"planned_exercises">)
        .select("id")
        .single();

      if (exerciseError || !plannedExercise) {
        throw new Error(exerciseError?.message ?? "Could not copy pattern exercise");
      }

      const sets = [...(patternExercise.pattern_sets ?? [])].sort((a, b) => a.position - b.position);

      if (sets.length > 0) {
        const { error: setsError } = await supabase.from("planned_sets").insert(
          sets.map((set) => ({
            trainer_id: pattern.trainer_id,
            planned_exercise_id: plannedExercise.id,
            position: set.position,
            weight: set.weight,
            reps: set.reps,
            intensity_value: set.intensity_value,
            notes: set.notes
          })) satisfies TablesInsert<"planned_sets">[]
        );

        if (setsError) {
          throw new Error(setsError.message);
        }
      }
    }
  }
}

async function copyPlanPatternsToTemplate(planId: string, templateId: string, trainerId: string) {
  const supabase = createSupabaseClient();
  const { data: patterns, error } = await supabase
    .from("training_plan_patterns")
    .select("*, pattern_exercises(*, pattern_sets(*))")
    .eq("training_plan_id", planId)
    .neq("status", "archived")
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  for (const pattern of patterns ?? []) {
    const { data: templatePattern, error: patternError } = await supabase
      .from("template_patterns")
      .insert({
        trainer_id: trainerId,
        template_id: templateId,
        name: pattern.name,
        code: pattern.code,
        description: pattern.description,
        position: pattern.position
      } satisfies TablesInsert<"template_patterns">)
      .select("id")
      .single();

    if (patternError || !templatePattern) {
      throw new Error(patternError?.message ?? "Could not copy template pattern");
    }

    for (const exercise of pattern.pattern_exercises ?? []) {
      const { data: templateExercise, error: exerciseError } = await supabase
        .from("template_exercises")
        .insert({
          trainer_id: trainerId,
          template_pattern_id: templatePattern.id,
          exercise_id: exercise.exercise_id,
          name_snapshot: exercise.name_snapshot,
          position: exercise.position,
          intensity_type: exercise.intensity_type,
          notes: exercise.notes
        } satisfies TablesInsert<"template_exercises">)
        .select("id")
        .single();

      if (exerciseError || !templateExercise) {
        throw new Error(exerciseError?.message ?? "Could not copy template exercise");
      }

      const sets = [...(exercise.pattern_sets ?? [])].sort((a, b) => a.position - b.position);

      if (sets.length > 0) {
        const { error: setsError } = await supabase.from("template_sets").insert(
          sets.map((set) => ({
            trainer_id: trainerId,
            template_exercise_id: templateExercise.id,
            position: set.position,
            weight: set.weight,
            reps: set.reps,
            intensity_value: set.intensity_value,
            notes: set.notes
          })) satisfies TablesInsert<"template_sets">[]
        );

        if (setsError) {
          throw new Error(setsError.message);
        }
      }
    }
  }
}

async function copyTemplatePatternsToPlan(
  template: Awaited<ReturnType<typeof getTrainingPlanTemplate>>,
  plan: Tables<"training_plans">,
  trainerId: string
) {
  const supabase = createSupabaseClient();
  const patternMap = new Map<string, string>();

  for (const templatePattern of template.template_patterns) {
    const { data: pattern, error } = await supabase
      .from("training_plan_patterns")
      .insert({
        trainer_id: trainerId,
        training_plan_id: plan.id,
        name: templatePattern.name,
        code: templatePattern.code,
        description: templatePattern.description,
        position: templatePattern.position
      } satisfies TablesInsert<"training_plan_patterns">)
      .select("id")
      .single();

    if (error || !pattern) {
      throw new Error(error?.message ?? "Could not copy pattern");
    }

    patternMap.set(templatePattern.id, pattern.id);

    for (const templateExercise of templatePattern.template_exercises) {
      const { data: patternExercise, error: exerciseError } = await supabase
        .from("pattern_exercises")
        .insert({
          trainer_id: trainerId,
          pattern_id: pattern.id,
          exercise_id: templateExercise.exercise_id,
          name_snapshot: templateExercise.name_snapshot,
          position: templateExercise.position,
          intensity_type: templateExercise.intensity_type,
          notes: templateExercise.notes
        } satisfies TablesInsert<"pattern_exercises">)
        .select("id")
        .single();

      if (exerciseError || !patternExercise) {
        throw new Error(exerciseError?.message ?? "Could not copy pattern exercise");
      }

      if (templateExercise.template_sets.length > 0) {
        const { error: setsError } = await supabase.from("pattern_sets").insert(
          templateExercise.template_sets.map((set) => ({
            trainer_id: trainerId,
            pattern_exercise_id: patternExercise.id,
            position: set.position,
            weight: set.weight,
            reps: set.reps,
            intensity_value: set.intensity_value,
            notes: set.notes
          })) satisfies TablesInsert<"pattern_sets">[]
        );

        if (setsError) {
          throw new Error(setsError.message);
        }
      }
    }
  }

  return patternMap;
}

async function hasCalendarConflict({
  trainerId,
  startsAt,
  endsAt
}: {
  trainerId: string;
  startsAt: string;
  endsAt: string;
}) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id")
    .eq("trainer_id", trainerId)
    .neq("status", "cancelled")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

type GeneratedPlannedWorkout = {
  name: string;
  planned_date: string;
  week_number: number;
  day_number: number;
  status: "planned";
  notes: string | null;
};

function generatePlannedWorkouts(plan: Tables<"training_plans">, weekdays: number[]) {
  const workouts: GeneratedPlannedWorkout[] = [];
  const totalDays = plan.duration_weeks * 7;
  let dayNumber = 1;

  for (let offset = 0; offset < totalDays; offset += 1) {
    const plannedDate = addDays(plan.starts_on, offset);
    const weekday = getIsoWeekday(plannedDate);

    if (!weekdays.includes(weekday)) {
      continue;
    }

    const weekNumber = Math.floor(offset / 7) + 1;
    workouts.push({
      name: plan.name,
      planned_date: plannedDate,
      week_number: weekNumber,
      day_number: dayNumber,
      status: "planned",
      notes: null
    });
    dayNumber += 1;
  }

  return workouts;
}

function getWorkoutName(splitType: Tables<"training_plans">["split_type"], dayNumber: number) {
  if (splitType === "full_body") {
    return "Full body";
  }

  if (splitType === "upper_lower") {
    return dayNumber % 2 === 1 ? "Upper" : "Lower";
  }

  if (splitType === "push_pull_legs") {
    const names = ["Push", "Pull", "Legs"];

    return names[(dayNumber - 1) % names.length];
  }

  if (splitType === "powerlifting") {
    const names = ["Squat focus", "Bench focus", "Deadlift focus"];

    return names[(dayNumber - 1) % names.length];
  }

  return `Тренировка ${dayNumber}`;
}

function getIsoWeekday(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = date.getUTCDay();

  return weekday === 0 ? 7 : weekday;
}

function addDays(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const resultYear = date.getUTCFullYear();
  const resultMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const resultDay = String(date.getUTCDate()).padStart(2, "0");

  return `${resultYear}-${resultMonth}-${resultDay}`;
}

function todayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formDateTimeToUtc(dateValue: string, timeValue: string, timezone: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getTimeZoneOffsetMs(utcGuess, timezone);

  return new Date(utcGuess.getTime() - offset);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(date);
  const timeZoneName = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);

  if (!match) {
    return 0;
  }

  const direction = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");

  return direction * (hours * 60 + minutes) * 60 * 1000;
}

function plannedWorkoutPath(workout: Pick<Tables<"planned_workouts">, "client_id" | "id">) {
  return `/clients/${workout.client_id}/planned-workouts/${workout.id}`;
}

function patternPath(pattern: Pick<PatternForAction, "client_id" | "training_plan_id" | "id">) {
  return `/clients/${pattern.client_id}/plans/${pattern.training_plan_id}/patterns/${pattern.id}`;
}

function patternErrorPath(pattern: Pick<PatternForAction, "client_id" | "training_plan_id" | "id">, message: string) {
  return `${patternPath(pattern)}?error=${encodeURIComponent(message)}`;
}

function plannedWorkoutErrorPath(workout: Pick<Tables<"planned_workouts">, "client_id" | "id">, message: string) {
  return `${plannedWorkoutPath(workout)}?error=${encodeURIComponent(message)}`;
}

function redirectActionError(error: unknown, path: string): never {
  if (isRedirectError(error)) {
    throw error;
  }

  redirect(`${path}?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
}
