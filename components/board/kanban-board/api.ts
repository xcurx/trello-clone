import type { BoardCard, BoardList } from "@/types/kanban-board";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

function getErrorMessage<T>(payload: ApiResponse<T>, fallback: string) {
  return payload.error ?? fallback;
}

function normalizeListCards(
  cards: Array<BoardCard & { checklistItems?: Array<{ id: string }> }>,
) {
  return cards.map((card) => ({
    ...card,
    checklistDone: card.checklistDone ?? card.checklistItems?.length,
  }));
}

export async function createOrCopyList(params: {
  boardId: string;
  title: string;
  position: number;
  copySourceListId: string | null;
}) {
  const { boardId, title, position, copySourceListId } = params;

  const response = copySourceListId
    ? await fetch(`/api/lists/${copySourceListId}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
    : await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          boardId,
          position,
        }),
      });

  const payload = (await response.json()) as ApiResponse<BoardList>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(getErrorMessage(payload, "Failed to create list"));
  }

  return {
    ...payload.data,
    cards: normalizeListCards(
      (payload.data.cards as Array<
        BoardCard & { checklistItems?: Array<{ id: string }> }
      >) ?? [],
    ),
  } as BoardList;
}

export async function patchBoardTitle(boardId: string, title: string) {
  await fetch(`/api/boards/${boardId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function patchJson(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error?: unknown }).error)
        : "Request failed";
    throw new Error(message);
  }
}

export async function persistCardsReorder(listId: string, orderedIds: string[]) {
  await patchJson("/api/cards/reorder", { listId, orderedIds });
}

export async function persistCardMove(
  cardId: string,
  targetListId: string,
  position: number,
) {
  await patchJson(`/api/cards/${cardId}/move`, { targetListId, position });
}
