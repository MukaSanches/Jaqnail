import { formatInTimeZone } from "date-fns-tz";
import type { Preferences } from "../../domain/models";
import { zone } from "../../app/context";
export function dayKey(iso: string | Date) {
  return formatInTimeZone(iso, zone(), "yyyy-MM-dd");
}
export function dateLabel(iso: string | Date, p: Preferences) {
  return formatInTimeZone(
    iso,
    zone(),
    p.dateFormat === "DMY"
      ? "dd/MM/yyyy"
      : p.dateFormat === "MDY"
        ? "MM/dd/yyyy"
        : "yyyy-MM-dd",
  );
}
export function timeLabel(iso: string | Date, p: Preferences) {
  return new Intl.DateTimeFormat(p.lang, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !p.hour24,
  }).format(new Date(iso));
}
export function nextDay(day: string, n: number) {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
