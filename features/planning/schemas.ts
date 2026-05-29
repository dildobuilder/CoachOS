import { z } from "zod";
import { intensityTypeSchema } from "@/features/workouts/schemas";

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

export const splitTypeSchema = z.enum(["full_body", "upper_lower", "push_pull_legs", "powerlifting", "custom"]);
export const trainingPlanStatusSchema = z.enum(["active", "completed", "archived"]);
export const plannedWorkoutStatusSchema = z.enum(["planned", "scheduled", "in_progress", "completed", "cancelled"]);

export const trainingPlanSchema = z
  .object({
    name: z.string().trim().min(1, "Введите название плана"),
    starts_on: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату старта"),
    duration_weeks: z.coerce.number().int().min(1).max(52).default(4),
    training_weekdays: z
      .array(z.coerce.number().int().min(1).max(7))
      .min(1, "Выберите хотя бы один тренировочный день"),
    split_type: splitTypeSchema.default("custom"),
    notes: optionalText
  })
  .transform((value) => ({
    ...value,
    training_weekdays: Array.from(new Set(value.training_weekdays)).sort((a, b) => a - b),
    sessions_per_week: Array.from(new Set(value.training_weekdays)).length
  }));

export const plannedExerciseSchema = z.object({
  exercise_id: z.string().uuid("Выберите упражнение")
});

export const plannedExerciseUpdateSchema = z.object({
  intensity_type: intensityTypeSchema.default("none"),
  notes: optionalText
});

export const plannedSetSchema = z.object({
  weight: optionalNumber,
  reps: optionalNumber.pipe(z.number().int().min(1).max(500).nullable()),
  intensity_value: optionalNumber,
  notes: optionalText
});

export const schedulePlannedWorkoutSchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату"),
  starts_at_time: z.string().trim().regex(/^\d{2}:00$/, "Выберите начало ровно в начале часа"),
  duration_hours: z.coerce
    .number()
    .int()
    .refine((value): value is 1 | 2 | 3 | 4 => [1, 2, 3, 4].includes(value), {
      message: "Длительность должна быть от 1 до 4 часов"
    }),
  title: optionalText,
  notes: optionalText
});

export type TrainingPlanFormValues = z.infer<typeof trainingPlanSchema>;
export type PlannedWorkoutStatus = z.infer<typeof plannedWorkoutStatusSchema>;
