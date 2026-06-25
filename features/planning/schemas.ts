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
export const trainingPlanStatusSchema = z.enum(["active", "inactive", "completed", "archived"]);
export const plannedWorkoutStatusSchema = z.enum(["planned", "scheduled", "in_progress", "completed", "cancelled"]);
export const futureUpdateModeSchema = z.enum(["update_unscheduled", "plan_only", "cancel_unscheduled"]).default("update_unscheduled");
export const extendTrainingPlanSchema = z.object({
  extend_weeks: z.coerce.number().int().min(1, "Добавьте минимум 1 неделю").max(52, "За один раз можно добавить до 52 недель")
});

export const trainingPlanSchema = z
  .object({
    name: z.string().trim().min(1, "Введите название плана"),
    starts_on: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату старта"),
    duration_weeks: z.coerce.number().int().min(1).max(156).default(4),
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
  notes: optionalText,
  set_count: z.coerce.number().int().min(1, "РњРёРЅРёРјСѓРј 1 РїРѕРґС…РѕРґ").max(10, "РњР°РєСЃРёРјСѓРј 10 РїРѕРґС…РѕРґРѕРІ").default(1)
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

export const planPatternSchema = z.object({
  code: z.string().trim().min(1, "Введите код тренировки").max(12),
  name: z.string().trim().min(1, "Введите название тренировки"),
  description: optionalText
});

export const patternExerciseUpdateSchema = z.object({
  intensity_type: intensityTypeSchema.default("none"),
  notes: optionalText
});

export const patternSetSchema = plannedSetSchema;

export const assignPatternSchema = z.object({
  weekday: z.coerce.number().int().min(1).max(7),
  pattern_id: z.string().uuid("Выберите тренировку")
});

export const applyPatternSchema = z.object({
  scope: z.enum(["future_only", "all_not_started"]).default("future_only")
});

export const savePlanTemplateSchema = z.object({
  name: z.string().trim().min(1, "Введите название шаблона"),
  description: optionalText,
  category: optionalText,
  use_case: optionalText
});

export const createPlanFromTemplateSchema = z
  .object({
    template_id: z.string().uuid("Выберите шаблон"),
    name: optionalText,
    starts_on: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату старта"),
    duration_weeks: z.coerce.number().int().min(1).max(156).default(4),
    training_weekdays: z
      .array(z.coerce.number().int().min(1).max(7))
      .min(1, "Выберите хотя бы один тренировочный день")
  })
  .transform((value) => ({
    ...value,
    training_weekdays: Array.from(new Set(value.training_weekdays)).sort((a, b) => a - b),
    sessions_per_week: Array.from(new Set(value.training_weekdays)).length
  }));

export type TrainingPlanFormValues = z.infer<typeof trainingPlanSchema>;
export type PlannedWorkoutStatus = z.infer<typeof plannedWorkoutStatusSchema>;
