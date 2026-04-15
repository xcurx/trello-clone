import { boardService } from "@/lib/services/board.service";
import { createBoardSchema } from "@/lib/validations/board.schema";
import { success, created, serverError, validationError } from "@/lib/api-response";

export async function GET() {
  try {
    const boards = await boardService.getAll();
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
