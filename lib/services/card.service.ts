import { Prisma } from "@prisma/client";
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
    return prisma.$transaction(async (tx) => {
      const existingCard = await tx.card.findUnique({
        where: { id: cardId },
        select: { listId: true },
      });

      if (!existingCard) {
        throw new Error("Card not found");
      }

      const lockListIds = Array.from(
        new Set([existingCard.listId, targetListId]),
      ).sort();

      for (const listId of lockListIds) {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(72101, hashtext(${listId}))
        `;
      }

      await tx.card.updateMany({
        where: {
          listId: targetListId,
          position: { gte: position },
          isArchived: false,
        },
        data: {
          position: { increment: 1 },
        },
      });

      return tx.card.update({
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
    });
  },

  async reorder(listId: string, orderedIds: string[]) {
    const uniqueOrderedIds = Array.from(new Set(orderedIds));

    if (uniqueOrderedIds.length === 0) {
      return { reordered: 0 };
    }

    return prisma.$transaction(async (tx) => {
      // Serialize reorder operations per list to avoid row-lock deadlocks
      // when multiple drag operations hit the same list concurrently.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(72101, hashtext(${listId}))
      `;

      const values = Prisma.join(
        uniqueOrderedIds.map((id, index) =>
          Prisma.sql`(${id}::text, ${index}::int)`,
        ),
      );

      const updated = await tx.$executeRaw`
        UPDATE "cards" AS c
        SET
          "position" = v.position,
          "listId" = ${listId}
        FROM (VALUES ${values}) AS v(id, position)
        WHERE c."id" = v.id
      `;

      return { reordered: updated };
    });
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
        list: { boardId, isArchived: false },
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
