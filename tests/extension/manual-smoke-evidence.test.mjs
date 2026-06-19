import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'new-manual-smoke-evidence.ps1');
const releaseReadiness = fs.readFileSync(path.join(repoRoot, 'docs', 'release-readiness.md'), 'utf8');
const verifierScript = fs.readFileSync(path.join(repoRoot, 'scripts', 'verify.ps1'), 'utf8');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kbb-manual-smoke-evidence-'));

try {
  const artifactsDir = path.join(tempRoot, 'artifacts');
  fs.mkdirSync(artifactsDir);
  fs.writeFileSync(
    path.join(artifactsDir, 'release-manifest.json'),
    JSON.stringify(
      {
        Product: 'KeePass Browser Bridge',
        Version: '9.8.7',
        SourceRevision: 'abcdef0123456789abcdef0123456789abcdef01',
        SourceDirty: false,
        Build: {
          KeePassFileVersion: '2.61.1.0',
          MinimumKeePassVersion: '2.50',
          MinimumDotNetVersion: '4.0'
        },
        Artifacts: [
          {
            Name: 'KeePassBrowserBridge.plgx',
            Sha256: 'f'.repeat(64),
            SizeBytes: 12345
          }
        ],
        ChecksumFile: 'SHA256SUMS.txt'
      },
      null,
      2
    )
  );

  const outputPath = path.join(tempRoot, 'manual-smoke.md');
  const result = runPowerShell([
    '-File',
    scriptPath,
    '-ArtifactsDir',
    artifactsDir,
    '-OutputPath',
    outputPath,
    '-Tester',
    'Release Bot',
    '-WindowsVersion',
    'Windows Test',
    '-Browser',
    'Firefox',
    '-BrowserVersion',
    '141.0',
    '-DatabaseAlias',
    'throwaway.kdbx',
    '-BrowserProfile',
    'temp-profile',
    '-FixtureAlias',
    'fixture.test',
    '-Date',
    '2026-06-19'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(outputPath), true, 'manual smoke evidence file should be created');

  const evidence = fs.readFileSync(outputPath, 'utf8');
  assert.ok(evidence.includes('| Version | 9.8.7 |'), 'evidence should use the release-manifest version');
  assert.ok(
    evidence.includes('| Commit | abcdef0123456789abcdef0123456789abcdef01 |'),
    'evidence should use the release-manifest source revision'
  );
  assert.ok(evidence.includes(`| Artifact directory | ${artifactsDir} |`), 'evidence should record the artifact directory');
  assert.ok(evidence.includes('| KeePass version | 2.61.1.0 |'), 'evidence should record the KeePass build version');
  assert.ok(evidence.includes('| Windows version | Windows Test |'), 'evidence should accept the Windows version label');
  assert.ok(evidence.includes('| Tester | Release Bot |'), 'evidence should accept the tester label');
  assert.ok(evidence.includes('| Date | 2026-06-19 |'), 'evidence should accept the release-candidate date');
  assert.match(
    evidence,
    /\| Clean release build \| `\.\\scripts\\build-release\.ps1 -RequireCleanSource` \| Pending \| Confirm command output for abcdef0123456789abcdef0123456789abcdef01; release-manifest SourceDirty=False\. \|/,
    'evidence should avoid claiming clean-build success while preserving provenance context'
  );
  assert.ok(evidence.includes('Pairing and Revocation'), 'evidence should preserve manual pairing/revoke cases');
  assert.ok(evidence.includes('Save New Login'), 'evidence should preserve save-new smoke cases');
  assert.ok(evidence.includes('Passkeys/WebAuthn Unsupported'), 'evidence should preserve unsupported-passkey checks');
  assert.ok(evidence.includes('| Browser under test | Firefox |'), 'evidence should prefill the disposable browser');
  assert.ok(evidence.includes('| Browser version | 141.0 |'), 'evidence should prefill the browser version');
  assert.ok(evidence.includes('| Throwaway KeePass database path | throwaway.kdbx |'), 'evidence should prefill the database alias');
  assert.ok(evidence.includes('| Browser profile path or label | temp-profile |'), 'evidence should prefill the profile alias');
  assert.ok(evidence.includes('| Fixture host or disposable account alias | fixture.test |'), 'evidence should prefill the fixture alias');

  const overwrite = runPowerShell([
    '-File',
    scriptPath,
    '-ArtifactsDir',
    artifactsDir,
    '-OutputPath',
    outputPath
  ]);
  assert.notEqual(overwrite.status, 0, 'script should not overwrite evidence without -Force');
  assert.match(
    `${overwrite.stdout}\n${overwrite.stderr}`,
    /already exists/i,
    'overwrite failure should explain the existing output file'
  );

  assert.ok(
    releaseReadiness.includes('new-manual-smoke-evidence.ps1'),
    'release readiness docs should mention the evidence generator'
  );
  assert.ok(
    verifierScript.includes('manual-smoke-evidence.test.mjs'),
    'main verifier should run the manual smoke evidence generator test'
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function runPowerShell(args) {
  return spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', ...args], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
}
