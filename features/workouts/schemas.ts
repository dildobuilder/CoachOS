import { z } from "zod";

export const intensityTypeSchema = z.enum(["none", "rpe", "rir", "percent", "time"]);

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

const optionalNumber = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    return Number(value);
  })
  .pipe(z.number().finite().nullable());

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Введите упражнение"),
  intensity_type: intensityTypeSchema.default("none"),
  notes: optionalText
});

export const setSchema = z.object({
  weight: optionalNumber,
  reps: optionalNumber.pipe(z.number().int().min(1).max(500).nullable()),
  intensity_value: optionalNumber,
  notes: optionalText,
  set_count: z.coerce.number().int().min(1, "РњРёРЅРёРјСѓРј 1 РїРѕРґС…РѕРґ").max(10, "РњР°РєСЃРёРјСѓРј 10 РїРѕРґС…РѕРґРѕРІ").default(1)
});

export const completeSessionSchema = z.object({
  coach_notes: optionalText
});

export type IntensityType = z.infer<typeof intensityTypeSchema>;
export type ExerciseFormValues = z.infer<typeof exerciseSchema>;
export type SetFormValues = z.infer<typeof setSchema>;

export function validateIntensityValue(type: IntensityType, value: number | null) {
  if (type === "none") {
    return null;
  }

  if (value === null) {
    throw new Error("Укажите интенсивность");
  }

  if (type === "rpe") {
    const allowed = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

    if (!allowed.includes(value)) {
      throw new Error("RPE должен быть от 5 до 10 с шагом 0.5");
    }
  }

  if (type === "rir" && (!Number.isInteger(value) || value < 1 || value > 10)) {
    throw new Error("RIR должен быть целым числом от 1 до 10");
  }

  if (type === "percent" && (!Number.isInteger(value) || value < 0 || value > 100)) {
    throw new Error("Процент должен быть целым числом от 0 до 100");
  }

  if (type === "time" && (!Number.isInteger(value) || value <= 0)) {
    throw new Error("Время должно быть положительным целым числом секунд");
  }

  return value;
}
