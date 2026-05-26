import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import { exerciseCategories, isSpecialCategory, type ExerciseCategory } from "@/features/exercises/schemas";

export type ExerciseRow = Tables<"exercises">;

export async function getExerciseCategories() {
  return [...exerciseCategories];
}

export async function getExerciseById(exerciseId: string): Promise<ExerciseRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("exercises").select("*").eq("id", exerciseId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getTrainerCustomExercises(): Promise<ExerciseRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("source_type", "custom")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAvailableExercises(): Promise<ExerciseRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("status", "active")
    .order("primary_category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getExercisesByCategory(category: ExerciseCategory): Promise<ExerciseRow[]> {
  const exercises = await getAvailableExercises();

  return exercises.filter((exercise) => exerciseMatchesCategory(exercise, category));
}

export async function searchExercises(query: string, category?: ExerciseCategory): Promise<ExerciseRow[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const exercises = category ? await getExercisesByCategory(category) : await getAvailableExercises();

  if (!normalizedQuery) {
    return exercises;
  }

  return exercises.filter((exercise) =>
    [exercise.name, exercise.equipment, exercise.movement_pattern, exercise.short_description]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedQuery))
  );
}

export function exerciseMatchesCategory(exercise: ExerciseRow, category: ExerciseCategory) {
  if (isSpecialCategory(category)) {
    return exercise.primary_category === category;
  }

  if (isSpecialCategory(exercise.primary_category)) {
    return false;
  }

  return exercise.primary_category === category || exercise.secondary_categories.includes(category);
}
