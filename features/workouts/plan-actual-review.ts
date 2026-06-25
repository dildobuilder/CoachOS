import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

type IntensityType = Tables<"session_exercises">["intensity_type"];

export type ReviewStatus = "matched" | "changed" | "added" | "missed";

export type ReviewValue = {
  weight: number | null;
  reps: number | null;
  intensityType: IntensityType;
  intensityValue: number | null;
  notes: string | null;
};

export type SetReviewItem = {
  id: string;
  position: number;
  status: ReviewStatus;
  planned: ReviewValue | null;
  actual: ReviewValue | null;
  deltas: string[];
};

export type ExerciseReviewItem = {
  id: string;
  name: string;
  position: number;
  status: ReviewStatus;
  plannedExerciseId: string | null;
  actualExerciseId: string | null;
  plannedNotes: string | null;
  actualNotes: string | null;
  setReviews: SetReviewItem[];
  deltas: string[];
};

export type PlanActualReview = {
  sessionId: string;
  sessionStatus: Tables<"workout_sessions">["status"];
  plannedWorkout: Pick<Tables<"planned_workouts">, "id" | "name" | "planned_date" | "status">;
  exercises: ExerciseReviewItem[];
  hasPlannedExercises: boolean;
};

type PlannedExerciseWithSets = Tables<"planned_exercises"> & {
  planned_sets: Tables<"planned_sets">[];
};

type SessionExerciseWithSets = Tables<"session_exercises"> & {
  session_sets: Tables<"session_sets">[];
};

export async function getPlanActualReviewForSession(sessionId: string): Promise<PlanActualReview | null> {
  const supabase = createClient();
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.planned_workout_id || session.status !== "completed") {
    return null;
  }

  const { data: plannedWorkout, error: workoutError } = await supabase
    .from("planned_workouts")
    .select("id, name, planned_date, status")
    .eq("id", session.planned_workout_id)
    .maybeSingle();

  if (workoutError) {
    throw new Error(workoutError.message);
  }

  if (!plannedWorkout) {
    return null;
  }

  const [plannedExercises, actualExercises] = await Promise.all([
    getPlannedExercisesWithSets(session.planned_workout_id),
    getActualExercisesWithSets(session.id)
  ]);

  return {
    sessionId: session.id,
    sessionStatus: session.status,
    plannedWorkout,
    exercises: buildExerciseReviews(plannedExercises, actualExercises),
    hasPlannedExercises: plannedExercises.length > 0
  };
}

