import type { NextRequest } from "next/server";
import { checklistService } from "@/lib/services/checklist.service";
import { updateChecklistItemSchema } from "@/lib/validations/checklist.schema";
import { success, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const parsed = updateChecklistItemSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const item = await checklistService.update(itemId, parsed.data);
    return success(item);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params;
    await checklistService.delete(itemId);
    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
