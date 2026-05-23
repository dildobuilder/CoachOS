import { z } from "zod";

export const workoutSessionSchema = z.object({
  client_id: z.string().uuid()
});
