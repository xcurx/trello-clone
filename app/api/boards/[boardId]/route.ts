import type { NextRequest } from "next/server";
import { boardService } from "@/lib/services/board.service";
import { updateBoardSchema } from "@/lib/validations/board.schema";
import {
  success,
  notFound,
  serverError,
  validationError,
} from "@/lib/api-response";

type Params = { params: Promise<{ boardId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const board = await boardService.getById(boardId);
    if (!board) return notFound("Board");

    // Transform checklistItems count for cards
    const transformed = {
      ...board,
      lists: board.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) => ({
          ...card,
          checklistDone: card.checklistItems.length,
          checklistItems: undefined,
        })),
      })),
    };

    return success(transformed);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const body = await _request.json();
    const parsed = updateBoardSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const board = await boardService.update(boardId, parsed.data);
    return success(board);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    await boardService.delete(boardId);
    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
