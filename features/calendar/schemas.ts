import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

const optionalClientId = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

export const calendarEventTypeSchema = z.enum(["client_training", "personal", "break", "other"]);
export const calendarEventStatusSchema = z.enum(["scheduled", "started", "completed", "cancelled"]);
export const durationHoursSchema = z.coerce
  .number()
  .int()
  .refine((value): value is 1 | 2 | 3 | 4 => [1, 2, 3, 4].includes(value), {
    message: "Длительность должна быть от 1 до 4 часов"
  });

const calendarEventBaseSchema = z.object({
  type: calendarEventTypeSchema.default("client_training"),
  client_id: optionalClientId,
  date: z.string().trim().min(1, "Выберите дату"),
  starts_at_time: z.string().trim().regex(/^\d{2}:00$/, "Выберите начало ровно в начале часа"),
  duration_hours: durationHoursSchema.default(1),
  title: optionalText,
  notes: optionalText,
  return_to_start: optionalText,
  return_to_path: optionalText
});

function validateClientTrainingClient(
  value: { type: CalendarEventType; client_id?: string | null },
  context: z.RefinementCtx
) {
    if (value.type === "client_training" && !value.client_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["client_id"],
        message: "Выберите клиента"
      });
    }
}

export const calendarEventSchema = calendarEventBaseSchema.superRefine(validateClientTrainingClient);

export const updateCalendarEventSchema = calendarEventBaseSchema
  .extend({
    status: calendarEventStatusSchema.default("scheduled")
  })
  .superRefine(validateClientTrainingClient);

export type CalendarEventFormValues = z.infer<typeof calendarEventSchema>;
export type CalendarEventType = z.infer<typeof calendarEventTypeSchema>;
