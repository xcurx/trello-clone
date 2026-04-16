export interface CardModalState {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  isArchived: boolean;
  coverColor: string | null;
  coverImageUrl: string | null;
  coverImagePath?: string | null;
  createdAt: string;
  updatedAt: string;
  labels: Array<{
    id: string;
    label: {
      id: string;
      boardId: string;
      title: string;
      color: string;
    };
  }>;
  members: Array<{
    id: string;
    member: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  }>;
  checklistItems: Array<{
    id: string;
    cardId: string;
    title: string;
    isCompleted: boolean;
    position: number;
  }>;
  comments: Array<{
    id: string;
    cardId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    member: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  }>;
  attachments: Array<{
    id: string;
    cardId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    fileUrl: string;
    storagePath: string;
    createdAt: string;
  }>;
  list: {
    id: string;
    title: string;
    boardId: string;
  };
}
