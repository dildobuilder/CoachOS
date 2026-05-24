import { Select } from "@/components/ui/select";
import type { IntensityType } from "@/features/workouts/schemas";

type IntensityValueInputProps = {
  type: IntensityType;
  defaultValue?: number | null;
};

const rpeValues = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const rirValues = Array.from({ length: 10 }, (_, index) => index + 1);
const percentValues = Array.from({ length: 101 }, (_, index) => index);

export function IntensityValueInput({ type, defaultValue }: IntensityValueInputProps) {
  if (type === "none") {
    return <input type="hidden" name="intensity_value" value="" />;
  }

  const options =
    type === "rpe" ? rpeValues : type === "rir" ? rirValues : percentValues;
  const label = type === "rpe" ? "RPE" : type === "rir" ? "RIR" : "%";

  return (
    <Select name="intensity_value" defaultValue={defaultValue === null || defaultValue === undefined ? "" : String(defaultValue)}>
      <option value="" disabled>
        {label}
      </option>
      {options.map((value) => (
        <option key={value} value={value}>
          {type === "percent" ? `${value}%` : value}
        </option>
      ))}
    </Select>
  );
}