async function getPlannedExercisesWithSets(plannedWorkoutId: string): Promise<PlannedExerciseWithSets[]> {
  const supabase = createClient();
  const { data: exercises, error } = await supabase
    .from("planned_exercises")
    .select("*, planned_sets(*)")
    .eq("planned_workout_id", plannedWorkoutId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((exercises ?? []) as PlannedExerciseWithSets[]).map((exercise) => ({
    ...exercise,
    planned_sets: [...(exercise.planned_sets ?? [])].sort((a, b) => a.position - b.position)
  }));
}

async function getActualExercisesWithSets(sessionId: string): Promise<SessionExerciseWithSets[]> {
  const supabase = createClient();
  const { data: exercises, error } = await supabase
    .from("session_exercises")
    .select("*, session_sets(*)")
    .eq("session_id", sessionId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((exercises ?? []) as SessionExerciseWithSets[]).map((exercise) => ({
    ...exercise,
    session_sets: [...(exercise.session_sets ?? [])].sort((a, b) => a.position - b.position)
  }));
}

function buildExerciseReviews(
  plannedExercises: PlannedExerciseWithSets[],
  actualExercises: SessionExerciseWithSets[]
): ExerciseReviewItem[] {
  const actualByPlannedId = new Map(
    actualExercises
      .filter((exercise) => exercise.planned_exercise_id)
      .map((exercise) => [exercise.planned_exercise_id as string, exercise])
  );
  const plannedReviews = plannedExercises.map((plannedExercise) => {
    const actualExercise = actualByPlannedId.get(plannedExercise.id) ?? null;

    return buildPlannedExerciseReview(plannedExercise, actualExercise);
  });
  const addedReviews = actualExercises
    .filter((actualExercise) => !actualExercise.planned_exercise_id)
    .map(buildAddedExerciseReview);

  return [...plannedReviews, ...addedReviews].sort((a, b) => a.position - b.position);
}

function buildPlannedExerciseReview(
  plannedExercise: PlannedExerciseWithSets,
  actualExercise: SessionExerciseWithSets | null
): ExerciseReviewItem {
  if (!actualExercise) {
    return {
      id: plannedExercise.id,
      name: plannedExercise.name_snapshot,
      position: plannedExercise.position,
      status: "missed",
      plannedExerciseId: plannedExercise.id,
      actualExerciseId: null,
      plannedNotes: plannedExercise.notes,
      actualNotes: null,
      setReviews: plannedExercise.planned_sets.map((plannedSet) =>
        buildMissedSetReview(plannedSet, plannedExercise.intensity_type)
      ),
      deltas: []
    };
  }

  const setReviews = buildSetReviews(plannedExercise, actualExercise);
  const deltas = plannedExercise.intensity_type === actualExercise.intensity_type
    ? []
    : [`Интенсивность: ${formatIntensityType(plannedExercise.intensity_type)} -> ${formatIntensityType(actualExercise.intensity_type)}`];
  const hasChanges = deltas.length > 0 || setReviews.some((set) => set.status !== "matched");

  return {
    id: plannedExercise.id,
    name: actualExercise.name_snapshot || actualExercise.name || plannedExercise.name_snapshot,
    position: plannedExercise.position,
    status: hasChanges ? "changed" : "matched",
    plannedExerciseId: plannedExercise.id,
    actualExerciseId: actualExercise.id,
    plannedNotes: plannedExercise.notes,
    actualNotes: actualExercise.notes,
    setReviews,
    deltas
  };
}

function buildAddedExerciseReview(actualExercise: SessionExerciseWithSets): ExerciseReviewItem {
  return {
    id: actualExercise.id,
    name: actualExercise.name_snapshot || actualExercise.name,
    position: actualExercise.position,
    status: "added",
    plannedExerciseId: null,
    actualExerciseId: actualExercise.id,
    plannedNotes: null,
    actualNotes: actualExercise.notes,
    setReviews: actualExercise.session_sets.map((actualSet) =>
      buildAddedSetReview(actualSet, actualExercise.intensity_type)
    ),
    deltas: []
  };
}

function buildSetReviews(
  plannedExercise: PlannedExerciseWithSets,
  actualExercise: SessionExerciseWithSets
): SetReviewItem[] {
  const actualByPlannedSetId = new Map(
    actualExercise.session_sets
      .filter((set) => set.planned_set_id)
      .map((set) => [set.planned_set_id as string, set])
  );
  const matchedOrMissed = plannedExercise.planned_sets.map((plannedSet) => {
    const actualSet = actualByPlannedSetId.get(plannedSet.id) ?? null;

    return actualSet
      ? buildComparedSetReview(plannedSet, plannedExercise.intensity_type, actualSet, actualExercise.intensity_type)
      : buildMissedSetReview(plannedSet, plannedExercise.intensity_type);
  });
  const added = actualExercise.session_sets
    .filter((actualSet) => !actualSet.planned_set_id)
    .map((actualSet) => buildAddedSetReview(actualSet, actualExercise.intensity_type));

  return [...matchedOrMissed, ...added].sort((a, b) => a.position - b.position);
}

function buildComparedSetReview(
  plannedSet: Tables<"planned_sets">,
  plannedIntensityType: IntensityType,
  actualSet: Tables<"session_sets">,
  actualIntensityType: IntensityType
): SetReviewItem {
  const planned = toReviewValue(plannedSet, plannedIntensityType);
  const actual = toReviewValue(actualSet, actualIntensityType);
  const deltas = getValueDeltas(planned, actual);

  return {
    id: plannedSet.id,
    position: plannedSet.position,
    status: deltas.length > 0 ? "changed" : "matched",
    planned,
    actual,
    deltas
  };
}

function buildMissedSetReview(plannedSet: Tables<"planned_sets">, intensityType: IntensityType): SetReviewItem {
  return {
    id: plannedSet.id,
    position: plannedSet.position,
    status: "missed",
    planned: toReviewValue(plannedSet, intensityType),
    actual: null,
    deltas: []
  };
}

function buildAddedSetReview(actualSet: Tables<"session_sets">, intensityType: IntensityType): SetReviewItem {
  return {
    id: actualSet.id,
    position: actualSet.position,
    status: "added",
    planned: null,
    actual: toReviewValue(actualSet, intensityType),
    deltas: []
  };
}

function toReviewValue(
  set: Tables<"planned_sets"> | Tables<"session_sets">,
  intensityType: IntensityType
): ReviewValue {
  return {
    weight: normalizeNumber(set.weight),
    reps: normalizeNumber(set.reps),
    intensityType,
    intensityValue: normalizeNumber(set.intensity_value),
    notes: set.notes
  };
}

function getValueDeltas(planned: ReviewValue, actual: ReviewValue) {
  const deltas: string[] = [];

  if (planned.weight !== actual.weight) {
    deltas.push(`${formatWeight(planned.weight)} -> ${formatWeight(actual.weight)}`);
  }

  if (planned.reps !== actual.reps) {
    deltas.push(`${formatReps(planned.reps)} -> ${formatReps(actual.reps)}`);
  }

  if (planned.intensityType !== actual.intensityType || planned.intensityValue !== actual.intensityValue) {
    deltas.push(`${formatIntensity(planned.intensityType, planned.intensityValue)} -> ${formatIntensity(actual.intensityType, actual.intensityValue)}`);
  }

  return deltas;
}

function normalizeNumber(value: number | null | undefined) {
  return value ?? null;
}

function formatWeight(value: number | null) {
  return value === null ? "вес не задан" : `${value} кг`;
}

function formatReps(value: number | null) {
  return value === null ? "повт. не заданы" : `${value} повт.`;
}

function formatIntensity(type: IntensityType, value: number | null) {
  if (type === "none" || value === null) {
    return "без оценки";
  }

  if (type === "rpe") {
    return `RPE ${value}`;
  }

  if (type === "rir") {
    return `RIR ${value}`;
  }

  if (type === "time") {
    return formatTime(value);
  }

  return `${value}%`;
}

function formatIntensityType(type: IntensityType) {
  if (type === "rpe") {
    return "RPE";
  }

  if (type === "rir") {
    return "RIR";
  }

  if (type === "percent") {
    return "%";
  }

  if (type === "time") {
    return "Время";
  }

  return "Без оценки";
}

function formatTime(value: number) {
  if (value < 60) {
    return `${value} сек`;
  }

  if (value % 60 === 0) {
    return `${value / 60} мин`;
  }

  return `${Math.floor(value / 60)} мин ${value % 60} сек`;
}
