import { addDays, formatDateValueInTimeZone } from "@/features/calendar/queries";
import { getTrainerProfile } from "@/features/trainer/queries";
import { getPlanActualReviewForSession } from "@/features/workouts/plan-actual-review";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type ProgressRange = "30" | "90" | "all";

export type WeightTrendPoint = {
  date: string;
  weight: number;
};

export type WeightSummary = {
  startingWeight: number | null;
  currentWeight: number | null;
  deltaFromStart: number | null;
  trend: WeightTrendPoint[];
};

export type SessionSummary = {
  completedCount: number;
  latestCompletedWorkout: {
    id: string;
    completedAt: string | null;
    title: string;
  } | null;
};

export type AdherenceSummary = {
  duePlannedCount: number;
  completedPlannedCount: number;
  missedPlannedCount: number;
  adherencePercent: number | null;
};

export type RecentPlanActualHighlight = {
  sessionId: string;
  completedAt: string | null;
  title: string;
  changedExercises: number;
  addedExercises: number;
  missedExercises: number;
  missedSets: number;
};

export type ClientProgressDashboard = {
  client: {
    id: string;
    name: string;
    startingWeight: number | null;
  };
  range: ProgressRange;
  activePlan: {
    id: string;
    name: string;
    status: Tables<"training_plans">["status"];
    startsOn: string;
    endsOn: string;
  } | null;
  nextPlannedWorkout: {
    id: string;
    plannedDate: string;
    title: string;
    patternName: string | null;
    status: Tables<"planned_workouts">["status"];
  } | null;
  weight: WeightSummary;
  sessions: SessionSummary;
  adherence: AdherenceSummary;
  recentHighlights: RecentPlanActualHighlight[];
};

type ClientRow = Pick<Tables<"clients">, "id" | "name" | "preferred_name" | "starting_weight">;

type PlanRow = Pick<
  Tables<"training_plans">,
  "id" | "name" | "status" | "starts_on" | "ends_on"
>;

type PlannedWorkoutRow = Pick<
  Tables<"planned_workouts">,
  "id" | "name" | "planned_date" | "status" | "calendar_event_id" | "pattern_id"
> & {
  training_plans: Pick<Tables<"training_plans">, "id" | "name"> | null;
  training_plan_patterns: Pick<Tables<"training_plan_patterns">, "id" | "code" | "name"> | null;
};

type CompletedSessionRow = Pick<
  Tables<"workout_sessions">,
  "id" | "completed_at" | "started_at" | "planned_workout_id"
> & {
  calendar_events: Pick<Tables<"calendar_events">, "title"> | null;
  planned_workouts: Pick<Tables<"planned_workouts">, "name"> | null;
};

type PlannedWorkoutWithSessions = PlannedWorkoutRow & {
  workout_sessions: Pick<Tables<"workout_sessions">, "id" | "status">[];
};

export function normalizeProgressRange(value?: string | null): ProgressRange {
  return value === "90" || value === "all" ? value : "30";
}

export async function getClientProgressDashboard(
  clientId: string,
  options: { range?: ProgressRange } = {}
): Promise<ClientProgressDashboard> {
  const supabase = createClient();
  const range = options.range ?? "30";
  const profile = await getTrainerProfile();
  const timezone = profile?.timezone || "Europe/Moscow";
  const today = formatDateValueInTimeZone(new Date(), timezone);
  const rangeStart = range === "all" ? null : addDays(today, -Number(range) + 1);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, preferred_name, starting_weight")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (!client) {
    throw new Error("Client not found");
  }

  const [activePlan, weightLogs, completedSessions, plannedWorkouts, nextPlannedWorkout, highlightSessions] =
    await Promise.all([
      getActivePlan(clientId),
      getWeightLogs(clientId, rangeStart),
      getCompletedSessions(clientId, rangeStart),
      getPlannedWorkoutsForAdherence(clientId, rangeStart, today),
      getNextPlannedWorkout(clientId, today),
      getRecentLinkedCompletedSessions(clientId)
    ]);

  const highlights = await buildRecentHighlights(highlightSessions);
  const weight = buildWeightSummary(client, weightLogs);

  return {
    client: {
      id: client.id,
      name: client.preferred_name || client.name,
      startingWeight: client.starting_weight
    },
    range,
    activePlan,
    nextPlannedWorkout: nextPlannedWorkout ? normalizePlannedWorkout(nextPlannedWorkout) : null,
    weight,
    sessions: {
      completedCount: completedSessions.length,
      latestCompletedWorkout: completedSessions[0] ? normalizeCompletedSession(completedSessions[0]) : null
    },
    adherence: buildAdherenceSummary(plannedWorkouts, today),
    recentHighlights: highlights
  };
}

async function getActivePlan(clientId: string): Promise<ClientProgressDashboard["activePlan"]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("training_plans")
    .select("id, name, status, starts_on, ends_on")
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const plan = data as PlanRow;

  return {
    id: plan.id,
    name: plan.name,
    status: plan.status,
    startsOn: plan.starts_on,
    endsOn: plan.ends_on
  };
}

