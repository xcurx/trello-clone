export interface KanbanCardData {
  id: string;
  listId?: string;
  title: string;
  description?: string | null;
  position?: number;
  dueDate?: string | Date | null;
  isArchived?: boolean;
  coverColor?: string | null;
  coverImageUrl?: string | null;
  labels?: Array<{
    id: string;
    label: {
      id: string;
      title: string;
      color: string;
    };
  }>;
  members?: Array<{
    id: string;
    member: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }>;
  _count?: {
    checklistItems?: number;
    comments?: number;
  };
  checklistDone?: number;
  checklistItems?: Array<{ id: string }>;
}
