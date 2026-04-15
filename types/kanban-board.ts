import type { KanbanCardData } from "@/types/kanban-card";

export type BoardCard = Omit<KanbanCardData, "listId"> & {
  listId: string;
  description: string | null;
  position: number;
  dueDate: Date | string | null;
  isArchived: boolean;
  coverColor: string | null;
  labels: Array<{
    id: string;
    label: {
      id: string;
      title: string;
      color: string;
    };
  }>;
  members: Array<{
    id: string;
    member: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }>;
  _count: {
    checklistItems: number;
    comments: number;
  };
};

export interface BoardList {
  id: string;
  boardId: string;
  title: string;
  color?: string | null;
  position: number;
  cards: BoardCard[];
}

export interface BoardState {
  id: string;
  title: string;
  backgroundColor: string;
  lists: BoardList[];
}

export interface KanbanBoardProps {
  board: BoardState;
  hideHeader?: boolean;
}
