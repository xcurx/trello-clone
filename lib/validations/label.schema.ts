import { z } from "zod/v4";

export const createLabelSchema = z.object({
  title: z.string().max(100).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
});

export const updateLabelSchema = z.object({
  title: z.string().max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
});

export const cardLabelSchema = z.object({
  labelId: z.string(),
});
