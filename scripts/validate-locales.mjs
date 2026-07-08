import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename);
const defaultLocalesDir = path.resolve(__dirname, "..", "extension", "_locales");

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function getKeys(obj) {
  return Object.keys(obj).sort();
}

export function validateLocales(localesDir) {
  const errors = [];

  const locales = fs.readdirSync(localesDir).filter((name) => {
    return fs.statSync(path.join(localesDir, name)).isDirectory();
  });

  if (!locales.includes("en")) {
    errors.push("English locale is missing");
    return { ok: false, errors, localeCount: locales.length };
  }

  const english = loadJson(path.join(localesDir, "en", "messages.json"));
  const englishKeys = getKeys(english);

  for (const locale of locales) {
    if (locale === "en") continue;
    const filePath = path.join(localesDir, locale, "messages.json");
    let data;
    try {
      data = loadJson(filePath);
    } catch (err) {
      errors.push(`Invalid JSON in ${locale}: ${err.message}`);
      continue;
    }

    const keys = getKeys(data);
    const missing = englishKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !englishKeys.includes(k));

    if (missing.length > 0) {
      errors.push(`Locale ${locale} is missing keys: ${missing.join(", ")}`);
    }
    if (extra.length > 0) {
      errors.push(`Locale ${locale} has extra keys: ${extra.join(", ")}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    localeCount: locales.length,
  };
}

function main() {
  const { ok, errors, localeCount } = validateLocales(defaultLocalesDir);

  if (!ok) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }

  console.log(`All ${localeCount} locales are consistent with English.`);
}

if (process.argv[1] === __filename) {
  main();
}
