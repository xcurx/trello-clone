import type { NextRequest } from "next/server";
import { cardService } from "@/lib/services/card.service";
import { moveCardSchema } from "@/lib/validations/card.schema";
import { success, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ cardId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const parsed = moveCardSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const card = await cardService.move(
      cardId,
      parsed.data.targetListId,
      parsed.data.position,
    );
    return success(card);
  } catch (err) {
    return serverError(err);
  }
}
