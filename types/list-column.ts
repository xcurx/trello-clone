import type { KanbanCardData } from "@/types/kanban-card";

export interface MoveBoardSummary {
  id: string;
  title: string;
}

export interface MoveListSummary {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cardsCount: number;
}

export type ListColorKey =
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "blue"
  | "teal"
  | "lime"
  | "pink"
  | "gray";

export type ListTone = {
  shell: string;
  header: string;
};

export interface ListColumnData {
  id: string;
  boardId: string;
  title: string;
  position: number;
  color?: string | null;
  cards: KanbanCardData[];
}

export interface ListColumnProps {
  list: ListColumnData;
  onRequestCopyList?: (listId: string, title: string) => void;
  onCreateCard?: (listId: string, title: string) => Promise<void> | void;
  onListPatched?: (
    listId: string,
    patch: { title?: string; color?: string | null; isArchived?: boolean },
  ) => void;
  isOverlay?: boolean;
}
