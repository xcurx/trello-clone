// api res wrapper
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string[]> };

// board
export interface BoardSummary {
  id: string;
  title: string;
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    lists: number;
    members: number;
  };
}

export interface BoardDetail {
  id: string;
  title: string;
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
  lists: ListWithCards[];
  labels: LabelData[];
  members: BoardMemberData[];
}

// list
export interface ListData {
  id: string;
  boardId: string;
  title: string;
  position: number;
}

export interface ListWithCards extends ListData {
  cards: CardData[];
}

// card
export interface CardData {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  isArchived: boolean;
  coverColor: string | null;
  labels: CardLabelData[];
  members: CardMemberData[];
  _count: {
    checklistItems: number;
    comments: number;
  };
  checklistDone: number;
}

export interface CardDetail extends Omit<CardData, "_count" | "checklistDone"> {
  createdAt: string;
  updatedAt: string;
  checklistItems: ChecklistItemData[];
  comments: CommentData[];
}

// label
export interface LabelData {
  id: string;
  boardId: string;
  title: string;
  color: string;
}

export interface CardLabelData {
  id: string;
  label: LabelData;
}

// checklist
export interface ChecklistItemData {
  id: string;
  cardId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

// member
export interface MemberData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface BoardMemberData {
  id: string;
  role: string;
  member: MemberData;
}

export interface CardMemberData {
  id: string;
  member: MemberData;
}

// comment
export interface CommentData {
  id: string;
  cardId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  member: MemberData;
}

// dnd
export interface ReorderPayload {
  orderedIds: string[];
}

export interface MoveCardPayload {
  targetListId: string;
  position: number;
}
