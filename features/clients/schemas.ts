import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Имя клиента обязательно"),
  preferred_name: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
    .pipe(z.string().email("Введите корректный email").nullable())
    .optional(),
  birth_date: optionalText,
  sex: optionalText,
  goal: optionalText,
  level: optionalText,
  limitations: optionalText,
  injuries: optionalText,
  notes: optionalText,
  training_frequency: optionalText,
  training_split: optionalText,
  status: z.enum(["active", "paused", "archived"]).default("active"),
  started_at: optionalText
});

export type ClientFormValues = z.infer<typeof clientSchema>;
