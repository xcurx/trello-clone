import { z } from "zod/v4";

export const createChecklistItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  isCompleted: z.boolean().optional(),
});
