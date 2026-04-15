"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  textClassName?: string;
  inputClassName?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  disabled?: boolean;
}

export function EditableText({
  value,
  onChange,
  className,
  textClassName,
  inputClassName,
  as: Component = "h2",
  disabled = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue.trim() !== value && currentValue.trim() !== "") {
      onChange(currentValue.trim());
    } else {
      setCurrentValue(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setCurrentValue(value);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("relative", className)}>
        <input
          ref={inputRef}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "w-full bg-surface text-on-surface border-2 border-primary rounded-sm px-1 py-0.5 outline-none font-semibold",
            inputClassName
          )}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        "cursor-pointer rounded-sm border-2 border-transparent px-1 py-0.5 transition-colors",
        !disabled && "hover:bg-black/5 dark:hover:bg-white/10",
        className
      )}
    >
      <Component className={cn("truncate font-semibold", textClassName)}>
        {value}
      </Component>
    </div>
  );
}
