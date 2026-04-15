import { prisma } from "@/lib/db";

export const labelService = {
  async getByBoard(boardId: string) {
    return prisma.label.findMany({
      where: { boardId },
      orderBy: { color: "asc" },
    });
  },

  async create(boardId: string, data: { title?: string; color: string }) {
    return prisma.label.create({
      data: {
        boardId,
        title: data.title ?? "",
        color: data.color,
      },
    });
  },

  async update(id: string, data: { title?: string; color?: string }) {
    return prisma.label.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.label.delete({
      where: { id },
    });
  },

  async addToCard(cardId: string, labelId: string) {
    return prisma.cardLabel.create({
      data: { cardId, labelId },
      include: { label: true },
    });
  },

  async removeFromCard(cardId: string, labelId: string) {
    return prisma.cardLabel.deleteMany({
      where: { cardId, labelId },
    });
  },
};
