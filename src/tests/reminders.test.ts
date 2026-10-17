import { test } from "node:test";
import assert from "node:assert/strict";
import { reminderPlan } from "../domain/reminders";
import { preferencesSchema } from "../domain/models";
const anchor = "2026-10-01T10:00:00.000Z";
const p = preferencesSchema.parse({
  notifications: true,
  backupDays: 7,
  reminderMinutes: 30,
});
test("first backup reminder is anchored to database creation, not each refresh", () => {
  const a = reminderPlan(
    [],
    p,
    true,
    anchor,
    Date.parse("2026-10-02T10:00:00Z"),
  );
  const b = reminderPlan(
    [],
    p,
    true,
    anchor,
    Date.parse("2026-10-03T10:00:00Z"),
  );
  assert.equal(
    a.get("jaqnail-backup")?.at.toISOString(),
    "2026-10-08T10:00:00.000Z",
  );
  assert.equal(
    a.get("jaqnail-backup")?.fingerprint,
    b.get("jaqnail-backup")?.fingerprint,
  );
});
test("overdue backup keeps a future reminder on the original interval", () => {
  const r = reminderPlan(
    [],
    p,
    true,
    anchor,
    Date.parse("2026-10-09T10:00:00Z"),
  );
  assert.equal(
    r.get("jaqnail-backup")?.at.toISOString(),
    "2026-10-15T10:00:00.000Z",
  );
});
test("denied permission and disabled alerts produce no jobs", () => {
  assert.equal(reminderPlan([], p, false, anchor, 0).size, 0);
  assert.equal(
    reminderPlan([], { ...p, notifications: false }, true, anchor, 0).size,
    0,
  );
});
test("only future active appointments get privacy-preserving notifications", () => {
  const a = {
    id: "a",
    startsAt: "2026-10-02T12:00:00Z",
    updatedAt: anchor,
    status: "active",
    deletedAt: null,
  };
  const r = reminderPlan(
    [
      a,
      { ...a, id: "b", status: "cancelled" },
      { ...a, id: "c", deletedAt: anchor },
    ],
    p,
    true,
    anchor,
    Date.parse("2026-10-02T10:00:00Z"),
  );
  assert.equal(
    r.get("jaqnail-a")?.at.toISOString(),
    "2026-10-02T11:30:00.000Z",
  );
  assert.equal(r.has("jaqnail-b"), false);
  assert.equal(r.has("jaqnail-c"), false);
  assert.equal(
    r.get("jaqnail-a")?.body,
    "Abra o Jaqnail para conferir os detalhes.",
  );
});
