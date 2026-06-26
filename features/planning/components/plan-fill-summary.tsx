import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlannedWorkoutListItem, TrainingPlanPatternRow, TrainingPlanRow } from "@/features/planning/queries";

type PlanFillSummaryProps = {
  plan: TrainingPlanRow;
  patterns: TrainingPlanPatternRow[];
  workouts: PlannedWorkoutListItem[];
};

export function PlanFillSummary({ plan, patterns, workouts }: PlanFillSummaryProps) {
  const summary = getPlanFillSummary(plan, workouts);
  const hasProblems = summary.withoutPattern > 0 || summary.withoutExercises > 0 || summary.unassignedWeekdays > 0;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>План заполнен?</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Быстрая проверка patterns, упражнений и будущих тренировок без времени.
          </p>
        </div>
        <Button asChild variant={hasProblems ? "default" : "outline"} size="sm">
          <Link href="#plan-patterns">Настроить patterns</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem label="Patterns" value={patterns.length} />
        <SummaryItem label="Дни с pattern" value={`${summary.assignedWeekdays}/${plan.training_weekdays.length}`} tone={summary.unassignedWeekdays > 0 ? "warning" : "default"} />
        <SummaryItem label="Без pattern" value={summary.withoutPattern} tone={summary.withoutPattern > 0 ? "warning" : "default"} />
        <SummaryItem label="Пустые" value={summary.withoutExercises} tone={summary.withoutExercises > 0 ? "warning" : "default"} />
        <SummaryItem label="Будущие без времени" value={summary.futureUnscheduled} />
        <SummaryItem label="В календаре" value={summary.scheduled} />
        <SummaryItem label="Завершено" value={summary.completed} />
        <SummaryItem label="Отменено" value={summary.cancelled} />
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warning";
}) {
  return (
    <div className={tone === "warning" ? "rounded-md border border-amber-300 bg-amber-50 p-3" : "rounded-md border bg-background p-3"}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function getPlanFillSummary(plan: TrainingPlanRow, workouts: PlannedWorkoutListItem[]) {
  const today = toDateString(new Date());
  const assignedWeekdays = new Set(
    workouts
      .filter((workout) => workout.status !== "cancelled" && Boolean(workout.pattern_id))
      .map((workout) => getIsoWeekday(workout.planned_date))
  );

  return workouts.reduce(
    (summary, workout) => {
      const hasCalendarSlot = Boolean(workout.calendar_event_id);
      const hasSession = Boolean(workout.existing_session_id);
      const isFuture = workout.planned_date >= today;

      if (workout.status !== "cancelled" && !workout.pattern_id) {
        summary.withoutPattern += 1;
      }

      if (workout.status !== "cancelled" && workout.planned_exercise_count === 0) {
        summary.withoutExercises += 1;
      }

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
    {
      assignedWeekdays: plan.training_weekdays.filter((weekday) => assignedWeekdays.has(weekday)).length,
      unassignedWeekdays: plan.training_weekdays.filter((weekday) => !assignedWeekdays.has(weekday)).length,
      withoutPattern: 0,
      withoutExercises: 0,
      futureUnscheduled: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0
    }
  );
}

function getIsoWeekday(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  const day = date.getUTCDay();

  return day === 0 ? 7 : day;
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
