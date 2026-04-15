import type { NextRequest } from "next/server";
import { memberService } from "@/lib/services/member.service";
import { success, created, serverError } from "@/lib/api-response";
import { z } from "zod/v4";

type Params = { params: Promise<{ cardId: string }> };

const assignMemberSchema = z.object({
  memberId: z.string(),
});

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const parsed = assignMemberSchema.safeParse(body);

    if (!parsed.success) {
      return success({ error: "memberId is required" });
    }

    const cardMember = await memberService.assignToCard(
      cardId,
      parsed.data.memberId,
    );
    return created(cardMember);
  } catch (err) {
    return serverError(err);
  }
}
