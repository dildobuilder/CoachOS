"use client";

import { EmptyState } from "@/components/empty-states/empty-state";
import { ExerciseCard } from "@/features/exercises/components/exercise-card";
import type { ExerciseRow } from "@/features/exercises/queries";

type ExerciseListProps = {
  sessionId: string;
  exercises: ExerciseRow[];
};

export function ExerciseList({ sessionId, exercises }: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <EmptyState
        title="Упражнения не найдены"
        description="Попробуйте другую группу или добавьте своё упражнение."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} sessionId={sessionId} exercise={exercise} />
      ))}
    </div>
  );
}
