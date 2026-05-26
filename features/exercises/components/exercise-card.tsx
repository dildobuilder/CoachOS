"use client";

import { Dumbbell, Plus } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { addLibraryExerciseToSession } from "@/features/exercises/actions";
import type { ExerciseRow } from "@/features/exercises/queries";

type ExerciseCardProps = {
  sessionId: string;
  exercise: ExerciseRow;
};

const intensityLabels: Record<string, string> = {
  none: "Без оценки",
  rpe: "RPE",
  rir: "RIR",
  percent: "%",
  time: "Время"
};

export function ExerciseCard({ sessionId, exercise }: ExerciseCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{exercise.name}</h4>
            <Badge variant={exercise.source_type === "system" ? "secondary" : "outline"}>
              {exercise.source_type === "system" ? "CoachOS" : "Своё"}
            </Badge>
            <Badge variant="outline">{intensityLabels[exercise.default_intensity_type]}</Badge>
          </div>
          {exercise.short_description ? (
            <p className="text-sm text-muted-foreground">{exercise.short_description}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {exercise.equipment ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1">
                <Dumbbell className="h-3 w-3" />
                {exercise.equipment}
              </span>
            ) : null}
            {exercise.agonists.slice(0, 3).map((muscle) => (
              <span key={muscle} className="rounded-md bg-secondary px-2 py-1">
                {muscle}
              </span>
            ))}
          </div>
        </div>
        <form action={addLibraryExerciseToSession.bind(null, sessionId, exercise.id)}>
          <SubmitButton size="sm">
            <Plus className="h-4 w-4" />
            Добавить
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
