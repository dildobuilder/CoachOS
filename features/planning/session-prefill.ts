import type { TablesInsert } from "@/lib/database.types";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function prefillSessionFromPlannedWorkout({
  sessionId,
  plannedWorkoutId,
  trainerId
}: {
  sessionId: string;
  plannedWorkoutId: string;
  trainerId: string;
}) {
  const supabase = createSupabaseClient();
  const { data: plannedExercises, error } = await supabase
    .from("planned_exercises")
    .select("*, planned_sets(*)")
    .eq("planned_workout_id", plannedWorkoutId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  for (const plannedExercise of plannedExercises ?? []) {
    const exerciseInsert: TablesInsert<"session_exercises"> = {
      session_id: sessionId,
      trainer_id: trainerId,
      exercise_id: plannedExercise.exercise_id,
      planned_exercise_id: plannedExercise.id,
      name: plannedExercise.name_snapshot,
      name_snapshot: plannedExercise.name_snapshot,
      position: plannedExercise.position,
      intensity_type: plannedExercise.intensity_type,
      notes: plannedExercise.notes
    };
    const { data: sessionExercise, error: exerciseError } = await supabase
      .from("session_exercises")
      .insert(exerciseInsert)
      .select("id")
      .single();

    if (exerciseError || !sessionExercise) {
      throw new Error(exerciseError?.message ?? "Could not copy planned exercise");
    }

    const plannedSets = [...(plannedExercise.planned_sets ?? [])].sort((a, b) => a.position - b.position);

    if (plannedSets.length > 0) {
      const setInserts: TablesInsert<"session_sets">[] = plannedSets.map((set) => ({
        session_exercise_id: sessionExercise.id,
        trainer_id: trainerId,
        planned_set_id: set.id,
        position: set.position,
        weight: set.weight,
        reps: set.reps,
        intensity_value: set.intensity_value,
        notes: set.notes,
        is_completed: true
      }));
      const { error: setsError } = await supabase.from("session_sets").insert(setInserts);

      if (setsError) {
        throw new Error(setsError.message);
      }
    }
  }
}
