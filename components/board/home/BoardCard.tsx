"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent } from "react";
import { BOARD_PREVIEW_GRADIENTS } from "@/components/board/workspace/constants";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface BoardCardData {
  id: string;
  title: string;
  backgroundColor: string;
  backgroundImageUrl: string | null;
  isStarred: boolean;
  _count: {
    lists: number;
  };
}

interface BoardCardProps {
  board: BoardCardData;
  cardHeightClassName?: string;
  showListsCount?: boolean;
}

function isUpdateSuccess(
  payload: unknown,
): payload is ApiResponse<{ id: string }> & { success: true } {
  return (
    !!payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: unknown }).success === true
  );
}

export function BoardCard({
  board,
  cardHeightClassName = "h-[100px]",
  showListsCount = false,
}: BoardCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isStarred, setIsStarred] = useState(board.isStarred);

  const handleToggleStar = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isPending) return;

    const nextStarState = !isStarred;
    setIsStarred(nextStarState);

    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: nextStarState }),
      });

      const payload = (await response.json()) as unknown;

      if (!response.ok || !isUpdateSuccess(payload)) {
        throw new Error("Failed to update board star status");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setIsStarred(!nextStarState);
    }
  };

  return (
    <Link
      href={`/b/${board.id}`}
      className={cn(
        "group relative rounded-lg p-3 hover:shadow-card-hover transition-shadow overflow-hidden block",
        cardHeightClassName,
      )}
      style={{
        background: board.backgroundImageUrl
          ? `center / cover no-repeat url("${board.backgroundImageUrl}")`
          : (BOARD_PREVIEW_GRADIENTS[board.backgroundColor] ??
            BOARD_PREVIEW_GRADIENTS.ocean),
        color:
          board.backgroundColor === "snow"
            ? "var(--color-on-surface)"
            : "var(--color-on-primary)",
      }}
    >
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex h-full flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-semibold text-base leading-snug drop-shadow-sm",
              showListsCount ? "line-clamp-2" : "truncate",
            )}
          >
            {board.title}
          </h3>

          <button
            type="button"
            onClick={handleToggleStar}
            aria-label={isStarred ? "Unstar board" : "Star board"}
            className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all",
              isStarred
                ? "opacity-100 text-[#f5cd47]"
                : "opacity-0 text-white/92 group-hover:opacity-100",
              "hover:bg-black/20",
            )}
          >
            <Star
              className={cn(
                "h-4 w-4",
                isStarred ? "fill-[#f5cd47]" : "fill-transparent",
              )}
            />
          </button>
        </div>

        {showListsCount ? (
          <div className="mt-auto">
            <span className="text-[11px] uppercase tracking-wider font-bold opacity-80 backdrop-blur-sm px-1.5 py-0.5 rounded-sm bg-white/20">
              {board._count.lists} lists
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
