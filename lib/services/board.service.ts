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

  async getById(id: string) {
    return prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
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

  async update(id: string, data: { title?: string; backgroundColor?: string }) {
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
