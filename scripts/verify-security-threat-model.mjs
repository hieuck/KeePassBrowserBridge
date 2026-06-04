import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const sources = {
  securityThreatModel: read('docs/security-threat-model.md'),
  releaseIntegrity: read('docs/release-integrity.md'),
  releaseNotesTemplate: read('docs/release-notes-template.md'),
  releaseReadiness: read('docs/release-readiness.md'),
  storeSubmission: read('docs/store-submission.md'),
  privacyPolicy: read('docs/privacy-policy.md'),
  passkeyDesign: read('docs/passkeys-webauthn-design.md'),
  testsProgram: read('tests/Program.cs'),
  formDetectionTests: read('tests/e2e/form-detection.spec.js'),
  extensionLoadTests: read('tests/e2e/extension-load.spec.js'),
  optionsPageTests: read('tests/e2e/options-page.spec.js'),
  realSiteValidation: read('docs/real-site-validation.md'),
  bridgeMethodPolicy: read('src/Bridge/BridgeMethodPolicy.cs'),
  passkeyService: read('src/Bridge/PasskeyService.cs'),
  loopbackServer: read('src/Bridge/LoopbackBridgeServer.cs'),
  contentScript: read('extension/contentScript.js'),
  popup: read('extension/popup.js'),
  options: read('extension/options.js'),
  background: read('extension/background.js'),
  passkeysProxyExperiment: read('extension/passkeysProxyExperiment.js'),
  manifest: read('extension/manifest.json'),
  firefoxManifest: read('extension/manifest.firefox.json'),
  passkeysProxyTests: read('tests/extension/passkeys-proxy.test.mjs'),
  buildRelease: read('scripts/build-release.ps1'),
  verifyReleaseArtifacts: read('scripts/verify-release-artifacts.ps1'),
  signedReleaseSmoke: read('scripts/verify-signed-release-smoke.ps1'),
  verifyScript: read('scripts/verify.ps1')
};

const checks = [];

function requireIncludes(sourceName, needle, message) {
  const source = sources[sourceName];
  if (!source.includes(needle)) {
    throw new Error(`${message} Missing ${JSON.stringify(needle)} in ${sourceName}.`);
  }
  checks.push(message);
}

function requireNotIncludes(sourceName, needle, message) {
  const source = sources[sourceName];
  if (source.includes(needle)) {
    throw new Error(`${message} Unexpected ${JSON.stringify(needle)} in ${sourceName}.`);
  }
  checks.push(message);
}

function requireEvery(sourceName, needles, message) {
  for (const needle of needles) {
    requireIncludes(sourceName, needle, message);
  }
}

requireIncludes('securityThreatModel', '## Security Review Checklist',
  'security threat model should keep a pre-release checklist');
requireIncludes('securityThreatModel', 'Before public replacement release',
  'security threat model should scope the checklist to public replacement releases');

requireEvery('testsProgram', [
  'BridgeMethodPolicyCoversEveryBridgeMethod',
  'BridgeMethodPolicyAssignsExpectedPermissions'
], 'bridge method permission policy should be covered by backend tests');
requireEvery('bridgeMethodPolicy', [
  'RequiresAuthentication',
  'RequiredPermission',
  'AllMethods'
], 'bridge method policy should centralize authentication and permissions');

requireEvery('testsProgram', [
  'LoopbackBridgeServerRejectsWebPreflightOrigin',
  'LoopbackBridgeServerRejectsWebPostOriginBeforeHandling',
  'LoopbackBridgeServerRejectsNonJsonPostBeforeHandling',
  'LoopbackBridgeServerRejectsOversizedPostBeforeHandling',
  'LoopbackBridgeServerRejectsMismatchedHeaderAndRequestOriginBeforeHandling'
], 'loopback bridge rejection paths should be covered by backend tests');
requireEvery('loopbackServer', [
  'Content-Type',
  'application/json',
  'MaxRequestBodyBytes',
  'Access-Control-Allow-Origin'
], 'loopback bridge should enforce JSON, request size, and extension CORS controls');

requireEvery('testsProgram', [
  'BridgeHandlerRejectsReplayedAuthenticatedRequestId',
  'BridgeHandlerRejectsReplayedPasskeyCreateCompletionRequestId',
  'BridgeHandlerRejectsReplayedPasskeyGetCompletionRequestId'
], 'authenticated request replay protection should be covered by backend tests');

requireEvery('testsProgram', [
  'PasskeyRegistrationRejectsRequiredUserVerification',
  'PasskeyAssertionRejectsRequiredUserVerification',
  'PasskeyPendingRejectsRequiredUserVerification',
  'BridgeHandlerRejectsRequiredPasskeyUserVerificationWhenFeatureGateIsEnabled'
], 'required passkey user verification rejection should be covered by backend tests');
requireEvery('passkeyService', [
  'unsupported_user_verification',
  'IsUserVerificationRequired',
  'Passkey user verification is not supported by this build.'
], 'passkey backend should reject required user verification until KeePass-side verification exists');
requireEvery('passkeysProxyExperiment', [
  'normalizeUserVerification',
  'assertUserVerificationSupported',
  'Passkey user verification is not supported by this build.'
], 'passkey proxy should reject required user verification before bridge calls');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject create requests requiring unsupported user verification',
  'bridge helper must not call backend passkey methods when required user verification is unsupported',
  'lifecycle should reject required user verification before calling handlers'
], 'required user verification rejection should be covered by proxy tests');

