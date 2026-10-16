import { test } from "node:test";
import assert from "node:assert/strict";
import {
  money,
  cost,
  overlaps,
  slots,
  weeklyDates,
  stockState,
  stats,
  whatsapp,
  csvCell,
  localDateTime,
} from "../domain/rules";
const item = {
  serviceId: "s",
  name: "Manicure",
  priceCents: 7500,
  duration: 30,
  amount: 2,
};
test("money normalizes decimal strings without floating point loss", () => {
  assert.equal(money("123.45"), 12345);
  assert.equal(money("0,29"), 29);
  for (const n of ["NaN", "-1", "1.234", "1e5", ""])
    assert.throws(() => money(n));
});
test("quantity changes totals and duration; discount is clamped", () => {
  assert.deepEqual(cost([item], 2000), {
    subtotalCents: 15000,
    totalCents: 13000,
    duration: 60,
  });
  assert.equal(cost([item], 20000).totalCents, 0);
  assert.throws(() => cost([{ ...item, amount: 0 }], 0));
  assert.throws(() => cost([], 0));
});
test("half-open intervals allow adjacent slots", () => {
  assert.equal(
    overlaps("2026-10-16T10:00Z", 60, "2026-10-16T11:00Z", 30),
    false,
  );
  assert.equal(
    overlaps("2026-10-16T10:00Z", 60, "2026-10-16T10:30Z", 30),
    true,
  );
});
test("suggestions respect business hours and cap at four", () => {
  const r = slots("2026-10-16", 60, [], "UTC");
  assert.equal(r.length, 4);
  assert.equal(r[0], "2026-10-16T08:00:00.000Z");
  assert.equal(slots("2026-10-16", 800, [], "UTC").length, 0);
});
test("recurrence preserves wall clock across DST", () => {
  const r = weeklyDates("2026-03-01T15:00:00Z", 3, "America/New_York");
  assert.equal(r[1], "2026-03-08T14:00:00.000Z");
  assert.equal(r[2], "2026-03-15T14:00:00.000Z");
});
test("nonexistent local time is rejected", () => {
  assert.throws(() => localDateTime("2026-03-08", "02:30", "America/New_York"));
  assert.throws(() => localDateTime("2026-02-30", "10:00", "UTC"));
});
test("stock classifications use text and reject negatives", () => {
  assert.equal(stockState(0, null), "esgotado");
  assert.equal(stockState(2, 2), "baixo");
  assert.equal(stockState(3, null), "normal");
  assert.throws(() => stockState(-1, 0));
});
test("statistics omit cancelled records and count distinct clients", () => {
  const a = {
    startsAt: "2026-01-01T02:00:00Z",
    status: "active",
    totalCents: 12345,
    clientId: "c",
    deletedAt: null,
  } as const;
  assert.deepEqual(
    stats([a, { ...a, status: "cancelled" }], 2025, 12, "America/Sao_Paulo"),
    { count: 1, clients: 1, revenueCents: 12345 },
  );
  assert.equal(stats([a], 2026, 1, "America/Sao_Paulo").count, 0);
});
test("WhatsApp enforces consent and safely encodes messages", () => {
  assert.throws(() => whatsapp("11999999999", "Olá", false));
  assert.match(
    whatsapp("5511999999999", "Olá & até amanhã", true),
    /^https:\/\/wa.me\/5511999999999\?text=Ol%C3%A1/,
  );
  assert.throws(() => whatsapp("abc", "test", true));
});
test("CSV prevents formulas and escapes quotes", () => {
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell('a"b'), '"a""b"');
});
test("suggestions ignore cancelled appointments and own id", () => {
  const busy = {
    id: "self",
    startsAt: "2026-10-16T08:00:00Z",
    duration: 60,
    status: "active",
  };
  assert.equal(
    slots("2026-10-16", 60, [busy], "UTC")[0],
    "2026-10-16T09:00:00.000Z",
  );
  assert.equal(
    slots("2026-10-16", 60, [busy], "UTC", "self")[0],
    "2026-10-16T08:00:00.000Z",
  );
  assert.equal(
    slots("2026-10-16", 60, [{ ...busy, status: "cancelled" }], "UTC")[0],
    "2026-10-16T08:00:00.000Z",
  );
});
