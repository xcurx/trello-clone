import type { NextRequest } from "next/server";
import { labelService } from "@/lib/services/label.service";
import { success, serverError } from "@/lib/api-response";

type Params = { params: Promise<{ cardId: string; labelId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { cardId, labelId } = await params;
    await labelService.removeFromCard(cardId, labelId);
    return success({ removed: true });
  } catch (err) {
    return serverError(err);
  }
}
