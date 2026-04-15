import { NextRequest } from "next/server";
import { listService } from "@/lib/services/list.service";
import { success, serverError, validationError } from "@/lib/api-response";
import { createListSchema } from "@/lib/validations/list.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createListSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { boardId, title, color } = parsed.data;
    const list = await listService.create(boardId, { title, color });
    
    // Add default empty cards array to map frontend shape gracefully
    return success({ ...list, cards: [] });
  } catch (err) {
    return serverError(err);
  }
}
