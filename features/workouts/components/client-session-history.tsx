import Link from "next/link";
import { EmptyState } from "@/components/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkoutSessionDetail } from "@/features/workouts/queries";

type ClientSessionHistoryProps = {
  sessions: WorkoutSessionDetail[];
};

export function ClientSessionHistory({ sessions }: ClientSessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="Завершенных тренировок пока нет"
        description="История появится после первой завершенной тренировки клиента."
      />
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((detail) => {
        const setCount = detail.exercises.reduce((total, exercise) => total + exercise.session_sets.length, 0);

        return (
          <Card key={detail.session.id}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium">{formatDate(detail.session.completed_at || detail.session.started_at)}</p>
                <p className="text-sm text-muted-foreground">
                  {detail.exercises.length} упражнений · {setCount} подходов
                </p>
                {detail.session.coach_notes ? (
                  <p className="text-sm text-muted-foreground">{detail.session.coach_notes}</p>
                ) : null}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/sessions/${detail.session.id}`}>Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}
