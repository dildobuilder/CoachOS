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
  const summary = getWorkoutSummary(workouts);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <SummaryItem label="Будущие без времени" value={summary.futureUnscheduled} />
        <SummaryItem label="В календаре" value={summary.scheduled} />
        <SummaryItem label="Завершено" value={summary.completed} />
        <SummaryItem label="Отменено" value={summary.cancelled} />
      </div>
      {workouts.map((workout) => (
        <Card key={workout.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{plannedWorkoutTitle(workout)}</h3>
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

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function getWorkoutSummary(workouts: PlannedWorkoutListItem[]) {
  const today = toDateString(new Date());

  return workouts.reduce(
    (summary, workout) => {
      const isFuture = workout.planned_date >= today;
      const hasCalendarSlot = Boolean(workout.calendar_event_id);
      const hasSession = Boolean(workout.existing_session_id);

      if (isFuture && workout.status === "planned" && !hasCalendarSlot && !hasSession) {
        summary.futureUnscheduled += 1;
      }

      if (workout.status === "scheduled" || hasCalendarSlot) {
        summary.scheduled += 1;
      }

      if (workout.status === "completed") {
        summary.completed += 1;
      }

      if (workout.status === "cancelled") {
        summary.cancelled += 1;
      }

      return summary;
    },
    { futureUnscheduled: 0, scheduled: 0, completed: 0, cancelled: 0 }
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

function plannedWorkoutTitle(workout: PlannedWorkoutListItem) {
  return workout.training_plan_patterns?.name || workout.training_plans?.name || workout.name;
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

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
