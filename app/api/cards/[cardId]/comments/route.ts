import type { NextRequest } from "next/server";
import { commentService } from "@/lib/services/comment.service";
import { createCommentSchema } from "@/lib/validations/comment.schema";
import { DEFAULT_USER_ID } from "@/lib/constants";
import {
  success,
  created,
  serverError,
  validationError,
} from "@/lib/api-response";

type Params = { params: Promise<{ cardId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const comments = await commentService.getByCard(cardId);
    return success(comments);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const comment = await commentService.create(
      cardId,
      DEFAULT_USER_ID,
      parsed.data.content,
    );
    return created(comment);
  } catch (err) {
    return serverError(err);
  }
}
