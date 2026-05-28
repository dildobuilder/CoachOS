import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const optionalPositiveNumber = z.preprocess(
  emptyToNull,
  z.coerce.number().positive("Значение должно быть больше 0").nullable().optional()
);

const optionalNonNegativeInteger = z.preprocess(
  emptyToNull,
  z.coerce.number().int().min(0, "Значение не может быть отрицательным").nullable().optional()
);

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

export const dateValueSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату");

export const clientDailyLogSchema = z.object({
  log_date: dateValueSchema,
  body_weight: optionalPositiveNumber,
  calories: optionalNonNegativeInteger,
  protein: optionalNonNegativeInteger,
  fat: optionalNonNegativeInteger,
  carbs: optionalNonNegativeInteger,
  notes: optionalText,
  return_to_start: optionalText
});

export const clientStartingWeightSchema = z.object({
  starting_weight: optionalPositiveNumber,
  return_to_path: optionalText
});

export type ClientDailyLogValues = z.infer<typeof clientDailyLogSchema>;
export type ClientStartingWeightValues = z.infer<typeof clientStartingWeightSchema>;
