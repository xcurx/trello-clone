import { prisma } from "@/lib/db";

export const checklistService = {
  async create(cardId: string, data: { title: string }) {
    const maxPosition = await prisma.checklistItem.aggregate({
      where: { cardId },
      _max: { position: true },
    });
    const position = (maxPosition._max.position ?? -1) + 1;

    return prisma.checklistItem.create({
      data: {
        cardId,
        title: data.title,
        position,
      },
    });
  },

  async update(id: string, data: { title?: string; isCompleted?: boolean }) {
    return prisma.checklistItem.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.checklistItem.delete({
      where: { id },
    });
  },
};
