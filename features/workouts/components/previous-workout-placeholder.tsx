import { EmptyState } from "@/components/empty-states/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutSessionDetail } from "@/features/workouts/queries";

export function PreviousWorkoutPlaceholder({ workout }: { workout: WorkoutSessionDetail | null }) {
  if (!workout) {
    return (
      <EmptyState
        title="Предыдущих тренировок пока нет"
        description="После первой завершенной тренировки здесь появится краткая опора для следующей сессии."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Прошлая тренировка клиента</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          }).format(new Date(workout.session.completed_at || workout.session.started_at))}
        </p>
        <div className="space-y-2">
          {workout.exercises.map((exercise) => (
            <div key={exercise.id} className="flex items-center justify-between rounded-md border bg-background p-3 text-sm">
              <span>{exercise.name}</span>
              <span className="text-muted-foreground">{exercise.session_sets.length} подходов</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Полное сравнение появится позже.</p>
      </CardContent>
    </Card>
  );
}
