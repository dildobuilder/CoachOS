import { z } from "zod";

export const trainerProfileSchema = z.object({
  display_name: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().default("Europe/Moscow"),
  specialization: z.string().optional()
});
