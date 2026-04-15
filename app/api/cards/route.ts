import { NextRequest } from "next/server";
import { cardService } from "@/lib/services/card.service";
import { success, serverError, validationError } from "@/lib/api-response";
import { createCardSchema } from "@/lib/validations/card.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCardSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { listId, title } = parsed.data;
    const card = await cardService.create(listId, { title });
    
    return success(card);
  } catch (err) {
    return serverError(err);
  }
}
