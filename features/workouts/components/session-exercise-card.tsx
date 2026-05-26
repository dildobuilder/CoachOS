import { Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddSetForm } from "@/features/workouts/components/add-set-form";
import { IntensityTypeSelector } from "@/features/workouts/components/intensity-type-selector";
import { IntensityValueInput } from "@/features/workouts/components/intensity-value-input";
import {
  deleteSessionExercise,
  deleteSessionSet,
  updateSessionExercise,
  updateSessionExerciseIntensity,
  updateSessionSet
} from "@/features/workouts/actions";
import type { SessionExerciseWithSets } from "@/features/workouts/queries";
import type { IntensityType } from "@/features/workouts/schemas";

type SessionExerciseCardProps = {
  exercise: SessionExerciseWithSets;
  readonly?: boolean;
};

export function SessionExerciseCard({ exercise, readonly = false }: SessionExerciseCardProps) {
  const intensityType = exercise.intensity_type as IntensityType;
  const exerciseName = exercise.name_snapshot || exercise.name;
  const isMobility = exercise.exercises?.primary_category === "Мобилити";
  const isLibraryExercise = Boolean(exercise.exercise_id);

  return (
    <Card>
      <CardHeader className="gap-3">
        {readonly || isLibraryExercise ? (
          <div>
            <CardTitle>{exerciseName}</CardTitle>
            {exercise.notes ? <p className="mt-2 text-sm text-muted-foreground">{exercise.notes}</p> : null}
            <MuscleInfo exercise={exercise} />
            {!readonly && isLibraryExercise && !isMobility ? (
              <form action={updateSessionExerciseIntensity.bind(null, exercise.session_id, exercise.id)} className="mt-4 flex max-w-sm items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Интенсивность</Label>
                  <IntensityTypeSelector defaultValue={intensityType} />
                </div>
                <SubmitButton size="sm" variant="outline">
                  Сохранить
                </SubmitButton>
              </form>
            ) : null}
          </div>
        ) : (
          <form action={updateSessionExercise.bind(null, exercise.session_id, exercise.id)} className="grid gap-3">
            <div className={isMobility ? "grid gap-3 sm:grid-cols-[1fr_auto]" : "grid gap-3 sm:grid-cols-[1fr_180px_auto]"}>
              <div className="space-y-2">
                <Label>Упражнение</Label>
                <Input name="name" defaultValue={exerciseName} required />
              </div>
              <div className={isMobility ? "hidden" : "space-y-2"}>
                <Label>Интенсивность</Label>
                {isMobility ? <input type="hidden" name="intensity_type" value="none" /> : <IntensityTypeSelector defaultValue={intensityType} />}
              </div>
              <div className="flex items-end gap-2">
                <SubmitButton size="sm" variant="outline">
                  Сохранить
                </SubmitButton>
              </div>
            </div>
            <Textarea name="notes" defaultValue={exercise.notes ?? ""} placeholder="Заметки к упражнению" />
            <MuscleInfo exercise={exercise} />
          </form>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {exercise.session_sets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Подходов пока нет.</p>
        ) : (
          <div className="space-y-2">
            {exercise.session_sets.map((set) =>
              isMobility ? (
                <div key={set.id} className="rounded-md border bg-muted/40 p-3 text-sm">
                  <span className="font-medium">Подход {set.position}:</span> выполнено
                  {set.notes ? <p className="mt-1 text-muted-foreground">{set.notes}</p> : null}
                </div>
              ) : readonly ? (
                <div key={set.id} className="rounded-md border bg-background p-3 text-sm">
                  <span className="font-medium">Подход {set.position}:</span>{" "}
                  {formatSetLoad(intensityType, set.weight, set.reps)}
                  {formatSetLoad(intensityType, set.weight, set.reps)
                    ? formatIntensity(intensityType, set.intensity_value)
                    : formatTimeOnlyIntensity(intensityType, set.intensity_value)}
                  {set.notes ? <p className="mt-1 text-muted-foreground">{set.notes}</p> : null}
                </div>
              ) : (
                <div key={set.id} className="grid gap-2 rounded-md border bg-background p-3">
                  <form action={updateSessionSet.bind(null, exercise.session_id, set.id)} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                    <Input name="weight" type="number" step="0.5" min="0" defaultValue={set.weight ?? ""} placeholder="кг" />
                    <Input name="reps" type="number" step="1" min="1" defaultValue={set.reps ?? ""} placeholder="повт." />
                    {intensityType === "none" ? (
                      <input type="hidden" name="intensity_value" value="" />
                    ) : (
                      <IntensityValueInput type={intensityType} defaultValue={set.intensity_value} />
                    )}
                    <Input name="notes" defaultValue={set.notes ?? ""} placeholder="заметка" />
                    <SubmitButton size="sm" variant="outline">
                      OK
                    </SubmitButton>
                  </form>
                  <form action={deleteSessionSet.bind(null, exercise.session_id, set.id)} className="flex justify-end">
                    <Button type="submit" variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                      Удалить подход
                    </Button>
                  </form>
                </div>
              )
            )}
          </div>
        )}

        {!readonly ? (
          <div className="space-y-3">
            {isMobility ? null : <AddSetForm sessionId={exercise.session_id} exerciseId={exercise.id} intensityType={intensityType} />}
            <form action={deleteSessionExercise.bind(null, exercise.session_id, exercise.id)} className="flex justify-end">
              <Button type="submit" variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
                Удалить упражнение
              </Button>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function formatIntensity(type: IntensityType, value: number | null) {
  if (value === null || type === "none") {
    return "";
  }

  if (type === "rpe") {
    return ` @ RPE ${value}`;
  }

  if (type === "rir") {
    return ` @ RIR ${value}`;
  }

  if (type === "time") {
    return ` · ${formatTimeIntensity(value)}`;
  }

  return ` @ ${value}%`;
}

function formatSetLoad(type: IntensityType, weight: number | null, reps: number | null) {
  if (type === "time" && weight === null && reps === null) {
    return "";
  }

  return `${weight ?? "-"} кг × ${reps ?? "-"}`;
}

function formatTimeOnlyIntensity(type: IntensityType, value: number | null) {
  if (type !== "time" || value === null) {
    return "";
  }

  return formatTimeIntensity(value);
}

function MuscleInfo({ exercise }: { exercise: SessionExerciseWithSets }) {
  const source = exercise.exercises;

  if (!source || (!source.agonists.length && !source.synergists.length && !source.antagonists.length)) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
      {source.agonists.length ? <MuscleLine label="Агонисты" values={source.agonists} /> : null}
      {source.synergists.length ? <MuscleLine label="Синергисты" values={source.synergists} /> : null}
      {source.antagonists.length ? <MuscleLine label="Антагонисты" values={source.antagonists} /> : null}
    </div>
  );
}

function MuscleLine({ label, values }: { label: string; values: string[] }) {
  return (
    <p>
      <span className="font-medium text-foreground">{label}:</span> {values.join(", ")}
    </p>
  );
}

function formatTimeIntensity(value: number) {
  if (value < 60) {
    return `${value} сек`;
  }

  if (value % 60 === 0) {
    return `${value / 60} мин`;
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  return `${minutes} мин ${seconds} сек`;
}
