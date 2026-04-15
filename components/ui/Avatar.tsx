import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({
  src,
  alt,
  name = "User",
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-7 h-7 text-xs",
    lg: "w-9 h-9 text-sm",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full font-bold items-center justify-center bg-outline-variant text-on-surface",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || name}
          fill
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span>{initials || "U"}</span>
      )}
    </div>
  );
}
