import { Clock, Star } from "lucide-react";
import { boardService } from "@/lib/services/board.service";
import { BoardCard } from "@/components/board/home/BoardCard";
import { CreateBoardTile } from "@/components/board/home/CreateBoardTile";

export default async function DashboardPage() {
  const boards = await boardService.getAll();
  const starredBoards = boards.filter((board) => board.isStarred);
  const recentBoards = boards.slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-10 h-full w-full">
      {starredBoards.length > 0 ? (
        <>
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-on-surface-variant" />
            <h2 className="text-xl font-bold text-on-surface">Starred boards</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {starredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                cardHeightClassName="h-[120px]"
                showListsCount
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-on-surface-variant" />
        <h2 className="text-xl font-bold text-on-surface">Recently viewed</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {recentBoards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            cardHeightClassName="h-[120px]"
            showListsCount
          />
        ))}
      </div>

      <div className="flex items-center justify-between mb-6 border-b border-outline-variant/30 pb-4">
        <h2 className="text-xl font-bold text-on-surface">YOUR WORKSPACES</h2>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold shadow-sm shrink-0">
            W
          </div>
          <h3 className="font-bold text-base">Main Workspace</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              cardHeightClassName="h-[100px]"
            />
          ))}
          
          <CreateBoardTile />
        </div>
      </div>
      </div>
    </div>
  );
}
