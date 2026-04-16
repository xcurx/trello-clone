import { prisma } from "@/lib/db";

export const attachmentService = {
  async getById(attachmentId: string) {
    return prisma.cardAttachment.findUnique({
      where: { id: attachmentId },
    });
  },

  async listByCard(cardId: string) {
    return prisma.cardAttachment.findMany({
      where: { cardId },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(
    cardId: string,
    data: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      fileUrl: string;
      storagePath: string;
    },
  ) {
    return prisma.cardAttachment.create({
      data: {
        cardId,
        ...data,
      },
    });
  },

  async delete(attachmentId: string) {
    return prisma.cardAttachment.delete({
      where: { id: attachmentId },
    });
  },
};
