export type WorkspaceLabel = {
  id: string;
  title: string;
  color: string;
};

export type WorkspaceMember = {
  id: string;
  role: string;
  member: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export type WorkspaceCard = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | Date | null;
  isArchived: boolean;
  coverColor: string | null;
  labels: Array<{
    id: string;
    label: WorkspaceLabel;
  }>;
  members: Array<{
    id: string;
    member: WorkspaceMember["member"];
  }>;
  _count: {
    checklistItems: number;
    comments: number;
  };
  checklistDone?: number;
};

export type WorkspaceList = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  color?: string | null;
  cards: WorkspaceCard[];
};

export type WorkspaceBoard = {
  id: string;
  title: string;
  backgroundColor: string;
  labels: WorkspaceLabel[];
  members: WorkspaceMember[];
  lists: WorkspaceList[];
};

export type SwitchBoardItem = {
  id: string;
  title: string;
  backgroundColor: string;
  _count?: {
    lists?: number;
    members?: number;
  };
};

export type ArchivedListItem = {
  id: string;
  title: string;
  updatedAt: string;
  cardsCount: number;
};

export type ArchivedCardItem = {
  id: string;
  title: string;
  updatedAt: string;
  listId: string;
  listTitle: string;
  commentsCount: number;
};

export type ArchivedItemsTab = "lists" | "cards";

export type BoardMenuView = "menu" | "change-background" | "colors";

export type BoardBackgroundKey =
  | "ocean"
  | "sunset"
  | "forest"
  | "lavender"
  | "midnight"
  | "sky"
  | "berry"
  | "slate"
  | "snow";

export type BoardBackgroundOption = {
  key: BoardBackgroundKey;
  emoji: string;
  label: string;
};

export interface BoardWorkspaceProps {
  board: WorkspaceBoard;
}

export type DueDateFilter = "all" | "overdue" | "today" | "week" | "none";
