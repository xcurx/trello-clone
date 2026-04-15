import type { ListColorKey, ListTone } from "@/types/list-column";

const DEFAULT_LIST_TONES: ListTone[] = [
  {
    shell: "bg-[#5d4b83]/95",
    header: "text-white/92",
  },
  {
    shell: "bg-[#6a5718]/95",
    header: "text-[#ffe9a3]",
  },
  {
    shell: "bg-[#2a6b5f]/95",
    header: "text-[#d0f6eb]",
  },
  {
    shell: "bg-[#1f2329]/95",
    header: "text-white/90",
  },
];

const LIST_COLOR_TONES: Record<ListColorKey, ListTone> = {
  green: {
    shell: "bg-[#2a6b5f]/95",
    header: "text-[#d0f6eb]",
  },
  yellow: {
    shell: "bg-[#6a5718]/95",
    header: "text-[#ffe9a3]",
  },
  orange: {
    shell: "bg-[#7a4a12]/95",
    header: "text-[#ffe0b2]",
  },
  red: {
    shell: "bg-[#6e2d2c]/95",
    header: "text-[#ffd1cc]",
  },
  purple: {
    shell: "bg-[#5d4b83]/95",
    header: "text-white/92",
  },
  blue: {
    shell: "bg-[#2a4f7c]/95",
    header: "text-[#d8e7ff]",
  },
  teal: {
    shell: "bg-[#245f73]/95",
    header: "text-[#d6f1fb]",
  },
  lime: {
    shell: "bg-[#4c6720]/95",
    header: "text-[#ecffcb]",
  },
  pink: {
    shell: "bg-[#6a3a64]/95",
    header: "text-[#ffd9f7]",
  },
  gray: {
    shell: "bg-[#3a414b]/95",
    header: "text-[#edf2f8]",
  },
};

export const LIST_COLOR_OPTIONS: Array<{
  key: ListColorKey;
  swatchClass: string;
}> = [
  { key: "green", swatchClass: "bg-[#1d8c6f]" },
  { key: "yellow", swatchClass: "bg-[#8b6f05]" },
  { key: "orange", swatchClass: "bg-[#b35f00]" },
  { key: "red", swatchClass: "bg-[#bf3b2f]" },
  { key: "purple", swatchClass: "bg-[#7d43a1]" },
  { key: "blue", swatchClass: "bg-[#2563d4]" },
  { key: "teal", swatchClass: "bg-[#2c86a4]" },
  { key: "lime", swatchClass: "bg-[#5b8a2a]" },
  { key: "pink", swatchClass: "bg-[#a44f88]" },
  { key: "gray", swatchClass: "bg-[#7c8088]" },
];

export const resolveListTone = (
  color: string | null | undefined,
  position: number,
) => {
  if (color && color in LIST_COLOR_TONES) {
    return LIST_COLOR_TONES[color as ListColorKey];
  }

  return DEFAULT_LIST_TONES[position % DEFAULT_LIST_TONES.length];
};
