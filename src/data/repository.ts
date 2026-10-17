import {
  clientSchema,
  serviceSchema,
  materialSchema,
  appointmentSchema,
  preferencesSchema,
  snapshotSchema,
  type Appointment,
  type Catalog,
  type Entities,
  type Preferences,
  type Snapshot,
} from "../domain/models";
import { conflict, cost, weeklyDates } from "../domain/rules";
export interface Sqlite {
  execSync(sql: string): void;
  runSync(sql: string, ...params: (string | number | null)[]): unknown;
  getAllSync<T>(sql: string, ...params: (string | number | null)[]): T[];
  withTransactionSync(fn: () => void): void;
}
export type AppointmentDraft = Pick<
  Appointment,
  | "clientId"
  | "services"
  | "startsAt"
  | "timezone"
  | "discountCents"
  | "payment"
  | "notes"
> & { id?: string };
const tables = ["clients", "services", "materials", "appointments"] as const;
const schemas = {
  clients: clientSchema,
  services: serviceSchema,
  materials: materialSchema,
  appointments: appointmentSchema,
};
export class Repository {
  constructor(
    public readonly db: Sqlite,
    private readonly uuid: () => string,
  ) {
    db.execSync(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
    );
    const version =
      db.getAllSync<{ user_version: number }>("PRAGMA user_version")[0]
        ?.user_version ?? 0;
    if (version > 1)
      throw new Error("Banco de uma versão mais recente. Atualize o Jaqnail.");
    if (version === 0)
      db.withTransactionSync(() => {
        db.execSync(`
   CREATE TABLE clients(id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)));
   CREATE TABLE services(id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)));
   CREATE TABLE materials(id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)));
   CREATE TABLE appointments(id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id), starts_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','cancelled')), payload TEXT NOT NULL CHECK(json_valid(payload)));
   CREATE INDEX appointment_date ON appointments(starts_at,status);
   CREATE INDEX appointment_client ON appointments(client_id);
   CREATE TABLE appointment_services(appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE, position INTEGER NOT NULL, service_id TEXT NOT NULL REFERENCES services(id), payload TEXT NOT NULL CHECK(json_valid(payload)),PRIMARY KEY(appointment_id,position));
   CREATE TABLE preferences(id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL);
   CREATE TABLE reminder_jobs(id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL);
   CREATE TABLE backup_history(id TEXT PRIMARY KEY, created_at TEXT NOT NULL, kind TEXT NOT NULL);
   CREATE TABLE recovery_snapshot(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);
   CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
   INSERT INTO schema_migrations VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
   PRAGMA user_version=1;`);
      });
  }
  list<K extends keyof Entities>(
    table: K,
    includeDeleted = false,
  ): Entities[K][] {
    return this.db
      .getAllSync<{ payload: string }>(
        `SELECT payload FROM ${table} ORDER BY rowid`,
      )
      .map((r) => schemas[table].parse(JSON.parse(r.payload)) as Entities[K])
      .filter((r) => includeDeleted || !r.deletedAt);
  }
  get<K extends keyof Entities>(table: K, id: string): Entities[K] | undefined {
    const r = this.db.getAllSync<{ payload: string }>(
      `SELECT payload FROM ${table} WHERE id=?`,
      id,
    )[0];
    return r
      ? (schemas[table].parse(JSON.parse(r.payload)) as Entities[K])
      : undefined;
  }
  private put<K extends keyof Entities>(table: K, value: Entities[K]) {
    const text = JSON.stringify(value);
    if (table === "appointments") {
      const a = value as Appointment;
      this.db.runSync(
        "INSERT INTO appointments(id,client_id,starts_at,status,payload) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id,starts_at=excluded.starts_at,status=excluded.status,payload=excluded.payload",
        a.id,
        a.clientId,
        a.startsAt,
        a.status,
        text,
      );
      this.db.runSync(
        "DELETE FROM appointment_services WHERE appointment_id=?",
        a.id,
      );
      a.services.forEach((s, i) =>
        this.db.runSync(
          "INSERT INTO appointment_services VALUES(?,?,?,?)",
          a.id,
          i,
          s.serviceId,
          JSON.stringify(s),
        ),
      );
    } else
      this.db.runSync(
        `INSERT INTO ${table}(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload`,
        value.id,
        text,
      );
  }
  saveCatalog<K extends Catalog>(
    table: K,
    input: Omit<Entities[K], "id" | "createdAt" | "updatedAt" | "deletedAt"> & {
      id?: string;
    },
  ): Entities[K] {
    const old = input.id ? this.get(table, input.id) : undefined;
    if (input.id && !old) throw new Error("Registro não encontrado.");
    const now = new Date().toISOString();
    const value = schemas[table].parse({
      ...input,
      id: old?.id ?? this.uuid(),
      createdAt: old?.createdAt ?? now,
      updatedAt: now,
      deletedAt: old?.deletedAt ?? null,
    }) as Entities[K];
    this.db.withTransactionSync(() => this.put(table, value));
    return value;
  }
  adjustStock(id: string, delta: number) {
    this.db.withTransactionSync(() => {
      const m = this.get("materials", id);
      if (!m || m.deletedAt) throw new Error("Material não encontrado.");
      const value = materialSchema.parse({
        ...m,
        stock: m.stock + delta,
        updatedAt: new Date().toISOString(),
      });
      this.put("materials", value);
    });
  }
  saveAppointment(draft: AppointmentDraft, count = 1): Appointment[] {
    const saved: Appointment[] = [];
    this.db.withTransactionSync(() => {
      const client = this.get("clients", draft.clientId),
        old = draft.id ? this.get("appointments", draft.id) : undefined;
      if (!client || (client.deletedAt && old?.clientId !== client.id))
        throw new Error("Selecione um cliente ativo.");
      if (draft.id && !old) throw new Error("Agendamento não encontrado.");
      if (old && count !== 1)
        throw new Error(
          "Edite uma ocorrência por vez ou duplique para uma nova série.",
        );
      for (const line of draft.services) {
        const s = this.get("services", line.serviceId);
        if (
          !s ||
          (s.deletedAt && !old?.services.some((x) => x.serviceId === s.id))
        )
          throw new Error(
            "Um serviço foi arquivado. Selecione um serviço ativo.",
          );
      }
      const totals = cost(draft.services, draft.discountCents),
        dates = weeklyDates(draft.startsAt, count, draft.timezone),
        seriesId = old?.seriesId ?? (count > 1 ? this.uuid() : null),
        existing = this.list("appointments");
      for (const startsAt of dates) {
        if (
          conflict(startsAt, totals.duration, [...existing, ...saved], old?.id)
        )
          throw new Error(
            `Conflito de horário em ${startsAt}. Escolha uma sugestão livre.`,
          );
        const now = new Date().toISOString();
        saved.push(
          appointmentSchema.parse({
            ...draft,
            ...totals,
            id: old?.id ?? this.uuid(),
            clientName:
              old?.clientId === client.id ? old.clientName : client.name,
            startsAt,
            seriesId,
            status: old?.status ?? "active",
            createdAt: old?.createdAt ?? now,
            updatedAt: now,
            deletedAt: null,
          }),
        );
      }
      saved.forEach((a) => this.put("appointments", a));
    });
    return saved;
  }
  setStatus(id: string, status: Appointment["status"], series = false) {
    this.db.withTransactionSync(() => {
      const a = this.get("appointments", id);
      if (!a || a.deletedAt) throw new Error("Agendamento não encontrado.");
      const items =
        series && a.seriesId
          ? this.list("appointments").filter(
              (x) => x.seriesId === a.seriesId && x.startsAt >= a.startsAt,
            )
          : [a];
      for (const x of items) {
        if (
          status === "active" &&
          conflict(x.startsAt, x.duration, this.list("appointments"), x.id)
        )
          throw new Error("Conflito ao reativar.");
        this.put("appointments", {
          ...x,
          status,
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }
  remove<K extends keyof Entities>(table: K, id: string) {
    this.db.withTransactionSync(() => {
      const item = this.get(table, id);
      if (!item) throw new Error("Registro não encontrado.");
      this.put(table, {
        ...item,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }
  restore<K extends keyof Entities>(table: K, id: string) {
    this.db.withTransactionSync(() => {
      const item = this.get(table, id);
      if (!item) throw new Error("Registro não encontrado.");
      if (table === "appointments") {
        const a = item as Appointment;
        if (
          a.status === "active" &&
          conflict(a.startsAt, a.duration, this.list("appointments"), id)
        )
          throw new Error("Conflito ao restaurar.");
      }
      this.put(table, {
        ...item,
        deletedAt: null,
        updatedAt: new Date().toISOString(),
      });
    });
  }
  preferences(): Preferences {
    const r = this.db.getAllSync<{ payload: string }>(
      "SELECT payload FROM preferences WHERE id=1",
    )[0];
    return preferencesSchema.parse(r ? JSON.parse(r.payload) : {});
  }
  setPreferences(p: Partial<Preferences>) {
    const value = preferencesSchema.parse({ ...this.preferences(), ...p });
    this.db.runSync(
      "INSERT INTO preferences VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
      JSON.stringify(value),
    );
  }
  snapshot(): Snapshot {
    return {
      clients: this.list("clients", true),
      services: this.list("services", true),
      materials: this.list("materials", true),
      appointments: this.list("appointments", true),
      preferences: this.preferences(),
    };
  }
  importSnapshot(input: Snapshot) {
    const data = validateSnapshot(input);
    this.db.withTransactionSync(() => {
      this.db.runSync(
        "INSERT INTO recovery_snapshot VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
        JSON.stringify(this.snapshot()),
      );
      this.replace(data);
      this.recordBackup("import");
    });
  }
  private replace(data: Snapshot) {
    this.db.execSync(
      "DELETE FROM appointment_services;DELETE FROM appointments;DELETE FROM clients;DELETE FROM services;DELETE FROM materials;DELETE FROM reminder_jobs;",
    );
    for (const t of tables) for (const row of data[t]) this.put(t, row);
    this.setPreferences(data.preferences);
  }
  recover() {
    const row = this.db.getAllSync<{ payload: string }>(
      "SELECT payload FROM recovery_snapshot WHERE id=1",
    )[0];
    if (!row) throw new Error("Nenhuma restauração anterior disponível.");
    const data = validateSnapshot(JSON.parse(row.payload));
    this.db.withTransactionSync(() => {
      this.replace(data);
      this.db.runSync("DELETE FROM recovery_snapshot");
    });
  }
  eraseAll() {
    this.db.withTransactionSync(() => {
      this.replace({
        clients: [],
        services: [],
        materials: [],
        appointments: [],
        preferences: preferencesSchema.parse({}),
      });
      this.db.execSync(
        "DELETE FROM recovery_snapshot;DELETE FROM backup_history;",
      );
    });
    this.db.execSync("PRAGMA wal_checkpoint(TRUNCATE);VACUUM;");
  }
  recordBackup(kind: string) {
    this.db.runSync(
      "INSERT INTO backup_history VALUES(?,?,?)",
      this.uuid(),
      new Date().toISOString(),
      kind,
    );
  }
  backupHistory() {
    return this.db.getAllSync<{ id: string; created_at: string; kind: string }>(
      "SELECT * FROM backup_history ORDER BY created_at DESC LIMIT 20",
    );
  }
}
export function validateSnapshot(input: unknown): Snapshot {
  const d = snapshotSchema.parse(input);
  for (const table of tables) {
    if (new Set(d[table].map((x) => x.id)).size !== d[table].length)
      throw new Error("IDs duplicados no backup.");
  }
  const cs = new Set(d.clients.map((x) => x.id)),
    ss = new Set(d.services.map((x) => x.id));
  for (const a of d.appointments) {
    if (!cs.has(a.clientId) || a.services.some((s) => !ss.has(s.serviceId)))
      throw new Error("Referências ausentes no backup.");
    const totals = cost(a.services, a.discountCents);
    if (
      totals.totalCents !== a.totalCents ||
      totals.duration !== a.duration ||
      totals.subtotalCents !== a.subtotalCents
    )
      throw new Error("Totais inconsistentes no backup.");
  }
  const active = d.appointments
    .filter((a) => !a.deletedAt && a.status === "active")
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  let previousEnd = -Infinity;
  for (const a of active) {
    const start = Date.parse(a.startsAt);
    if (start < previousEnd)
      throw new Error("Agendamentos ativos conflitantes no backup.");
    previousEnd = start + a.duration * 60_000;
  }
  return d;
}
