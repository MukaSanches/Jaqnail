jest.mock("../integrations/native", () => ({
  syncReminders: jest.fn().mockResolvedValue(undefined),
  requestNotifications: jest.fn().mockResolvedValue(true),
  saveBackupToDevice: jest.fn().mockResolvedValue(true),
  shareBackup: jest.fn().mockResolvedValue(undefined),
  pickBackup: jest.fn().mockResolvedValue(null),
  exportCSV: jest.fn().mockResolvedValue(undefined),
}));
jest.mock(
  "react-native-safe-area-context",
  () => jest.requireActual("react-native-safe-area-context/jest/mock").default,
);
