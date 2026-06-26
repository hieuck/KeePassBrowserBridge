import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const files = [
  { path: 'extension/manifest.json', pattern: /"version": "\d+\.\d+\.\d+"/ },
  { path: 'extension/manifest.firefox.json', pattern: /"version": "\d+\.\d+\.\d+"/ },
  { path: 'update/versioninfo.txt', pattern: /KeePass Browser Bridge:\d+\.\d+\.\d+/ },
  { path: 'src/Bridge/BridgeSettings.cs', pattern: /PluginVersion = "\d+\.\d+\.\d+"/ },
  { path: 'extension/src/options/tabs/AboutTab.vue', pattern: /const version = '\d+\.\d+\.\d+'/ },
  { path: 'extension/src/options/tabs/AboutTab.vue', pattern: /const pluginVersion = '\d+\.\d+\.\d+'/ },
];

const oldVersion = process.argv[2];
const newVersion = process.argv[3];

if (!oldVersion || !newVersion) {
  console.error('Usage: node scripts/bump-version.mjs <old> <new>');
  console.error('Example: node scripts/bump-version.mjs 2.0.0 2.1.0');
  process.exit(1);
}

for (const { path: filePath, pattern } of files) {
  const fullPath = path.resolve(root, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const oldStr = content.match(pattern)?.[0];
  if (!oldStr) {
    console.error(`❌ Pattern not found in ${filePath}`);
    continue;
  }
  const newStr = oldStr.replace(oldVersion, newVersion);
  fs.writeFileSync(fullPath, content.replace(pattern, newStr));
  console.log(`✅ ${filePath}: ${oldStr} → ${newStr}`);
}
