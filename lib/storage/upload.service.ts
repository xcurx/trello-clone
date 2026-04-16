import { randomUUID } from "node:crypto";
import {
  IMAGE_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  MIME_EXTENSION_MAP,
  SUPABASE_STORAGE_BUCKET,
} from "@/lib/storage/constants";
import { getSupabaseAdminClient } from "@/lib/storage/supabase-admin";
import type {
  UploadFileInput,
  UploadPurpose,
  UploadedStorageObject,
} from "@/lib/storage/types";

const PURPOSE_SET: ReadonlySet<UploadPurpose> = new Set([
  "board-background",
  "card-cover",
  "card-attachment",
]);

export function isUploadPurpose(value: string): value is UploadPurpose {
  return PURPOSE_SET.has(value as UploadPurpose);
}

function sanitizeFileName(rawName: string) {
  const normalized = rawName
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || "file";
}

function resolveExtension(file: File) {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : undefined;

  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) {
    return fromName;
  }

  return MIME_EXTENSION_MAP[file.type] ?? "bin";
}

function assertUploadAllowed(input: UploadFileInput) {
  const { purpose, file } = input;
  const maxBytes = MAX_UPLOAD_SIZE_BYTES[purpose];

  if (file.size <= 0) {
    throw new Error("Cannot upload an empty file");
  }

  if (file.size > maxBytes) {
    throw new Error(
      `File too large. Max allowed size is ${Math.floor(maxBytes / (1024 * 1024))}MB for ${purpose}.`,
    );
  }

  if ((purpose === "board-background" || purpose === "card-cover") && !IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Only image uploads are allowed for board backgrounds and card covers");
  }
}

function buildStoragePath(input: UploadFileInput) {
  const extension = resolveExtension(input.file);
  const baseName = sanitizeFileName(input.file.name);
  const uniqueName = `${Date.now()}-${randomUUID()}-${baseName}.${extension}`;

  if (input.purpose === "board-background") {
    return `board-backgrounds/${input.boardId ?? "unscoped"}/${uniqueName}`;
  }

  if (input.purpose === "card-cover") {
    return `card-covers/${input.cardId ?? "unscoped"}/${uniqueName}`;
  }

  return `card-attachments/${input.cardId ?? "unscoped"}/${uniqueName}`;
}

export async function uploadFileToStorage(
  input: UploadFileInput,
): Promise<UploadedStorageObject> {
  assertUploadAllowed(input);

  const storagePath = buildStoragePath(input);
  const supabase = getSupabaseAdminClient();
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());

  const uploadResult = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);

  return {
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    sizeBytes: input.file.size,
    storagePath,
    fileUrl: publicUrl,
  };
}

export async function removeStorageObject(storagePath: string) {
  if (!storagePath) return;

  const supabase = getSupabaseAdminClient();
  const result = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .remove([storagePath]);

  if (result.error) {
    throw new Error(result.error.message);
  }
}
