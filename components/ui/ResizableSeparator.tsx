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
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
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
        "group relative hidden w-px shrink-0 cursor-col-resize touch-none items-stretch justify-center lg:flex",
        className,
      )}
    >
      <div className="w-px rounded-full bg-white/14 transition-colors group-hover:bg-white/38" />
      <div className="absolute inset-y-0 -left-2 -right-2" />
    </button>
  );
}
