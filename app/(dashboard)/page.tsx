import Link from "next/link";
import { Star, Clock } from "lucide-react";
import { boardService } from "@/lib/services/board.service";
import { formatDistanceToNow } from "date-fns";

// Mapped gradients from DESIGN.md
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

export default async function DashboardPage() {
  const boards = await boardService.getAll();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-10 h-full w-full">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-on-surface-variant" />
        <h2 className="text-xl font-bold text-on-surface">Recently viewed</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {boards.slice(0, 4).map((board) => (
          <Link
            key={board.id}
            href={`/b/${board.id}`}
            className="group relative h-[120px] rounded-lg p-3 hover:shadow-card-hover transition-shadow overflow-hidden block"
            style={{ 
              background: GRADIENTS[board.backgroundColor] || GRADIENTS["ocean"],
              color: board.backgroundColor === "snow" ? "var(--color-on-surface)" : "var(--color-on-primary)"
            }}
          >
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <h3 className="font-semibold text-base leading-snug drop-shadow-sm">
                {board.title}
              </h3>
              <div className="flex justify-between items-end">
                <span className="text-[11px] uppercase tracking-wider font-bold opacity-80 backdrop-blur-sm px-1.5 py-0.5 rounded-sm bg-white/20">
                  {board._count.lists} lists
                </span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                  <Star className="w-4 h-4 fill-transparent hover:fill-white" />
                </button>
              </div>
            </div>
          </Link>
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
            <Link
              key={board.id}
              href={`/b/${board.id}`}
              className="group relative h-[100px] rounded-lg p-3 hover:shadow-card-hover transition-shadow overflow-hidden block"
              style={{ 
                background: GRADIENTS[board.backgroundColor] || GRADIENTS["ocean"],
                color: board.backgroundColor === "snow" ? "var(--color-on-surface)" : "var(--color-on-primary)"
              }}
            >
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <h3 className="font-semibold text-base leading-snug drop-shadow-sm truncate">
                  {board.title}
                </h3>
              </div>
            </Link>
          ))}
          
          <button className="h-[100px] rounded-lg p-3 flex items-center justify-center bg-surface-container-low hover:bg-surface-container hover:-translate-y-0.5 transition-all outline-dashed outline-2 outline-offset-[-2px] outline-outline-variant text-on-surface-variant group">
            <span className="font-medium text-sm group-hover:text-primary transition-colors">
              Create new board
            </span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
