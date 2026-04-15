import { formatDistanceToNow } from "date-fns";

export function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
}

export function toRelativeActivityTime(value: string) {
  const result = formatDistanceToNow(new Date(value), { addSuffix: true });
  return result === "less than a minute ago" ? "just now" : result;
}
