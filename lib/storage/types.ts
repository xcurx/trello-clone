export type UploadPurpose =
  | "board-background"
  | "card-cover"
  | "card-attachment";

export interface UploadedStorageObject {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  fileUrl: string;
}

export interface UploadFileInput {
  purpose: UploadPurpose;
  file: File;
  boardId?: string;
  cardId?: string;
}
