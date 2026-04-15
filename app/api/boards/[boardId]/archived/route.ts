import type { NextRequest } from "next/server";
import { success, serverError } from "@/lib/api-response";
import { boardService } from "@/lib/services/board.service";

type Params = { params: Promise<{ boardId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const query = request.nextUrl.searchParams.get("q") || undefined;

    const rawType = request.nextUrl.searchParams.get("type");
    const type: "cards" | "lists" | "all" =
      rawType === "cards" || rawType === "lists" ? rawType : "all";

    const archivedItems = await boardService.getArchivedItems(boardId, {
      query,
      type,
    });

    return success(archivedItems);
  } catch (err) {
    return serverError(err);
  }
}
