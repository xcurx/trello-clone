import { boardService } from "@/lib/services/board.service";
import { createBoardSchema } from "@/lib/validations/board.schema";
import { success, created, serverError, validationError } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() ?? "";
    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 20))
      : 8;

    const boards = query
      ? await boardService.search(query, limit)
      : await boardService.getAll();

    return success(boards);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createBoardSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const board = await boardService.create(parsed.data);
    return created(board);
  } catch (err) {
    return serverError(err);
  }
}
