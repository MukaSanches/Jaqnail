import test from "node:test";
import assert from "node:assert/strict";
import { calendarCells, weekDays, timelineRows } from "../domain/calendar";
const busy = {
  id: "a",
  startsAt: "2026-10-19T13:15:00Z",
  duration: 90,
  status: "active",
  deletedAt: null,
};
test("month grid includes complete Monday-first weeks and leap day", () => {
  const cells = calendarCells("2024-02-15");
  assert.equal(cells[0], "2024-01-29");
  assert.ok(cells.includes("2024-02-29"));
  assert.equal(cells.length % 7, 0);
  assert.equal(new Set(cells).size, cells.length);
});
test("week dates cross month and year correctly", () => {
  assert.deepEqual(weekDays("2026-01-01"), [
    "2025-12-29",
    "2025-12-30",
    "2025-12-31",
    "2026-01-01",
    "2026-01-02",
    "2026-01-03",
    "2026-01-04",
  ]);
});
test("timeline respects exact start and blocks quick-add slots inside a booking", () => {
  const rows = timelineRows("2026-10-19", [busy], "America/Sao_Paulo");
  assert.ok(
    rows.some(
      (r) => r.kind === "appointment" && r.id === "a" && r.minute === 615,
    ),
  );
  assert.ok(
    !rows.some(
      (r) => r.kind === "free" && (r.minute === 600 || r.minute === 660),
    ),
  );
  assert.ok(rows.some((r) => r.kind === "free" && r.minute === 720));
});
test("cancelled bookings do not block slots, and events outside business hours remain visible", () => {
  const rows = timelineRows(
    "2026-10-19",
    [
      { ...busy, status: "cancelled" },
      { ...busy, id: "early", startsAt: "2026-10-19T09:00:00Z" },
    ],
    "America/Sao_Paulo",
  );
  assert.ok(rows.some((r) => r.kind === "free" && r.minute === 600));
  assert.ok(rows.some((r) => r.kind === "appointment" && r.minute === 360));
});
test("timeline includes appointments continuing from previous day", () => {
  const rows = timelineRows(
    "2026-10-19",
    [{ ...busy, startsAt: "2026-10-19T02:30:00Z", duration: 120 }],
    "America/Sao_Paulo",
  );
  assert.ok(rows.some((r) => r.kind === "appointment" && r.minute === 0));
});
test("midnight DST transitions and skipped civil days do not crash the timeline", () => {
  assert.doesNotThrow(() =>
    timelineRows("2018-11-03", [], "America/Sao_Paulo"),
  );
  assert.doesNotThrow(() =>
    timelineRows("2018-11-04", [], "America/Sao_Paulo"),
  );
  assert.doesNotThrow(() => timelineRows("2026-03-08", [], "America/Havana"));
  assert.deepEqual(timelineRows("2011-12-30", [], "Pacific/Apia"), []);
});
