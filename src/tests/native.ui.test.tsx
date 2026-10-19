import { DatabaseSync } from "node:sqlite";
import { Repository, Sqlite } from "../data/repository";
import * as FS from "expo-file-system/legacy";
import { shareBackup, saveBackupToDevice } from "../integrations/native";
jest.unmock("../integrations/native");
const mockFiles = new Map<string, string>();
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "cache/",
  readAsStringAsync: jest.fn(async (uri: string) => mockFiles.get(uri)),
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn(async () => ({
      granted: true,
      directoryUri: "content://folder",
    })),
    createFileAsync: jest.fn(async () => "content://backup.json"),
  },
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
function makeRepo() {
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
  return { repo, raw };
}
test("shared backup remains readable by receiving app; expired export cache is cleaned", async () => {
  const { repo, raw } = makeRepo();
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

test("device backup verifies written contents before marking successful export", async () => {
  const { repo, raw } = makeRepo();
  expect(await saveBackupToDevice(repo)).toBe(true);
  expect(JSON.parse(mockFiles.get("content://backup.json")!).format).toBe(
    "jaqnail",
  );
  expect(repo.preferences().lastBackup).not.toBeNull();
  expect(repo.backupHistory()[0]?.kind).toBe("export-device-verified");
  raw.close();
});
test("cancelled folder selection does not mark backup as saved", async () => {
  const { repo, raw } = makeRepo();
  jest
    .mocked(FS.StorageAccessFramework.requestDirectoryPermissionsAsync)
    .mockResolvedValueOnce({ granted: false });
  expect(await saveBackupToDevice(repo)).toBe(false);
  expect(repo.preferences().lastBackup).toBeNull();
  expect(repo.backupHistory()).toHaveLength(0);
  raw.close();
});
test("failed output verification preserves backup date and reports failure", async () => {
  const { repo, raw } = makeRepo();
  jest.mocked(FS.readAsStringAsync).mockResolvedValueOnce("truncated");
  await expect(saveBackupToDevice(repo)).rejects.toThrow("verificar");
  expect(repo.preferences().lastBackup).toBeNull();
  raw.close();
});