async function getWeightLogs(clientId: string, rangeStart: string | null): Promise<Tables<"client_daily_logs">[]> {
  const supabase = createClient();
  let query = supabase
    .from("client_daily_logs")
    .select("*")
    .eq("client_id", clientId)
    .not("body_weight", "is", null)
    .order("log_date", { ascending: true });

  if (rangeStart) {
    query = query.gte("log_date", rangeStart);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getCompletedSessions(clientId: string, rangeStart: string | null): Promise<CompletedSessionRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("workout_sessions")
    .select("id, completed_at, started_at, planned_workout_id, calendar_events(title), planned_workouts(name)")
    .eq("client_id", clientId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (rangeStart) {
    query = query.gte("completed_at", `${rangeStart}T00:00:00.000Z`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompletedSessionRow[];
}

async function getPlannedWorkoutsForAdherence(
  clientId: string,
  rangeStart: string | null,
  today: string
): Promise<PlannedWorkoutWithSessions[]> {
  const supabase = createClient();
  let query = supabase
    .from("planned_workouts")
    .select(
      "id, name, planned_date, status, calendar_event_id, pattern_id, training_plans(id, name), training_plan_patterns(id, code, name), workout_sessions(id, status)"
    )
    .eq("client_id", clientId)
    .neq("status", "cancelled")
    .lte("planned_date", today)
    .order("planned_date", { ascending: true });

  if (rangeStart) {
    query = query.gte("planned_date", rangeStart);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PlannedWorkoutWithSessions[];
}

async function getNextPlannedWorkout(clientId: string, today: string): Promise<PlannedWorkoutRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("planned_workouts")
    .select("id, name, planned_date, status, calendar_event_id, pattern_id, training_plans(id, name), training_plan_patterns(id, code, name)")
    .eq("client_id", clientId)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .gte("planned_date", today)
    .order("planned_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PlannedWorkoutRow | null;
}

async function getRecentLinkedCompletedSessions(clientId: string): Promise<CompletedSessionRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, completed_at, started_at, planned_workout_id, calendar_events(title), planned_workouts(name)")
    .eq("client_id", clientId)
    .eq("status", "completed")
    .not("planned_workout_id", "is", null)
    .order("completed_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompletedSessionRow[];
}

async function buildRecentHighlights(sessions: CompletedSessionRow[]): Promise<RecentPlanActualHighlight[]> {
  const highlights = await Promise.all(
    sessions.map(async (session) => {
      const review = await getPlanActualReviewForSession(session.id);

      if (!review) {
        return null;
      }

      const changedExercises = review.exercises.filter((exercise) => exercise.status === "changed").length;
      const addedExercises = review.exercises.filter((exercise) => exercise.status === "added").length;
      const missedExercises = review.exercises.filter((exercise) => exercise.status === "missed").length;
      const missedSets = review.exercises.reduce(
        (total, exercise) => total + exercise.setReviews.filter((set) => set.status === "missed").length,
        0
      );

      if (changedExercises + addedExercises + missedExercises + missedSets === 0) {
        return null;
      }

      return {
        sessionId: session.id,
        completedAt: session.completed_at,
        title: sessionTitle(session),
        changedExercises,
        addedExercises,
        missedExercises,
        missedSets
      };
    })
  );

  return highlights.filter((highlight): highlight is RecentPlanActualHighlight => Boolean(highlight));
}

function buildWeightSummary(client: ClientRow, logs: Tables<"client_daily_logs">[]): WeightSummary {
  const trend = logs
    .filter((log): log is Tables<"client_daily_logs"> & { body_weight: number } => log.body_weight !== null)
    .map((log) => ({
      date: log.log_date,
      weight: log.body_weight
    }));
  const currentWeight = trend.at(-1)?.weight ?? null;
  const startingWeight = client.starting_weight;

  return {
    startingWeight,
    currentWeight,
    deltaFromStart: startingWeight !== null && currentWeight !== null ? roundOne(currentWeight - startingWeight) : null,
    trend
  };
}

function buildAdherenceSummary(workouts: PlannedWorkoutWithSessions[], today: string): AdherenceSummary {
  const due = workouts.filter((workout) => workout.planned_date <= today);
  const completed = due.filter(isPlannedWorkoutCompleted);
  const missed = due.filter(
    (workout) => workout.planned_date < today && workout.status !== "completed" && !hasCompletedSession(workout)
  );

  return {
    duePlannedCount: due.length,
    completedPlannedCount: completed.length,
    missedPlannedCount: missed.length,
    adherencePercent: due.length > 0 ? Math.round((completed.length / due.length) * 100) : null
  };
}

function isPlannedWorkoutCompleted(workout: PlannedWorkoutWithSessions) {
  return workout.status === "completed" || hasCompletedSession(workout);
}

function hasCompletedSession(workout: PlannedWorkoutWithSessions) {
  return workout.workout_sessions?.some((session) => session.status === "completed") ?? false;
}

function normalizePlannedWorkout(workout: PlannedWorkoutRow): ClientProgressDashboard["nextPlannedWorkout"] {
  const patternName = workout.training_plan_patterns?.name ?? null;

  return {
    id: workout.id,
    plannedDate: workout.planned_date,
    title: patternName || workout.training_plans?.name || workout.name,
    patternName,
    status: workout.status
  };
}

function normalizeCompletedSession(session: CompletedSessionRow): SessionSummary["latestCompletedWorkout"] {
  return {
    id: session.id,
    completedAt: session.completed_at,
    title: sessionTitle(session)
  };
}

function sessionTitle(session: CompletedSessionRow) {
  return session.calendar_events?.title || session.planned_workouts?.name || "Тренировка";
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}
