import { prisma } from "@/lib/db";

export const cardService = {
  async create(listId: string, data: { title: string }) {
    const maxPosition = await prisma.card.aggregate({
      where: { listId },
      _max: { position: true },
    });
    const position = (maxPosition._max.position ?? -1) + 1;

    return prisma.card.create({
      data: {
        listId,
        title: data.title,
        position,
      },
      include: {
        labels: { include: { label: true } },
        members: { include: { member: true } },
        _count: { select: { checklistItems: true, comments: true } },
      },
    });
  },

  async getById(id: string) {
    return prisma.card.findUnique({
      where: { id },
      include: {
        labels: { include: { label: true } },
        members: { include: { member: true } },
        checklistItems: { orderBy: { position: "asc" } },
        comments: {
          orderBy: { createdAt: "desc" },
          include: { member: true },
        },
        list: {
          select: { id: true, title: true, boardId: true },
        },
      },
    });
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      dueDate?: Date | null;
      coverColor?: string | null;
      isArchived?: boolean;
    },
  ) {
    return prisma.card.update({
      where: { id },
      data,
      include: {
        labels: { include: { label: true } },
        members: { include: { member: true } },
        _count: { select: { checklistItems: true, comments: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.card.delete({
      where: { id },
    });
  },

  async move(cardId: string, targetListId: string, position: number) {
    await prisma.card.updateMany({
      where: {
        listId: targetListId,
        position: { gte: position },
        isArchived: false,
      },
      data: {
        position: { increment: 1 },
      },
    });

    return prisma.card.update({
      where: { id: cardId },
      data: {
        listId: targetListId,
        position,
      },
      include: {
        labels: { include: { label: true } },
        members: { include: { member: true } },
        _count: { select: { checklistItems: true, comments: true } },
      },
    });
  },

  async reorder(listId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      prisma.card.update({
        where: { id },
        data: { position: index, listId },
      }),
    );
    return prisma.$transaction(updates);
  },

  async search(
    boardId: string,
    query?: string,
    filters?: {
      labelIds?: string[];
      memberIds?: string[];
      dueDateFilter?: "overdue" | "today" | "week" | "none";
    },
  ) {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return prisma.card.findMany({
      where: {
        list: { boardId },
        isArchived: false,
        ...(query && {
          title: { contains: query, mode: "insensitive" as const },
        }),
        ...(filters?.labelIds?.length && {
          labels: {
            some: { labelId: { in: filters.labelIds } },
          },
        }),
        ...(filters?.memberIds?.length && {
          members: {
            some: { memberId: { in: filters.memberIds } },
          },
        }),
        ...(filters?.dueDateFilter === "overdue" && {
          dueDate: { lt: now },
        }),
        ...(filters?.dueDateFilter === "today" && {
          dueDate: { gte: now, lte: todayEnd },
        }),
        ...(filters?.dueDateFilter === "week" && {
          dueDate: { gte: now, lte: weekEnd },
        }),
        ...(filters?.dueDateFilter === "none" && {
          dueDate: null,
        }),
      },
      include: {
        labels: { include: { label: true } },
        members: { include: { member: true } },
        list: { select: { id: true, title: true } },
        _count: { select: { checklistItems: true, comments: true } },
      },
      orderBy: { position: "asc" },
    });
  },
};
