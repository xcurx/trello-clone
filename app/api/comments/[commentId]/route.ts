import type { NextRequest } from "next/server";
import { commentService } from "@/lib/services/comment.service";
import { updateCommentSchema } from "@/lib/validations/comment.schema";
import { success, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ commentId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const parsed = updateCommentSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const comment = await commentService.update(commentId, parsed.data.content);
    return success(comment);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { commentId } = await params;
    await commentService.delete(commentId);
    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
