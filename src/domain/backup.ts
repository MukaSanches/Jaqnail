import { validateSnapshot } from "../data/repository";
import { preferencesSchema, type Snapshot } from "./models";
import { money, cost } from "./rules";
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export function serializeBackup(data: Snapshot) {
  return JSON.stringify(
    {
      format: "jaqnail",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: validateSnapshot(data),
    },
    null,
    2,
  );
}
export function parseBackup(text: string): Snapshot {
  if (text.length > MAX_BACKUP_BYTES) throw new Error("Backup excede 10 MiB.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Arquivo JSON inválido.");
  }
  if (!raw || typeof raw !== "object") throw new Error("Backup inválido.");
  const x = raw as Record<string, unknown>;
  if (x.format !== "jaqnail" || x.version !== 1)
    throw new Error("Formato/versão não suportado. Use um backup Jaqnail v1.");
  return validateSnapshot(x.data);
}
/** Explicit adapter for the documented legacy shape; not auto-detection or full AppNail interoperability. */
export function importLegacy(input: unknown): Snapshot {
  if (!input || typeof input !== "object")
    throw new Error("Formato legado inválido.");
  const root = input as Record<string, unknown>;
  if (root.version !== 1 || !root.data || typeof root.data !== "object")
    throw new Error("Versão legada não suportada.");
  const d = root.data as Record<string, unknown>;
  for (const key of ["clients", "services", "materials", "schedules"])
    if (!Array.isArray(d[key])) throw new Error("Coleção legada ausente.");
  const now = new Date().toISOString();
  const base = (r: Record<string, unknown>) => ({
    createdAt: r.createdAt ?? now,
    updatedAt: r.updatedAt ?? now,
    deletedAt: null,
    ...r,
  });
  const clients = (d.clients as Record<string, unknown>[]).map((r) => ({
    ...base(r),
    phone: r.phone ?? "",
    notes: r.notes ?? "",
    consent: false,
  }));
  const services = (d.services as Record<string, unknown>[]).map((r) => ({
    ...base(r),
    priceCents: money(String(r.price)),
    notes: r.notes ?? "",
  }));
  const materials = (d.materials as Record<string, unknown>[]).map((r) => ({
    ...base(r),
    minStock: r.minStock ?? null,
    notes: "",
  }));
  const appointments = (d.schedules as Record<string, unknown>[]).map((r) => {
    if (!r.client || typeof r.client !== "object" || !Array.isArray(r.services))
      throw new Error("Agenda legada inválida.");
    const c = r.client as Record<string, unknown>;
    const lines = (r.services as Record<string, unknown>[]).map((s) => ({
      serviceId: String(s.serviceId ?? s.id ?? ""),
      name: String(s.name),
      priceCents: money(String(s.price)),
      duration: Number(s.duration),
      amount: Number(s.amount),
    }));
    const discountCents = money(String(r.discount ?? 0)),
      totals = cost(lines, discountCents);
    if (r.total !== undefined && money(String(r.total)) !== totals.totalCents)
      throw new Error("Total legado inconsistente.");
    return {
      ...base(r),
      clientId: c.id,
      clientName: c.name,
      services: lines,
      startsAt: r.appointmentDate,
      timezone: "America/Sao_Paulo",
      discountCents,
      ...totals,
      payment: r.paymentMethod ?? "credit-card",
      notes: r.notes ?? "",
      status: r.status ?? "active",
      seriesId: null,
    };
  });
  return validateSnapshot({
    clients,
    services,
    materials,
    appointments,
    preferences: preferencesSchema.parse({}),
  });
}
