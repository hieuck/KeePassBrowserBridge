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
  optionsTests: read('tests/extension/options.test.mjs'),
  popupTests: read('tests/extension/popup.test.mjs'),
  realSiteValidation: read('docs/real-site-validation.md'),
  bridgeMethodPolicy: read('src/Bridge/BridgeMethodPolicy.cs'),
  bridgeRequestHandler: read('src/Bridge/BridgeRequestHandler.cs'),
  protocolModels: read('src/Bridge/ProtocolModels.cs'),
  passkeyService: read('src/Bridge/PasskeyService.cs'),
  loopbackServer: read('src/Bridge/LoopbackBridgeServer.cs'),
  contentScript: read('extension/contentScript.js'),
  popup: read('extension/popup.js'),
  options: read('extension/options.js'),
  background: read('extension/background.js'),
  backgroundTests: read('tests/extension/background.test.mjs'),
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

function requireCountAtLeast(sourceName, needle, expectedCount, message) {
  const source = sources[sourceName];
  const count = source.split(needle).length - 1;
  if (count < expectedCount) {
    throw new Error(`${message} Expected ${expectedCount} occurrences of ${JSON.stringify(needle)} in ${sourceName}, found ${count}.`);
  }
  checks.push(message);
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
requireEvery('popup', [
  'ensureWriteActionsEnabled',
  'showEditForm',
  "if (!hasClientPermission('write'))",
  'const hydratedState = await hydrateStatePermissions(state)',
  'renderState(hydratedState)'
], 'popup write actions should be guarded by trusted-client write permission');
requireCountAtLeast('popup', 'renderState(await hydrateStatePermissions(state))', 7,
  'popup state-changing actions should hydrate trusted-client permissions before rendering controls');
requireEvery('popupTests', [
  'read-only state should disable create action',
  'read-only rendered entries should disable edit buttons',
  'read-only edit action should not open an edit form',
  'read-only edit action should not send update requests',
  'query refresh should hydrate permissions before rendering read-only controls',
  'read-only query refresh should keep create action disabled',
  'read-only query refresh should keep trusted browser management disabled',
  'auto-fill toggle should hydrate permissions before rendering read-only controls',
  'read-only auto-fill toggle should keep create action disabled',
  'auto-submit toggle should hydrate permissions before rendering read-only controls',
  'read-only auto-submit toggle should keep trusted browser management disabled',
  'endpoint save should hydrate permissions before rendering read-only controls',
  'read-only endpoint save should keep create action disabled',
  'unlock should hydrate permissions before rendering read-only controls',
  'read-only unlock should keep trusted browser management disabled',
  'pair cancel should hydrate permissions before rendering paired read-only controls',
  'read-only pair cancel should keep trusted browser management disabled'
], 'popup tests should cover read-only create and edit restrictions');
requireIncludes('securityThreatModel', 'Read-only popup sessions disable create/edit controls',
  'security threat model should document read-only popup write restrictions');
requireIncludes('securityThreatModel', 'Popup state-changing refreshes hydrate trusted-client permissions',
  'security threat model should document permission hydration before popup state rendering');
requireEvery('popup', [
  'currentClientLostManage',
  'failClosedManageClientAccess',
  '/permission|not allowed/i.test(message)',
  "stored.Current",
  "currentClientLostManage = !stored.Permissions.includes('manageClients')",
  'Manage browsers permission was removed for this browser'
], 'popup trusted-browser controls should fail closed when current browser loses manage permission');
requireEvery('popupTests', [
  'self-removing manage permission should disable popup permission controls',
  'self-removing manage permission should disable popup revoke controls',
  'self-removing manage permission should explain popup management is no longer available',
  'permission-denied trusted browser list should refresh current permissions',
  'permission-denied trusted browser list should clear stale client rows'
], 'popup tests should cover self-removing manage permission UI lockout');
requireEvery('options', [
  'trustedBrowserManagementEnabled',
  "stored.Current && !stored.Permissions.includes('manageClients')",
  'if (client && client.Current)',
  'trustedBrowserClients = []',
  'revoke.disabled = !trustedBrowserManagementEnabled',
  "checkbox.disabled = definition.value === 'read' || !trustedBrowserManagementEnabled"
], 'options trusted-browser controls should fail closed when current browser loses manage permission');
requireEvery('optionsTests', [
  'self-removing manage permission should disable permission controls',
  'self-removing manage permission should disable revoke controls',
  'Manage browsers permission was removed for this browser',
  'current browser revoke should not refresh trusted browsers after local pairing credentials are removed',
  'current browser revoke should clear stale trusted browser rows'
], 'options tests should cover self-removing manage permission UI lockout');
requireIncludes('securityThreatModel', 'Popup and Options trusted-browser controls disable themselves',
  'security threat model should document manage-permission UI lockout');
requireIncludes('securityThreatModel', 'Popup trusted-browser management fails closed on backend permission-denied responses',
  'security threat model should document popup backend permission-denied lockout');
requireIncludes('securityThreatModel', 'The Options page clears trusted-browser rows locally after revoking the current browser',
  'security threat model should document options current-client revoke cleanup');

requireEvery('testsProgram', [
  'LoopbackBridgeServerRejectsWebPreflightOrigin',
  'LoopbackBridgeServerRejectsPreflightWithoutOrigin',
  'LoopbackBridgeServerRejectsWebPostOriginBeforeHandling',
  'LoopbackBridgeServerRejectsNonJsonPostBeforeHandling',
  'LoopbackBridgeServerRejectsMalformedJsonBeforeHandling',
  'LoopbackBridgeServerRejectsOversizedPostBeforeHandling',
  'LoopbackBridgeServerRejectsMismatchedHeaderAndRequestOriginBeforeHandling'
], 'loopback bridge rejection paths should be covered by backend tests');
requireIncludes('securityThreatModel', 'malformed JSON',
  'security threat model should document malformed bridge JSON rejection');
requireIncludes('securityThreatModel', 'missing-origin preflights',
  'security threat model should document originless preflight rejection');
requireEvery('loopbackServer', [
  'Content-Type',
  'application/json',
  'MaxRequestBodyBytes',
  'Access-Control-Allow-Origin'
], 'loopback bridge should enforce JSON, request size, and extension CORS controls');
requireEvery('testsProgram', [
  'CredentialMutationCreateDoesNotReturnPassword',
  'CredentialMutationUpdateDoesNotReturnPassword',
  'CredentialMutationFillAckDoesNotReturnPassword'
], 'mutation acknowledgements should have backend coverage for password minimization');
requireIncludes('securityThreatModel', 'Create, update, and fill acknowledgements return metadata without passwords',
  'security threat model should document mutation acknowledgement password minimization');
requireEvery('background', [
  "clearSensitiveRuntimeState('locked-access')",
  "clearSensitiveRuntimeState('unpaired-access')",
  "clearSensitiveRuntimeState('partial-pairing')",
  "clearSensitiveRuntimeState('endpoint-change')",
  "clearSensitiveRuntimeState('pair-complete')",
  'hasPartialPairingCredentials'
], 'background guard should clear sensitive runtime state before locked or unpaired denials');
requireIncludes('background', 'tryAcknowledgeFill',
  'background should keep automatic fill acknowledgements best-effort');
requireCountAtLeast('background', 'tryAcknowledgeFill', 4,
  'all automatic fill paths should use best-effort fill acknowledgement');
requireEvery('backgroundTests', [
  'locked pending consume should clear stale multi-step credentials',
  'unpaired submitted consume should clear stale submitted credentials',
  'locked extension should clear clipboard state before rejecting credential access',
  'partial pairing state should remove the stale client id',
  'partial pairing state should clear pending credentials',
  'endpoint change should unpair the browser',
  'endpoint change should remove stale shared secret',
  'endpoint change should clear pending credentials',
  'successful pairing should clear pending multi-step credentials',
  'successful pairing should clear pending submitted credentials',
  'successful pairing should cancel pending passkey proxy requests',
  'read-only popup fill should return the content script result when usage acknowledgement is denied',
  'read-only popup fill should still attempt best-effort usage acknowledgement'
], 'background tests should cover locked/unpaired cleanup and best-effort acknowledgement behavior');
requireIncludes('securityThreatModel', 'Locked or unpaired credential access clears pending runtime credentials',
  'security threat model should document locked and unpaired runtime-secret cleanup');
requireIncludes('securityThreatModel', 'Partial pairing credentials are treated as unpaired state',
  'security threat model should document partial pairing cleanup');
requireIncludes('securityThreatModel', 'Changing the bridge endpoint clears pairing credentials',
  'security threat model should document endpoint-change pairing cleanup');
requireIncludes('securityThreatModel', 'Successful pairing clears pending runtime credentials',
  'security threat model should document pair-complete runtime-secret cleanup');
requireIncludes('securityThreatModel', 'Extension-triggered fill acknowledgements are best-effort',
  'security threat model should document best-effort fill acknowledgements');
requireEvery('popup', [
  'clearRenderedCredentials',
  'clearRenderedClients',
  'if (!manageClientActionsEnabled())',
  'if (!credentialActionsEnabled())'
], 'popup should clear rendered credentials when credential access is unavailable');
requireIncludes('popupTests', 'locked popup should clear stale rendered fill buttons',
  'popup tests should cover clearing stale rendered credential actions after lock');
requireIncludes('popupTests', 'endpoint save that unpairs should clear stale trusted browser rows',
  'popup tests should cover clearing stale trusted-browser management rows after unpair');
requireIncludes('securityThreatModel', 'The popup clears trusted-browser management rows',
  'security threat model should document stale trusted-browser management cleanup');
requireIncludes('securityThreatModel', 'The popup clears rendered credential results when credential access becomes locked or unpaired',
  'security threat model should document stale popup credential cleanup');

requireEvery('testsProgram', [
  'BridgeHandlerRejectsReplayedAuthenticatedRequestId',
  'BridgeHandlerRejectsReplayedPasskeyCreateCompletionRequestId',
  'BridgeHandlerRejectsReplayedPasskeyGetCompletionRequestId'
], 'authenticated request replay protection should be covered by backend tests');

requireEvery('testsProgram', [
  'PasskeyRegistrationRejectsRequiredUserVerification',
  'PasskeyAssertionRejectsRequiredUserVerification',
  'PasskeyPendingRejectsRequiredUserVerification',
  'PasskeyRegistrationRejectsUnknownUserVerification',
  'PasskeyAssertionRejectsUnknownUserVerification',
  'PasskeyPendingRejectsUnknownUserVerification',
  'BridgeHandlerRejectsRequiredPasskeyUserVerificationWhenFeatureGateIsEnabled',
  'BridgeHandlerRejectsUnknownPasskeyUserVerificationWhenFeatureGateIsEnabled'
], 'required and unknown passkey user verification rejection should be covered by backend tests');
requireEvery('passkeyService', [
  'unsupported_user_verification',
  'IsUserVerificationRequired',
  'IsKnownUserVerification',
  'Passkey user verification is not supported by this build.'
], 'passkey backend should reject required or unknown user verification until KeePass-side verification exists');
requireEvery('passkeyService', [
  'WebAuthnClientDataJson',
  'webauthn.create',
  'webauthn.get',
  "ch == '-'",
  "ch == '_'",
  'if (!allowed) return false;',
  'normalized.Length != normalized.Trim().Length',
  'normalized.Length % 4 != 0',
  'paddingLength < 1 || paddingLength > 2',
  'paddingStart >= 0 && i > paddingStart',
  'string canonicalChallenge = Base64Url.Encode(challenge);',
  'string canonicalOrigin = PasskeyRelyingPartyValidator.NormalizeOrigin(request.Origin);',
  'GetLeftPart(UriPartial.Authority)',
  'CrossOrigin = false'
], 'passkey backend should produce structured WebAuthn clientDataJSON with canonical challenges and origins from strict base64url alphabet, padding, and whitespace input');
requireEvery('testsProgram', [
  'PasskeyBase64UrlRejectsStandardBase64Alphabet',
  'PasskeyBase64UrlRejectsMalformedPadding',
  'PasskeyBase64UrlRejectsWhitespace',
  'passkey base64url decoder must reject standard base64 plus characters',
  'passkey base64url decoder must reject standard base64 slash characters',
  'passkey base64url decoder should accept URL-safe alphabet characters',
  'passkey base64url decoder must reject short malformed padding',
  'passkey base64url decoder must reject overpadded values',
  'passkey base64url decoder must reject data after padding',
  'passkey base64url decoder should accept valid double padding',
  'passkey base64url decoder should accept valid single padding',
  'passkey base64url decoder must reject leading whitespace',
  'passkey base64url decoder must reject trailing whitespace',
  'passkey base64url decoder must reject embedded whitespace',
  'AssertWebAuthnClientData',
  'registration clientDataJSON',
  'assertion clientDataJSON',
  'request.Challenge = canonicalChallenge + "=="',
  'Challenge = canonicalChallenge + "=="',
  'passkey credential origin should be normalized to a WebAuthn origin',
  'type mismatch',
  'challenge mismatch',
  'origin mismatch',
  'crossOrigin should be false',
  'assertion authenticatorData RP ID hash mismatch',
  'assertion authenticatorData should encode sign count 1'
], 'passkey registration and assertion clientDataJSON canonicalization plus assertion authenticator-data structure should be covered by backend tests');
requireEvery('passkeyService', [
  'WebAuthnAttestationObject',
  'CreateNone',
  'WebAuthnAuthenticatorData.CreateAttestationData',
  'CreateRpIdHash',
  'NormalizeRpId(rpId)',
  "TrimEnd('.')",
  'UserPresentFlag',
  'AttestedCredentialDataFlag'
], 'passkey backend should produce structured none-attestation authenticator data with canonical RP ID hashes');
requireEvery('testsProgram', [
  'ReadNoneAttestationAuthData',
  'request.RpId = "Example.com."',
  'RpId = "Example.com."',
  'registration attestationObject fmt mismatch',
  'registration authenticatorData RP ID hash mismatch',
  'assertion authenticatorData RP ID hash mismatch',
  'registration authenticatorData should set user-present and attested-credential flags only',
  'registration authenticatorData credential ID mismatch',
  'registration authenticatorData public key COSE mismatch'
], 'passkey registration and assertion authenticator-data canonical RP ID structure should be covered by backend tests');
requireEvery('passkeyService', [
  'TryDecodeEs256PublicKey',
  'IsAssertionClientDataForOrigin(clientDataJson, credential.Origin, expectedChallenge)',
  'string canonicalExpectedOrigin = PasskeyRelyingPartyValidator.NormalizeOrigin(expectedOrigin);',
  'WebAuthnAuthenticatorData.AssertionDataLength',
  'WebAuthnAuthenticatorData.UserPresentFlag',
  'WebAuthnAuthenticatorData.CreateRpIdHash(credential.RpId)',
  'string canonicalExpectedChallenge = null;',
  'FixedTimeEquals(storedCredentialId, assertionCredentialId)',
  'FixedTimeEquals(storedUserHandle, assertionUserHandle)',
  'assertion.SignCount != ReadUInt32BigEndian(authenticatorData, 33)',
  'value != 2',
  'value != -7',
  'value != 1',
  'x.Length != 32',
  'y.Length != 32',
  'offset != coseKey.Length'
], 'passkey assertion verification should reject authenticatorData RP ID hash, flag, origin, challenge, and metadata mismatches plus stored public keys that are not strict EC2 P-256 ES256 COSE keys');
requireEvery('testsProgram', [
  'PasskeyAssertionRejectsNonEs256PublicKeyCose',
  'passkey assertion verification must reject clientDataJSON origin mismatches',
  'passkey assertion verification must reject authenticatorData without user-present flag',
  'passkey assertion verification must reject unsupported authenticatorData flags',
  'passkey assertion verification must reject trailing authenticatorData bytes',
  'passkey assertion verification must reject authenticatorData RP ID hash mismatches',
  'passkey assertion verification must reject clientDataJSON challenge mismatches',
  'passkey assertion verification must reject credential ID mismatches',
  'passkey assertion verification must reject user handle mismatches',
  'passkey assertion verification must reject sign count metadata mismatches',
  'when kty is not EC2',
  'when alg is not ES256',
  'when crv is not P-256'
], 'strict passkey assertion RP ID hash/flag/origin/challenge/metadata and public-key COSE verification should be covered by backend tests');
requireEvery('passkeyService', [
  'CanonicalizeUserHandle',
  'string canonicalUserHandle = Base64Url.Encode(userHandle);',
  'Stored passkey user handle is invalid.',
  'invalid_user_handle',
  'WebAuthn user handle must be base64url-encoded and between 1 and 64 bytes.'
], 'passkey backend should reject invalid create user handles before approval and canonicalize assertion user handles');
requireEvery('testsProgram', [
  'PasskeyPendingRejectsInvalidCreateUserHandle',
  'BridgeHandlerRejectsInvalidPasskeyUserHandleBeforeApprovalWhenFeatureGateIsEnabled',
  'passkey assertion should return canonical user handle bytes',
  'bridge invalid user handle rejection should not prompt for approval'
], 'invalid passkey user handle rejection should be covered by backend tests');
requireEvery('passkeyService', [
  'TryNormalizeAllowCredentialIds',
  'TryNormalizeCredentialIds',
  'invalid_allow_credential',
  'Passkey allowCredentials contains an invalid credential ID.'
], 'passkey backend should reject invalid get allowCredentials before approval');
requireEvery('testsProgram', [
  'PasskeyPendingRejectsInvalidAllowCredentialIds',
  'PasskeyLookupRejectsInvalidAllowedCredentialIds',
  'BridgeHandlerRejectsInvalidPasskeyListAllowCredentialWhenFeatureGateIsEnabled',
  'BridgeHandlerRejectsInvalidPasskeyAllowCredentialBeforeApprovalWhenFeatureGateIsEnabled',
  'bridge invalid allowCredentials rejection should not prompt for approval'
], 'invalid passkey allowCredentials rejection should be covered by backend tests');
requireEvery('bridgeRequestHandler', [
  'if (!result.Success) return Error(request, result.ErrorCode, result.Error);'
], 'passkey list lookup failures should be returned as bridge errors');
requireEvery('passkeyService', [
  'invalid_exclude_credential',
  'Passkey excludeCredentials contains an invalid credential ID.'
], 'passkey backend should reject invalid create excludeCredentials before approval');
requireEvery('testsProgram', [
  'PasskeyPendingRejectsInvalidExcludeCredentialIds',
  'BridgeHandlerRejectsInvalidPasskeyExcludeCredentialBeforeApprovalWhenFeatureGateIsEnabled',
  'bridge invalid excludeCredentials rejection should not prompt for approval'
], 'invalid passkey excludeCredentials rejection should be covered by backend tests');
requireEvery('protocolModels', [
  'CredentialAlgorithms',
  'Attestation',
  'AuthenticatorAttachment',
  'ResidentKey',
  'ExcludeCredentialIds',
  'TimeoutMs',
  'Hints',
  'RequestedExtensions',
  'UnsupportedExtensions',
  'ClientExtensionResults'
], 'passkey create/get begin payloads should carry credential algorithm, attestation, authenticator attachment, resident-key policy, exclude-credential policy, timeout and UX hints, unsupported-extension policy, and extension-result contracts to the backend');
requireEvery('passkeyService', [
  'UnsupportedCredentialAlgorithmErrorCode',
  'AllowsEs256CredentialAlgorithm',
  'Passkey ES256 public-key credential algorithm is not allowed by this request.'
], 'passkey backend should reject create requests that do not allow ES256');
requireEvery('testsProgram', [
  'PasskeyPendingRejectsUnsupportedCredentialAlgorithm',
  'BridgeHandlerRejectsUnsupportedPasskeyCredentialAlgorithmWhenFeatureGateIsEnabled',
  'unsupported_algorithm'
], 'backend ES256 create-algorithm enforcement should be covered by tests');
requireEvery('passkeyService', [
  'UnsupportedAttestationErrorCode',
  'IsNoneAttestationConveyance',
  'Passkey attestation conveyance is not supported by this build.'
], 'passkey backend should reject unsupported attestation conveyance');
requireEvery('testsProgram', [
  'PasskeyPendingRejectsUnsupportedAttestation',
  'BridgeHandlerRejectsUnsupportedPasskeyAttestationWhenFeatureGateIsEnabled',
  'unsupported_attestation'
], 'backend attestation enforcement should be covered by tests');
requireEvery('passkeyService', [
  'CrossPlatformAuthenticatorAttachment',
  'UnsupportedAuthenticatorAttachmentErrorCode',
  'IsSupportedAuthenticatorAttachment',
  'Passkey authenticator attachment is not supported by this build.'
], 'passkey backend should reject unsupported authenticator attachment');
requireEvery('testsProgram', [
  'PasskeyPendingRejectsUnsupportedAuthenticatorAttachment',
  'BridgeHandlerRejectsUnsupportedPasskeyAuthenticatorAttachmentWhenFeatureGateIsEnabled',
  'bridge unsupported authenticator attachment rejection should not prompt for approval'
], 'backend authenticator attachment enforcement should be covered by tests');
requireEvery('passkeyService', [
  'UnsupportedResidentKeyErrorCode',
  'IsKnownResidentKeyRequirement',
  'NormalizeResidentKeyRequirement',
  'KBB-Passkey-Origin',
  'OriginFromRpId',
  'KBB-Passkey-ResidentKey',
  'Passkey resident-key requirement is not supported by this build.'
], 'passkey backend should reject unknown resident-key requirements and preserve origin plus normalized resident-key metadata');
requireEvery('testsProgram', [
  'PasskeyRegistrationRejectsUnknownResidentKey',
  'PasskeyPendingRejectsUnsupportedResidentKey',
  'BridgeHandlerRejectsUnsupportedPasskeyResidentKeyWhenFeatureGateIsEnabled',
  'bridge unsupported resident-key rejection should not prompt for approval',
  'stored passkey origin mismatch',
  'stored passkey origin fallback mismatch',
  'stored passkey resident-key requirement mismatch'
], 'backend resident-key policy and passkey-origin storage should be covered by tests');
requireEvery('bridgeRequestHandler', [
  'RejectExcludedCreateCredential',
  'excluded_credential_exists',
  'ExcludeCredentialIds'
], 'passkey bridge should reject create requests whose excludeCredentials match existing passkeys');
requireEvery('testsProgram', [
  'BridgeHandlerRejectsPasskeyCreateExcludedCredentialWhenFeatureGateIsEnabled',
  'excluded_credential_exists',
  'bridge excluded credential rejection should not prompt for approval'
], 'backend excludeCredentials enforcement should be covered by tests');
requireEvery('passkeyService', [
  'NormalizePendingTimeoutMs',
  'MaxPendingLifetimeMs'
], 'passkey backend should clamp browser timeout hints to the backend pending-session maximum');
requireEvery('testsProgram', [
  'PasskeyPendingHonorsRequestedTimeoutUpToMaximum',
  'pending create should honor shorter browser request timeout',
  'pending get should clamp long browser request timeout to the backend maximum',
  'pending create should retain WebAuthn hints',
  'pending get should retain WebAuthn hints'
], 'backend pending-session timeout clamping and WebAuthn hint retention should be covered by tests');
requireEvery('bridgeRequestHandler', [
  'CreateClientExtensionResults',
  'PasskeyCredPropsExtensionResult',
  'AuthenticatorData = registration.AuthenticatorData',
  'PublicKey = registration.PublicKey',
  'PasskeyGetCompleteResponsePayload',
  'RpId = pending.Session.RpId',
  'AuthenticatorAttachment = PasskeyService.CrossPlatformAuthenticatorAttachment',
  'Transports = registration.Credential.Transports',
  'Rk = true'
], 'passkey bridge should return requested credProps extension results, authenticator data, RP ID, authenticator attachment, and transport metadata for discoverable credentials');
requireCountAtLeast('bridgeRequestHandler', 'AuthenticatorAttachment = PasskeyService.CrossPlatformAuthenticatorAttachment', 2,
  'passkey bridge should return authenticator attachment metadata for create and get completion responses');
requireEvery('protocolModels', [
  'PasskeyCreateCompleteResponsePayload',
  'PasskeyGetCompleteResponsePayload',
  'public string AuthenticatorData { get; set; }',
  'public string PublicKey { get; set; }',
  'public string AuthenticatorAttachment { get; set; }',
  'public string[] Transports { get; set; }'
], 'passkey complete response contracts should carry authenticator data, SPKI public key data, and attachment metadata to the proxy');
requireCountAtLeast('protocolModels', 'public string AuthenticatorAttachment { get; set; }', 2,
  'passkey create/get complete response contracts should each carry authenticator attachment metadata');
requireEvery('testsProgram', [
  'pending create should retain requested credProps extension state',
  'create complete response should include authenticatorData',
  'create complete response authenticatorData mismatch',
  'AssertP256SubjectPublicKeyInfo',
  'DER prefix mismatch',
  'create complete response should include public key SPKI',
  'create complete response should include cross-platform authenticator attachment',
  'get complete response RP ID mismatch',
  'get complete response should include cross-platform authenticator attachment',
  'create complete response should include normalized transport metadata',
  'create complete response should include requested credProps resident-key result'
], 'backend credProps extension result and complete-response metadata handling should be covered by tests');
requireEvery('passkeyDesign', [
  'create-complete response also carries authenticator data, SPKI publicKey, the cross-platform authenticator attachment, normalized credential transports, public-key COSE storage metadata, and ES256 algorithm metadata',
  'get-complete response carries the RP ID echo and cross-platform authenticator attachment metadata',
  'authenticatorAttachment plus response.authenticatorData/transports/publicKey/publicKeyAlgorithm',
  'create response authenticatorData, transports',
  'create public-key SPKI',
  'create-complete authenticatorData, SPKI publicKey, authenticator attachment, and transport metadata'
], 'passkey design should document complete-response authenticator data, SPKI publicKey, authenticator attachment, transport metadata, and proxy serialization');
requireEvery('passkeyService', [
  'UnsupportedExtensionErrorCode',
  'HasUnsupportedRequestedExtensions',
  'HasUnsupportedExtensionNames',
  'Passkey requested WebAuthn extension is not supported by this build.'
], 'passkey backend should reject unsupported requested WebAuthn extensions');
requireEvery('testsProgram', [
  'PasskeyPendingRejectsUnsupportedRequestedExtension',
  'PasskeyPendingRejectsUnsupportedGetExtension',
  'BridgeHandlerRejectsUnsupportedPasskeyExtensionWhenFeatureGateIsEnabled',
  'BridgeHandlerRejectsUnsupportedPasskeyGetExtensionWhenFeatureGateIsEnabled',
  'bridge unsupported requested extension rejection should not prompt for approval',
  'bridge unsupported requested get extension rejection should not prompt for approval'
], 'backend unsupported requested extension rejection should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeUserVerification',
  'assertUserVerificationSupported',
  'normalizeKnownOptionalEnum',
  'Passkey user verification is not supported by this build.'
], 'passkey proxy should reject required or unknown user verification before bridge calls');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject create requests requiring unsupported user verification',
  'proxy experiment must reject create requests with unknown user verification values',
  'proxy experiment must reject get requests with unknown user verification values',
  'bridge helper must not call backend passkey methods when required user verification is unsupported',
  'lifecycle should reject required user verification before calling handlers'
], 'user verification rejection should be covered by proxy tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeUserHandle',
  'base64UrlByteLength',
  'invalidUserHandleMessage',
  'paddingStart',
  'text !== text.trim()',
  'text.length % 4 !== 0',
  'paddingLength < 1 || paddingLength > 2'
], 'passkey proxy should reject invalid user handles and malformed base64url padding or whitespace before bridge calls');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject create requests with invalid user handles',
  'proxy experiment must reject create requests with malformed-padded user handles',
  'proxy experiment must reject create requests with whitespace-padded user handles',
  'bridge helper must not call backend passkey methods when user handle is invalid'
], 'proxy invalid user handle rejection should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeExcludeCredentialIds',
  "type !== 'public-key'",
  'invalidExcludeCredentialMessage',
  'Passkey excludeCredentials contains an invalid credential ID.'
], 'passkey proxy should reject invalid create excludeCredentials IDs and descriptor types before bridge calls');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject create requests with invalid excludeCredentials',
  'proxy experiment must reject create requests with malformed-padded excludeCredentials',
  'proxy experiment must reject create requests with whitespace-padded excludeCredentials',
  'proxy experiment must reject create requests with unsupported excludeCredentials descriptor types',
  'bridge helper must not call backend passkey methods when excludeCredentials is invalid',
  'bridge helper must not call backend passkey methods when excludeCredentials descriptor type is unsupported'
], 'proxy invalid excludeCredentials ID and descriptor type rejection should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeChallenge',
  'invalidChallengeMessage',
  'base64UrlByteLength'
], 'passkey proxy should reject invalid challenges before bridge calls');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject create requests with short challenges',
  'proxy experiment must reject get requests with invalid challenges',
  'proxy experiment must reject get requests with malformed-padded challenges',
  'proxy experiment must reject get requests with whitespace-padded challenges',
  'bridge helper must not call backend passkey methods when challenge is invalid'
], 'proxy invalid challenge rejection should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeAllowCredentialIds',
  "type !== 'public-key'",
  'invalidAllowCredentialMessage',
  'Passkey allowCredentials contains an invalid credential ID.'
], 'passkey proxy should reject invalid get allowCredentials IDs and descriptor types before bridge calls');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject get requests with invalid allowCredentials',
  'proxy experiment must reject get requests with malformed-padded allowCredentials',
  'proxy experiment must reject get requests with whitespace-padded allowCredentials',
  'proxy experiment must reject get requests with unsupported allowCredentials descriptor types',
  'bridge helper must not call backend passkey methods when allowCredentials is invalid',
  'bridge helper must not call backend passkey methods when allowCredentials descriptor type is unsupported'
], 'proxy invalid allowCredentials ID and descriptor type rejection should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'credentialIdFromSummary',
  'Selected passkey credential was not returned by KeePass.',
  'credentials.some((credential) => credentialIdFromSummary(credential) === credentialId)'
], 'passkey proxy bridge helper should only complete get requests for credentials returned by KeePass');
requireEvery('passkeysProxyTests', [
  'get bridge helper should reject selected credentials that were not returned by KeePass',
  'bridge helper must not complete get requests for unlisted selected credentials',
  'Selected passkey credential was not returned by KeePass.'
], 'proxy selected-credential allow-list enforcement should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'assertBeginMatchesRequest',
  'assertBeginFieldMatches',
  "assertBeginFieldMatches(payload, begin, 'RpId')",
  "assertBeginFieldMatches(payload, begin, 'Origin')",
  'Passkey begin response did not match the WebAuthn request.'
], 'passkey proxy bridge helper should reject mismatched begin response bindings before completion');
requireEvery('passkeysProxyTests', [
  'get bridge helper should reject begin responses for a different WebAuthn request',
  'get bridge helper should reject begin responses with a different origin binding',
  'bridge helper must not complete get requests after mismatched begin responses',
  'bridge helper must not complete get requests after mismatched begin origin responses',
  'Passkey begin response did not match the WebAuthn request.'
], 'proxy begin-response WebAuthn request, RP ID, and origin binding should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'assertCreateCompleteMatchesRequest',
  'assertGetCompleteMatchesRequest',
  "assertCompleteFieldMatches(payload, complete, 'CredentialId')",
  'Passkey complete response did not match the WebAuthn request.',
  'validatedSerializedCreateResponseJson',
  'validatedSerializedGetResponseJson',
  'parseSerializedResponseJson',
  'serializedCredentialId',
  'Passkey complete response credential ID fields did not match.',
  'assertSerializedCredentialType',
  'Passkey complete response credential type was not public-key.',
  'assertBase64UrlCompleteFields',
  'assertOptionalBase64UrlCompleteFields',
  'completeBase64UrlField',
  'completeCredentialId',
  'Passkey complete response contained invalid base64url WebAuthn fields.',
  'assertSerializedTransportMetadata',
  'normalizeTransportArray',
  'normalizeTransportToken',
  'Passkey complete response contained invalid transport metadata.',
  'assertCompleteAuthenticatorAttachment',
  'assertCompleteAuthenticatorAttachmentAliases',
  'completeAuthenticatorAttachment',
  'Passkey complete response authenticator attachment was not cross-platform.',
  'assertSerializedClientExtensionResults',
  'assertCompleteClientExtensionResultAliases',
  'normalizeCompleteClientExtensionResults',
  'unsupportedClientExtensionResultNames',
  'unsupportedCredPropsResultNames',
  'Passkey complete response contained invalid client extension results.',
  'assertRequiredCompleteFields',
  'Passkey complete response was missing required WebAuthn fields.'
], 'passkey proxy bridge helper should reject mismatched complete response bindings before browser completion');
requireCountAtLeast('passkeysProxyExperiment', 'assertBase64UrlCompleteFields(', 5,
  'passkey proxy should validate both object and serialized complete response base64url fields');
