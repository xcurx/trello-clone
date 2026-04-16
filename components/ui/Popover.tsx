"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type PopoverSide = "bottom" | "right" | "left" | "top";
type PopoverAlign = "start" | "center" | "end";

interface PopoverProps {
  trigger: ReactNode;
  title?: string;
  children: ReactNode;
  contentClassName?: string;
  containerClassName?: string;
  triggerClassName?: string;
  side?: PopoverSide;
  align?: PopoverAlign;
}

export function Popover({
  trigger,
  title,
  children,
  contentClassName,
  containerClassName,
  triggerClassName,
  side = "bottom",
  align = "start",
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedSide, setResolvedSide] = useState<PopoverSide>(side);
  const [resolvedAlign, setResolvedAlign] = useState<PopoverAlign>(align);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isOpen) {
      setResolvedSide(side);
      setResolvedAlign(align);
    }
  }, [align, isOpen, side]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const VIEWPORT_MARGIN = 8;

    const updatePlacement = () => {
      const containerElement = containerRef.current;
      const contentElement = contentRef.current;

      if (!containerElement || !contentElement) {
        return;
      }

      const triggerRect = containerElement.getBoundingClientRect();
      const contentRect = contentElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const canPlaceRight =
        triggerRect.right + VIEWPORT_MARGIN + contentRect.width <=
        viewportWidth - VIEWPORT_MARGIN;
      const canPlaceLeft =
        triggerRect.left - VIEWPORT_MARGIN - contentRect.width >=
        VIEWPORT_MARGIN;
      const canPlaceBottom =
        triggerRect.bottom + VIEWPORT_MARGIN + contentRect.height <=
        viewportHeight - VIEWPORT_MARGIN;
      const canPlaceTop =
        triggerRect.top - VIEWPORT_MARGIN - contentRect.height >=
        VIEWPORT_MARGIN;

      const availableRight =
        viewportWidth - VIEWPORT_MARGIN - triggerRect.right - VIEWPORT_MARGIN;
      const availableLeft = triggerRect.left - VIEWPORT_MARGIN - VIEWPORT_MARGIN;
      const availableBottom =
        viewportHeight - VIEWPORT_MARGIN - triggerRect.bottom - VIEWPORT_MARGIN;
      const availableTop = triggerRect.top - VIEWPORT_MARGIN - VIEWPORT_MARGIN;

      let nextSide: PopoverSide = side;

      if (side === "right") {
        if (canPlaceRight) {
          nextSide = "right";
        } else if (canPlaceLeft) {
          nextSide = "left";
        } else if (canPlaceBottom || canPlaceTop) {
          if (canPlaceBottom && canPlaceTop) {
            nextSide = availableBottom >= availableTop ? "bottom" : "top";
          } else {
            nextSide = canPlaceBottom ? "bottom" : "top";
          }
        } else {
          nextSide = availableRight >= availableLeft ? "right" : "left";
        }
      } else if (side === "left") {
        if (canPlaceLeft) {
          nextSide = "left";
        } else if (canPlaceRight) {
          nextSide = "right";
        } else if (canPlaceBottom || canPlaceTop) {
          if (canPlaceBottom && canPlaceTop) {
            nextSide = availableBottom >= availableTop ? "bottom" : "top";
          } else {
            nextSide = canPlaceBottom ? "bottom" : "top";
          }
        } else {
          nextSide = availableLeft >= availableRight ? "left" : "right";
        }
      } else if (side === "bottom") {
        if (canPlaceBottom) {
          nextSide = "bottom";
        } else if (canPlaceTop) {
          nextSide = "top";
        } else if (canPlaceRight || canPlaceLeft) {
          if (canPlaceRight && canPlaceLeft) {
            nextSide = availableRight >= availableLeft ? "right" : "left";
          } else {
            nextSide = canPlaceRight ? "right" : "left";
          }
        } else {
          nextSide = availableBottom >= availableTop ? "bottom" : "top";
        }
      } else if (side === "top") {
        if (canPlaceTop) {
          nextSide = "top";
        } else if (canPlaceBottom) {
          nextSide = "bottom";
        } else if (canPlaceRight || canPlaceLeft) {
          if (canPlaceRight && canPlaceLeft) {
            nextSide = availableRight >= availableLeft ? "right" : "left";
          } else {
            nextSide = canPlaceRight ? "right" : "left";
          }
        } else {
          nextSide = availableTop >= availableBottom ? "top" : "bottom";
        }
      }

      let nextAlign: PopoverAlign = align;

      if (align === "center") {
        if (nextSide === "right" || nextSide === "left") {
          const centeredTop =
            triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
          if (centeredTop < VIEWPORT_MARGIN) {
            nextAlign = "start";
          } else if (
            centeredTop + contentRect.height >
            viewportHeight - VIEWPORT_MARGIN
          ) {
            nextAlign = "end";
          }
        } else {
          const centeredLeft =
            triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
          if (centeredLeft < VIEWPORT_MARGIN) {
            nextAlign = "start";
          } else if (
            centeredLeft + contentRect.width >
            viewportWidth - VIEWPORT_MARGIN
          ) {
            nextAlign = "end";
          }
        }
      }

      setResolvedSide(nextSide);
      setResolvedAlign(nextAlign);
    };

    const rafId = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [align, isOpen, side]);

  let sideClasses = "top-full mt-2";
  if (resolvedSide === "bottom") sideClasses = "top-full mt-2";
  if (resolvedSide === "top") sideClasses = "bottom-full mb-2";
  if (resolvedSide === "right") sideClasses = "left-full ml-2";
  if (resolvedSide === "left") sideClasses = "right-full mr-2";

  let alignClasses = "left-0";

  if (resolvedSide === "bottom" || resolvedSide === "top") {
    if (resolvedAlign === "start") alignClasses = "left-0";
    if (resolvedAlign === "end") alignClasses = "right-0";
    if (resolvedAlign === "center") {
      alignClasses = "left-1/2 -translate-x-1/2";
    }
  } else {
    if (resolvedAlign === "start") alignClasses = "top-0";
    if (resolvedAlign === "end") alignClasses = "bottom-0";
    if (resolvedAlign === "center") {
      alignClasses = "top-1/2 -translate-y-1/2";
    }
  }

  return (
    <div className={cn("relative inline-block", containerClassName)} ref={containerRef}>
      <div className={triggerClassName} onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      
      {isOpen && (
        <div
          ref={contentRef}
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
