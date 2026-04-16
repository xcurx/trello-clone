import { z } from "zod/v4";

export const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  backgroundColor: z.string().default("ocean"),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  backgroundColor: z.string().optional(),
  backgroundImageUrl: z.string().url().nullable().optional(),
  backgroundImagePath: z.string().nullable().optional(),
  isStarred: z.boolean().optional(),
});