requireCountAtLeast('passkeysProxyExperiment', "assertCompleteFieldMatches(payload, complete, 'RpId')", 2,
  'passkey proxy should verify RP ID binding for both create and get complete responses');
requireEvery('passkeysProxyTests', [
  'get bridge helper should reject complete responses for a different selected credential',
  'get bridge helper should reject complete responses for a different RP ID',
  'bridge helper must not return mismatched get complete responses',
  'bridge helper must not return get complete responses with mismatched RP IDs',
  'Passkey complete response did not match the WebAuthn request.',
  'get success should fail closed when KeePass omits required assertion fields',
  'create success should fail closed when pre-serialized responseJson omits required attestation fields',
  'get success should fail closed when pre-serialized responseJson omits required assertion fields',
  'create success should fail closed when pre-serialized responseJson has mismatched id and rawId',
  'get success should fail closed when pre-serialized responseJson has mismatched id and rawId',
  'create success should fail closed when pre-serialized responseJson has an unsupported credential type',
  'get success should fail closed when pre-serialized responseJson has an unsupported credential type',
  'create success should fail closed when pre-serialized responseJson has a non-exact credential type',
  'get success should fail closed when pre-serialized responseJson has a non-exact credential type',
  'create success should fail closed when pre-serialized responseJson has invalid base64url credential IDs',
  'get success should fail closed when pre-serialized responseJson has invalid base64url assertion fields',
  'create success should fail closed when object complete response has invalid base64url credential IDs',
  'get success should fail closed when object complete response has invalid base64url assertion fields',
  'create success should fail closed when object complete response has invalid optional base64url fields',
  'get success should fail closed when object complete response has invalid optional base64url fields',
  'create success should fail closed when pre-serialized responseJson has invalid optional base64url fields',
  'get success should fail closed when pre-serialized responseJson has invalid optional base64url fields',
  'create success should fail closed when pre-serialized responseJson has invalid transport metadata',
  'create success should fail closed when object complete response has unsupported authenticator attachment',
  'get success should fail closed when object complete response has unsupported authenticator attachment',
  'create success should fail closed when pre-serialized responseJson has unsupported authenticator attachment',
  'get success should fail closed when pre-serialized responseJson has unsupported authenticator attachment',
  'create success should fail closed when object complete response has invalid client extension results',
  'get success should fail closed when object complete response has invalid client extension results',
  'create success should fail closed when pre-serialized responseJson has invalid client extension results',
  'get success should fail closed when pre-serialized responseJson has invalid client extension results',
  'create success should fail closed when object complete response has unsupported client extension results',
  'get success should fail closed when object complete response has unsupported client extension results',
  'create success should fail closed when pre-serialized responseJson has unsupported client extension results',
  'get success should fail closed when pre-serialized responseJson has unsupported client extension results',
  'create success should fail closed when object complete response has unsupported credProps result fields',
  'get success should fail closed when object complete response has unsupported credProps result fields',
  'create success should fail closed when pre-serialized responseJson has unsupported credProps result fields',
  'get success should fail closed when pre-serialized responseJson has unsupported credProps result fields',
  'create success should fail closed when object complete response has conflicting client extension result aliases',
  'get success should fail closed when object complete response has conflicting client extension result aliases',
  'create success should fail closed when pre-serialized responseJson has conflicting client extension result aliases',
  'get success should fail closed when pre-serialized responseJson has conflicting client extension result aliases',
  'create success should fail closed when object complete response has conflicting authenticator attachment aliases',
  'get success should fail closed when object complete response has conflicting authenticator attachment aliases',
  'create success should fail closed when pre-serialized responseJson has conflicting authenticator attachment aliases',
  'get success should fail closed when pre-serialized responseJson has conflicting authenticator attachment aliases',
  'create success should fail closed when object complete response has invalid base64url field aliases',
  'get success should fail closed when object complete response has invalid base64url field aliases',
  'create success should fail closed when pre-serialized responseJson has invalid base64url field aliases',
  'get success should fail closed when pre-serialized responseJson has invalid base64url field aliases',
  'create success should fail closed when object complete response has invalid credential ID aliases',
  'get success should fail closed when object complete response has invalid credential ID aliases',
  'create success should fail closed when object complete response has mismatched credential ID aliases',
  'get success should fail closed when object complete response has mismatched credential ID aliases',
  "Transports: ['Internal', 'usb', 'usb', 'invalid value', 'hybrid', '']",
  "transports: ['internal', 'usb', 'hybrid']",
  'Passkey complete response credential ID fields did not match.',
  'Passkey complete response credential type was not public-key.',
  'Passkey complete response contained invalid base64url WebAuthn fields.',
  'Passkey complete response contained invalid transport metadata.',
  'Passkey complete response authenticator attachment was not cross-platform.',
  'Passkey complete response contained invalid client extension results.',
  'Passkey complete response was missing required WebAuthn fields.'
], 'proxy complete-response WebAuthn request, RP ID, credential, and required-field binding should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'assertEs256CredentialAlgorithmAllowed',
  'normalizeCredentialAlgorithms',
  'CredentialAlgorithms',
  'Passkey ES256 public-key credential algorithm is not allowed by this request.'
], 'passkey proxy should reject create requests that do not allow ES256');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject create requests missing ES256 public-key credential parameters',
  'proxy experiment must reject create requests that do not allow ES256 credentials',
  'CredentialAlgorithms: [-257, -7]',
  'bridge helper must not call backend passkey methods when ES256 is not allowed by the request'
], 'ES256 create-algorithm enforcement should be covered by proxy tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeAttestationConveyance',
  'assertAttestationSupported',
  'Passkey attestation conveyance is not supported by this build.'
], 'passkey proxy should reject unsupported attestation conveyance before bridge calls');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject create requests requiring unsupported attestation conveyance',
  'proxy experiment must reject create requests with unknown attestation conveyance',
  'bridge helper must not call backend passkey methods when attestation conveyance is unsupported'
], 'proxy attestation enforcement should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeAuthenticatorAttachment',
  'assertAuthenticatorAttachmentSupported',
  'Passkey authenticator attachment is not supported by this build.'
], 'passkey proxy should reject unsupported authenticator attachment before bridge calls');
requireEvery('passkeysProxyTests', [
  'proxy experiment must reject create requests requiring unsupported authenticator attachment',
  'proxy experiment must reject create requests with unknown authenticator attachment',
  'bridge helper must not call backend passkey methods when authenticator attachment is unsupported',
  "authenticatorAttachment: 'cross-platform'",
  "AuthenticatorAttachment: 'cross-platform'"
], 'proxy authenticator attachment enforcement should be covered by tests');
requireCountAtLeast('passkeysProxyTests', "authenticatorAttachment: 'cross-platform'", 2,
  'proxy success serialization should include authenticator attachment for create and get completions');
