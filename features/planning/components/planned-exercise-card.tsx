import { Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addPlannedSet,
  deletePlannedExercise,
  deletePlannedSet,
  updatePlannedExercise,
  updatePlannedSet
} from "@/features/planning/actions";
import type { PlannedExerciseWithSets } from "@/features/planning/queries";
import { IntensityValueInput } from "@/features/workouts/components/intensity-value-input";
import type { IntensityType } from "@/features/workouts/schemas";

type PlannedExerciseCardProps = {
  exercise: PlannedExerciseWithSets;
  editable: boolean;
};

const intensityLabels: Record<IntensityType, string> = {
  none: "Без оценки",
  rpe: "RPE",
  rir: "RIR",
  percent: "%",
  time: "Время"
};

export function PlannedExerciseCard({ exercise, editable }: PlannedExerciseCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="space-y-2">
            <h3 className="font-semibold">{exercise.name_snapshot}</h3>
            {exercise.notes ? <p className="text-sm text-muted-foreground">{exercise.notes}</p> : null}
            <MuscleInfo exercise={exercise} />
          </div>
          {editable ? (
            <form action={deletePlannedExercise.bind(null, exercise.id)}>
              <Button type="submit" size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            </form>
          ) : null}
        </div>

        {editable ? (
          <form action={updatePlannedExercise.bind(null, exercise.id)} className="grid gap-3 rounded-md bg-secondary/40 p-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor={`intensity-${exercise.id}`}>Интенсивность</Label>
              <Select id={`intensity-${exercise.id}`} name="intensity_type" defaultValue={exercise.intensity_type}>
                {Object.entries(intensityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`notes-${exercise.id}`}>Заметки к упражнению</Label>
              <Input id={`notes-${exercise.id}`} name="notes" defaultValue={exercise.notes ?? ""} />
            </div>
            <SubmitButton size="sm">Сохранить</SubmitButton>
          </form>
        ) : null}

        <div className="space-y-2">
          <div className="text-sm font-medium">Плановые подходы</div>
          {exercise.planned_sets.length > 0 ? (
            <div className="grid gap-2">
              {exercise.planned_sets.map((set) =>
                editable ? (
                  <form
                    key={set.id}
                    action={updatePlannedSet.bind(null, set.id)}
                    className="grid gap-2 rounded-md border bg-background p-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] sm:items-end"
                  >
                    <SetField label="Вес" name="weight" defaultValue={set.weight} placeholder="кг" />
                    <SetField label="Повт." name="reps" defaultValue={set.reps} placeholder="8" />
                    <div className="space-y-2">
                      <Label>{intensityLabels[exercise.intensity_type]}</Label>
                      <IntensityValueInput type={exercise.intensity_type} defaultValue={set.intensity_value} />
                    </div>
                    <SetField label="Заметка" name="notes" defaultValue={set.notes} placeholder="опционально" />
                    <SubmitButton size="sm" variant="outline">OK</SubmitButton>
                    <Button formAction={deletePlannedSet.bind(null, set.id)} size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <div key={set.id} className="rounded-md border bg-background p-3 text-sm">
                    Подход {set.position}: {formatSet(set.weight, set.reps, set.intensity_value, exercise.intensity_type)}
                    {set.notes ? <span className="text-muted-foreground"> · {set.notes}</span> : null}
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Подходов пока нет.</p>
          )}
        </div>

        {editable ? (
          <form action={addPlannedSet.bind(null, exercise.id)} className="grid gap-2 rounded-md bg-secondary/40 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] sm:items-end">
            <SetField label="Вес" name="weight" placeholder="кг" />
            <SetField label="Подходов" name="set_count" defaultValue="1" placeholder="1" />
            <SetField label="Повт." name="reps" placeholder="8" />
            <div className="space-y-2">
              <Label>{intensityLabels[exercise.intensity_type]}</Label>
              <IntensityValueInput type={exercise.intensity_type} />
            </div>
            <SetField label="Заметка" name="notes" placeholder="опционально" />
            <SubmitButton size="sm">Добавить</SubmitButton>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SetField({
  label,
  name,
  defaultValue,
  placeholder
}: {
  label: string;
  name: string;
  defaultValue?: number | string | null;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} />
    </div>
  );
}

function MuscleInfo({ exercise }: { exercise: PlannedExerciseWithSets }) {
  if (!exercise.exercises) {
    return null;
  }

  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      {exercise.exercises.agonists.length > 0 ? <div>Агонисты: {exercise.exercises.agonists.join(", ")}</div> : null}
      {exercise.exercises.synergists.length > 0 ? <div>Синергисты: {exercise.exercises.synergists.join(", ")}</div> : null}
      {exercise.exercises.antagonists.length > 0 ? <div>Антагонисты: {exercise.exercises.antagonists.join(", ")}</div> : null}
    </div>
  );
}

function formatSet(
  weight: number | null,
  reps: number | null,
  intensityValue: number | null,
  intensityType: IntensityType
) {
  const parts = [];

  if (weight !== null) {
    parts.push(`${weight} кг`);
  }

  if (reps !== null) {
    parts.push(`${reps} повт.`);
  }

  if (intensityValue !== null && intensityType !== "none") {
    parts.push(formatIntensity(intensityType, intensityValue));
  }

  return parts.length > 0 ? parts.join(" · ") : "без метрик";
}

function formatIntensity(type: IntensityType, value: number) {
  if (type === "rpe") {
    return `RPE ${value}`;
  }

  if (type === "rir") {
    return `RIR ${value}`;
  }

  if (type === "percent") {
    return `${value}%`;
  }

  if (type === "time") {
    return `${value} сек`;
  }

  return "";
}
