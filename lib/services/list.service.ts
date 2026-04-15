import { prisma } from "@/lib/db";

export const listService = {
  async create(boardId: string, data: { title: string }) {
    const maxPosition = await prisma.list.aggregate({
      where: { boardId },
      _max: { position: true },
    });
    const position = (maxPosition._max.position ?? -1) + 1;

    return prisma.list.create({
      data: {
        boardId,
        title: data.title,
        position,
      },
    });
  },

  async update(id: string, data: { title?: string }) {
    return prisma.list.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.list.delete({
      where: { id },
    });
  },

  async reorder(boardId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      prisma.list.update({
        where: { id },
        data: { position: index },
      }),
    );
    return prisma.$transaction(updates);
  },
};
