import type { NextRequest } from "next/server";
import { checklistService } from "@/lib/services/checklist.service";
import { createChecklistItemSchema } from "@/lib/validations/checklist.schema";
import { created, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ cardId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const parsed = createChecklistItemSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const item = await checklistService.create(cardId, parsed.data);
    return created(item);
  } catch (err) {
    return serverError(err);
  }
}
