import type { NextRequest } from "next/server";
import { memberService } from "@/lib/services/member.service";
import { success, serverError } from "@/lib/api-response";

type Params = { params: Promise<{ cardId: string; memberId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { cardId, memberId } = await params;
    await memberService.removeFromCard(cardId, memberId);
    return success({ removed: true });
  } catch (err) {
    return serverError(err);
  }
}
