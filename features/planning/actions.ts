"use server";

import { isRedirectError } from "next/dist/client/components/redirect";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTrainerProfile } from "@/features/trainer/queries";
import {
  plannedExerciseUpdateSchema,
  plannedSetSchema,
  schedulePlannedWorkoutSchema,
  trainingPlanSchema
} from "@/features/planning/schemas";
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
    notes: formData.get("notes")
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

export async function archiveTrainingPlan(planId: string) {
  try {
    const trainerId = await getUserId("/dashboard");
    const plan = await getTrainingPlanForAction(planId);
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("training_plans")
      .update({ status: "archived" } satisfies TablesUpdate<"training_plans">)
      .eq("id", planId)
      .eq("trainer_id", trainerId);

    if (error) {
      redirect(`/clients/${plan.client_id}/plans/${plan.id}?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath(`/clients/${plan.client_id}/plans`);
    redirect(`/clients/${plan.client_id}/plans`);
  } catch (error) {
    redirectActionError(error, "/dashboard");
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
    const setInsert: TablesInsert<"planned_sets"> = {
      trainer_id: trainerId,
      planned_exercise_id: plannedExerciseId,
      position,
      weight: parsed.data.weight,
      reps: parsed.data.reps,
      intensity_value: intensityValue,
      notes: parsed.data.notes
    };
    const { error } = await supabase.from("planned_sets").insert(setInsert);

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
      name: getWorkoutName(plan.split_type, dayNumber),
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

function plannedWorkoutErrorPath(workout: Pick<Tables<"planned_workouts">, "client_id" | "id">, message: string) {
  return `${plannedWorkoutPath(workout)}?error=${encodeURIComponent(message)}`;
}

function redirectActionError(error: unknown, path: string): never {
  if (isRedirectError(error)) {
    throw error;
  }

  redirect(`${path}?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
}
