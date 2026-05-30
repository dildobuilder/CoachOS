import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StartWorkoutButton } from "@/features/calendar/components/start-workout-button";
import type { PlannedWorkoutListItem } from "@/features/planning/queries";

type PlanWorkoutListProps = {
  clientId: string;
  workouts: PlannedWorkoutListItem[];
};

export function PlanWorkoutList({ clientId, workouts }: PlanWorkoutListProps) {
  return (
    <div className="grid gap-3">
      {workouts.map((workout) => (
        <Card key={workout.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{workout.name}</h3>
                <Badge variant={workout.status === "planned" ? "outline" : "default"}>{statusLabel(workout.status)}</Badge>
                {workout.training_plan_patterns ? (
                  <Badge variant="secondary">
                    {workout.training_plan_patterns.code} - {workout.training_plan_patterns.name}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Неделя {workout.week_number} · {formatDate(workout.planned_date)}
                {workout.calendar_events
                  ? ` · ${formatTime(workout.calendar_events.starts_at)}-${formatTime(workout.calendar_events.ends_at)}`
                  : " · без времени"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {workout.calendar_event_id && workout.status !== "completed" ? (
                <StartWorkoutButton eventId={workout.calendar_event_id} status={workout.status === "in_progress" ? "started" : "scheduled"} />
              ) : null}
              {workout.existing_session_id ? (
                <Button asChild variant="outline">
                  <Link href={`/sessions/${workout.existing_session_id}`}>Сессия</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href={`/clients/${clientId}/planned-workouts/${workout.id}`}>Открыть</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function statusLabel(status: PlannedWorkoutListItem["status"]) {
  if (status === "scheduled") {
    return "В календаре";
  }

  if (status === "in_progress") {
    return "Идет";
  }

  if (status === "completed") {
    return "Завершена";
  }

  if (status === "cancelled") {
    return "Отменена";
  }

  return "План";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    weekday: "short"
  }).format(parseDate(value));
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
