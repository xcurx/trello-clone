import type { KanbanCardData } from "@/types/kanban-card";
import type { MoveBoardSummary, MoveListSummary } from "@/types/list-column";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

function getErrorMessage<T>(payload: ApiResponse<T>, fallback: string) {
  return payload.error ?? fallback;
}

export async function fetchBoardOptions() {
  const response = await fetch("/api/boards", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<MoveBoardSummary[]>;

  if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
    throw new Error(getErrorMessage(payload, "Failed to load boards"));
  }

  return payload.data;
}

export async function fetchListsForBoard(boardId: string) {
  const response = await fetch(`/api/boards/${boardId}/lists`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<MoveListSummary[]>;

  if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
    throw new Error(getErrorMessage(payload, "Failed to load lists"));
  }

  return payload.data;
}

export async function moveList(
  listId: string,
  targetBoardId: string,
  position: number,
) {
  const response = await fetch(`/api/lists/${listId}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetBoardId,
      position,
    }),
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to move list"));
  }
}

export async function moveAllCardsInList(
  listId: string,
  targetBoardId: string,
  targetListId: string,
  position: number,
) {
  const response = await fetch(`/api/lists/${listId}/move-cards`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetBoardId,
      targetListId,
      position,
    }),
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to move cards"));
  }
}

export async function archiveList(listId: string) {
  const response = await fetch(`/api/lists/${listId}/archive`, {
    method: "PATCH",
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to archive list"));
  }
}

export async function archiveAllCardsInList(listId: string) {
  const response = await fetch(`/api/lists/${listId}/archive-cards`, {
    method: "PATCH",
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to archive cards"));
  }
}

export async function createCardInList(
  listId: string,
  title: string,
  position: number,
) {
  const response = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      listId,
      position,
    }),
  });

  const payload = (await response.json()) as ApiResponse<KanbanCardData>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(getErrorMessage(payload, "Failed to create card"));
  }

  return payload.data;
}

export async function patchListColor(listId: string, color: string | null) {
  const response = await fetch(`/api/lists/${listId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ color }),
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to update list"));
  }
}

export async function patchListTitle(listId: string, title: string) {
  const response = await fetch(`/api/lists/${listId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to update list title"));
  }
}
