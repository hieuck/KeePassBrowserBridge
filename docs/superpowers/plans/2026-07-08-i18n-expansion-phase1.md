# i18n Expansion Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-_SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand KeePass Browser Bridge locale coverage from 8 to 20 languages by adding 12 new locale files and a validator that enforces key consistency.

**Architecture:** Keep the existing `chrome.i18n` + `_locales/<lang>/messages.json` structure. Add a Node.js validator script and a Vitest test that fails the build when a locale is inconsistent with English.

**Tech Stack:** Node.js, ES modules, Vitest, Chrome extension i18n JSON format.

---

## Task 1: Create the locale validator script

**Files:**
- Create: `scripts/validate-locales.mjs`
- Test: `tests/unit/locales.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/locales.test.mjs
import { describe, test, expect } from "vitest";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptPath = fileURLToPath(new URL("../../scripts/validate-locales.mjs", import.meta.url));

describe("locale validation", () => {
  test("all locale files are valid and consistent", () => {
    expect(() => execSync(`node "${scriptPath}"`, { stdio: "pipe" })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/locales.test.mjs`
Expected: FAIL because `scripts/validate-locales.mjs` does not exist.

- [ ] **Step 3: Write minimal validator implementation**

```javascript
// scripts/validate-locales.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "extension", "_locales");

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function getKeys(obj) {
  return Object.keys(obj).sort();
}

function main() {
  const locales = fs.readdirSync(localesDir).filter((name) => {
    return fs.statSync(path.join(localesDir, name)).isDirectory();
  });

  if (!locales.includes("en")) {
    console.error("English locale is missing");
    process.exit(1);
  }

  const english = loadJson(path.join(localesDir, "en", "messages.json"));
  const englishKeys = getKeys(english);

  let hasError = false;

  for (const locale of locales) {
    if (locale === "en") continue;
    const filePath = path.join(localesDir, locale, "messages.json");
    let data;
    try {
      data = loadJson(filePath);
    } catch (err) {
      console.error(`Invalid JSON in ${locale}: ${err.message}`);
      hasError = true;
      continue;
    }

    const keys = getKeys(data);
    const missing = englishKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !englishKeys.includes(k));

    if (missing.length > 0) {
      console.error(`Locale ${locale} is missing keys: ${missing.join(", ")}`);
      hasError = true;
    }
    if (extra.length > 0) {
      console.error(`Locale ${locale} has extra keys: ${extra.join(", ")}`);
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  }

  console.log(`All ${locales.length} locales are consistent with English.`);
}

main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/locales.test.mjs`
Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: all existing tests still pass; new locale test passes.

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-locales.mjs tests/unit/locales.test.mjs
git commit -m "feat(i18n): add locale consistency validator and test"
```

---

## Task 2: Add 12 new locale files

**Files:**
- Create: `extension/_locales/<lang>/messages.json` for each locale in the list below.

Locales to add: `pt_BR`, `ru`, `it`, `pl`, `nl`, `tr`, `ar`, `th`, `id`, `sv`, `cs`, `uk`.

Use the English file as the key template. Translate only the `message` values. Keep `description` identical to English for translator context.

- [ ] **Step 1: Create `extension/_locales/pt_BR/messages.json`**

Copy `extension/_locales/en/messages.json` and translate values to Brazilian Portuguese.

- [ ] **Step 2: Create the remaining 11 locale files**

Repeat for `ru`, `it`, `pl`, `nl`, `tr`, `ar`, `th`, `id`, `sv`, `cs`, `uk`.

- [ ] **Step 3: Run validator test**

Run: `npx vitest run tests/unit/locales.test.mjs`
Expected: PASS (all keys match English).

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add extension/_locales/
git commit -m "feat(i18n): add 12 new locales for phase 1"
```

---

## Task 3: Push, review, and merge

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/i18n-expansion-phase1
```

- [ ] **Step 2: Open PR**

Use `gh pr create` with a body describing the change, motivation, and verification evidence.

- [ ] **Step 3: Run internal review**

Spawn Correctness, Security, and Tests reviewers. Address any requested changes.

- [ ] **Step 4: Wait for CI**

Use `gh pr checks <pr-number> --watch` to wait for all checks to pass.

- [ ] **Step 5: Merge**

```bash
gh pr merge <pr-number> --squash --delete-branch
```

---

## Self-Review

- Spec coverage: all 12 locales and validator are covered.
- Placeholder scan: no TODO/TBD in the plan.
- Type consistency: uses ES modules and Vitest patterns matching the repo.
