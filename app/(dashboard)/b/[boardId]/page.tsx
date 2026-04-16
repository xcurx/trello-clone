import { notFound } from "next/navigation";
import { BoardWorkspace } from "@/components/board/BoardWorkspace";
import { CardModal } from "@/components/card/CardModal";
import { boardService } from "@/lib/services/board.service";

// Map our gradients exactly as in Dashboard
const GRADIENTS: Record<string, string> = {
  ocean: "linear-gradient(180deg, #5a437f 0%, #754992 52%, #965687 100%)",
  sunset: "linear-gradient(180deg, #5b3b31 0%, #824b4a 52%, #9e5f72 100%)",
  forest: "linear-gradient(180deg, #1f4f47 0%, #2d5f58 52%, #4a6d64 100%)",
  lavender: "linear-gradient(180deg, #67458d 0%, #7d4e99 48%, #96568c 100%)",
  midnight: "linear-gradient(180deg, #253252 0%, #354565 52%, #4d5d78 100%)",
  sky: "linear-gradient(180deg, #204a67 0%, #355f84 52%, #536b98 100%)",
  berry: "linear-gradient(180deg, #693760 0%, #874b77 52%, #a76184 100%)",
  slate: "linear-gradient(180deg, #38434e 0%, #495565 52%, #5e6278 100%)",
  snow: "linear-gradient(180deg, #40465a 0%, #525a72 52%, #6e6784 100%)",
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
    lists: board.lists.map((list) => ({
      ...list,
      cards: list.cards.map((card) => ({
        ...card,
        checklistDone: card.checklistItems.length,
      })),
    })),
  };

  const bgStyle = {
    background: board.backgroundImageUrl
      ? `center / cover no-repeat url("${board.backgroundImageUrl}")`
      : (GRADIENTS[board.backgroundColor] || GRADIENTS.ocean),
    color:
      board.backgroundColor === "snow"
        ? "var(--color-on-surface)"
        : "var(--color-on-primary)",
  };

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-1 flex-col"
      style={bgStyle}
    >
      <BoardWorkspace board={transformedBoard} />
      <CardModal />
    </div>
  );
}
