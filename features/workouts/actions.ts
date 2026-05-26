"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { completeSessionSchema, exerciseSchema, setSchema, validateIntensityValue } from "@/features/workouts/schemas";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { getReadableErrorMessage, isTransientNetworkError } from "@/lib/errors";

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

function exerciseFormDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    intensity_type: formData.get("intensity_type") || "none",
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

export async function addExerciseToSession(sessionId: string, formData: FormData) {
  try {
  const parsed = exerciseSchema.safeParse(exerciseFormDataToObject(formData));

  if (!parsed.success) {
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  const trainerId = await getUserId(`/sessions/${sessionId}`);
  await ensureSessionIsStarted(sessionId);
  const supabase = createSupabaseClient();
  const nextPosition = await getNextExercisePosition(sessionId);
  const exerciseInsert: TablesInsert<"session_exercises"> = {
    session_id: sessionId,
    trainer_id: trainerId,
    exercise_id: null,
    name: parsed.data.name,
    name_snapshot: parsed.data.name,
    intensity_type: parsed.data.intensity_type,
    notes: parsed.data.notes,
    position: nextPosition
  };
  const { error } = await supabase.from("session_exercises").insert(exerciseInsert);

  if (error) {
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${sessionId}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

export async function updateSessionExercise(sessionId: string, exerciseId: string, formData: FormData) {
  try {
  const parsed = exerciseSchema.safeParse(exerciseFormDataToObject(formData));
  const exercise = await getExerciseById(exerciseId);

  if (!parsed.success) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  await ensureSessionIsStarted(exercise.session_id);

  if (exercise.exercise_id) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent("Упражнение из базы нельзя редактировать в тренировке")}`);
  }

  const supabase = createSupabaseClient();
  const exerciseUpdate: TablesUpdate<"session_exercises"> = {
    name: parsed.data.name,
    name_snapshot: parsed.data.name,
    intensity_type: parsed.data.intensity_type,
    notes: parsed.data.notes
  };
  const { error } = await supabase.from("session_exercises").update(exerciseUpdate).eq("id", exerciseId);

  if (error) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${exercise.session_id}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

export async function updateSessionExerciseIntensity(sessionId: string, exerciseId: string, formData: FormData) {
  try {
  const parsed = exerciseSchema.pick({ intensity_type: true }).safeParse({
    intensity_type: formData.get("intensity_type") || "none"
  });
  const exercise = await getExerciseById(exerciseId);

  if (!parsed.success) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  await ensureSessionIsStarted(exercise.session_id);

  if (!exercise.exercise_id) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent("Ручное упражнение редактируется через основную форму")}`);
  }

  const supabase = createSupabaseClient();
  const exerciseUpdate: TablesUpdate<"session_exercises"> = {
    intensity_type: parsed.data.intensity_type
  };
  const { error } = await supabase.from("session_exercises").update(exerciseUpdate).eq("id", exerciseId);

  if (error) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${exercise.session_id}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

export async function deleteSessionExercise(sessionId: string, exerciseId: string) {
  try {
  await getUserId(`/sessions/${sessionId}`);
  const exercise = await getExerciseById(exerciseId);
  await ensureSessionIsStarted(exercise.session_id);
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("session_exercises").delete().eq("id", exerciseId);

  if (error) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${exercise.session_id}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

export async function addSetToExercise(sessionId: string, exerciseId: string, formData: FormData) {
  try {
  const parsed = setSchema.safeParse(setFormDataToObject(formData));
  const trainerId = await getUserId(`/sessions/${sessionId}`);
  const exercise = await getExerciseById(exerciseId);

  if (!parsed.success) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  await ensureSessionIsStarted(exercise.session_id);
  const intensityValue = validateIntensityValue(exercise.intensity_type, parsed.data.intensity_value);
  const supabase = createSupabaseClient();
  const nextPosition = await getNextSetPosition(exerciseId);
  const setInsert: TablesInsert<"session_sets"> = {
    session_exercise_id: exerciseId,
    trainer_id: trainerId,
    position: nextPosition,
    weight: parsed.data.weight,
    reps: parsed.data.reps,
    intensity_value: intensityValue,
    notes: parsed.data.notes
  };
  const { error } = await supabase.from("session_sets").insert(setInsert);

  if (error) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${exercise.session_id}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

export async function updateSessionSet(sessionId: string, setId: string, formData: FormData) {
  try {
  const parsed = setSchema.safeParse(setFormDataToObject(formData));
  const { set, exercise } = await getSetWithExercise(setId);

  if (!parsed.success) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  await ensureSessionIsStarted(exercise.session_id);
  const intensityValue = validateIntensityValue(exercise.intensity_type, parsed.data.intensity_value);
  const supabase = createSupabaseClient();
  const setUpdate: TablesUpdate<"session_sets"> = {
    weight: parsed.data.weight,
    reps: parsed.data.reps,
    intensity_value: intensityValue,
    notes: parsed.data.notes,
    is_completed: set.is_completed
  };
  const { error } = await supabase.from("session_sets").update(setUpdate).eq("id", setId);

  if (error) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${exercise.session_id}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

export async function deleteSessionSet(sessionId: string, setId: string) {
  try {
  await getUserId(`/sessions/${sessionId}`);
  const { exercise } = await getSetWithExercise(setId);
  await ensureSessionIsStarted(exercise.session_id);
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("session_sets").delete().eq("id", setId);

  if (error) {
    redirect(`/sessions/${exercise.session_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${exercise.session_id}`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

export async function completeWorkoutSession(sessionId: string, formData: FormData) {
  try {
  const parsed = completeSessionSchema.safeParse({
    coach_notes: formData.get("coach_notes")
  });

  if (!parsed.success) {
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  await getUserId(`/sessions/${sessionId}`);
  const session = await ensureSessionIsStarted(sessionId);
  const completedAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.round((completedAt.getTime() - new Date(session.started_at).getTime()) / 1000)
  );
  const sessionUpdate: TablesUpdate<"workout_sessions"> = {
    status: "completed",
    completed_at: completedAt.toISOString(),
    duration_seconds: durationSeconds,
    coach_notes: parsed.data.coach_notes
  };
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("workout_sessions").update(sessionUpdate).eq("id", sessionId);

  if (error) {
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error.message)}`);
  }

  if (session.calendar_event_id) {
    const eventUpdate: TablesUpdate<"calendar_events"> = { status: "completed" };
    await supabase.from("calendar_events").update(eventUpdate).eq("id", session.calendar_event_id);
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/clients/${session.client_id}/history`);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect(`/clients/${session.client_id}/history`);
  } catch (error) {
    redirectActionError(error, `/sessions/${sessionId}`);
  }
}

function redirectActionError(error: unknown, path: string): never {
  if (isRedirectError(error)) {
    throw error;
  }

  redirect(`${path}?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
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
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent("Завершенную тренировку нельзя редактировать")}`);
  }

  return session;
}

async function getExerciseById(exerciseId: string): Promise<Tables<"session_exercises">> {
  const supabase = createSupabaseClient();
  const { data: exercise, error } = await supabase
    .from("session_exercises")
    .select("*")
    .eq("id", exerciseId)
    .maybeSingle();

  if (error || !exercise) {
    throw new Error(error?.message ?? "Exercise not found");
  }

  return exercise;
}

async function getSetWithExercise(setId: string) {
  const supabase = createSupabaseClient();
  const { data: set, error } = await supabase.from("session_sets").select("*").eq("id", setId).maybeSingle();

  if (error || !set) {
    throw new Error(error?.message ?? "Set not found");
  }

  return {
    set,
    exercise: await getExerciseById(set.session_exercise_id)
  };
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

async function getNextSetPosition(exerciseId: string) {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("session_sets")
    .select("position")
    .eq("session_exercise_id", exerciseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? 0) + 1;
}
