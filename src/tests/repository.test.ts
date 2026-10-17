import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { Repository, type Sqlite } from "../data/repository";
import { parseBackup, serializeBackup } from "../domain/backup";
let sequence = 0;
export function createRepo(path = ":memory:") {
  const raw = new DatabaseSync(path);
  const db: Sqlite = {
    execSync: (s) => raw.exec(s),
    runSync: (s, ...p) => raw.prepare(s).run(...p),
    getAllSync: <T>(s: string, ...p: (string | number | null)[]) =>
      raw.prepare(s).all(...p) as T[],
    withTransactionSync: (fn) => {
      raw.exec("BEGIN IMMEDIATE");
      try {
        fn();
        raw.exec("COMMIT");
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { repo: new Repository(db, () => `id-${++sequence}`), raw };
}
function setup() {
  const { repo, raw } = createRepo();
  const c = repo.saveCatalog("clients", {
    name: "Maria Silva",
    phone: "5511999999999",
    notes: "",
    consent: true,
  });
  const s = repo.saveCatalog("services", {
    name: "Manicure",
    priceCents: 7500,
    duration: 60,
    notes: "",
  });
  const draft = {
    clientId: c.id,
    services: [
      {
        serviceId: s.id,
        name: s.name,
        priceCents: s.priceCents,
        duration: s.duration,
        amount: 1,
      },
    ],
    startsAt: "2026-10-16T10:00:00Z",
    timezone: "UTC",
    discountCents: 0,
    payment: "pix" as const,
    notes: "",
  };
  return { repo, raw, c, s, draft };
}
test("migrations are idempotent, CRUD validates, soft delete preserves history", () => {
  const { repo, raw, c, draft } = setup();
  const [a] = repo.saveAppointment(draft);
  repo.saveCatalog("clients", { ...c, name: "Maria Nova" });
  assert.equal(repo.list("appointments")[0]?.clientName, "Maria Silva");
  repo.remove("clients", c.id);
  assert.equal(repo.list("clients").length, 0);
  assert.equal(repo.list("appointments")[0]?.id, a?.id);
  repo.restore("clients", c.id);
  assert.equal(repo.list("clients").length, 1);
  new Repository(repo.db, () => "fresh");
  assert.equal(raw.prepare("PRAGMA user_version").get()?.user_version, 1);
  assert.throws(() =>
    repo.saveCatalog("clients", {
      name: " ",
      phone: "",
      notes: "",
      consent: false,
    }),
  );
});
test("conflicts rollback a whole repeated series; contiguous appointment works", () => {
  const { repo, draft } = setup();
  repo.saveAppointment({ ...draft, startsAt: "2026-10-23T10:00:00Z" });
  assert.throws(() => repo.saveAppointment(draft, 3), /Conflito/);
  assert.equal(repo.list("appointments").length, 1);
  repo.saveAppointment({ ...draft, startsAt: "2026-10-23T11:00:00Z" });
  assert.equal(repo.list("appointments").length, 2);
});
test("edit ignores itself; reactivation rechecks conflicts", () => {
  const { repo, draft } = setup();
  const a = repo.saveAppointment(draft)[0]!;
  repo.saveAppointment({ ...draft, id: a.id });
  repo.setStatus(a.id, "cancelled");
  repo.saveAppointment(draft);
  assert.throws(() => repo.setStatus(a.id, "active"), /Conflito/);
});
test("stock changes persist and negative adjustment fails", () => {
  const { repo } = setup();
  const m = repo.saveCatalog("materials", {
    name: "Lixa",
    stock: 1,
    minStock: 2,
    notes: "",
  });
  repo.adjustStock(m.id, -1);
  assert.equal(repo.list("materials")[0]?.stock, 0);
  assert.throws(() => repo.adjustStock(m.id, -1));
});
test("backup roundtrip, preferences and snapshot data preserved", () => {
  const { repo, draft } = setup();
  repo.saveAppointment(draft, 2);
  repo.setPreferences({ theme: "dark", onboarded: true });
  const text = serializeBackup(repo.snapshot());
  const { repo: target } = createRepo();
  target.importSnapshot(parseBackup(text));
  assert.deepEqual(target.snapshot(), repo.snapshot());
});
test("bad schema, oversized files and orphans rejected before any replacement", () => {
  const { repo, draft } = setup();
  repo.saveAppointment(draft);
  const s = repo.snapshot();
  assert.throws(() => parseBackup("{"));
  assert.throws(() => parseBackup(" ".repeat(10 * 1024 * 1024 + 1)));
  assert.throws(() => repo.importSnapshot({ ...s, clients: [] }));
  assert.deepEqual(repo.snapshot(), s);
  assert.throws(() =>
    parseBackup(JSON.stringify({ format: "jaqnail", version: 999, data: s })),
  );
});
test("import failure rolls back all tables", () => {
  const { repo, raw } = setup();
  const original = repo.snapshot();
  raw.exec(
    "CREATE TRIGGER fail_restore BEFORE INSERT ON clients BEGIN SELECT RAISE(ABORT,'disk failure'); END",
  );
  assert.throws(() => repo.importSnapshot(original));
  assert.deepEqual(repo.snapshot(), original);
});
test("restore cannot resurrect an overlapping appointment", () => {
  const { repo, draft } = setup();
  const a = repo.saveAppointment(draft)[0]!;
  repo.remove("appointments", a.id);
  repo.saveAppointment(draft);
  assert.throws(() => repo.restore("appointments", a.id), /Conflito/);
});
test("persistent file reopens without losing records", () => {
  const file = `/tmp/jaqnail-test-${process.pid}-${Date.now()}.sqlite`;
  const { repo, raw } = createRepo(file);
  repo.saveCatalog("clients", {
    name: "Persistente",
    phone: "",
    notes: "",
    consent: false,
  });
  raw.close();
  const next = createRepo(file);
  assert.equal(next.repo.list("clients")[0]?.name, "Persistente");
  next.raw.close();
});
test("cancel future occurrences, edit one occurrence without touching history", () => {
  const { repo, draft } = setup();
  const series = repo.saveAppointment(draft, 3);
  repo.setStatus(series[1]!.id, "cancelled", true);
  assert.deepEqual(
    repo.list("appointments").map((a) => a.status),
    ["active", "cancelled", "cancelled"],
  );
  repo.saveAppointment({ ...draft, id: series[0]!.id, notes: "Editado" });
  assert.equal(repo.list("appointments")[1]?.notes, "");
});
test("recovery restores preimport state and deletion erases recovery too", () => {
  const { repo } = setup();
  const before = repo.snapshot();
  const blank = createRepo().repo.snapshot();
  repo.importSnapshot(blank);
  assert.equal(repo.list("clients").length, 0);
  repo.recover();
  assert.deepEqual(repo.snapshot(), before);
  repo.importSnapshot(blank);
  repo.eraseAll();
  assert.throws(() => repo.recover());
  assert.equal(repo.list("clients", true).length, 0);
});
test("catalog edits retain original service price and duration in appointments", () => {
  const { repo, draft, s } = setup();
  repo.saveAppointment(draft);
  repo.saveCatalog("services", { ...s, priceCents: 9000, duration: 90 });
  repo.remove("services", s.id);
  const a = repo.list("appointments")[0]!;
  assert.equal(a.totalCents, 7500);
  assert.equal(a.duration, 60);
  assert.equal(a.services[0]?.name, "Manicure");
});
test("foreign key integrity is enforced in SQLite itself", () => {
  const { raw } = setup();
  assert.throws(
    () =>
      raw
        .prepare("INSERT INTO appointments VALUES(?,?,?,?,?)")
        .run("orphan", "missing", "2026-01-01", "active", "{}"),
    /FOREIGN KEY/,
  );
});
test("legacy decimal totals normalize into cents", async () => {
  const { importLegacy } = await import("../domain/backup");
  const time = "2026-10-16T10:00:00Z";
  const common = { createdAt: time, updatedAt: time };
  const c = { ...common, id: "c", name: "Cliente", phone: "" };
  const s = {
    ...common,
    id: "s",
    name: "Serviço",
    price: 123.45,
    duration: 60,
  };
  const snapshot = importLegacy({
    version: 1,
    data: {
      clients: [c],
      services: [s],
      materials: [],
      schedules: [
        {
          ...common,
          id: "a",
          client: c,
          services: [{ ...s, serviceId: "s", amount: 1 }],
          appointmentDate: time,
          total: "123.45",
          discount: 0,
        },
      ],
    },
  });
  assert.equal(snapshot.appointments[0]?.totalCents, 12345);
});
test("backup refuses active overlaps instead of importing an invalid agenda", () => {
  const { repo, draft } = setup();
  const a = repo.saveAppointment(draft)[0]!;
  const data = repo.snapshot();
  data.appointments.push({ ...a, id: "conflicting-import" });
  assert.throws(() => repo.importSnapshot(data), /conflit/i);
  assert.equal(repo.list("appointments").length, 1);
});
test("export never creates a backup larger than the import limit", () => {
  const { repo, c } = setup();
  const data = repo.snapshot();
  data.clients = Array.from({ length: 5000 }, (_, i) => ({
    ...c,
    id: "large-" + i,
    notes: "x".repeat(2000),
  }));
  assert.throws(() => serializeBackup(data), /10 MiB/);
});
test("backup size limit counts UTF-8 bytes rather than UTF-16 characters", () => {
  const text = '"' + "é".repeat(6 * 1024 * 1024) + '"';
  assert.throws(() => parseBackup(text), /10 MiB/);
});
