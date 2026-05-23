import { z } from "zod";

export const calendarEventSchema = z.object({
  title: z.string().min(1),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1)
});
