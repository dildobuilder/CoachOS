"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddExerciseForm } from "@/features/workouts/components/add-exercise-form";
import { CustomExerciseForm } from "@/features/exercises/components/custom-exercise-form";
import { ExerciseCategorySelector } from "@/features/exercises/components/exercise-category-selector";
import { ExerciseList } from "@/features/exercises/components/exercise-list";
import { ExerciseSearch } from "@/features/exercises/components/exercise-search";
import type { ExerciseRow } from "@/features/exercises/queries";
import { isSpecialCategory, type ExerciseCategory } from "@/features/exercises/schemas";

type AddExerciseFromLibraryProps = {
  sessionId: string;
  exercises: ExerciseRow[];
  categories: ExerciseCategory[];
};

export function AddExerciseFromLibrary({ sessionId, exercises, categories }: AddExerciseFromLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>(categories[0]);
  const [search, setSearch] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showLegacyForm, setShowLegacyForm] = useState(false);
  const visibleExercises = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesCategory = exerciseMatchesCategory(exercise, selectedCategory);

      if (!matchesCategory) {
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Добавить упражнение</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Выберите упражнение из базы CoachOS или добавьте своё.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? "Скрыть" : "Добавить упражнение"}
          </button>
        </div>
      </CardHeader>

      {isOpen ? (
        <CardContent className="space-y-4">
          <ExerciseCategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <ExerciseSearch value={search} onChange={setSearch} />
          <ExerciseList sessionId={sessionId} exercises={visibleExercises} />

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setShowCustomForm((value) => !value)}
            >
              {showCustomForm ? "Скрыть своё упражнение" : "Добавить своё упражнение"}
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => setShowLegacyForm((value) => !value)}
            >
              {showLegacyForm ? "Скрыть ручной ввод" : "Ручной ввод"}
            </button>
          </div>

          {showCustomForm ? (
            <CustomExerciseForm sessionId={sessionId} categories={categories} defaultCategory={selectedCategory} />
          ) : null}

          {showLegacyForm ? <AddExerciseForm sessionId={sessionId} /> : null}

          <div className="flex justify-end border-t pt-4">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Скрыть
            </button>
          </div>
        </CardContent>
      ) : null}
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
