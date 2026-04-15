"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface PopoverProps {
  trigger: ReactNode;
  title?: string;
  children: ReactNode;
  contentClassName?: string;
  side?: "bottom" | "right" | "left" | "top";
  align?: "start" | "center" | "end";
}

export function Popover({
  trigger,
  title,
  children,
  contentClassName,
  side = "bottom",
  align = "start",
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  let sideClasses = "top-full mt-2";
  if (side === "bottom") sideClasses = "top-full mt-2";
  if (side === "top") sideClasses = "bottom-full mb-2";
  if (side === "right") sideClasses = "left-full ml-2 top-0";
  if (side === "left") sideClasses = "right-full mr-2 top-0";

  let alignClasses = "left-0";
  if (align === "start") alignClasses = "left-0";
  if (align === "end") alignClasses = "right-0";
  if (align === "center" && (side === "bottom" || side === "top")) alignClasses = "left-1/2 -translate-x-1/2";

  return (
    <div className="relative w-full" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-72 bg-surface rounded-md shadow-popover border border-[#091e420f] overflow-hidden animate-in fade-in zoom-in-95 duration-150",
            sideClasses,
            alignClasses,
            contentClassName
          )}
        >
          {title && (
            <div className="relative flex items-center justify-center p-3 border-b border-[#091e420f]">
              <span className="text-sm font-semibold text-on-surface-variant flex-1 text-center truncate px-6">
                {title}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-2 top-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-sm p-1 transition-colors"
                aria-label="Close popover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="p-3">{children}</div>
        </div>
      )}
    </div>
  );
}
