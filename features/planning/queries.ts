import { notFound } from "next/navigation";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type TrainingPlanRow = Tables<"training_plans">;
export type PlannedWorkoutRow = Tables<"planned_workouts">;
export type PlannedExerciseRow = Tables<"planned_exercises">;
export type PlannedSetRow = Tables<"planned_sets">;

export type PlannedWorkoutListItem = PlannedWorkoutRow & {
  training_plans: Pick<TrainingPlanRow, "id" | "name"> | null;
  calendar_events: Pick<Tables<"calendar_events">, "id" | "starts_at" | "ends_at" | "status"> | null;
  existing_session_id: string | null;
};

export type PlannedExerciseWithSets = PlannedExerciseRow & {
  planned_sets: PlannedSetRow[];
  exercises: Pick<
    Tables<"exercises">,
    "primary_category" | "equipment" | "agonists" | "synergists" | "antagonists" | "short_description"
  > | null;
};

export type PlannedWorkoutDetail = PlannedWorkoutRow & {
  training_plans: TrainingPlanRow | null;
  calendar_events: Pick<Tables<"calendar_events">, "id" | "starts_at" | "ends_at" | "status"> | null;
  planned_exercises: PlannedExerciseWithSets[];
  existing_session_id: string | null;
};

export async function getClientTrainingPlans(clientId: string): Promise<TrainingPlanRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("training_plans")
    .select("*")
    .eq("client_id", clientId)
    .neq("status", "archived")
    .order("starts_on", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getTrainingPlan(planId: string): Promise<TrainingPlanRow> {
  const supabase = createClient();
  const { data, error } = await supabase.from("training_plans").select("*").eq("id", planId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  return data;
}

export async function getPlanWorkouts(planId: string): Promise<PlannedWorkoutListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("planned_workouts")
    .select("*, training_plans(id, name), calendar_events(id, starts_at, ends_at, status)")
    .eq("training_plan_id", planId)
    .order("planned_date", { ascending: true })
    .order("day_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return addExistingSessionIds((data ?? []) as PlannedWorkoutListItem[]);
}

export async function getClientPlannedWorkouts(
  clientId: string,
  range: { startDate: string; endDate: string }
): Promise<PlannedWorkoutListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("planned_workouts")
    .select("*, training_plans(id, name), calendar_events(id, starts_at, ends_at, status)")
    .eq("client_id", clientId)
    .neq("status", "cancelled")
    .gte("planned_date", range.startDate)
    .lt("planned_date", range.endDate)
    .order("planned_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return addExistingSessionIds((data ?? []) as PlannedWorkoutListItem[]);
}

export async function getPlannedWorkout(plannedWorkoutId: string): Promise<PlannedWorkoutDetail> {
  const supabase = createClient();
  const { data: workout, error } = await supabase
    .from("planned_workouts")
    .select("*, training_plans(*), calendar_events(id, starts_at, ends_at, status)")
    .eq("id", plannedWorkoutId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!workout) {
    notFound();
  }

  const exercises = await getPlannedExercises(plannedWorkoutId);
  const sessionId = workout.calendar_event_id
    ? await getExistingSessionIdForEvent(workout.calendar_event_id)
    : null;

  return {
    ...(workout as PlannedWorkoutRow & {
      training_plans: TrainingPlanRow | null;
      calendar_events: Pick<Tables<"calendar_events">, "id" | "starts_at" | "ends_at" | "status"> | null;
    }),
    planned_exercises: exercises,
    existing_session_id: sessionId
  };
}

export async function getPlannedWorkoutByCalendarEvent(eventId: string): Promise<PlannedWorkoutDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("planned_workouts")
    .select("id")
    .eq("calendar_event_id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? getPlannedWorkout(data.id) : null;
}

export async function getPlannedExercises(plannedWorkoutId: string): Promise<PlannedExerciseWithSets[]> {
  const supabase = createClient();
  const { data: exercises, error } = await supabase
    .from("planned_exercises")
    .select("*, exercises(primary_category, equipment, agonists, synergists, antagonists, short_description)")
    .eq("planned_workout_id", plannedWorkoutId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = exercises ?? [];

  if (rows.length === 0) {
    return [];
  }

  const { data: sets, error: setsError } = await supabase
    .from("planned_sets")
    .select("*")
    .in(
      "planned_exercise_id",
      rows.map((exercise) => exercise.id)
    )
    .order("position", { ascending: true });

  if (setsError) {
    throw new Error(setsError.message);
  }

  return rows.map((exercise) => ({
    ...exercise,
    planned_sets: (sets ?? []).filter((set) => set.planned_exercise_id === exercise.id)
  })) as PlannedExerciseWithSets[];
}

async function addExistingSessionIds(workouts: PlannedWorkoutListItem[]): Promise<PlannedWorkoutListItem[]> {
  const eventIds = workouts
    .map((workout) => workout.calendar_event_id)
    .filter((value): value is string => Boolean(value));

  if (eventIds.length === 0) {
    return workouts.map((workout) => ({ ...workout, existing_session_id: null }));
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("id, calendar_event_id")
    .in("calendar_event_id", eventIds);

  return workouts.map((workout) => ({
    ...workout,
    existing_session_id:
      data?.find((session) => session.calendar_event_id === workout.calendar_event_id)?.id ?? null
  }));
}

async function getExistingSessionIdForEvent(eventId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("calendar_event_id", eventId)
    .maybeSingle();

  return data?.id ?? null;
}
