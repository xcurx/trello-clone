import { created, error, serverError } from "@/lib/api-response";
import { isUploadPurpose, uploadFileToStorage } from "@/lib/storage/upload.service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const purposeRaw = formData.get("purpose");
    const fileRaw = formData.get("file");
    const boardIdRaw = formData.get("boardId");
    const cardIdRaw = formData.get("cardId");

    if (typeof purposeRaw !== "string" || !isUploadPurpose(purposeRaw)) {
      return error("Invalid upload purpose", 400);
    }

    if (!(fileRaw instanceof File)) {
      return error("File is required", 400);
    }

    const boardId = typeof boardIdRaw === "string" ? boardIdRaw : undefined;
    const cardId = typeof cardIdRaw === "string" ? cardIdRaw : undefined;

    if (purposeRaw === "board-background" && !boardId) {
      return error("boardId is required for board background upload", 400);
    }

    if (
      (purposeRaw === "card-cover" || purposeRaw === "card-attachment") &&
      !cardId
    ) {
      return error("cardId is required for this upload", 400);
    }

    const uploaded = await uploadFileToStorage({
      purpose: purposeRaw,
      file: fileRaw,
      boardId,
      cardId,
    });

    return created(uploaded);
  } catch (err) {
    return serverError(err);
  }
}
