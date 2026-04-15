"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface ResizableSeparatorProps {
  className?: string;
  onResize: (deltaX: number) => void;
}

export function ResizableSeparator({
  className,
  onResize,
}: ResizableSeparatorProps) {
  const lastXRef = useRef(0);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    lastXRef.current = event.clientX;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - lastXRef.current;
      lastXRef.current = moveEvent.clientX;
      onResize(deltaX);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <button
      type="button"
      aria-label="Resize sidebar"
      onPointerDown={handlePointerDown}
      className={cn(
        "group relative hidden w-3 shrink-0 cursor-col-resize touch-none items-stretch justify-center lg:flex",
        className,
      )}
    >
      <div className="w-px rounded-full bg-white/10 transition-colors group-hover:bg-white/30" />
      <div className="absolute inset-y-0 left-1/2 w-7 -translate-x-1/2" />
    </button>
  );
}
