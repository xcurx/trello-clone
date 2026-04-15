import { prisma } from "@/lib/db";

export const commentService = {
  async getByCard(cardId: string) {
    return prisma.comment.findMany({
      where: { cardId },
      orderBy: { createdAt: "desc" },
      include: { member: true },
    });
  },

  async create(cardId: string, memberId: string, content: string) {
    return prisma.comment.create({
      data: { cardId, memberId, content },
      include: { member: true },
    });
  },

  async update(id: string, content: string) {
    return prisma.comment.update({
      where: { id },
      data: { content },
      include: { member: true },
    });
  },

  async delete(id: string) {
    return prisma.comment.delete({
      where: { id },
    });
  },
};
