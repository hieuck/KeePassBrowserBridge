import { describe, test, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const scriptPath = path.resolve(process.cwd(), "scripts", "validate-locales.mjs");

describe("locale validation", () => {
  test("all locale files are valid and consistent", () => {
    expect(() =>
      execSync(`node "${scriptPath}"`, { stdio: "pipe" }),
    ).not.toThrow();
  });
});
