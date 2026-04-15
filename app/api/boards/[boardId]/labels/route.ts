import type { NextRequest } from "next/server";
import { labelService } from "@/lib/services/label.service";
import { createLabelSchema } from "@/lib/validations/label.schema";
import {
  success,
  created,
  serverError,
  validationError,
} from "@/lib/api-response";

type Params = { params: Promise<{ boardId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const labels = await labelService.getByBoard(boardId);
    return success(labels);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const body = await request.json();
    const parsed = createLabelSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const label = await labelService.create(boardId, parsed.data);
    return created(label);
  } catch (err) {
    return serverError(err);
  }
}
