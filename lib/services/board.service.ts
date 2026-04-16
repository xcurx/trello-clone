import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID, LABEL_COLORS } from "@/lib/constants";

export const boardService = {
  async getAll() {
    return prisma.board.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { lists: true, members: true },
        },
      },
    });
  },

  async search(query: string, limit = 8) {
    const normalizedQuery = query.trim();
    const normalizedLimit = Math.max(1, Math.min(limit, 20));

    if (!normalizedQuery) {
      return [];
    }

    return prisma.board.findMany({
      where: {
        title: {
          contains: normalizedQuery,
          mode: "insensitive",
        },
      },
      orderBy: { updatedAt: "desc" },
      take: normalizedLimit,
      include: {
        _count: {
          select: { lists: true, members: true },
        },
      },
    });
  },

  async getById(id: string) {
    return prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          where: { isArchived: false },
          orderBy: { position: "asc" },
          include: {
            cards: {
              where: { isArchived: false },
              orderBy: { position: "asc" },
              include: {
                labels: {
                  include: { label: true },
                },
                members: {
                  include: { member: true },
                },
                _count: {
                  select: { checklistItems: true, comments: true },
                },
                checklistItems: {
                  where: { isCompleted: true },
                  select: { id: true },
                },
              },
            },
          },
        },
        labels: {
          orderBy: { color: "asc" },
        },
        members: {
          include: { member: true },
        },
      },
    });
  },

  async getArchivedItems(
    boardId: string,
    data?: { query?: string; type?: "cards" | "lists" | "all" },
  ) {
    const normalizedQuery = data?.query?.trim();
    const type = data?.type ?? "all";

    const [lists, cards] = await Promise.all([
      type === "cards"
        ? Promise.resolve([])
        : prisma.list.findMany({
            where: {
              boardId,
              isArchived: true,
              ...(normalizedQuery
                ? {
                    title: {
                      contains: normalizedQuery,
                      mode: "insensitive" as const,
                    },
                  }
                : {}),
            },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              title: true,
              updatedAt: true,
              _count: { select: { cards: true } },
            },
          }),
      type === "lists"
        ? Promise.resolve([])
        : prisma.card.findMany({
            where: {
              isArchived: true,
              list: { boardId },
              ...(normalizedQuery
                ? {
                    title: {
                      contains: normalizedQuery,
                      mode: "insensitive" as const,
                    },
                  }
                : {}),
            },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              title: true,
              updatedAt: true,
              list: {
                select: {
                  id: true,
                  title: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                },
              },
            },
          }),
    ]);

    return {
      lists: lists.map((list) => ({
        id: list.id,
        title: list.title,
        updatedAt: list.updatedAt,
        cardsCount: list._count.cards,
      })),
      cards: cards.map((card) => ({
        id: card.id,
        title: card.title,
        updatedAt: card.updatedAt,
        listId: card.list.id,
        listTitle: card.list.title,
        commentsCount: card._count.comments,
      })),
    };
  },

  async create(data: { title: string; backgroundColor?: string }) {
    return prisma.board.create({
      data: {
        title: data.title,
        backgroundColor: data.backgroundColor ?? "ocean",
        labels: {
          create: LABEL_COLORS.slice(0, 6).map((lc) => ({
            title: lc.name,
            color: lc.color,
          })),
        },
        members: {
          create: {
            memberId: DEFAULT_USER_ID,
            role: "OWNER",
          },
        },
      },
      include: {
        _count: {
          select: { lists: true, members: true },
        },
      },
    });
  },

  async update(
    id: string,
    data: { title?: string; backgroundColor?: string; isStarred?: boolean },
  ) {
    return prisma.board.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.board.delete({
      where: { id },
    });
  },
};
