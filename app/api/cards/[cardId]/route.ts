import type { NextRequest } from "next/server";
import { cardService } from "@/lib/services/card.service";
import { removeStorageObject } from "@/lib/storage/upload.service";
import { updateCardSchema } from "@/lib/validations/card.schema";
import {
  success,
  notFound,
  serverError,
  validationError,
} from "@/lib/api-response";

type Params = { params: Promise<{ cardId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const card = await cardService.getById(cardId);
    if (!card) return notFound("Card");
    return success(card);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const existingCard = await cardService.getCoverImagePath(cardId);
    if (!existingCard) return notFound("Card");

    const body = await request.json();
    const parsed = updateCardSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.dueDate !== undefined) {
      updateData.dueDate = parsed.data.dueDate
        ? new Date(parsed.data.dueDate)
        : null;
    }

    const card = await cardService.update(
      cardId,
      updateData as Parameters<typeof cardService.update>[1],
    );

    const nextCoverPath = parsed.data.coverImagePath;
    const shouldCleanupOldPath =
      parsed.data.coverImagePath !== undefined ||
      parsed.data.coverImageUrl === null;

    if (
      shouldCleanupOldPath &&
      existingCard.coverImagePath &&
      existingCard.coverImagePath !== nextCoverPath
    ) {
      void removeStorageObject(existingCard.coverImagePath).catch((error) => {
        console.error("Failed to remove previous card cover image", error);
      });
    }

    return success(card);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    await cardService.delete(cardId);
    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
