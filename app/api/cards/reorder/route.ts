import type { NextRequest } from "next/server";
import { cardService } from "@/lib/services/card.service";
import { reorderCardsSchema } from "@/lib/validations/card.schema";
import { success, serverError, validationError } from "@/lib/api-response";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reorderCardsSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    await cardService.reorder(parsed.data.listId, parsed.data.orderedIds);
    return success({ reordered: true });
  } catch (err) {
    return serverError(err);
  }
}
