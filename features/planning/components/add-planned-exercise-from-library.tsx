"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addExerciseToPlannedWorkout } from "@/features/planning/actions";
import { ExerciseCategorySelector } from "@/features/exercises/components/exercise-category-selector";
import { ExerciseSearch } from "@/features/exercises/components/exercise-search";
import type { ExerciseRow } from "@/features/exercises/queries";
import { isSpecialCategory, type ExerciseCategory } from "@/features/exercises/schemas";

type AddPlannedExerciseFromLibraryProps = {
  plannedWorkoutId: string;
  exercises: ExerciseRow[];
  categories: ExerciseCategory[];
};

const intensityLabels: Record<string, string> = {
  none: "Без оценки",
  rpe: "RPE",
  rir: "RIR",
  percent: "%",
  time: "Время"
};

export function AddPlannedExerciseFromLibrary({
  plannedWorkoutId,
  exercises,
  categories
}: AddPlannedExerciseFromLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>(categories[0]);
  const [search, setSearch] = useState("");
  const visibleExercises = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (!exerciseMatchesCategory(exercise, selectedCategory)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [exercise.name, exercise.equipment, exercise.movement_pattern, exercise.short_description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [exercises, search, selectedCategory]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Добавить упражнение в план</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Выберите упражнение из базы CoachOS. Факт тренировки потом можно будет менять отдельно.
          </p>
        </div>
        <ExerciseCategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <ExerciseSearch value={search} onChange={setSearch} />
        <div className="grid gap-3">
          {visibleExercises.map((exercise) => (
            <Card key={exercise.id}>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{exercise.name}</h4>
                    <Badge variant="outline">{intensityLabels[exercise.default_intensity_type]}</Badge>
                  </div>
                  {exercise.short_description ? (
                    <p className="text-sm text-muted-foreground">{exercise.short_description}</p>
                  ) : null}
                </div>
                <form action={addExerciseToPlannedWorkout.bind(null, plannedWorkoutId, exercise.id)}>
                  <SubmitButton size="sm">
                    <Plus className="h-4 w-4" />
                    Добавить
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function exerciseMatchesCategory(exercise: ExerciseRow, category: ExerciseCategory) {
  if (isSpecialCategory(category)) {
    return exercise.primary_category === category;
  }

  if (isSpecialCategory(exercise.primary_category)) {
    return false;
  }

  return exercise.primary_category === category || exercise.secondary_categories.includes(category);
}
