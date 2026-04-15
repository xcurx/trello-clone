import type { NextRequest } from "next/server";
import { cardService } from "@/lib/services/card.service";
import { success, serverError } from "@/lib/api-response";

type Params = { params: Promise<{ boardId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const query = searchParams.get("q") || undefined;
    const labelIds = searchParams.get("labels")?.split(",").filter(Boolean) || undefined;
    const memberIds = searchParams.get("members")?.split(",").filter(Boolean) || undefined;
    const dueDateFilter = searchParams.get("dueDate") as
      | "overdue"
      | "today"
      | "week"
      | "none"
      | undefined;

    const cards = await cardService.search(boardId, query, {
      labelIds,
      memberIds,
      dueDateFilter,
    });

    return success(cards);
  } catch (err) {
    return serverError(err);
  }
}
