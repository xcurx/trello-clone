"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, children, className }: DialogProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMounted, isOpen]);

  if (!isOpen || !isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-full items-start justify-center overflow-y-auto pb-10 pt-[60px] sm:pt-[100px]">
        <div
          role="dialog"
          className={cn(
            "relative mx-4 w-full max-w-[768px] rounded-xl bg-surface shadow-modal animate-in fade-in zoom-in-95 duration-200 sm:mx-auto",
            className,
          )}
        >
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <X className="h-5 w-5" />
          </button>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
