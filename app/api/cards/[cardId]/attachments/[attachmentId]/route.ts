import type { NextRequest } from "next/server";
import { attachmentService } from "@/lib/services/attachment.service";
import { notFound, serverError, success } from "@/lib/api-response";
import { removeStorageObject } from "@/lib/storage/upload.service";

type Params = { params: Promise<{ cardId: string; attachmentId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { cardId, attachmentId } = await params;
    const attachment = await attachmentService.getById(attachmentId);

    if (!attachment || attachment.cardId !== cardId) {
      return notFound("Attachment");
    }

    await attachmentService.delete(attachmentId);
    await removeStorageObject(attachment.storagePath);

    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
