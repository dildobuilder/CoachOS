import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import { getReadableErrorMessage, retryResultOnTransientError } from "@/lib/errors";

export type WorkoutSessionRow = Tables<"workout_sessions">;
export type SessionExerciseRow = Tables<"session_exercises">;
export type SessionSetRow = Tables<"session_sets">;

export type WorkoutSessionWithClient = WorkoutSessionRow & {
  clients: Pick<Tables<"clients">, "id" | "name" | "preferred_name"> | null;
  calendar_events: Pick<Tables<"calendar_events">, "id" | "title" | "starts_at"> | null;
};

export type SessionExerciseWithSets = SessionExerciseRow & {
  session_sets: SessionSetRow[];
};

export type WorkoutSessionDetail = {
  session: WorkoutSessionWithClient;
  exercises: SessionExerciseWithSets[];
};

export type WorkoutSessionDetailResult = {
  detail: WorkoutSessionDetail | null;
  error: string | null;
};

export async function getWorkoutSessionById(sessionId: string): Promise<WorkoutSessionDetail> {
  const result = await getWorkoutSessionResult(sessionId);

  if (result.error) {
    throw new Error(result.error);
  }

  if (!result.detail) {
    notFound();
  }

  return result.detail;
}

export async function getWorkoutSessionResult(sessionId: string): Promise<WorkoutSessionDetailResult> {
  try {
    const supabase = createClient();
    const { data: session, error } = await retryResultOnTransientError(() =>
      supabase
        .from("workout_sessions")
        .select("*, clients(id, name, preferred_name), calendar_events(id, title, starts_at)")
        .eq("id", sessionId)
        .maybeSingle()
    );

    if (error) {
      return {
        detail: null,
        error: getReadableErrorMessage(error, "Не удалось загрузить тренировку. Обновите страницу или попробуйте позже.")
      };
    }

    if (!session) {
      return {
        detail: null,
        error: null
      };
    }

    const exercises = await getSessionExercises(sessionId);

    return {
      detail: {
        session: session as WorkoutSessionWithClient,
        exercises
      },
      error: null
    };
  } catch (error) {
    return {
      detail: null,
      error: getReadableErrorMessage(error, "Не удалось загрузить тренировку. Обновите страницу или попробуйте позже.")
    };
  }
}

export async function getSessionExercises(sessionId: string): Promise<SessionExerciseWithSets[]> {
  const supabase = createClient();
  const { data: exercises, error } = await retryResultOnTransientError(() =>
    supabase
      .from("session_exercises")
      .select("*")
      .eq("session_id", sessionId)
      .order("position", { ascending: true })
  );

  if (error) {
    throw new Error(getReadableErrorMessage(error, "Не удалось загрузить упражнения."));
  }

  const exerciseRows = exercises ?? [];

  if (exerciseRows.length === 0) {
    return [];
  }

  const exerciseIds = exerciseRows.map((exercise) => exercise.id);
  const { data: sets, error: setsError } = await retryResultOnTransientError(() =>
    supabase
      .from("session_sets")
      .select("*")
      .in("session_exercise_id", exerciseIds)
      .order("position", { ascending: true })
  );

  if (setsError) {
    throw new Error(getReadableErrorMessage(setsError, "Не удалось загрузить подходы."));
  }

  return exerciseRows.map((exercise) => ({
    ...exercise,
    session_sets: (sets ?? []).filter((set) => set.session_exercise_id === exercise.id)
  }));
}

export async function getClientSessionHistory(clientId: string): Promise<WorkoutSessionDetail[]> {
  const supabase = createClient();
  const { data: sessions, error } = await retryResultOnTransientError(() =>
    supabase
      .from("workout_sessions")
      .select("*, clients(id, name, preferred_name), calendar_events(id, title, starts_at)")
      .eq("client_id", clientId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
  );

  if (error) {
    throw new Error(getReadableErrorMessage(error, "Не удалось загрузить историю тренировок."));
  }

  const details = await Promise.all(
    (sessions ?? []).map(async (session) => ({
      session: session as WorkoutSessionWithClient,
      exercises: await getSessionExercises(session.id)
    }))
  );

  return details;
}

export async function getPreviousCompletedWorkout(
  clientId: string,
  currentSessionId?: string
): Promise<WorkoutSessionDetail | null> {
  const history = await getClientSessionHistory(clientId);

  return history.find((detail) => detail.session.id !== currentSessionId) ?? null;
}
