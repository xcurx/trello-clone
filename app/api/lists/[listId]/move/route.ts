import type { NextRequest } from "next/server";
import { success, serverError, validationError } from "@/lib/api-response";
import { listService } from "@/lib/services/list.service";
import { moveListSchema } from "@/lib/validations/list.schema";

type Params = { params: Promise<{ listId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { listId } = await params;
    const body = await request.json();
    const parsed = moveListSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const movedList = await listService.move(listId, parsed.data);
    return success(movedList);
  } catch (err) {
    return serverError(err);
  }
}
