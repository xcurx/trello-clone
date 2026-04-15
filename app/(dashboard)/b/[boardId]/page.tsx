import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { CardModal } from "@/components/card/CardModal";
import { boardService } from "@/lib/services/board.service";

// Map our gradients exactly as in Dashboard
const GRADIENTS: Record<string, string> = {
  ocean: "linear-gradient(135deg, #0079bf, #00629d)",
  sunset: "linear-gradient(135deg, #eb5a46, #ff9f1a)",
  forest: "linear-gradient(135deg, #61bd4f, #0a8043)",
  lavender: "linear-gradient(135deg, #c377e0, #7c5cbf)",
  midnight: "linear-gradient(135deg, #344563, #091e42)",
  sky: "linear-gradient(135deg, #00c2e0, #0079bf)",
  berry: "linear-gradient(135deg, #ff78cb, #c377e0)",
  slate: "linear-gradient(135deg, #838c91, #505f79)",
  snow: "linear-gradient(135deg, #f8f9fd, #e1e2e6)",
};

interface PageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default async function BoardPage({ params }: PageProps) {
  const { boardId } = await params;
  
  const board = await boardService.getById(boardId);
  
  if (!board) {
    notFound();
  }

  // Pre-process checklist items to give 'checklistDone' count
  const transformedBoard = {
    ...board,
    lists: board.lists.map(list => ({
      ...list,
      cards: list.cards.map(card => ({
        ...card,
        checklistDone: card.checklistItems.length
      }))
    }))
  };

  const bgStyle = {
    background: GRADIENTS[board.backgroundColor] || GRADIENTS["ocean"],
    color: board.backgroundColor === "snow" ? "var(--color-on-surface)" : "var(--color-on-primary)"
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full" style={bgStyle}>
      <KanbanBoard board={transformedBoard} />
      <CardModal />
    </div>
  );
}
