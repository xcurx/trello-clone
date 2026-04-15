"use client";

import { useEffect, useRef } from "react";

function shouldStartDragScroll(target: Element) {
  if (target.closest("[data-pan-block='true']")) return false;

  if (
    target.closest(
      "button, input, textarea, select, option, a, [role='button'], [contenteditable='true']",
    )
  ) {
    return false;
  }

  return true;
}

export function useHorizontalDragScroll<T extends HTMLElement>(enabled = true) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let previousCursor = "";
    const previousUserSelect = document.body.style.userSelect;

    const stopDragging = () => {
      if (!isDragging) return;

      isDragging = false;
      container.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;

      const target =
        event.target instanceof Element
          ? event.target
          : event.target instanceof Node
            ? event.target.parentElement
            : null;

      if (!target) return;
      if (!shouldStartDragScroll(target)) return;

      isDragging = true;
      startX = event.clientX;
      startScrollLeft = container.scrollLeft;

      previousCursor = container.style.cursor;
      container.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      event.preventDefault();
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = event.clientX - startX;
      container.scrollLeft = startScrollLeft - deltaX;
      event.preventDefault();
    };

    const handleMouseUp = () => {
      stopDragging();
    };

    const handleWindowBlur = () => {
      stopDragging();
    };

    container.style.cursor = "grab";

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", handleWindowBlur);

      stopDragging();
      container.style.cursor = "";
    };
  }, [enabled]);

  return containerRef;
}
