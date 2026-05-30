import { EmptyState } from "@/components/empty-states/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PreviousCompletedWorkoutResult, SessionSetRow } from "@/features/workouts/queries";
import type { IntensityType } from "@/features/workouts/schemas";

export function PreviousWorkoutPlaceholder({ result }: { result: PreviousCompletedWorkoutResult }) {
  if (!result.workout) {
    return (
      <EmptyState
        title={
          result.pattern
            ? "Предыдущих завершённых тренировок по этому паттерну пока нет"
            : "Предыдущих тренировок пока нет"
        }
        description={
          result.pattern
            ? `Паттерн ${result.pattern.code} - ${result.pattern.name}. После первой завершённой тренировки по этому паттерну здесь появятся прошлые подходы.`
            : "После первой завершённой тренировки здесь появится краткая опора для следующей сессии."
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {result.pattern
            ? `Прошлая тренировка по паттерну ${result.pattern.code} - ${result.pattern.name}`
            : "Прошлая тренировка клиента"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          }).format(new Date(result.workout.session.completed_at || result.workout.session.started_at))}
        </p>
        <div className="space-y-3">
          {result.workout.exercises.map((exercise) => (
            <div key={exercise.id} className="rounded-md border bg-background p-3 text-sm">
              <div className="font-medium">{exercise.name_snapshot || exercise.name}</div>
              {exercise.session_sets.length > 0 ? (
                <div className="mt-2 space-y-1 text-muted-foreground">
                  {exercise.session_sets.map((set) => (
                    <div key={set.id}>
                      {set.position}) {formatSet(set, exercise.intensity_type)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-muted-foreground">Подходов не было.</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatSet(set: SessionSetRow, intensityType: IntensityType) {
  const parts = [];

  if (set.weight !== null) {
    parts.push(`${set.weight} кг`);
  }

  if (set.reps !== null) {
    parts.push(`${set.reps} повт.`);
  }

  if (set.intensity_value !== null && intensityType !== "none") {
    parts.push(formatIntensity(intensityType, set.intensity_value));
  }

  if (set.notes) {
    parts.push(set.notes);
  }

  return parts.length > 0 ? parts.join(" · ") : "без метрик";
}

function formatIntensity(type: IntensityType, value: number) {
  if (type === "rpe") {
    return `@ RPE ${value}`;
  }

  if (type === "rir") {
    return `@ RIR ${value}`;
  }

  if (type === "percent") {
    return `@ ${value}%`;
  }

  if (type === "time") {
    return `${formatTime(value)}`;
  }

  return "";
}

function formatTime(seconds: number) {
  if (seconds >= 60 && seconds % 60 === 0) {
    return `${seconds / 60} мин`;
  }

  return `${seconds} сек`;
}
