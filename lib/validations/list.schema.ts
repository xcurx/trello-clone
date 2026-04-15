import { z } from "zod/v4";

export const createListSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  boardId: z.string(),
  color: z.string().nullable().optional(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  color: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

export const copyListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const moveListSchema = z.object({
  targetBoardId: z.string(),
  position: z.number().int().min(0),
});

export const moveAllCardsSchema = z.object({
  targetBoardId: z.string(),
  targetListId: z.string(),
  position: z.number().int().min(0),
});

export const reorderListsSchema = z.object({
  orderedIds: z.array(z.string()),
});
