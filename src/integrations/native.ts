import * as Notifications from "expo-notifications";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import type { Repository } from "../data/repository";
import { serializeBackup, MAX_BACKUP_BYTES } from "../domain/backup";
import { reminderPlan } from "../domain/reminders";
import { csvCell } from "../domain/rules";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export async function requestNotifications() {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("appointments", {
      name: "Agendamentos",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  const p = await Notifications.requestPermissionsAsync();
  return p.granted;
}
export async function syncReminders(repo: Repository) {
  const p = repo.preferences();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((n) => n.identifier.startsWith("jaqnail-"));
  const granted = (await Notifications.getPermissionsAsync()).granted;
  const createdAt = repo.db.getAllSync<{ applied_at: string }>(
    "SELECT applied_at FROM schema_migrations ORDER BY version LIMIT 1",
  )[0]?.applied_at;
  if (!createdAt) throw new Error("Data de criação do banco indisponível.");
  const wanted = reminderPlan(repo.list("appointments"), p, granted, createdAt);
  const jobs = new Map(
    repo.db
      .getAllSync<{
        id: string;
        fingerprint: string;
      }>("SELECT * FROM reminder_jobs")
      .map((j) => [j.id, j.fingerprint]),
  );
  for (const n of ours) {
    const w = wanted.get(n.identifier);
    if (!w || jobs.get(n.identifier) !== w.fingerprint) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
      repo.db.runSync("DELETE FROM reminder_jobs WHERE id=?", n.identifier);
    }
  }
  for (const [id, w] of wanted) {
    if (ours.some((n) => n.identifier === id) && jobs.get(id) === w.fingerprint)
      continue;
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title: w.title, body: w.body, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: w.at,
        channelId: "appointments",
      },
    });
    repo.db.runSync(
      "INSERT INTO reminder_jobs VALUES(?,?) ON CONFLICT(id) DO UPDATE SET fingerprint=excluded.fingerprint",
      id,
      w.fingerprint,
    );
  }
}
async function shareFile(name: string, text: string, mimeType: string) {
  if (!FileSystem.cacheDirectory)
    throw new Error("Armazenamento temporário indisponível.");
  // Android resolves shareAsync when the chooser closes, before the receiver
  // necessarily reads the URI. Keep new files; only expire our old exports.
  const existing = await FileSystem.readDirectoryAsync(
    FileSystem.cacheDirectory,
  );
  for (const file of existing) {
    const match =
      /^Jaqnail-(?:backup|clientes|agendamentos|estatisticas)-(\d+)\.(?:json|csv)$/.exec(
        file,
      );
    if (match && Number(match[1]) < Date.now() - 86_400_000)
      await FileSystem.deleteAsync(FileSystem.cacheDirectory + file, {
        idempotent: true,
      });
  }
  const uri = FileSystem.cacheDirectory + name;
  await FileSystem.writeAsStringAsync(uri, text, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Compartilhamento indisponível neste aparelho.");
  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: "Salvar uma cópia segura",
  });
}
export async function shareBackup(repo: Repository) {
  await shareFile(
    `Jaqnail-backup-${Date.now()}.json`,
    serializeBackup(repo.snapshot()),
    "application/json",
  );
  repo.setPreferences({ lastBackup: new Date().toISOString() });
  repo.recordBackup("export-share-opened");
}
export async function pickBackup() {
  const r = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "application/octet-stream"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (r.canceled) return null;
  const file = r.assets[0];
  if (!file) throw new Error("Arquivo não encontrado.");
  try {
    const info = await FileSystem.getInfoAsync(file.uri);
    if (
      (file.size ??
        (info.exists && "size" in info ? info.size : MAX_BACKUP_BYTES + 1)) >
      MAX_BACKUP_BYTES
    )
      throw new Error("Arquivo excede 10 MiB.");
    return await FileSystem.readAsStringAsync(file.uri);
  } finally {
    await FileSystem.deleteAsync(file.uri, { idempotent: true });
  }
}
export async function exportCSV(name: string, rows: unknown[][]) {
  await shareFile(
    `Jaqnail-${name}-${Date.now()}.csv`,
    "\uFEFF" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n"),
    "text/csv",
  );
}
