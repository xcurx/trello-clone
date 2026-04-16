"use client";

import { Check } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BOARD_BACKGROUND_OPTIONS,
  BOARD_PREVIEW_GRADIENTS,
} from "@/components/board/workspace/constants";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type { ApiResponse, BoardSummary } from "@/types";

type PopoverSide = "bottom" | "right" | "left" | "top";
type PopoverAlign = "start" | "center" | "end";

interface CreateBoardPopoverProps {
  trigger: ReactNode;
  contentClassName?: string;
  containerClassName?: string;
  triggerClassName?: string;
  side?: PopoverSide;
  align?: PopoverAlign;
}

const DEFAULT_BACKGROUND = "ocean";

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: unknown }).success === false &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }

  return fallback;
}

export function CreateBoardPopover({
  trigger,
  contentClassName,
  containerClassName,
  triggerClassName,
  side = "right",
  align = "center",
}: CreateBoardPopoverProps) {
  const router = useRouter();
  const inputId = useId();

  const [title, setTitle] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canCreate = title.trim().length > 0 && !isCreating;

  const selectedBackground = useMemo(
    () =>
      BOARD_PREVIEW_GRADIENTS[backgroundColor] ?? BOARD_PREVIEW_GRADIENTS.ocean,
    [backgroundColor],
  );

  const handleCreateBoard = async () => {
    if (!canCreate) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          backgroundColor,
        }),
      });

      const payload = (await response.json()) as unknown;

      if (
        !response.ok ||
        !payload ||
        typeof payload !== "object" ||
        !("success" in payload) ||
        (payload as { success?: unknown }).success !== true ||
        !("data" in payload)
      ) {
        throw new Error(getErrorMessage(payload, "Failed to create board"));
      }

      setTitle("");
      const createdBoard = (payload as ApiResponse<BoardSummary> & {
        success: true;
      }).data;
      router.push(`/b/${createdBoard.id}`);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create board",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover
      containerClassName={containerClassName}
      triggerClassName={triggerClassName}
      title="Create board"
      side={side}
      align={align}
      contentClassName={cn(
        "w-[calc(100vw-1.25rem)] max-w-[300px] sm:w-[300px] border border-white/12 bg-[#2b2e38] text-white",
        contentClassName,
      )}
      trigger={trigger}
    >
      <div className="space-y-3">
        <div
          className="h-24 w-full rounded-md border border-white/10"
          style={{ background: selectedBackground }}
        >
          <div className="grid h-full grid-cols-3 gap-2 p-3">
            <div className="rounded-sm bg-white/85" />
            <div className="rounded-sm bg-white/85" />
            <div className="rounded-sm bg-white/85" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-white/78">Background</p>
          <div className="grid grid-cols-4 gap-2">
            {BOARD_BACKGROUND_OPTIONS.map((option) => {
              const isSelected = backgroundColor === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setBackgroundColor(option.key)}
                  className={cn(
                    "relative overflow-hidden rounded-md border border-white/14 transition-transform hover:scale-[1.02]",
                    isSelected &&
                      "ring-2 ring-white/75 ring-offset-1 ring-offset-[#2b2e38]",
                  )}
                  aria-label={`Set board color to ${option.label}`}
                  title={option.label}
                >
                  <div
                    className="h-10 w-full"
                    style={{
                      background:
                        BOARD_PREVIEW_GRADIENTS[option.key] ??
                        BOARD_PREVIEW_GRADIENTS.ocean,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-base">
                    {option.emoji}
                  </div>
                  {isSelected ? (
                    <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/40 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-semibold text-white/78"
          >
            Board title <span className="text-[#ffb4b4]">*</span>
          </label>
          <input
            id={inputId}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreateBoard();
              }
            }}
            placeholder="Enter board title"
            className="h-10 w-full rounded-md border border-white/20 bg-[#272b35] px-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#8fb8ff]"
          />
        </div>

        {createError ? <p className="text-xs text-[#ffb4b4]">{createError}</p> : null}

        <button
          type="button"
          onClick={() => {
            void handleCreateBoard();
          }}
          disabled={!canCreate}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#579dff] px-3 text-sm font-semibold text-[#082145] transition-colors hover:bg-[#85b8ff] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isCreating ? "Creating..." : "Create board"}
        </button>
      </div>
    </Popover>
  );
}