import { prisma } from "@/lib/db";

export const listService = {
  async create(boardId: string, data: { title: string; color?: string | null }) {
    const maxPosition = await prisma.list.aggregate({
      where: { boardId },
      _max: { position: true },
    });
    const position = (maxPosition._max.position ?? -1) + 1;

    return prisma.list.create({
      data: {
        boardId,
        title: data.title,
        color: data.color ?? null,
        position,
      },
    });
  },

  async getByBoard(boardId: string) {
    const [lists, cardCounts] = await Promise.all([
      prisma.list.findMany({
        where: { boardId },
        orderBy: { position: "asc" },
        select: {
          id: true,
          boardId: true,
          title: true,
          position: true,
        },
      }),
      prisma.card.groupBy({
        by: ["listId"],
        where: {
          isArchived: false,
          list: { boardId },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const countByListId = new Map(
      cardCounts.map((entry) => [entry.listId, entry._count._all]),
    );

    return lists.map((list) => ({
      ...list,
      cardsCount: countByListId.get(list.id) ?? 0,
    }));
  },

  async update(id: string, data: { title?: string; color?: string | null }) {
    return prisma.list.update({
      where: { id },
      data,
    });
  },

  async move(id: string, data: { targetBoardId: string; position: number }) {
    return prisma.$transaction(async (tx) => {
      const existingList = await tx.list.findUnique({
        where: { id },
        select: { id: true, boardId: true, position: true },
      });

      if (!existingList) {
        throw new Error("List not found");
      }

      const targetBoard = await tx.board.findUnique({
        where: { id: data.targetBoardId },
        select: { id: true },
      });

      if (!targetBoard) {
        throw new Error("Target board not found");
      }

      const lockBoardIds = Array.from(
        new Set([existingList.boardId, data.targetBoardId]),
      ).sort();

      for (const boardId of lockBoardIds) {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(72102, hashtext(${boardId}))
        `;
      }

      if (existingList.boardId === data.targetBoardId) {
        const totalLists = await tx.list.count({
          where: { boardId: existingList.boardId },
        });

        const clampedPosition = Math.max(
          0,
          Math.min(data.position, Math.max(0, totalLists - 1)),
        );

        if (clampedPosition === existingList.position) {
          return tx.list.update({
            where: { id },
            data: { position: existingList.position },
          });
        }

        if (clampedPosition > existingList.position) {
          await tx.list.updateMany({
            where: {
              boardId: existingList.boardId,
              position: {
                gt: existingList.position,
                lte: clampedPosition,
              },
            },
            data: {
              position: { decrement: 1 },
            },
          });
        } else {
          await tx.list.updateMany({
            where: {
              boardId: existingList.boardId,
              position: {
                gte: clampedPosition,
                lt: existingList.position,
              },
            },
            data: {
              position: { increment: 1 },
            },
          });
        }

        return tx.list.update({
          where: { id },
          data: { position: clampedPosition },
        });
      }

      const targetBoardCount = await tx.list.count({
        where: { boardId: data.targetBoardId },
      });

      const clampedPosition = Math.max(
        0,
        Math.min(data.position, targetBoardCount),
      );

      await tx.list.updateMany({
        where: {
          boardId: existingList.boardId,
          position: { gt: existingList.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      await tx.list.updateMany({
        where: {
          boardId: data.targetBoardId,
          position: { gte: clampedPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });

      return tx.list.update({
        where: { id },
        data: {
          boardId: data.targetBoardId,
          position: clampedPosition,
        },
      });
    }, {
      timeout: 15000,
    });
  },

  async moveAllCards(
    sourceListId: string,
    data: { targetBoardId: string; targetListId: string; position: number },
  ) {
    return prisma.$transaction(async (tx) => {
      const [sourceList, targetList] = await Promise.all([
        tx.list.findUnique({
          where: { id: sourceListId },
          select: { id: true, boardId: true },
        }),
        tx.list.findUnique({
          where: { id: data.targetListId },
          select: { id: true, boardId: true },
        }),
      ]);

      if (!sourceList) {
        throw new Error("Source list not found");
      }

      if (!targetList) {
        throw new Error("Target list not found");
      }

      if (targetList.boardId !== data.targetBoardId) {
        throw new Error("Target list does not belong to target board");
      }

      if (sourceListId === data.targetListId) {
        return { moved: 0 };
      }

      const lockListIds = Array.from(new Set([sourceListId, data.targetListId])).sort();

      for (const listId of lockListIds) {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(72101, hashtext(${listId}))
        `;
      }

      const [sourceCards, targetCards] = await Promise.all([
        tx.card.findMany({
          where: { listId: sourceListId, isArchived: false },
          orderBy: { position: "asc" },
          select: { id: true },
        }),
        tx.card.findMany({
          where: { listId: data.targetListId, isArchived: false },
          orderBy: { position: "asc" },
          select: { id: true },
        }),
      ]);

      if (sourceCards.length === 0) {
        return { moved: 0 };
      }

      const sourceIds = sourceCards.map((card) => card.id);
      const targetIds = targetCards.map((card) => card.id);

      const clampedPosition = Math.max(
        0,
        Math.min(data.position, targetIds.length),
      );

      const nextTargetOrder = [...targetIds];
      nextTargetOrder.splice(clampedPosition, 0, ...sourceIds);

      for (const [index, cardId] of nextTargetOrder.entries()) {
        await tx.card.update({
          where: { id: cardId },
          data: {
            listId: data.targetListId,
            position: index,
          },
        });
      }

      return { moved: sourceIds.length };
    });
  },

  async copy(id: string, data?: { title?: string }) {
    return prisma.$transaction(async (tx) => {
      const sourceList = await tx.list.findUnique({
        where: { id },
        include: {
          cards: {
            orderBy: { position: "asc" },
            include: {
              labels: true,
              members: true,
              checklistItems: {
                orderBy: { position: "asc" },
              },
              comments: {
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      });

      if (!sourceList) {
        throw new Error("List not found");
      }

      const maxPosition = await tx.list.aggregate({
        where: { boardId: sourceList.boardId },
        _max: { position: true },
      });
      const position = (maxPosition._max.position ?? -1) + 1;

      const nextTitle = data?.title?.trim() || sourceList.title;

      const copiedList = await tx.list.create({
        data: {
          boardId: sourceList.boardId,
          title: nextTitle,
          color: sourceList.color,
          position,
        },
      });

      for (const sourceCard of sourceList.cards) {
        await tx.card.create({
          data: {
            listId: copiedList.id,
            title: sourceCard.title,
            description: sourceCard.description,
            position: sourceCard.position,
            dueDate: sourceCard.dueDate,
            isArchived: sourceCard.isArchived,
            coverColor: sourceCard.coverColor,
            labels:
              sourceCard.labels.length > 0
                ? {
                    create: sourceCard.labels.map((label) => ({
                      labelId: label.labelId,
                    })),
                  }
                : undefined,
            members:
              sourceCard.members.length > 0
                ? {
                    create: sourceCard.members.map((member) => ({
                      memberId: member.memberId,
                    })),
                  }
                : undefined,
            checklistItems:
              sourceCard.checklistItems.length > 0
                ? {
                    create: sourceCard.checklistItems.map((item) => ({
                      title: item.title,
                      isCompleted: item.isCompleted,
                      position: item.position,
                    })),
                  }
                : undefined,
            comments:
              sourceCard.comments.length > 0
                ? {
                    create: sourceCard.comments.map((comment) => ({
                      memberId: comment.memberId,
                      content: comment.content,
                      createdAt: comment.createdAt,
                    })),
                  }
                : undefined,
          },
        });
      }

      const copiedListWithCards = await tx.list.findUnique({
        where: { id: copiedList.id },
        include: {
          cards: {
            orderBy: { position: "asc" },
            include: {
              labels: { include: { label: true } },
              members: { include: { member: true } },
              _count: { select: { checklistItems: true, comments: true } },
              checklistItems: {
                where: { isCompleted: true },
                select: { id: true },
              },
            },
          },
        },
      });

      if (!copiedListWithCards) {
        throw new Error("Failed to copy list");
      }

      return {
        ...copiedListWithCards,
        cards: copiedListWithCards.cards.map((card) => ({
          ...card,
          checklistDone: card.checklistItems.length,
        })),
      };
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
