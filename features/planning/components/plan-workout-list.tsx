"use client";

import { useMemo, useState } from "react";
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

type WorkoutFilter = "all" | "without_pattern" | "empty" | "future_unscheduled";

const filters: { value: WorkoutFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "without_pattern", label: "Без pattern" },
  { value: "empty", label: "Пустые" },
  { value: "future_unscheduled", label: "Будущие без времени" }
];

export function PlanWorkoutList({ clientId, workouts }: PlanWorkoutListProps) {
  const [activeFilter, setActiveFilter] = useState<WorkoutFilter>("all");
  const summary = getWorkoutSummary(workouts);
  const filteredWorkouts = useMemo(
    () => workouts.filter((workout) => matchesFilter(workout, activeFilter)),
    [activeFilter, workouts]
  );

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <SummaryItem label="Будущие без времени" value={summary.futureUnscheduled} />
        <SummaryItem label="В календаре" value={summary.scheduled} />
        <SummaryItem label="Завершено" value={summary.completed} />
        <SummaryItem label="Отменено" value={summary.cancelled} />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={activeFilter === filter.value ? "default" : "outline"}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {filteredWorkouts.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">{emptyFilterText(activeFilter)}</CardContent>
        </Card>
      ) : null}

      {filteredWorkouts.map((workout) => (
        <Card key={workout.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{plannedWorkoutTitle(workout)}</h3>
                {statusBadges(workout).map((badge) => (
                  <Badge key={badge.label} variant={badge.variant}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Неделя {workout.week_number} · {formatDate(workout.planned_date)}
                {workout.calendar_events
                  ? ` · ${formatTime(workout.calendar_events.starts_at)}-${formatTime(workout.calendar_events.ends_at)}`
                  : " · без времени"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!workout.calendar_event_id && workout.status === "planned" ? (
                <Button asChild>
                  <Link href={`/clients/${clientId}/planned-workouts/${workout.id}`}>Назначить время</Link>
                </Button>
              ) : null}
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
  return workouts.reduce(
    (summary, workout) => {
      if (isFutureUnscheduled(workout)) {
        summary.futureUnscheduled += 1;
      }

      if (workout.status === "scheduled" || workout.calendar_event_id) {
        summary.scheduled += 1;
      }

      if (isCompleted(workout)) {
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

function matchesFilter(workout: PlannedWorkoutListItem, filter: WorkoutFilter) {
  if (filter === "without_pattern") {
    return workout.status !== "cancelled" && !workout.pattern_id;
  }

  if (filter === "empty") {
    return workout.status !== "cancelled" && workout.planned_exercise_count === 0;
  }

  if (filter === "future_unscheduled") {
    return isFutureUnscheduled(workout);
  }

  return true;
}

function statusBadges(workout: PlannedWorkoutListItem): { label: string; variant: "default" | "secondary" | "destructive" | "outline" }[] {
  const badges: { label: string; variant: "default" | "secondary" | "destructive" | "outline" }[] = [];

  if (workout.status === "cancelled") {
    return [{ label: "Отменена", variant: "destructive" }];
  }

  if (isCompleted(workout)) {
    badges.push({ label: "Завершена", variant: "default" });
  } else if (workout.calendar_event_id) {
    badges.push({ label: "В календаре", variant: "default" });
  } else if (!workout.pattern_id) {
    badges.push({ label: "Без pattern", variant: "outline" });
  }

  if (workout.planned_exercise_count === 0) {
    badges.push({ label: "Пустая", variant: "outline" });
  } else if (workout.pattern_id) {
    badges.push({ label: "Заполнена", variant: "secondary" });
  }

  if (workout.training_plan_patterns) {
    badges.push({
      label: `${workout.training_plan_patterns.code} - ${workout.training_plan_patterns.name}`,
      variant: "secondary"
    });
  }

  return badges;
}

function emptyFilterText(filter: WorkoutFilter) {
  if (filter === "without_pattern") {
    return "Тренировок без pattern нет.";
  }

  if (filter === "empty") {
    return "Пустых тренировок без упражнений нет.";
  }

  if (filter === "future_unscheduled") {
    return "Все будущие тренировки уже назначены или защищены.";
  }

  return "В этом плане пока нет тренировок.";
}

function isFutureUnscheduled(workout: PlannedWorkoutListItem) {
  return (
    workout.planned_date >= toDateString(new Date()) &&
    workout.status === "planned" &&
    !workout.calendar_event_id &&
    !workout.existing_session_id
  );
}

function isCompleted(workout: PlannedWorkoutListItem) {
  return workout.status === "completed";
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
