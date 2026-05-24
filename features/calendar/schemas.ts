import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

export const calendarEventSchema = z.object({
  client_id: z.string().uuid("Выберите клиента"),
  date: z.string().trim().min(1, "Выберите дату"),
  starts_at_time: z.string().trim().min(1, "Выберите время начала"),
  duration_minutes: z.coerce.number().int().min(15).max(360).default(60),
  title: optionalText,
  notes: optionalText
});

export const updateCalendarEventSchema = calendarEventSchema.extend({
  status: z.enum(["scheduled", "started", "completed", "cancelled"]).default("scheduled")
});

export type CalendarEventFormValues = z.infer<typeof calendarEventSchema>;
