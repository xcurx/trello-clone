import type { NextRequest } from "next/server";
import { attachmentService } from "@/lib/services/attachment.service";
import { createCardAttachmentSchema } from "@/lib/validations/attachment.schema";
import {
  created,
  success,
  serverError,
  validationError,
} from "@/lib/api-response";

type Params = { params: Promise<{ cardId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const attachments = await attachmentService.listByCard(cardId);
    return success(attachments);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const parsed = createCardAttachmentSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const attachment = await attachmentService.create(cardId, parsed.data);
    return created(attachment);
  } catch (err) {
    return serverError(err);
  }
}
