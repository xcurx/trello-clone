import type { NextRequest } from "next/server";
import { labelService } from "@/lib/services/label.service";
import { updateLabelSchema } from "@/lib/validations/label.schema";
import { success, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ labelId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { labelId } = await params;
    const body = await request.json();
    const parsed = updateLabelSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const label = await labelService.update(labelId, parsed.data);
    return success(label);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { labelId } = await params;
    await labelService.delete(labelId);
    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
