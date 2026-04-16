import { z } from "zod/v4";

export const createCardSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  listId: z.string(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  coverColor: z.string().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  coverImagePath: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

export const moveCardSchema = z.object({
  targetListId: z.string(),
  position: z.number().int().min(0),
});

export const reorderCardsSchema = z.object({
  orderedIds: z.array(z.string()),
  listId: z.string(),
});
