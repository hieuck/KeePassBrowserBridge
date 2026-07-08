import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename);
const localesDir = path.resolve(__dirname, "..", "extension", "_locales");

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
