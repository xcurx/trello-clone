import type { NextRequest } from "next/server";
import { success, serverError } from "@/lib/api-response";
import { listService } from "@/lib/services/list.service";

type Params = { params: Promise<{ listId: string }> };

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const { listId } = await params;
    const result = await listService.archiveAllCards(listId);
    return success(result);
  } catch (err) {
    return serverError(err);
  }
}
