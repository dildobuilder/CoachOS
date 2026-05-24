import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddExerciseForm } from "@/features/workouts/components/add-exercise-form";
import { CompleteSessionButton } from "@/features/workouts/components/complete-session-button";
import { PreviousWorkoutPlaceholder } from "@/features/workouts/components/previous-workout-placeholder";
import { SessionExerciseCard } from "@/features/workouts/components/session-exercise-card";
import type { WorkoutSessionDetail } from "@/features/workouts/queries";

type SessionEditorProps = {
  detail: WorkoutSessionDetail;
  previousWorkout: WorkoutSessionDetail | null;
};

export function SessionEditor({ detail, previousWorkout }: SessionEditorProps) {
  const isReadonly = detail.session.status === "completed";
  const clientName = detail.session.clients?.preferred_name || detail.session.clients?.name || "Клиент";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{clientName}</h2>
              <Badge variant={isReadonly ? "outline" : "default"}>
                {isReadonly ? "Завершена" : "Активная"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Начало: {formatDateTime(detail.session.started_at)}
              {detail.session.completed_at ? ` · Завершение: ${formatDateTime(detail.session.completed_at)}` : ""}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/clients/${detail.session.client_id}/history`}>История клиента</Link>
          </Button>
        </CardContent>
      </Card>

      {!isReadonly ? <PreviousWorkoutPlaceholder workout={previousWorkout} /> : null}

      {!isReadonly ? <AddExerciseForm sessionId={detail.session.id} /> : null}

      <div className="space-y-4">
        {detail.exercises.map((exercise) => (
          <SessionExerciseCard key={exercise.id} exercise={exercise} readonly={isReadonly} />
        ))}
      </div>

      {!isReadonly ? <CompleteSessionButton sessionId={detail.session.id} /> : null}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
