"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BOARD_PREVIEW_GRADIENTS } from "@/components/board/workspace/constants";
import type { ApiResponse, BoardSummary } from "@/types";

export function NavbarBoardSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BoardSummary[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (!isOpen) {
      return;
    }

    if (!normalizedQuery) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/boards?query=${encodeURIComponent(normalizedQuery)}&limit=8`,
          {
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as ApiResponse<BoardSummary[]>;

        if (!response.ok || !payload.success) {
          setResults([]);
          return;
        }

        setResults(payload.data);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, query]);

  const navigateToBoard = (boardId: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/b/${boardId}`);
  };

  return (
    <div className="relative hidden flex-1 md:block" ref={containerRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
      <input
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            return;
          }

          if (event.key === "Enter" && results.length > 0) {
            event.preventDefault();
            navigateToBoard(results[0].id);
          }
        }}
        placeholder="Search boards"
        className="h-8 w-full rounded-md border border-white/16 bg-white/6 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/45 focus:border-white/26 focus:bg-white/10"
        aria-label="Search boards"
      />

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-white/12 bg-[#2b2e38] shadow-popover">
          {query.trim().length === 0 ? (
            <p className="px-3 py-2 text-sm text-white/60">Type to search boards</p>
          ) : isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/72">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching boards...
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-white/60">No boards found</p>
          ) : (
            <div className="max-h-72 overflow-y-auto py-1">
              {results.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => navigateToBoard(board.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/8"
                >
                  <span
                    className="h-6 w-9 rounded-sm border border-white/20"
                    style={{
                      background:
                        BOARD_PREVIEW_GRADIENTS[board.backgroundColor] ??
                        BOARD_PREVIEW_GRADIENTS.ocean,
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
                    {board.title}
                  </span>
                  <span className="text-xs text-white/55">{board._count.lists} lists</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}