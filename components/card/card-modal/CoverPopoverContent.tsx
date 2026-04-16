"use client";

import { Check, Upload } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { CARD_COVER_COLOR_OPTIONS } from "./constants";

interface CoverPopoverContentProps {
  selectedColor: string | null;
  selectedImageUrl: string | null;
  isUploadingImage: boolean;
  onSelectColor: (color: string) => void;
  onUploadImage: (file: File) => void | Promise<void>;
  onRemoveCover: () => void;
}

export function CoverPopoverContent({
  selectedColor,
  selectedImageUrl,
  isUploadingImage,
  onSelectColor,
  onUploadImage,
  onRemoveCover,
}: CoverPopoverContentProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void onUploadImage(file);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/56">
          Preview
        </p>
        <div className="rounded-lg border border-white/10 bg-[#242833] p-2">
          {selectedImageUrl ? (
            <img
              src={selectedImageUrl}
              alt="Cover preview"
              className="h-16 w-full rounded-md object-cover"
            />
          ) : (
            <div
              className="h-10 rounded-md"
              style={{ backgroundColor: selectedColor ?? "#2d313b" }}
            />
          )}
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-4/5 rounded bg-white/30" />
            <div className="h-1.5 w-3/5 rounded bg-white/18" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/56">
          Image
        </p>
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          disabled={isUploadingImage}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-white/8 px-3 text-sm font-medium text-white/84 transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Upload className="h-4 w-4" />
          {isUploadingImage ? "Uploading image..." : "Upload image"}
        </button>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleImageSelection}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/56">
          Colors
        </p>
        <div className="grid grid-cols-5 gap-2">
          {CARD_COVER_COLOR_OPTIONS.map((option) => {
            const isSelected = selectedColor === option.value;

            return (
              <button
                key={option.name}
                type="button"
                onClick={() => onSelectColor(option.value)}
                className={cn(
                  "relative h-8 rounded-md transition-transform hover:scale-[1.03]",
                  isSelected && "ring-2 ring-white/80 ring-offset-1 ring-offset-[#2b2e38]",
                )}
                style={{ backgroundColor: option.value }}
                aria-label={`Set cover color to ${option.name}`}
              >
                {isSelected ? (
                  <Check className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemoveCover}
        disabled={!selectedColor && !selectedImageUrl}
        className="inline-flex h-8 w-full items-center justify-center rounded-md bg-white/8 px-3 text-sm font-medium text-white/84 transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-55"
      >
        Remove cover
      </button>
    </div>
  );
}
