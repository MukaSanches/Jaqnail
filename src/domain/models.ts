import { z } from "zod";
export const cents = z.number().int().min(0).max(100_000_000);
export const name = z
  .string()
  .trim()
  .min(2, "Informe pelo menos 2 caracteres")
  .max(120);
const notes = z.string().max(2000).default("");
const date = z.string().datetime({ offset: true });
const base = {
  id: z.string().min(1).max(100),
  createdAt: date,
  updatedAt: date,
  deletedAt: date.nullable().default(null),
};
export const clientSchema = z.object({
  ...base,
  name,
  phone: z
    .string()
    .max(20)
    .refine(
      (v) => v === "" || /^\+?[\d ()-]{8,20}$/.test(v),
      "Telefone inválido",
    )
    .default(""),
  notes,
  consent: z.boolean().default(false),
});
export const serviceSchema = z.object({
  ...base,
  name,
  priceCents: cents,
  duration: z.number().int().min(1).max(1440),
  notes,
});
export const materialSchema = z.object({
  ...base,
  name,
  stock: z.number().min(0).max(1_000_000),
  minStock: z.number().min(0).max(1_000_000).nullable(),
  notes,
});
export const lineSchema = z.object({
  serviceId: z.string().min(1),
  name,
  priceCents: cents,
  duration: z.number().int().min(1).max(1440),
  amount: z.number().int().min(1).max(100),
});
export const appointmentSchema = z.object({
  ...base,
  clientId: z.string().min(1),
  clientName: name,
  services: z.array(lineSchema).min(1).max(100),
  startsAt: date,
  timezone: z.string().refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Fuso inválido"),
  duration: z.number().int().min(1).max(1440),
  subtotalCents: cents,
  totalCents: cents,
  discountCents: cents,
  payment: z.enum(["credit-card", "debit-card", "pix", "cash", "other"]),
  notes,
  status: z.enum(["active", "cancelled"]),
  seriesId: z.string().nullable(),
});
export const preferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).default("system"),
  lang: z.enum(["pt-BR", "en-US"]).default("pt-BR"),
  currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
  dateFormat: z.enum(["DMY", "MDY", "YMD"]).default("DMY"),
  hour24: z.boolean().default(true),
  view: z.enum(["day", "week"]).default("day"),
  notifications: z.boolean().default(false),
  reminderMinutes: z.number().int().min(0).max(1440).default(30),
  backupDays: z.number().int().min(1).max(90).default(7),
  lastBackup: date.nullable().default(null),
  backupDismissed: date.nullable().default(null),
  onboarded: z.boolean().default(false),
  referral: z.string().max(100).default(""),
  hideMoney: z.boolean().default(false),
  messageTemplate: z
    .string()
    .min(1)
    .max(2000)
    .default(
      "Olá, {cliente}! Seu horário é {data}, às {hora}. Serviços: {servicos}. Até breve!",
    ),
});
export type Client = z.infer<typeof clientSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Material = z.infer<typeof materialSchema>;
export type Line = z.infer<typeof lineSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type Catalog = "clients" | "services" | "materials";
export type Entities = {
  clients: Client;
  services: Service;
  materials: Material;
  appointments: Appointment;
};
export type Snapshot = {
  clients: Client[];
  services: Service[];
  materials: Material[];
  appointments: Appointment[];
  preferences: Preferences;
};
export const snapshotSchema = z.object({
  clients: z.array(clientSchema).max(50000),
  services: z.array(serviceSchema).max(10000),
  materials: z.array(materialSchema).max(10000),
  appointments: z.array(appointmentSchema).max(100000),
  preferences: preferencesSchema,
});
