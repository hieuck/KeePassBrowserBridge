import { describe, test, expect, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateLocales } from "../../scripts/validate-locales.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const realLocalesDir = path.join(projectRoot, "extension", "_locales");
const fixturesRoot = path.join(__dirname, "fixtures");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function createFixture(name, contents) {
  const dir = path.join(fixturesRoot, `locales-${name}`);
  removeDir(dir);
  ensureDir(dir);

  for (const [locale, data] of Object.entries(contents)) {
    const localeDir = path.join(dir, locale);
    ensureDir(localeDir);
    if (data !== null) {
      writeJson(path.join(localeDir, "messages.json"), data);
    }
  }

  return dir;
}

describe("locale validation", () => {
  test("all real locale files are valid and consistent", () => {
    const result = validateLocales(realLocalesDir);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.localeCount).toBeGreaterThan(0);
  });

  describe("edge cases", () => {
    afterAll(() => {
      removeDir(path.join(fixturesRoot, "locales-invalid-json"));
      removeDir(path.join(fixturesRoot, "locales-missing-en"));
      removeDir(path.join(fixturesRoot, "locales-missing-key"));
      removeDir(path.join(fixturesRoot, "locales-extra-key"));
    });

    test("invalid JSON file", () => {
      const dir = createFixture("invalid-json", {
        en: { appName: { message: "App" } },
        de: null,
      });
      fs.writeFileSync(path.join(dir, "de", "messages.json"), "{ invalid json }");

      const result = validateLocales(dir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid JSON in de"))).toBe(true);
    });

    test("missing English reference", () => {
      const dir = createFixture("missing-en", {
        de: { appName: { message: "App" } },
      });

      const result = validateLocales(dir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("English locale is missing"))).toBe(true);
    });

    test("missing key in a locale", () => {
      const dir = createFixture("missing-key", {
        en: { appName: { message: "App" }, appDescription: { message: "Desc" } },
        de: { appName: { message: "App" } },
      });

      const result = validateLocales(dir);
      expect(result.ok).toBe(false);
      expect(
        result.errors.some((e) => e.includes("Locale de is missing keys: appDescription")),
      ).toBe(true);
    });

    test("extra key in a locale", () => {
      const dir = createFixture("extra-key", {
        en: { appName: { message: "App" } },
        de: { appName: { message: "App" }, extraKey: { message: "Extra" } },
      });

      const result = validateLocales(dir);
      expect(result.ok).toBe(false);
      expect(
        result.errors.some((e) => e.includes("Locale de has extra keys: extraKey")),
      ).toBe(true);
    });
  });
});
