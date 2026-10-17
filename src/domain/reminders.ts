import type { Preferences } from "./models";
export type Reminder = {
  at: Date;
  title: string;
  body: string;
  fingerprint: string;
};
type ScheduledAppointment = {
  id: string;
  startsAt: string;
  updatedAt: string;
  status: string;
  deletedAt: string | null;
};
export function reminderPlan(
  appointments: ScheduledAppointment[],
  p: Preferences,
  granted: boolean,
  createdAt: string,
  now = Date.now(),
): Map<string, Reminder> {
  const wanted = new Map<string, Reminder>();
  if (!p.notifications || !granted) return wanted;
  for (const a of appointments) {
    const at = new Date(Date.parse(a.startsAt) - p.reminderMinutes * 60_000);
    if (!a.deletedAt && a.status === "active" && at.getTime() > now)
      wanted.set("jaqnail-" + a.id, {
        at,
        title: "Seu próximo atendimento",
        body: "Abra o Jaqnail para conferir os detalhes.",
        fingerprint: a.updatedAt + ":" + p.reminderMinutes,
      });
  }
  const anchor = Date.parse(p.lastBackup ?? createdAt),
    interval = p.backupDays * 86_400_000;
  const next =
    anchor + Math.max(1, Math.floor((now - anchor) / interval) + 1) * interval;
  if (Number.isFinite(next)) {
    const at = new Date(next);
    wanted.set("jaqnail-backup", {
      at,
      title: "Proteja sua agenda",
      body: "É hora de exportar um backup do Jaqnail.",
      fingerprint: at.toISOString(),
    });
  }
  return wanted;
}
