module.exports = {
  preset: "jest-expo",
  testMatch: ["**/*.ui.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup-ui.ts"],
  modulePathIgnorePatterns: ["<rootDir>/android/"],
};