requireEvery('passkeysProxyExperiment', [
  'normalizeResidentKey',
  'requireResidentKey',
  'Passkey resident-key requirement is not supported by this build.',
  'ResidentKey'
], 'passkey proxy should normalize resident-key requirements before bridge calls');
requireEvery('passkeysProxyTests', [
  "ResidentKey: 'preferred'",
  'legacy requireResidentKey=true',
  'proxy experiment must reject create requests with unknown resident-key requirements',
  'bridge helper must not call backend passkey methods when resident-key requirement is unsupported'
], 'proxy resident-key policy handling should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeExcludeCredentialIds',
  'normalizeCredentialDescriptorIds',
  'ExcludeCredentialIds'
], 'passkey proxy should forward create excludeCredentials to the backend');
requireEvery('passkeysProxyTests', [
  "ExcludeCredentialIds: ['YQ', 'ZXhjbHVkZS0y']"
], 'proxy excludeCredentials mapping should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeTimeoutMs',
  'normalizeHints',
  'TimeoutMs',
  'Hints'
], 'passkey proxy should forward normalized browser timeout and WebAuthn UX hints to the backend');
requireEvery('passkeysProxyTests', [
  'TimeoutMs: 45000',
  'TimeoutMs: 12000',
  "Hints: ['hybrid', 'security-key']",
  "Hints: ['client-device', 'hybrid']"
], 'proxy timeout and WebAuthn hint mapping should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'requestTimeoutMs',
  'scheduleRequestTimeout',
  'handleTimedOut',
  'clearPendingTimer',
  'Passkey WebAuthn request timed out.',
  "'timeout'"
], 'passkey proxy lifecycle should fail closed and clean up pending requests when browser WebAuthn timeouts expire');
requireEvery('passkeysProxyTests', [
  'lifecycle should schedule pending cleanup from the WebAuthn request timeout',
  'timeout cleanup should report timeout as the cancellation reason',
  'lifecycle should complete timed-out WebAuthn requests with a WebAuthn error',
  'timed-out WebAuthn requests must not complete success after the handler resolves'
], 'proxy WebAuthn timeout cleanup should be covered by lifecycle tests');
requireEvery('passkeysProxyExperiment', [
  'completePendingErrorBestEffort',
  'Passkey WebAuthn request was canceled.',
  'completeCreateError(chromeLike, requestId, error)',
  'completeGetError(chromeLike, requestId, error)'
], 'passkey proxy explicit cleanup should complete pending browser WebAuthn requests with an error');
requireEvery('passkeysProxyTests', [
  'explicit lifecycle cleanup should complete pending browser WebAuthn requests with an error',
  'lock-canceled get request must not be completed after the handler resolves',
  'Passkey WebAuthn request was canceled.'
], 'proxy explicit cleanup error completion should be covered by lifecycle tests');
requireEvery('background', [
  'clearPendingPasskeyState',
  "clearSensitiveRuntimeState('client-revoke')",
  "await lifecycle.cancelPending(reason || 'clear')"
], 'background lock, auto-lock, and current-client revoke should trigger passkey proxy cleanup');
requireEvery('backgroundTests', [
  "passkeyCleanupCalls.at(-1), 'client-revoke'",
  'current client revoke should cancel pending passkey proxy requests',
  "passkeyCleanupCalls.at(-1), 'lock'",
  "passkeyCleanupCalls.at(-1), 'auto-lock'"
], 'background passkey proxy cleanup hooks should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'normalizeRequestedExtensions',
  'assertNoUnsupportedGetExtensions',
  'unsupportedRequestedExtensionNames',
  'Passkey requested WebAuthn extension is not supported by this build.',
  'normalizeClientExtensionResults',
  'normalizeCompleteClientExtensionResults',
  'assertCompleteClientExtensionResultAliases',
  'unsupportedClientExtensionResultNames',
  'unsupportedCredPropsResultNames',
  'const authenticatorData = completeBase64UrlField',
  'assertRequiredCompleteFields(credentialId, clientDataJson, attestationObject)',
  'response && response.PublicKey',
  'PublicKeyCose',
  'publicKeyAlgorithm: publicKey ? -7 : undefined',
  'credProps'
], 'passkey proxy should map requested credProps, serialize create authenticator/public-key metadata, and reject unsupported WebAuthn extensions');
requireEvery('passkeysProxyTests', [
  'RequestedExtensions: { CredProps: true }',
  'proxy experiment must reject create requests with unsupported WebAuthn extensions',
  'proxy experiment must reject get requests with unsupported WebAuthn extensions',
  'bridge helper must not call backend passkey methods when requested extensions are unsupported',
  'bridge helper must not call backend get passkey methods when requested extensions are unsupported',
  "authenticatorData: 'YXV0aC1jcmVhdGU'",
  "PublicKey: 'c3BraS1wdWJsaWMta2V5'",
  "publicKey: 'c3BraS1wdWJsaWMta2V5'",
  'publicKeyAlgorithm: -7',
  'credProps: {',
  'rk: true',
  'appid: true',
  'unexpected: true'
], 'proxy WebAuthn extension and create public-key serialization handling should be covered by tests');
requireEvery('passkeysProxyExperiment', [
  'duplicatePendingRequestMessage',
  'pending.has(requestId)',
  "'duplicate'"
], 'passkey proxy should reject duplicate pending WebAuthn request IDs');
requireEvery('passkeysProxyTests', [
  'lifecycle should not call get handlers for duplicate pending WebAuthn request IDs',
  'duplicate-canceled WebAuthn requests must not complete success after the original handler resolves'
], 'duplicate pending WebAuthn request ID rejection should be covered by proxy tests');

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
  'PORTABLE_SETTING_DEFAULTS',
  'PORTABLE_SETTING_KEYS',
  'chrome.storage.local.get(PORTABLE_SETTING_DEFAULTS',
  'Object.prototype.hasOwnProperty.call(source, key)',
  'sanitizePortableSettings',
  'normalizeSiteOverrides',
  'isValidSiteOverrideHost'
], 'settings import/export should use a portable allowlist instead of exporting extension runtime state');
requireEvery('optionsTests', [
  'portable settings should contain only allowlisted user configuration keys',
  'unknownRuntimeState',
  'client-secret-id',
  'pairing-secret',
  'bad host',
  '*.example.com',
  'tenant_name.example.com',
  'portable settings should normalize site overrides and drop invalid or duplicate hosts before export or import',
  'portable settings should preserve disabled auto-lock',
  'portable settings import should reject non-loopback bridge endpoints'
], 'settings import/export allowlist minimization should be covered by fast options tests');
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
  'malformed padding',
  'browser-facing WebAuthn packaging remains future work'
], 'future WebAuthn permissions should stay routed through the passkey design');
requireIncludes('securityThreatModel', 'strict base64url alphabet/padding/whitespace validation',
  'security threat model should track strict passkey base64url decoding');
requireNotIncludes('manifest', 'webAuthenticationProxy',
  'Chrome manifest should not request WebAuthn proxy permission before review');
requireNotIncludes('firefoxManifest', 'webAuthenticationProxy',
  'Firefox manifest should not request unsupported WebAuthn proxy permission');
requireEvery('releaseReadiness', [
  'passkeys/WebAuthn are not supported',
  'docs/passkeys-webauthn-design.md'
], 'release readiness should prevent premature WebAuthn listing claims');

console.log(`Security threat-model verification passed (${checks.length} checks).`);
