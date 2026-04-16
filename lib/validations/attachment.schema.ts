import { z } from "zod/v4";

export const createCardAttachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  fileUrl: z.string().url(),
  storagePath: z.string().min(1),
});
