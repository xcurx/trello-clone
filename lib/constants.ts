// this is seeded in prisma/seed.ts and used as the active user.
export const DEFAULT_USER_ID = "default-user";

export const LABEL_COLORS = [
  { name: "Green", color: "#61bd4f", textColor: "#1d4a10" },
  { name: "Yellow", color: "#f2d600", textColor: "#533b00" },
  { name: "Orange", color: "#ff9f1a", textColor: "#5c3600" },
  { name: "Red", color: "#eb5a46", textColor: "#5c1a10" },
  { name: "Purple", color: "#c377e0", textColor: "#3b1f4a" },
  { name: "Blue", color: "#0079bf", textColor: "#ffffff" },
  { name: "Sky", color: "#00c2e0", textColor: "#003d4a" },
  { name: "Lime", color: "#51e898", textColor: "#0d3b1f" },
  { name: "Pink", color: "#ff78cb", textColor: "#5c1a3b" },
  { name: "Black", color: "#344563", textColor: "#ffffff" },
] as const;

export const BOARD_BACKGROUNDS = [
  { name: "ocean", value: "linear-gradient(135deg, #0079bf, #00629d)" },
  { name: "sunset", value: "linear-gradient(135deg, #eb5a46, #ff9f1a)" },
  { name: "forest", value: "linear-gradient(135deg, #61bd4f, #0a8043)" },
  { name: "lavender", value: "linear-gradient(135deg, #c377e0, #7c5cbf)" },
  { name: "midnight", value: "linear-gradient(135deg, #344563, #091e42)" },
  { name: "sky", value: "linear-gradient(135deg, #00c2e0, #0079bf)" },
  { name: "berry", value: "linear-gradient(135deg, #ff78cb, #c377e0)" },
  { name: "slate", value: "linear-gradient(135deg, #838c91, #505f79)" },
  { name: "snow", value: "linear-gradient(135deg, #f8f9fd, #e1e2e6)" },
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];
export type BoardBackground = (typeof BOARD_BACKGROUNDS)[number];
