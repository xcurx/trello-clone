"use client";

import { ChevronDown, ChevronRight, ListFilter, Pin, Search } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import type { SwitchBoardItem } from "@/types/board-workspace";

interface SwitchBoardsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boardSearch: string;
  onBoardSearchChange: (value: string) => void;
  boardsLoading: boolean;
  boardsError: string | null;
  recentBoards: SwitchBoardItem[];
  filteredBoards: SwitchBoardItem[];
  currentBoardId: string;
  isWorkspaceExpanded: boolean;
  onToggleWorkspaceExpanded: () => void;
  onSwitchBoard: (boardId: string) => void;
  previewGradients: Record<string, string>;
}

export function SwitchBoardsDialog({
  isOpen,
  onClose,
  boardSearch,
  onBoardSearchChange,
  boardsLoading,
  boardsError,
  recentBoards,
  filteredBoards,
  currentBoardId,
  isWorkspaceExpanded,
  onToggleWorkspaceExpanded,
  onSwitchBoard,
  previewGradients,
}: SwitchBoardsDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[640px] border border-white/10 bg-[#2b2e38] text-white max-sm:min-h-[calc(100vh-60px)] max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-b-0"
    >
      <div className="px-4 pb-20 pt-4 sm:px-6 sm:pb-6 sm:pt-10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
            <input
              type="text"
              value={boardSearch}
              onChange={(event) => onBoardSearchChange(event.target.value)}
              placeholder="Search your boards"
              className="h-10 w-full rounded-md border border-[#6ba4ff] bg-[#242833] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#8ab6ff]"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/8 text-white/70 transition-colors hover:bg-white/14 hover:text-white"
            aria-label="List view"
          >
            <ListFilter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/8 text-white/70 transition-colors hover:bg-white/14 hover:text-white"
            aria-label="Pinned boards"
          >
            <Pin className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-md border border-[#6ba4ff] bg-[#0c66e4]/22 px-2.5 py-1 text-sm font-medium text-[#8ab6ff]">
            All
          </span>
          <span className="rounded-md bg-white/8 px-2.5 py-1 text-sm font-medium text-white/82">
            Trello Workspace
          </span>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-white/76">Recent</p>

          {boardsLoading ? (
            <p className="text-sm text-white/58">Loading boards...</p>
          ) : boardsError ? (
            <p className="text-sm text-[#ff9f9f]">{boardsError}</p>
          ) : recentBoards.length === 0 ? (
            <p className="text-sm text-white/58">No boards found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {recentBoards.map((boardItem) => (
                <button
                  key={boardItem.id}
                  type="button"
                  onClick={() => onSwitchBoard(boardItem.id)}
                  className={cn(
                    "overflow-hidden rounded-lg border border-white/10 text-left transition-all hover:border-white/30",
                    boardItem.id === currentBoardId && "border-[#6ba4ff]",
                  )}
                >
                  <div
                    className="h-16 w-full"
                    style={{
                      background: boardItem.backgroundImageUrl
                        ? `center / cover no-repeat url("${boardItem.backgroundImageUrl}")`
                        : (previewGradients[boardItem.backgroundColor] ??
                          previewGradients.ocean),
                    }}
                  />
                  <div className="bg-black/28 px-3 py-2">
                    <p className="truncate text-sm font-medium text-white">
                      {boardItem.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onToggleWorkspaceExpanded}
            className="inline-flex items-center gap-2 text-left text-lg font-semibold text-white/84 transition-colors hover:text-white"
          >
            {isWorkspaceExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Trello Workspace
          </button>

          {isWorkspaceExpanded ? (
            <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
              {filteredBoards.map((boardItem) => (
                <button
                  key={`${boardItem.id}-row`}
                  type="button"
                  onClick={() => onSwitchBoard(boardItem.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-white/8",
                    boardItem.id === currentBoardId && "bg-[#0c66e4]/20 text-[#9ac2ff]",
                  )}
                >
                  <span className="truncate text-sm font-medium">
                    {boardItem.title}
                  </span>
                  <span className="text-xs text-white/56">
                    {boardItem._count?.lists ?? 0} lists
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
