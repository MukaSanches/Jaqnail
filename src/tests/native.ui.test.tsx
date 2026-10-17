import { DatabaseSync } from "node:sqlite";
import { Repository, Sqlite } from "../data/repository";
import * as FS from "expo-file-system/legacy";
import { shareBackup } from "../integrations/native";
jest.unmock("../integrations/native");
const mockFiles = new Map<string, string>();
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "cache/",
  EncodingType: { UTF8: "utf8" },
  writeAsStringAsync: jest.fn(async (path: string, text: string) => {
    mockFiles.set(path, text);
  }),
  readDirectoryAsync: jest.fn(async () =>
    Array.from(mockFiles.keys()).map((x) => x.replace("cache/", "")),
  ),
  deleteAsync: jest.fn(async (path: string) => {
    mockFiles.delete(path);
  }),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));
jest.mock("expo-notifications", () => ({ setNotificationHandler: jest.fn() }));
test("shared backup remains readable by receiving app; expired export cache is cleaned", async () => {
  const raw = new DatabaseSync(":memory:");
  const db: Sqlite = {
    execSync: (s) => raw.exec(s),
    runSync: (s, ...p) => raw.prepare(s).run(...p),
    getAllSync: <T,>(s: string, ...p: (string | number | null)[]) =>
      raw.prepare(s).all(...p) as T[],
    withTransactionSync: (fn) => {
      raw.exec("BEGIN");
      try {
        fn();
        raw.exec("COMMIT");
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
  };
  let i = 0;
  const repo = new Repository(db, () => String(++i));
  mockFiles.set("cache/Jaqnail-backup-1.json", "old");
  mockFiles.set("cache/unrelated.json", "keep");
  await shareBackup(repo);
  const shared = [...mockFiles.keys()].find(
    (x) =>
      /^cache\/Jaqnail-backup-\d+\.json$/.test(x) &&
      x !== "cache/Jaqnail-backup-1.json",
  );
  expect(shared).toBeDefined();
  expect(JSON.parse(mockFiles.get(shared!)!).format).toBe("jaqnail");
  expect(mockFiles.has("cache/Jaqnail-backup-1.json")).toBe(false);
  expect(mockFiles.has("cache/unrelated.json")).toBe(true);
  expect(FS.writeAsStringAsync).toHaveBeenCalled();
  raw.close();
});
