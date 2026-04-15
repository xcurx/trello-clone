import type { NextRequest } from "next/server";
import { cardService } from "@/lib/services/card.service";
import { createCardSchema } from "@/lib/validations/card.schema";
import { created, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ listId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { listId } = await params;
    const body = await request.json();
    const parsed = createCardSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const card = await cardService.create(listId, parsed.data);
    return created(card);
  } catch (err) {
    return serverError(err);
  }
}
