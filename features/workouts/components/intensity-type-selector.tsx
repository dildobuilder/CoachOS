import { Select } from "@/components/ui/select";
import type { IntensityType } from "@/features/workouts/schemas";

type IntensityTypeSelectorProps = {
  defaultValue?: IntensityType;
};

export function IntensityTypeSelector({ defaultValue = "none" }: IntensityTypeSelectorProps) {
  return (
    <Select name="intensity_type" defaultValue={defaultValue}>
      <option value="none">Без оценки</option>
      <option value="rpe">RPE</option>
      <option value="rir">RIR</option>
      <option value="percent">%</option>
      <option value="time">Время</option>
    </Select>
  );
}
