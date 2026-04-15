import type { NextRequest } from "next/server";
import { listService } from "@/lib/services/list.service";
import { reorderListsSchema } from "@/lib/validations/list.schema";
import { success, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ boardId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const body = await request.json();
    const parsed = reorderListsSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    await listService.reorder(boardId, parsed.data.orderedIds);
    return success({ reordered: true });
  } catch (err) {
    return serverError(err);
  }
}
