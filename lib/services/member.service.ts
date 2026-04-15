import { prisma } from "@/lib/db";

export const memberService = {
  async getAll() {
    return prisma.member.findMany({
      orderBy: { name: "asc" },
    });
  },

  async getByBoard(boardId: string) {
    return prisma.boardMember.findMany({
      where: { boardId },
      include: { member: true },
    });
  },

  async assignToCard(cardId: string, memberId: string) {
    return prisma.cardMember.create({
      data: { cardId, memberId },
      include: { member: true },
    });
  },

  async removeFromCard(cardId: string, memberId: string) {
    return prisma.cardMember.deleteMany({
      where: { cardId, memberId },
    });
  },
};
