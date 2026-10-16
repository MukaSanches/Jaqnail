import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { lineSchema, type Line } from "./models";
export function money(value: string | number): number {
  const text = String(value).trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text))
    throw new Error("Valor monetário inválido; use até duas casas decimais.");
  const [whole = "0", fraction = ""] = text.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result > 100_000_000)
    throw new Error("Valor monetário excede o limite.");
  return result;
}
export function cost(lines: Line[], discountCents: number) {
  if (!lines.length) throw new Error("Escolha pelo menos um serviço.");
  if (!Number.isSafeInteger(discountCents) || discountCents < 0)
    throw new Error("Desconto inválido.");
  let subtotalCents = 0,
    duration = 0;
  for (const raw of lines) {
    const l = lineSchema.parse(raw);
    subtotalCents += l.priceCents * l.amount;
    duration += l.duration * l.amount;
  }
  if (subtotalCents > 100_000_000 || duration > 1440)
    throw new Error("Total ou duração excede o limite.");
  return {
    subtotalCents,
    totalCents: Math.max(0, subtotalCents - discountCents),
    duration,
  };
}
export function overlaps(a: string, ad: number, b: string, bd: number) {
  const aa = Date.parse(a),
    bb = Date.parse(b);
  return aa < bb + bd * 60000 && bb < aa + ad * 60000;
}
export function localDateTime(day: string, time: string, zone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error("Data ou hora inválida.");
  const text = `${day}T${time}:00`;
  const date = fromZonedTime(text, zone);
  if (
    !Number.isFinite(date.getTime()) ||
    formatInTimeZone(date, zone, "yyyy-MM-dd'T'HH:mm:ss") !== text
  )
    throw new Error("Data/hora inexistente neste fuso.");
  return date.toISOString();
}
export function weeklyDates(start: string, count: number, zone: string) {
  if (!Number.isInteger(count) || count < 1 || count > 52)
    throw new Error("Use de 1 a 52 ocorrências.");
  const wall = formatInTimeZone(start, zone, "yyyy-MM-dd'T'HH:mm");
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(wall + "Z");
    d.setUTCDate(d.getUTCDate() + i * 7);
    result.push(
      localDateTime(d.toISOString().slice(0, 10), wall.slice(11, 16), zone),
    );
  }
  return result;
}
export type Busy = {
  id?: string;
  startsAt: string;
  duration: number;
  status: string;
  deletedAt?: string | null;
};
export function conflict(
  start: string,
  duration: number,
  existing: Busy[],
  ignore?: string,
) {
  return existing.find(
    (a) =>
      a.status === "active" &&
      !a.deletedAt &&
      a.id !== ignore &&
      overlaps(start, duration, a.startsAt, a.duration),
  );
}
export function slots(
  day: string,
  duration: number,
  existing: Busy[],
  zone: string,
  ignore?: string,
) {
  const r: string[] = [];
  for (let min = 480; min + duration <= 1260; min += 30) {
    const start = localDateTime(
      day,
      `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`,
      zone,
    );
    if (!conflict(start, duration, existing, ignore)) r.push(start);
    if (r.length === 4) break;
  }
  return r;
}
export function stockState(stock: number, min: number | null) {
  if (!Number.isFinite(stock) || stock < 0)
    throw new Error("Estoque inválido.");
  return stock === 0
    ? "esgotado"
    : min !== null && stock <= min
      ? "baixo"
      : "normal";
}
export function stats(
  items: {
    startsAt: string;
    status: string;
    totalCents: number;
    clientId: string;
    deletedAt?: string | null;
  }[],
  year: number,
  month: number | null,
  zone: string,
) {
  const filtered = items.filter((a) => {
    const p = formatInTimeZone(a.startsAt, zone, "yyyy-MM");
    return (
      a.status === "active" &&
      !a.deletedAt &&
      p.startsWith(String(year)) &&
      (month === null || Number(p.slice(5)) === month)
    );
  });
  return {
    count: filtered.length,
    clients: new Set(filtered.map((a) => a.clientId)).size,
    revenueCents: filtered.reduce((s, a) => s + a.totalCents, 0),
  };
}
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
export function whatsapp(phone: string, message: string, consent: boolean) {
  if (!consent)
    throw new Error(
      "Registre o consentimento do cliente antes de abrir o WhatsApp.",
    );
  const n = phone.replace(/\D/g, "");
  if (!/^[1-9]\d{9,14}$/.test(n))
    throw new Error("Informe o telefone com código do país (ex.: 55).");
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