requireEvery('testsProgram', [
  'CredentialQueryRedactsProtectedCustomFieldValues',
  'CredentialMutationCreatesEntryWithCustomField',
  'CredentialMutationReplacesExistingEntryCustomFields'
], 'protected custom fields should be covered by backend query and mutation tests');
requireEvery('contentScript', [
  'candidate.IsProtected !== true',
  'field.IsProtected === true'
], 'content script should exclude protected custom field values from fill surfaces');
requireEvery('popup', [
  "field.IsProtected ? '",
  'return fields.filter((field) => field && !field.IsProtected'
], 'popup should hide protected custom field values from display, search, copy, and fill actions');
requireEvery('options', [
  'SENSITIVE_SETTING_KEYS',
  "'clientId'",
  "'sharedSecret'",
  "'pairingSessionId'",
  "'locked'",
  "'lastCredentialActivityAt'",
  'sanitizePortableSettings'
], 'settings import/export should exclude pairing secrets and runtime lock state');
requireEvery('optionsPageTests', [
  "expect(exported).not.toHaveProperty('clientId')",
  "expect(exported).not.toHaveProperty('sharedSecret')",
  "expect(exported).not.toHaveProperty('pairingSessionId')",
  "expect(exported).not.toHaveProperty('locked')",
  "expect(stored).not.toHaveProperty('clientId')",
  "expect(stored).not.toHaveProperty('sharedSecret')"
], 'settings import/export minimization should be covered by options E2E tests');

requireEvery('realSiteValidation', [
  'Password reset/recovery email forms must not be username-first login',
  'fill.dev-style profile/payment/settings fields must not be login or OTP',
  'Sign-up/create-account forms with only new-password fields must not be auto-filled as logins',
  'Sign-up/create-account forms with only new-password fields must not trigger save prompts',
  'Developer/API token settings must not be treated as login password or OTP fields'
], 'real-site validation matrix should document false-positive fill and save guards');
requireEvery('formDetectionTests', [
  'does not treat password reset email forms as username-first login',
  'does not treat profile, payment, or numeric settings forms as login fields',
  'does not autofill sign-up forms that only ask for a new password',
  'does not prompt to save sign-up forms that only ask for a new password',
  'does not treat API token settings as password login fields'
], 'false-positive form detection and save prompts should be covered by E2E tests');

requireEvery('verifyReleaseArtifacts', [
  'Assert-ReleaseManifest',
  'Assert-ZipEntrySet',
  'Read-ChecksumFile',
  'Get-FileHash',
  'extension package file list mismatch',
  'SourceDirty'
], 'release artifact verifier should check metadata, stale files, and checksums');
requireEvery('buildRelease', [
  '[switch] $RequireCleanSource',
  'Release build requires a clean source tree',
  'SHA256SUMS.txt',
  'release-manifest.json'
], 'release builder should produce provenance artifacts and support clean-source gating');
requireEvery('verifyScript', [
  'verify-clean-source-smoke.ps1',
  'verify-signed-release-smoke.ps1'
], 'main verifier should exercise release-integrity smokes');
requireEvery('signedReleaseSmoke', [
  'verify-release-artifacts.ps1',
  '-RequireSignatures'
], 'signed release smoke should exercise release artifact verification');

requireEvery('releaseNotesTemplate', [
  'docs/migration-guide.md',
  'Passkeys/WebAuthn: not supported',
  'docs/release-integrity.md',
  'docs/privacy-policy.md',
  'docs/security-threat-model.md',
  'Known Gaps'
], 'release notes template should document migration, residual risks, unsupported passkeys, and integrity verification');

requireEvery('storeSubmission', [
  'does not send credentials to any remote server',
  'docs/privacy-policy.md',
  'Settings export excludes pairing secrets',
  'Passkeys/WebAuthn are not supported'
], 'store submission privacy answers should align with privacy policy and current passkey gap');
requireEvery('privacyPolicy', [
  'does not collect analytics',
  'does not send passwords',
  'Credentials to any remote server controlled by the project maintainers',
  'Settings export intentionally excludes pairing secrets',
  'Passkey/WebAuthn credentials'
], 'privacy policy should match store privacy and unsupported passkey statements');

requireEvery('passkeyDesign', [
  'Passkeys are not implemented as a browser-facing feature',
  'No passkey support in public store listings',
  'webAuthenticationProxy',
  'browser-facing WebAuthn packaging remains future work'
], 'future WebAuthn permissions should stay routed through the passkey design');
requireNotIncludes('manifest', 'webAuthenticationProxy',
  'Chrome manifest should not request WebAuthn proxy permission before review');
requireNotIncludes('firefoxManifest', 'webAuthenticationProxy',
  'Firefox manifest should not request unsupported WebAuthn proxy permission');
requireEvery('releaseReadiness', [
  'passkeys/WebAuthn are not supported',
  'docs/passkeys-webauthn-design.md'
], 'release readiness should prevent premature WebAuthn listing claims');

console.log(`Security threat-model verification passed (${checks.length} checks).`);
