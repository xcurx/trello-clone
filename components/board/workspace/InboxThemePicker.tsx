"use client";

import { Check } from "lucide-react";
import {
  INBOX_THEME_OPTIONS,
  resolveInboxThemeGradient,
} from "@/components/board/workspace/constants";
import { cn } from "@/lib/utils";
import type { InboxThemeKey } from "@/types/board-workspace";

interface InboxThemePickerProps {
  activeTheme: InboxThemeKey;
  onThemeChange: (theme: InboxThemeKey) => void;
}

export function InboxThemePicker({
  activeTheme,
  onThemeChange,
}: InboxThemePickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/56">
        Inbox colors
      </p>

      <div className="grid grid-cols-4 gap-2">
        {INBOX_THEME_OPTIONS.map((themeOption) => {
          const isSelected = activeTheme === themeOption.key;

          return (
            <button
              key={themeOption.key}
              type="button"
              onClick={() => onThemeChange(themeOption.key)}
              className={cn(
                "relative overflow-hidden rounded-md border border-white/16 transition-transform hover:scale-[1.02]",
                isSelected && "ring-2 ring-white/75 ring-offset-1 ring-offset-[#2b2e38]",
              )}
              aria-label={`Set inbox theme to ${themeOption.label}`}
              title={themeOption.label}
            >
              <div
                className="h-11 w-full"
                style={{ background: resolveInboxThemeGradient(themeOption.key) }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="inline-flex h-full w-full items-center justify-center text-[14px] leading-none"
                  aria-hidden="true"
                >
                  {themeOption.emoji}
                </span>
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
  );
}
