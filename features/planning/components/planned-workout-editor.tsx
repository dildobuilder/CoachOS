import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StartWorkoutButton } from "@/features/calendar/components/start-workout-button";
import { getAvailableExercises, getExerciseCategories } from "@/features/exercises/queries";
import { AddPlannedExerciseFromLibrary } from "@/features/planning/components/add-planned-exercise-from-library";
import { PlannedExerciseCard } from "@/features/planning/components/planned-exercise-card";
import { SchedulePlannedWorkoutForm } from "@/features/planning/components/schedule-planned-workout-form";
import type { PlannedWorkoutDetail } from "@/features/planning/queries";

type PlannedWorkoutEditorProps = {
  workout: PlannedWorkoutDetail;
};

export async function PlannedWorkoutEditor({ workout }: PlannedWorkoutEditorProps) {
  const editable = ["planned", "scheduled"].includes(workout.status);
  const [exercises, categories] = editable
    ? await Promise.all([getAvailableExercises(), getExerciseCategories()])
    : [[], []];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{plannedWorkoutTitle(workout)}</h2>
              <Badge variant={workout.status === "planned" ? "outline" : "default"}>{statusLabel(workout.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {workout.training_plans?.name ?? "План"} · неделя {workout.week_number} · {formatDate(workout.planned_date)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {workout.calendar_event_id && workout.status !== "completed" ? (
              <StartWorkoutButton eventId={workout.calendar_event_id} status={workout.status === "in_progress" ? "started" : "scheduled"} />
            ) : null}
            {workout.existing_session_id ? (
              <Button asChild variant="outline">
                <Link href={`/sessions/${workout.existing_session_id}`}>Открыть сессию</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/clients/${workout.client_id}/calendar`}>Календарь клиента</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {workout.calendar_event_id ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Тренировка уже назначена в календарь.
            {workout.calendar_events
              ? ` Время: ${formatTime(workout.calendar_events.starts_at)}-${formatTime(workout.calendar_events.ends_at)}.`
              : null}
          </CardContent>
        </Card>
      ) : editable ? (
        <SchedulePlannedWorkoutForm workout={workout} />
      ) : null}

      {editable ? (
        <AddPlannedExerciseFromLibrary
          plannedWorkoutId={workout.id}
          exercises={exercises}
          categories={categories}
        />
      ) : null}

      <div className="space-y-4">
        {workout.planned_exercises.length > 0 ? (
          workout.planned_exercises.map((exercise) => (
            <PlannedExerciseCard key={exercise.id} exercise={exercise} editable={editable} />
          ))
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              В плановой тренировке пока нет упражнений.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function statusLabel(status: PlannedWorkoutDetail["status"]) {
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

function plannedWorkoutTitle(workout: PlannedWorkoutDetail) {
  return workout.training_plan_patterns?.name || workout.training_plans?.name || workout.name;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    weekday: "long"
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
