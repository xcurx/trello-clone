import type { NextRequest } from "next/server";
import { listService } from "@/lib/services/list.service";
import { updateListSchema } from "@/lib/validations/list.schema";
import { success, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ listId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { listId } = await params;
    const body = await request.json();
    const parsed = updateListSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const list = await listService.update(listId, parsed.data);
    return success(list);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { listId } = await params;
    await listService.delete(listId);
    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
