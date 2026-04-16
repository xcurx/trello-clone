import type { UploadedStorageObject, UploadPurpose } from "@/lib/storage/types";
import type { ApiResponse } from "@/types";

interface UploadClientInput {
  purpose: UploadPurpose;
  file: File;
  boardId?: string;
  cardId?: string;
}

export async function uploadFileViaApi({
  purpose,
  file,
  boardId,
  cardId,
}: UploadClientInput): Promise<UploadedStorageObject> {
  const formData = new FormData();
  formData.append("purpose", purpose);
  formData.append("file", file);

  if (boardId) {
    formData.append("boardId", boardId);
  }

  if (cardId) {
    formData.append("cardId", cardId);
  }

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as ApiResponse<UploadedStorageObject>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Upload failed" : payload.error);
  }

  return payload.data;
}
