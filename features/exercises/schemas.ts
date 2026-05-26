import { z } from "zod";
import { intensityTypeSchema } from "@/features/workouts/schemas";

export const exerciseCategories = [
  "Ноги",
  "Грудь",
  "Спина",
  "Плечи",
  "Руки",
  "Кор",
  "Кардио",
  "Мобилити",
  "ОФП / Плиометрика"
] as const;

export const exerciseCategorySchema = z.enum(exerciseCategories);

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

const listText = z
  .string()
  .optional()
  .nullable()
  .transform((value) =>
    value
      ? value
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean)
      : []
  );

export const customExerciseSchema = z.object({
  name: z.string().trim().min(1, "Введите название упражнения"),
  primary_category: exerciseCategorySchema,
  secondary_categories: listText,
  agonists: listText,
  synergists: listText,
  equipment: optionalText,
  movement_pattern: optionalText,
  default_intensity_type: intensityTypeSchema.default("none"),
  short_description: optionalText
});

export const exerciseSearchSchema = z.object({
  query: z.string().trim().optional().default(""),
  category: exerciseCategorySchema.optional()
});

export const addLibraryExerciseSchema = z.object({
  exercise_id: z.string().uuid()
});

export function isSpecialCategory(category: string) {
  return category === "РљР°СЂРґРёРѕ" || category === "РњРѕР±РёР»РёС‚Рё" || category === "РћР¤Рџ / РџР»РёРѕРјРµС‚СЂРёРєР°";
}

export type ExerciseCategory = z.infer<typeof exerciseCategorySchema>;
export type CustomExerciseFormValues = z.infer<typeof customExerciseSchema>;
