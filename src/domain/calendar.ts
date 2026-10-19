import { formatInTimeZone } from "date-fns-tz";
import { conflict, localDateTime, type Busy } from "./rules";
function add(day: string, n: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function weekDays(day: string) {
  const weekday = new Date(day + "T12:00:00Z").getUTCDay();
  const start = add(day, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => add(start, i));
}
export function calendarCells(day: string) {
  const first = day.slice(0, 7) + "-01";
  const d = new Date(first + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  const last = d.toISOString().slice(0, 10);
  const start = weekDays(first)[0]!;
  const end = weekDays(last)[6]!;
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  return Array.from({ length: days }, (_, i) => add(start, i));
}
export type TimelineRow =
  | { kind: "appointment"; id: string; minute: number; startsAt: string }
  | { kind: "free"; id: string; minute: number; startsAt: string };
const boundaries = new Map<string, number>();
// Locate the first instant of a civil day. Some IANA transitions remove
// midnight (or an entire date), so constructing 00:00 is not reliable.
function dayBoundary(day: string, zone: string) {
  const key = zone + day;
  const cached = boundaries.get(key);
  if (cached !== undefined) return cached;
  const center = Date.parse(day + "T00:00:00Z");
  let low = center - 2 * 86400000,
    high = center + 2 * 86400000;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (formatInTimeZone(middle, zone, "yyyy-MM-dd") < day) low = middle + 1;
    else high = middle;
  }
  if (boundaries.size >= 64) boundaries.delete(boundaries.keys().next().value!);
  boundaries.set(key, low);
  return low;
}
export function timelineRows(
  day: string,
  appointments: Busy[],
  zone: string,
): TimelineRow[] {
  const start = dayBoundary(day, zone),
    end = dayBoundary(add(day, 1), zone);
  if (start === end) return [];
  const rows: TimelineRow[] = appointments
    .filter(
      (a) =>
        !a.deletedAt &&
        Date.parse(a.startsAt) < end &&
        Date.parse(a.startsAt) + a.duration * 60000 > start,
    )
    .map((a) => ({
      kind: "appointment",
      id: a.id!,
      startsAt: a.startsAt,
      minute:
        Date.parse(a.startsAt) < start
          ? 0
          : Number(formatInTimeZone(a.startsAt, zone, "H")) * 60 +
            Number(formatInTimeZone(a.startsAt, zone, "m")),
    }));
  for (let hour = 8; hour < 21; hour++) {
    let startsAt: string;
    try {
      startsAt = localDateTime(
        day,
        `${String(hour).padStart(2, "0")}:00`,
        zone,
      );
    } catch {
      continue;
    }
    if (!conflict(startsAt, 30, appointments))
      rows.push({
        kind: "free",
        id: `free-${day}-${hour}`,
        minute: hour * 60,
        startsAt,
      });
  }
  return rows.sort(
    (a, b) => a.minute - b.minute || (a.kind === "appointment" ? -1 : 1),
  );
}
