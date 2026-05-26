"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { customExerciseSchema } from "@/features/exercises/schemas";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { getReadableErrorMessage, isTransientNetworkError } from "@/lib/errors";

function formDataToCustomExercise(formData: FormData) {
  return {
    name: formData.get("name"),
    primary_category: formData.get("primary_category"),
    secondary_categories: formData.get("secondary_categories"),
    agonists: formData.get("agonists"),
    synergists: formData.get("synergists"),
    equipment: formData.get("equipment"),
    movement_pattern: formData.get("movement_pattern"),
    default_intensity_type: formData.get("default_intensity_type") || "none",
    short_description: formData.get("short_description")
  };
}

export async function createCustomExercise(formData: FormData) {
  const trainerId = await getUserId("/dashboard");
  const parsed = customExerciseSchema.safeParse(formDataToCustomExercise(formData));

  if (!parsed.success) {
    redirect(`/dashboard?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  const supabase = createSupabaseClient();
  const exerciseInsert: TablesInsert<"exercises"> = {
    trainer_id: trainerId,
    source_type: "custom",
    exercise_key: null,
    name: parsed.data.name,
    primary_category: parsed.data.primary_category,
    secondary_categories: parsed.data.secondary_categories,
    agonists: parsed.data.agonists,
    synergists: parsed.data.synergists,
    antagonists: [],
    equipment: parsed.data.equipment,
    movement_pattern: parsed.data.movement_pattern,
    default_intensity_type: parsed.data.default_intensity_type,
    short_description: parsed.data.short_description,
    status: "active"
  };
  const { error } = await supabase.from("exercises").insert(exerciseInsert);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function updateCustomExercise(exerciseId: string, formData: FormData) {
  const parsed = customExerciseSchema.safeParse(formDataToCustomExercise(formData));

  if (!parsed.success) {
    redirect(`/dashboard?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  await getUserId("/dashboard");
  const supabase = createSupabaseClient();
  const exerciseUpdate: TablesUpdate<"exercises"> = {
    name: parsed.data.name,
    primary_category: parsed.data.primary_category,
    secondary_categories: parsed.data.secondary_categories,
    agonists: parsed.data.agonists,
    synergists: parsed.data.synergists,
    equipment: parsed.data.equipment,
    movement_pattern: parsed.data.movement_pattern,
    default_intensity_type: parsed.data.default_intensity_type,
    short_description: parsed.data.short_description
  };
  const { error } = await supabase
    .from("exercises")
    .update(exerciseUpdate)
    .eq("id", exerciseId)
    .eq("source_type", "custom");

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function archiveCustomExercise(exerciseId: string) {
  await getUserId("/dashboard");
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("exercises")
    .update({ status: "archived" } satisfies TablesUpdate<"exercises">)
    .eq("id", exerciseId)
    .eq("source_type", "custom");

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function addLibraryExerciseToSession(sessionId: string, exerciseId: string) {
  try {
    const trainerId = await getUserId(`/sessions/${sessionId}`);
    const session = await ensureSessionIsStarted(sessionId);
    const exercise = await getExerciseForAdd(exerciseId);
    const nextPosition = await getNextExercisePosition(sessionId);
    await insertSessionExercise({
      sessionId,
      trainerId,
      exercise,
      position: nextPosition
    });

    revalidatePath(`/sessions/${session.id}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

export async function createCustomExerciseAndAddToSession(sessionId: string, formData: FormData) {
  try {
    const trainerId = await getUserId(`/sessions/${sessionId}`);
    await ensureSessionIsStarted(sessionId);
    const parsed = customExerciseSchema.safeParse(formDataToCustomExercise(formData));

    if (!parsed.success) {
      redirect(`/sessions/${sessionId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
    }

    const supabase = createSupabaseClient();
    const exerciseInsert: TablesInsert<"exercises"> = {
      trainer_id: trainerId,
      source_type: "custom",
      exercise_key: null,
      name: parsed.data.name,
      primary_category: parsed.data.primary_category,
      secondary_categories: parsed.data.secondary_categories,
      agonists: parsed.data.agonists,
      synergists: parsed.data.synergists,
      antagonists: [],
      equipment: parsed.data.equipment,
      movement_pattern: parsed.data.movement_pattern,
      default_intensity_type: parsed.data.default_intensity_type,
      short_description: parsed.data.short_description,
      status: "active"
    };
    const { data: exercise, error } = await supabase.from("exercises").insert(exerciseInsert).select("*").single();

    if (error || !exercise) {
      redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error?.message ?? "Упражнение не создано")}`);
    }

    const nextPosition = await getNextExercisePosition(sessionId);
    await insertSessionExercise({
      sessionId,
      trainerId,
      exercise,
      position: nextPosition
    });

    revalidatePath(`/sessions/${sessionId}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

async function insertSessionExercise({
  sessionId,
  trainerId,
  exercise,
  position
}: {
  sessionId: string;
  trainerId: string;
  exercise: Tables<"exercises">;
  position: number;
}) {
  const supabase = createSupabaseClient();
  const isMobility = isMobilityExercise(exercise);
  const exerciseInsert: TablesInsert<"session_exercises"> = {
    session_id: sessionId,
    trainer_id: trainerId,
    exercise_id: exercise.id,
    name: exercise.name,
    name_snapshot: exercise.name,
    intensity_type: isMobility ? "none" : exercise.default_intensity_type,
    notes: exercise.short_description,
    position
  };
  const { data: sessionExercise, error } = await supabase
    .from("session_exercises")
    .insert(exerciseInsert)
    .select("id")
    .single();

  if (error || !sessionExercise) {
    throw new Error(error?.message ?? "Exercise was not added");
  }

  if (isMobility) {
    const setInsert: TablesInsert<"session_sets"> = {
      session_exercise_id: sessionExercise.id,
      trainer_id: trainerId,
      position: 1,
      weight: null,
      reps: null,
      intensity_value: null,
      is_completed: true,
      notes: null
    };
    const { error: setError } = await supabase.from("session_sets").insert(setInsert);

    if (setError) {
      throw new Error(setError.message);
    }
  }
}

function isMobilityExercise(exercise: Pick<Tables<"exercises">, "primary_category">) {
  return exercise.primary_category === "Мобилити";
}

async function getExerciseForAdd(exerciseId: string): Promise<Tables<"exercises">> {
  const supabase = createSupabaseClient();
  const { data: exercise, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !exercise) {
    throw new Error(error?.message ?? "Упражнение не найдено");
  }

  return exercise;
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

async function ensureSessionIsStarted(sessionId: string): Promise<Tables<"workout_sessions">> {
  const supabase = createSupabaseClient();
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !session) {
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error?.message ?? "Тренировка не найдена")}`);
  }

  if (session.status !== "started") {
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent("Завершённую тренировку нельзя редактировать")}`);
  }

  return session;
}

async function getNextExercisePosition(sessionId: string) {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("session_exercises")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? 0) + 1;
}

function redirectActionError(error: unknown, path: string): never {
  if (isRedirectError(error)) {
    throw error;
  }

  redirect(`${path}?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
}
