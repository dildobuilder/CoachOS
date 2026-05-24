import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

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

export async function getWorkoutSessionById(sessionId: string): Promise<WorkoutSessionDetail> {
  const supabase = createClient();
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .select("*, clients(id, name, preferred_name), calendar_events(id, title, starts_at)")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!session) {
    notFound();
  }

  const exercises = await getSessionExercises(sessionId);

  return {
    session: session as WorkoutSessionWithClient,
    exercises
  };
}

export async function getSessionExercises(sessionId: string): Promise<SessionExerciseWithSets[]> {
  const supabase = createClient();
  const { data: exercises, error } = await supabase
    .from("session_exercises")
    .select("*")
    .eq("session_id", sessionId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const exerciseRows = exercises ?? [];

  if (exerciseRows.length === 0) {
    return [];
  }

  const exerciseIds = exerciseRows.map((exercise) => exercise.id);
  const { data: sets, error: setsError } = await supabase
    .from("session_sets")
    .select("*")
    .in("session_exercise_id", exerciseIds)
    .order("position", { ascending: true });

  if (setsError) {
    throw new Error(setsError.message);
  }

  return exerciseRows.map((exercise) => ({
    ...exercise,
    session_sets: (sets ?? []).filter((set) => set.session_exercise_id === exercise.id)
  }));
}

export async function getClientSessionHistory(clientId: string): Promise<WorkoutSessionDetail[]> {
  const supabase = createClient();
  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select("*, clients(id, name, preferred_name), calendar_events(id, title, starts_at)")
    .eq("client_id", clientId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
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
