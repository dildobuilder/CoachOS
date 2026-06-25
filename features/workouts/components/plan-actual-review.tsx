import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExerciseReviewItem, PlanActualReview as PlanActualReviewModel, ReviewStatus, ReviewValue, SetReviewItem } from "@/features/workouts/plan-actual-review";

type PlanActualReviewProps = {
  review: PlanActualReviewModel;
};

const statusLabels: Record<ReviewStatus, string> = {
  matched: "По плану",
  changed: "Изменено",
  added: "Добавлено",
  missed: "Не выполнено"
};

const statusVariants: Record<ReviewStatus, "default" | "secondary" | "outline" | "destructive"> = {
  matched: "default",
  changed: "secondary",
  added: "outline",
  missed: "destructive"
};

export function PlanActualReview({ review }: PlanActualReviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>План / факт</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {review.plannedWorkout.name} · {formatDate(review.plannedWorkout.planned_date)}
            </p>
          </div>
          <Badge variant="outline">Только просмотр</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!review.hasPlannedExercises ? (
          <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">В плане не было упражнений.</p>
        ) : null}

        {review.exercises.length > 0 ? (
          review.exercises.map((exercise) => <ExerciseReviewCard key={`${exercise.status}-${exercise.id}`} exercise={exercise} />)
        ) : (
          <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">Нет данных для сравнения.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ExerciseReviewCard({ exercise }: { exercise: ExerciseReviewItem }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold">{exercise.name}</h3>
          {exercise.plannedNotes ? <p className="mt-1 text-xs text-muted-foreground">План: {exercise.plannedNotes}</p> : null}
          {exercise.actualNotes ? <p className="mt-1 text-xs text-muted-foreground">Факт: {exercise.actualNotes}</p> : null}
        </div>
        <Badge variant={statusVariants[exercise.status]}>{statusLabels[exercise.status]}</Badge>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <SetColumn title="По плану" sets={exercise.setReviews} mode="planned" />
        <SetColumn title="Факт" sets={exercise.setReviews} mode="actual" />
      </div>

      {exercise.deltas.length || exercise.setReviews.some((set) => set.deltas.length > 0 || set.status === "added" || set.status === "missed") ? (
        <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
          <p className="font-medium">Изменения</p>
          <ul className="mt-2 grid gap-1 text-muted-foreground">
            {exercise.deltas.map((delta) => (
              <li key={delta}>{delta}</li>
            ))}
            {exercise.setReviews.map((set) => (
              <SetChangeLine key={`${set.status}-${set.id}`} set={set} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SetColumn({ title, sets, mode }: { title: string; sets: SetReviewItem[]; mode: "planned" | "actual" }) {
  const visibleSets = sets.filter((set) => (mode === "planned" ? set.planned : set.actual));

  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
      {visibleSets.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {visibleSets.map((set) => {
            const value = mode === "planned" ? set.planned : set.actual;

            return value ? (
              <div key={`${mode}-${set.id}`} className="rounded-md border bg-muted/20 p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Подход {set.position}</span>
                  <Badge variant={statusVariants[set.status]}>{statusLabels[set.status]}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{formatReviewValue(value)}</p>
                {value.notes ? <p className="mt-1 text-xs text-muted-foreground">{value.notes}</p> : null}
              </div>
            ) : null;
          })}
        </div>
      ) : (
        <p className="mt-2 rounded-md border bg-muted/20 p-2 text-sm text-muted-foreground">Нет данных.</p>
      )}
    </div>
  );
}

function SetChangeLine({ set }: { set: SetReviewItem }) {
  if (set.status === "added") {
    return <li>Подход {set.position}: добавлен сверх плана.</li>;
  }

  if (set.status === "missed") {
    return <li>Подход {set.position}: не выполнен.</li>;
  }

  if (set.deltas.length === 0) {
    return null;
  }

  return (
    <li>
      Подход {set.position}: {set.deltas.join("; ")}
    </li>
  );
}

function formatReviewValue(value: ReviewValue) {
  const parts: string[] = [];

  if (value.weight !== null) {
    parts.push(`${value.weight} кг`);
  }

  if (value.reps !== null) {
    parts.push(`${value.reps} повт.`);
  }

  const intensity = formatIntensity(value.intensityType, value.intensityValue);

  if (intensity) {
    parts.push(intensity);
  }

  return parts.length > 0 ? parts.join(" · ") : "Без метрик";
}

function formatIntensity(type: ReviewValue["intensityType"], value: number | null) {
  if (type === "none" || value === null) {
    return "";
  }

  if (type === "rpe") {
    return `RPE ${value}`;
  }

  if (type === "rir") {
    return `RIR ${value}`;
  }

  if (type === "time") {
    return formatTime(value);
  }

  return `${value}%`;
}

function formatTime(value: number) {
  if (value < 60) {
    return `${value} сек`;
  }

  if (value % 60 === 0) {
    return `${value / 60} мин`;
  }

  return `${Math.floor(value / 60)} мин ${value % 60} сек`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parseDate(value));
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}
