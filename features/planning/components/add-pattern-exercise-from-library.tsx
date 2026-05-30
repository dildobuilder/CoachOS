"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseCategorySelector } from "@/features/exercises/components/exercise-category-selector";
import { ExerciseSearch } from "@/features/exercises/components/exercise-search";
import type { ExerciseRow } from "@/features/exercises/queries";
import { isSpecialCategory, type ExerciseCategory } from "@/features/exercises/schemas";
import { addExerciseToPattern } from "@/features/planning/actions";

type AddPatternExerciseFromLibraryProps = {
  patternId: string;
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

export function AddPatternExerciseFromLibrary({
  patternId,
  exercises,
  categories
}: AddPatternExerciseFromLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Добавить упражнение в pattern</h3>
            <p className="text-sm text-muted-foreground">Выберите упражнение из базы CoachOS.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Добавить упражнение в pattern</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Это упражнение попадёт во все planned workouts после применения pattern.</p>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} className="text-sm font-medium text-primary">
            Скрыть
          </button>
        </div>
        <ExerciseCategorySelector categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
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
                <form action={addExerciseToPattern.bind(null, patternId, exercise.id)}>
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
