import type { NextRequest } from "next/server";
import { listService } from "@/lib/services/list.service";
import { createListSchema } from "@/lib/validations/list.schema";
import {
  created,
  serverError,
  success,
  validationError,
} from "@/lib/api-response";

type Params = { params: Promise<{ boardId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const lists = await listService.getByBoard(boardId);
    return success(lists);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { boardId } = await params;
    const body = await request.json();
    const parsed = createListSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const list = await listService.create(boardId, parsed.data);
    return created(list);
  } catch (err) {
    return serverError(err);
  }
}
