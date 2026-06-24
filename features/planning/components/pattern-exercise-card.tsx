import { Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addPatternSet,
  deletePatternExercise,
  deletePatternSet,
  updatePatternExercise,
  updatePatternSet
} from "@/features/planning/actions";
import type { PatternExerciseWithSets } from "@/features/planning/queries";
import { IntensityValueInput } from "@/features/workouts/components/intensity-value-input";
import type { IntensityType } from "@/features/workouts/schemas";

type PatternExerciseCardProps = {
  exercise: PatternExerciseWithSets;
};

const intensityLabels: Record<IntensityType, string> = {
  none: "Без оценки",
  rpe: "RPE",
  rir: "RIR",
  percent: "%",
  time: "Время"
};

export function PatternExerciseCard({ exercise }: PatternExerciseCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="space-y-2">
            <h3 className="font-semibold">{exercise.name_snapshot}</h3>
            {exercise.notes ? <p className="text-sm text-muted-foreground">{exercise.notes}</p> : null}
          </div>
          <form action={deletePatternExercise.bind(null, exercise.id)}>
            <Button type="submit" size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" />
              Удалить
            </Button>
          </form>
        </div>

        <form action={updatePatternExercise.bind(null, exercise.id)} className="grid gap-3 rounded-md bg-secondary/40 p-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor={`pattern-intensity-${exercise.id}`}>Интенсивность</Label>
            <Select id={`pattern-intensity-${exercise.id}`} name="intensity_type" defaultValue={exercise.intensity_type}>
              {Object.entries(intensityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`pattern-notes-${exercise.id}`}>Заметки</Label>
            <Input id={`pattern-notes-${exercise.id}`} name="notes" defaultValue={exercise.notes ?? ""} />
          </div>
          <SubmitButton size="sm">Сохранить</SubmitButton>
        </form>

        <div className="space-y-2">
          <div className="text-sm font-medium">Planned sets</div>
          {exercise.pattern_sets.length > 0 ? (
            <div className="grid gap-2">
              {exercise.pattern_sets.map((set) => (
                <form
                  key={set.id}
                  action={updatePatternSet.bind(null, set.id)}
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
                  <Button formAction={deletePatternSet.bind(null, set.id)} size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Подходов пока нет.</p>
          )}
        </div>

        <form action={addPatternSet.bind(null, exercise.id)} className="grid gap-2 rounded-md bg-secondary/40 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] sm:items-end">
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
