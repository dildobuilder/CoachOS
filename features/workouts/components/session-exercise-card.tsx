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
import { deleteSessionExercise, deleteSessionSet, updateSessionExercise, updateSessionSet } from "@/features/workouts/actions";
import type { SessionExerciseWithSets } from "@/features/workouts/queries";
import type { IntensityType } from "@/features/workouts/schemas";

type SessionExerciseCardProps = {
  exercise: SessionExerciseWithSets;
  readonly?: boolean;
};

export function SessionExerciseCard({ exercise, readonly = false }: SessionExerciseCardProps) {
  const intensityType = exercise.intensity_type as IntensityType;

  return (
    <Card>
      <CardHeader className="gap-3">
        {readonly ? (
          <div>
            <CardTitle>{exercise.name}</CardTitle>
            {exercise.notes ? <p className="mt-2 text-sm text-muted-foreground">{exercise.notes}</p> : null}
          </div>
        ) : (
          <form action={updateSessionExercise.bind(null, exercise.session_id, exercise.id)} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
              <div className="space-y-2">
                <Label>Упражнение</Label>
                <Input name="name" defaultValue={exercise.name} required />
              </div>
              <div className="space-y-2">
                <Label>Интенсивность</Label>
                <IntensityTypeSelector defaultValue={intensityType} />
              </div>
              <div className="flex items-end gap-2">
                <SubmitButton size="sm" variant="outline">
                  Сохранить
                </SubmitButton>
              </div>
            </div>
            <Textarea name="notes" defaultValue={exercise.notes ?? ""} placeholder="Заметки к упражнению" />
          </form>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {exercise.session_sets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Подходов пока нет.</p>
        ) : (
          <div className="space-y-2">
            {exercise.session_sets.map((set) =>
              readonly ? (
                <div key={set.id} className="rounded-md border bg-background p-3 text-sm">
                  <span className="font-medium">Подход {set.position}:</span>{" "}
                  {set.weight ?? "-"} кг × {set.reps ?? "-"}
                  {formatIntensity(intensityType, set.intensity_value)}
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
            <AddSetForm sessionId={exercise.session_id} exerciseId={exercise.id} intensityType={intensityType} />
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

  return ` @ ${value}%`;
}
