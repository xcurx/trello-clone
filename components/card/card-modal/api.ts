import type {
  ApiResponse,
  CardAttachmentData,
  CardDetail,
  CommentData,
  LabelData,
  MemberData,
} from "@/types";
import { uploadFileViaApi } from "@/lib/uploads/client";
import type { CardModalState } from "@/types/card-modal";

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(body.success ? "Request failed" : body.error);
  }

  return body.data;
}

export async function loadCardModalData(cardId: string) {
  const card = await fetchJson<CardModalState>(`/api/cards/${cardId}`);

  const [labels, members] = await Promise.all([
    fetchJson<LabelData[]>(`/api/boards/${card.list.boardId}/labels`),
    fetchJson<MemberData[]>("/api/members"),
  ]);

  return {
    card,
    labels,
    members,
  };
}

export async function patchCardDetails(
  cardId: string,
  patch: Partial<CardDetail>,
) {
  return fetchJson<CardDetail>(`/api/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function addCardMember(cardId: string, memberId: string) {
  return fetchJson<{ id: string; member: MemberData }>(`/api/cards/${cardId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId }),
  });
}

export async function removeCardMember(cardId: string, memberId: string) {
  return fetchJson<{ removed: true }>(`/api/cards/${cardId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function addCardLabel(cardId: string, labelId: string) {
  return fetchJson<{ id: string; label: LabelData }>(`/api/cards/${cardId}/labels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ labelId }),
  });
}

export async function removeCardLabel(cardId: string, labelId: string) {
  return fetchJson<{ removed: true }>(`/api/cards/${cardId}/labels/${labelId}`, {
    method: "DELETE",
  });
}

export async function createChecklistItem(cardId: string, title: string) {
  return fetchJson<{
    id: string;
    cardId: string;
    title: string;
    isCompleted: boolean;
    position: number;
  }>(`/api/cards/${cardId}/checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export async function patchChecklistItem(itemId: string, isCompleted: boolean) {
  return fetchJson<{
    id: string;
    cardId: string;
    title: string;
    isCompleted: boolean;
    position: number;
  }>(`/api/checklist/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isCompleted }),
  });
}

export async function deleteChecklistItem(itemId: string) {
  return fetchJson<{ deleted: true }>(`/api/checklist/${itemId}`, {
    method: "DELETE",
  });
}

export async function createCardComment(cardId: string, content: string) {
  return fetchJson<CommentData>(`/api/cards/${cardId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function uploadCardCoverImage(cardId: string, file: File) {
  return uploadFileViaApi({
    purpose: "card-cover",
    file,
    cardId,
  });
}

export async function uploadCardAttachmentFile(cardId: string, file: File) {
  return uploadFileViaApi({
    purpose: "card-attachment",
    file,
    cardId,
  });
}

export async function createCardAttachment(
  cardId: string,
  attachment: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    fileUrl: string;
    storagePath: string;
  },
) {
  return fetchJson<CardAttachmentData>(`/api/cards/${cardId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attachment),
  });
}

export async function deleteCardAttachment(cardId: string, attachmentId: string) {
  return fetchJson<{ deleted: true }>(
    `/api/cards/${cardId}/attachments/${attachmentId}`,
    {
      method: "DELETE",
    },
  );
}
