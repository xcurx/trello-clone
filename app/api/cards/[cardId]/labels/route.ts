import type { NextRequest } from "next/server";
import { labelService } from "@/lib/services/label.service";
import { cardLabelSchema } from "@/lib/validations/label.schema";
import { created, serverError, validationError } from "@/lib/api-response";

type Params = { params: Promise<{ cardId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const parsed = cardLabelSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const cardLabel = await labelService.addToCard(cardId, parsed.data.labelId);
    return created(cardLabel);
  } catch (err) {
    return serverError(err);
  }
}
