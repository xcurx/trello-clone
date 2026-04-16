import type {
  ArchivedCardItem,
  ArchivedItemsTab,
  ArchivedListItem,
  BoardBackgroundKey,
  SwitchBoardItem,
} from "@/types/board-workspace";
import { uploadFileViaApi } from "@/lib/uploads/client";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

function getErrorMessage<T>(payload: ApiResponse<T>, fallback: string) {
  return payload.error ?? fallback;
}

export async function fetchSwitchBoards(signal?: AbortSignal) {
  const response = await fetch("/api/boards", {
    signal,
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<SwitchBoardItem[]>;

  if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
    throw new Error(getErrorMessage(payload, "Failed to load boards"));
  }

  return payload.data;
}

interface FetchArchivedItemsParams {
  boardId: string;
  tab: ArchivedItemsTab;
  search: string;
  signal?: AbortSignal;
}

export async function fetchArchivedItems({
  boardId,
  tab,
  search,
  signal,
}: FetchArchivedItemsParams) {
  const query = new URLSearchParams();
  query.set("type", tab);

  const trimmedQuery = search.trim();
  if (trimmedQuery) {
    query.set("q", trimmedQuery);
  }

  const response = await fetch(`/api/boards/${boardId}/archived?${query.toString()}`, {
    signal,
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<{
    lists?: ArchivedListItem[];
    cards?: ArchivedCardItem[];
  }>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to load archived items"));
  }

  return {
    lists: payload.data?.lists ?? [],
    cards: payload.data?.cards ?? [],
  };
}

export async function requestArchivedAction(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Request failed"));
  }
}

export async function patchBoardBackground(
  boardId: string,
  backgroundColor: BoardBackgroundKey,
) {
  const response = await fetch(`/api/boards/${boardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      backgroundColor,
      backgroundImageUrl: null,
      backgroundImagePath: null,
    }),
  });

  const payload = (await response.json()) as ApiResponse<{
    backgroundColor?: string;
    backgroundImageUrl?: string | null;
  }>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to update board background"));
  }

  return payload.data?.backgroundColor ?? backgroundColor;
}

export async function uploadBoardBackgroundImage(boardId: string, file: File) {
  const uploaded = await uploadFileViaApi({
    purpose: "board-background",
    file,
    boardId,
  });

  const response = await fetch(`/api/boards/${boardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      backgroundImageUrl: uploaded.fileUrl,
      backgroundImagePath: uploaded.storagePath,
    }),
  });

  const payload = (await response.json()) as ApiResponse<{
    backgroundImageUrl?: string | null;
  }>;

  if (!response.ok || !payload.success) {
    throw new Error(
      getErrorMessage(payload, "Failed to update board background image"),
    );
  }

  return {
    backgroundImageUrl: payload.data?.backgroundImageUrl ?? uploaded.fileUrl,
    backgroundImagePath: uploaded.storagePath,
  };
}

export async function patchBoardStarStatus(
  boardId: string,
  isStarred: boolean,
) {
  const response = await fetch(`/api/boards/${boardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isStarred }),
  });

  const payload = (await response.json()) as ApiResponse<{
    isStarred?: boolean;
  }>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Failed to update board star"));
  }

  return payload.data?.isStarred ?? isStarred;
}
