import type {
  BoardBackgroundKey,
  BoardBackgroundOption,
} from "@/types/board-workspace";

export const RAIL_MIN_WIDTH = 240;
export const RAIL_MAX_WIDTH = 420;

export const BOARD_PREVIEW_GRADIENTS: Record<string, string> = {
  ocean: "linear-gradient(135deg, #0079bf, #00629d)",
  sunset: "linear-gradient(135deg, #eb5a46, #ff9f1a)",
  forest: "linear-gradient(135deg, #61bd4f, #0a8043)",
  lavender: "linear-gradient(135deg, #c377e0, #7c5cbf)",
  midnight: "linear-gradient(135deg, #344563, #091e42)",
  sky: "linear-gradient(135deg, #00c2e0, #0079bf)",
  berry: "linear-gradient(135deg, #ff78cb, #c377e0)",
  slate: "linear-gradient(135deg, #838c91, #505f79)",
  snow: "linear-gradient(135deg, #f8f9fd, #e1e2e6)",
};

export const BOARD_CANVAS_GRADIENTS: Record<BoardBackgroundKey, string> = {
  ocean: "linear-gradient(180deg, #5a437f 0%, #754992 52%, #965687 100%)",
  sunset: "linear-gradient(180deg, #5b3b31 0%, #824b4a 52%, #9e5f72 100%)",
  forest: "linear-gradient(180deg, #1f4f47 0%, #2d5f58 52%, #4a6d64 100%)",
  lavender:
    "linear-gradient(180deg, #67458d 0%, #7d4e99 48%, #96568c 100%)",
  midnight:
    "linear-gradient(180deg, #253252 0%, #354565 52%, #4d5d78 100%)",
  sky: "linear-gradient(180deg, #204a67 0%, #355f84 52%, #536b98 100%)",
  berry: "linear-gradient(180deg, #693760 0%, #874b77 52%, #a76184 100%)",
  slate: "linear-gradient(180deg, #38434e 0%, #495565 52%, #5e6278 100%)",
  snow: "linear-gradient(180deg, #40465a 0%, #525a72 52%, #6e6784 100%)",
};

export const BOARD_BACKGROUND_OPTIONS: BoardBackgroundOption[] = [
  { key: "midnight", emoji: "🪐", label: "Midnight" },
  { key: "sky", emoji: "❄️", label: "Sky" },
  { key: "ocean", emoji: "🌊", label: "Ocean" },
  { key: "berry", emoji: "🔮", label: "Berry" },
  { key: "lavender", emoji: "🌈", label: "Lavender" },
  { key: "sunset", emoji: "🍑", label: "Sunset" },
  { key: "snow", emoji: "🌸", label: "Snow" },
  { key: "forest", emoji: "🌍", label: "Forest" },
  { key: "slate", emoji: "👽", label: "Slate" },
];

export const DUE_DATE_FILTER_OPTIONS = [
  { value: "none", label: "No dates" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due in the next day" },
  { value: "week", label: "Due in the next week" },
] as const;

export const resolveBoardBackgroundGradient = (backgroundColor: string) => {
  const key = backgroundColor as BoardBackgroundKey;
  return BOARD_CANVAS_GRADIENTS[key] ?? BOARD_CANVAS_GRADIENTS.ocean;
};
