import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSetToExercise } from "@/features/workouts/actions";
import { IntensityValueInput } from "@/features/workouts/components/intensity-value-input";
import type { IntensityType } from "@/features/workouts/schemas";

type AddSetFormProps = {
  exerciseId: string;
  intensityType: IntensityType;
};

export function AddSetForm({ exerciseId, intensityType }: AddSetFormProps) {
  return (
    <form action={addSetToExercise.bind(null, exerciseId)} className="grid gap-3 rounded-md bg-secondary/40 p-3">
      <div className={intensityType === "none" ? "grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]" : "grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"}>
        <div className="space-y-2">
          <Label>Вес</Label>
          <Input name="weight" type="number" inputMode="decimal" step="0.5" min="0" placeholder="кг" />
        </div>
        <div className="space-y-2">
          <Label>Повт.</Label>
          <Input name="reps" type="number" inputMode="numeric" step="1" min="1" placeholder="8" />
        </div>
        {intensityType === "none" ? (
          <input type="hidden" name="intensity_value" value="" />
        ) : (
          <div className="space-y-2">
            <Label>{getIntensityLabel(intensityType)}</Label>
            <IntensityValueInput type={intensityType} />
          </div>
        )}
        <div className="flex items-end">
          <SubmitButton size="sm">Добавить</SubmitButton>
        </div>
      </div>
      <Input name="notes" placeholder="Заметка к подходу" />
    </form>
  );
}

function getIntensityLabel(type: IntensityType) {
  if (type === "rpe") {
    return "RPE";
  }

  if (type === "rir") {
    return "RIR";
  }

  if (type === "percent") {
    return "%";
  }

  return "Оценка";
}
