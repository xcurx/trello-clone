import type { NextRequest } from "next/server";
import { success, serverError, validationError } from "@/lib/api-response";
import { listService } from "@/lib/services/list.service";
import { copyListSchema } from "@/lib/validations/list.schema";

type Params = { params: Promise<{ listId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { listId } = await params;

    let rawBody: unknown = {};
    try {
      rawBody = await request.json();
    } catch {
      rawBody = {};
    }

    const parsed = copyListSchema.safeParse(rawBody);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const copiedList = await listService.copy(listId, parsed.data);
    return success(copiedList);
  } catch (err) {
    return serverError(err);
  }
}