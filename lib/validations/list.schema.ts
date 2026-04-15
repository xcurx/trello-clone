import { z } from "zod/v4";

export const createListSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  boardId: z.string(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const reorderListsSchema = z.object({
  orderedIds: z.array(z.string()),
});
