using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.Serialization;
using System.Security.Cryptography;
using System.Text;
using KeePassBrowserBridge.Bridge;
using KeePassLib;
using KeePassLib.Security;

internal static class Program
{
    private static int Main()
    {
        ExactHostMatchesIgnoringPathAndCase();
        ParentDomainDoesNotMatchByDefault();
        WildcardSubdomainMatchesChildHost();
        WildcardSubdomainDoesNotMatchParentHost();
        WildcardPathMatchesSameHostPath();
        InvalidUrlsDoNotMatch();
        HttpAndHttpsWithSameHostMatch();
        DifferentHostsDoNotMatch();
        BridgeClockConvertsUnixMillisecondsToUtcDateTime();
        TotpGeneratorMatchesRfcVector();
        TotpGeneratorParsesOtpAuthUri();
        PasskeyRpIdValidationAllowsMatchingOriginAndSubdomain();
        PasskeyRpIdValidationRejectsMismatchedOrigin();
        PasskeyBase64UrlRejectsStandardBase64Alphabet();
        PasskeyBase64UrlRejectsMalformedPadding();
        PasskeyBase64UrlRejectsWhitespace();
        PasskeyRegistrationCreatesCredentialAndAttestation();
        PasskeyRegistrationRejectsRequiredUserVerification();
        PasskeyRegistrationRejectsUnknownUserVerification();
        PasskeyRegistrationRejectsUnknownResidentKey();
        PasskeyCredentialIdsAreUnique();
        PasskeyAssertionSignsChallengeAndIncrementsCounter();
        PasskeyAssertionRejectsNonEs256PublicKeyCose();
        PasskeyAssertionRejectsRequiredUserVerification();
        PasskeyAssertionRejectsUnknownUserVerification();
        PasskeyEntryStoreProtectsPrivateKeyMaterial();
        PasskeyLookupListsMatchingRpIdWithoutPrivateKeyMaterial();
        PasskeyLookupFiltersAllowedCredentialIds();
        PasskeyLookupRejectsInvalidAllowedCredentialIds();
        PasskeyLookupRejectsMismatchedOrigin();
        PasskeyPendingCreateBindsRequestContext();
        PasskeyPendingRejectsUnsupportedRequestedExtension();
        PasskeyPendingRejectsUnsupportedGetExtension();
        PasskeyPendingRejectsInvalidCreateUserHandle();
        PasskeyPendingRejectsInvalidExcludeCredentialIds();
        PasskeyPendingHonorsRequestedTimeoutUpToMaximum();
        PasskeyPendingCompletionRequiresMatchingBindingAndConsumes();
        PasskeyPendingGetRejectsCredentialOutsideAllowList();
        PasskeyPendingRejectsInvalidAllowCredentialIds();
        PasskeyPendingRejectsRequiredUserVerification();
        PasskeyPendingRejectsUnknownUserVerification();
        PasskeyPendingRejectsUnsupportedCredentialAlgorithm();
        PasskeyPendingRejectsUnsupportedAttestation();
        PasskeyPendingRejectsUnsupportedAuthenticatorAttachment();
        PasskeyPendingRejectsUnsupportedResidentKey();
        PasskeyPendingRejectsDuplicateLiveWebAuthnRequestId();
        PasskeyPendingCompletionExpiresStaleSession();
        PasskeyPendingClearForClientRemovesOnlyClientSessions();
        PasskeyPendingClearAllRemovesEverySession();
        ValidHelloRequestPassesValidation();
        UnknownMethodFailsValidation();
        MissingOriginFailsValidation();
        WebPageOriginFailsValidation();
        FirefoxExtensionOriginPassesValidation();
        MalformedExtensionOriginFailsValidation();
        NonCanonicalExtensionOriginFailsValidation();
        StaleTimestampFailsValidation();
        WrongProtocolVersionFailsValidation();
        PasskeyMethodPassesProtocolValidation();
        BridgeMethodPolicyCoversEveryBridgeMethod();
        BridgeMethodPolicyAssignsExpectedPermissions();
        UpdateCheckerReadsCurrentVersionFromAssembly();
        UpdateCheckerDetectsNewerSemanticVersions();
        UpdateCheckerIgnoresSameOrInvalidVersions();
        UpdateCheckerSelectsNewestSemanticTag();
        UpdateCheckerBuildsPluginAssetUrl();
        UpdateCheckerAlwaysBuildsPlgxAssetUrl();
        UpdateCheckerSelectsNewestReleaseWithPlgxAsset();
        UpdateCheckerSkipsReleaseWithoutChecksumAsset();
        UpdateCheckerExtractsExpectedPluginChecksum();
        UpdateCheckerVerifiesDownloadedPluginChecksum();
        PairingSessionGeneratesSixDigitCode();
        PairingSessionStoresExtensionOriginFromBegin();
        WrongPairingCodeIsRejected();
        PairingCompletionRejectsDifferentOrigin();
        NewPairingSessionCancelsOlderSessionForSameClient();
        PairingSessionLocksAfterRepeatedWrongCodes();
        CancelledPairingSessionCannotComplete();
        ExpiredPairingCodeIsRejected();
        SuccessfulPairingCreatesTrustedClient();
        RevokedClientIsNoLongerTrusted();
        TrustedClientStorePersistsRoundTrip();
        TrustedClientDefaultPermissionsDoNotGrantPasskeys();
        TrustedClientPermissionUpdateAcceptsPasskeyPermissions();
        CredentialQueryReturnsExactHostMatch();
        CredentialQueryMatchesParentDomainWhenStrictMatchingIsDisabled();
        CredentialQueryMatchesWwwEntryToApexPageWhenStrictMatchingIsDisabled();
        CredentialQueryIgnoresRegexPatternWhenRegexMatchingIsDisabled();
        CredentialQueryMatchesAdditionalUrlField();
        CredentialQueryIncludesKeePassGroupPath();
        CredentialQueryIncludesUsageMetadata();
        CredentialQueryIncludesOneTimePassword();
        CredentialQueryRedactsProtectedCustomFieldValues();
        CredentialQuerySkipsPasskeyOnlyEntries();
        CredentialQueryRejectsUnrelatedDomain();
        CredentialQueryRejectsClosedDatabase();
        CredentialMutationCreatesEntryInDatabase();
        CredentialMutationCreatesEntryInRequestedGroup();
        CredentialMutationCreatesEntryWithTotpSecret();
        CredentialMutationCreatesEntryWithCustomField();
        CredentialMutationUpdatesExistingEntryPassword();
        CredentialMutationAcceptsPageUrlFromAdditionalUrlField();
        CredentialMutationUpdatesExistingEntryFields();
        CredentialMutationUpdatesExistingEntryCustomField();
        CredentialMutationReplacesExistingEntryCustomFields();
        CredentialMutationMovesExistingEntryToRequestedGroup();
        CredentialMutationMovesExistingEntryToRootWhenGroupIsBlank();
        CredentialMutationUpdatesExistingEntryTotpSecret();
        CredentialMutationClearsExistingEntryTotpSecret();
        BridgeHandlerHelloDoesNotRequireAuthentication();
        BridgeHandlerRejectsBadHmacForTrustedMethod();
        BridgeHandlerAcceptsValidHmacForClientStatus();
        BridgeHandlerClientStatusIncludesPermissions();
        BridgeHandlerPairBeginPassesOriginToPairingPrompt();
        BridgeHandlerPairCompleteStoresExtensionOrigin();
        BridgeHandlerRejectsAuthenticatedRequestFromDifferentExtensionOrigin();
        BridgeHandlerRejectsReplayedAuthenticatedRequestId();
        BridgeHandlerReturnsStructuredErrorForMalformedPayload();
        BridgeHandlerCancelsPairingSession();
        BridgeHandlerListsTrustedClientsWithoutSecrets();
        BridgeHandlerListsTrustedClientOrigins();
        BridgeHandlerTracksTrustedClientLastUsed();
        BridgeHandlerListsTrustedClientLastUsed();
        BridgeHandlerRevokesTrustedClient();
        BridgeHandlerRejectsWriteWhenTrustedClientIsReadOnly();
        BridgeHandlerListsTrustedClientPermissions();
        BridgeHandlerUpdatesTrustedClientPermissions();
        BridgeHandlerDoesNotGrantFullPermissionsForEmptyPermissionUpdate();
        BridgeHandlerKeepsReadPermissionWhenUpdatingElevatedPermissions();
        BridgeHandlerRejectsPasskeyReadWithoutPasskeyPermission();
        BridgeHandlerRejectsPasskeyWriteWithOnlyPasskeyRead();
        BridgeHandlerReturnsFeatureDisabledForPermittedPasskeyMethod();
        BridgeHandlerReturnsFeatureDisabledForPermittedPasskeyWriteMethod();
        BridgeHandlerListsPasskeysWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsInvalidPasskeyListAllowCredentialWhenFeatureGateIsEnabled();
        BridgeHandlerBeginsPasskeyCreateWhenFeatureGateIsEnabled();
        BridgeHandlerBeginsPasskeyGetWithCredentialSummariesWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsInvalidPasskeyAllowCredentialBeforeApprovalWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsInvalidPasskeyExcludeCredentialBeforeApprovalWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsRequiredPasskeyUserVerificationWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsUnknownPasskeyUserVerificationWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsInvalidPasskeyUserHandleBeforeApprovalWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsUnsupportedPasskeyCredentialAlgorithmWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsUnsupportedPasskeyAttestationWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsUnsupportedPasskeyAuthenticatorAttachmentWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsUnsupportedPasskeyResidentKeyWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsUnsupportedPasskeyExtensionWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsUnsupportedPasskeyGetExtensionWhenFeatureGateIsEnabled();
        BridgeHandlerRejectsPasskeyCreateExcludedCredentialWhenFeatureGateIsEnabled();
        BridgeHandlerDeniedPasskeyCreateApprovalCancelsPendingSession();
        BridgeHandlerDeniedPasskeyGetApprovalCancelsPendingSession();
        BridgeHandlerCompletesPasskeyCreateAndSavesDatabaseWhenFeatureGateIsEnabled();
        BridgeHandlerCompletesPasskeyGetSignsAssertionAndSavesDatabaseWhenFeatureGateIsEnabled();
        BridgeHandlerPersistsPasskeySignCountAcrossGetSessions();
        BridgeHandlerRejectsReplayedPasskeyCreateCompletionRequestId();
        BridgeHandlerRejectsReplayedPasskeyGetCompletionRequestId();
        BridgeHandlerRevokesPasskeyAndSavesDatabaseWhenFeatureGateIsEnabled();
        BridgeHandlerCancelsPendingPasskeySessionWhenFeatureGateIsEnabled();
        BridgeHandlerRevokingClientClearsPendingPasskeySessions();
        BridgeHandlerClearPendingPasskeySessionsRejectsLaterCompletion();
        BridgeHandlerReturnsLoginsForAuthenticatedQuery();
        BridgeHandlerCreatesLoginForAuthenticatedRequest();
        BridgeHandlerSavesDatabaseAfterSuccessfulCreate();
        BridgeHandlerDoesNotSaveDatabaseAfterFailedCreate();
        BridgeHandlerUpdatesLoginForAuthenticatedRequest();
        BridgeHandlerSavesDatabaseAfterSuccessfulUpdate();
        BridgeHandlerUpdatesUsageAfterFillAck();
        LoopbackBridgeServerRespondsToHello();
        LoopbackBridgeServerRejectsWebPreflightOrigin();
        LoopbackBridgeServerRejectsPreflightWithoutOrigin();
        LoopbackBridgeServerAllowsExtensionPreflightOrigin();
        LoopbackBridgeServerRejectsExtensionPreflightForWrongPath();
        LoopbackBridgeServerRejectsUnsupportedPreflightMethod();
        LoopbackBridgeServerRejectsUnsupportedPreflightHeaders();
        LoopbackBridgeServerRejectsWebPostOriginBeforeHandling();
        LoopbackBridgeServerRejectsNonJsonPostBeforeHandling();
        LoopbackBridgeServerRejectsMalformedJsonBeforeHandling();
        LoopbackBridgeServerRejectsOversizedPostBeforeHandling();
        LoopbackBridgeServerRejectsMismatchedHeaderAndRequestOriginBeforeHandling();
        LoopbackBridgeServerTryStartReportsPortConflict();
        return 0;
    }

    private static void ExactHostMatchesIgnoringPathAndCase()
    {
        AssertTrue(UrlMatcher.IsMatch("https://Example.com/login", "https://example.com/account"),
            "same host with different path/case should match");
    }

    private static void ParentDomainDoesNotMatchByDefault()
    {
        AssertFalse(UrlMatcher.IsMatch("https://example.com/login", "https://accounts.example.com/login"),
            "parent domain should not match subdomain in MVP");
    }

    private static void WildcardSubdomainMatchesChildHost()
    {
        AssertTrue(UrlMatcher.IsMatch("https://*.example.com/*", "https://accounts.example.com/login"),
            "wildcard subdomain URL should match a child host");
    }

    private static void WildcardSubdomainDoesNotMatchParentHost()
    {
        AssertFalse(UrlMatcher.IsMatch("https://*.example.com/*", "https://example.com/login"),
            "wildcard subdomain URL should not match the parent host itself");
    }

    private static void WildcardPathMatchesSameHostPath()
    {
        AssertTrue(UrlMatcher.IsMatch("https://example.com/login/*", "https://example.com/login/password"),
            "wildcard path URL should match same-host child path");
    }

    private static void InvalidUrlsDoNotMatch()
    {
        AssertFalse(UrlMatcher.IsMatch("not a url", "https://example.com"),
            "invalid entry URL should not match");
        AssertFalse(UrlMatcher.IsMatch("https://example.com", "not a url"),
            "invalid origin URL should not match");
    }

    private static void HttpAndHttpsWithSameHostMatch()
    {
        AssertTrue(UrlMatcher.IsMatch("http://example.com", "https://example.com/login"),
            "scheme should not block same-host matching");
    }

    private static void DifferentHostsDoNotMatch()
    {
        AssertFalse(UrlMatcher.IsMatch("https://example.com", "https://evil.example.net"),
            "different hosts should not match");
    }

    private static void BridgeClockConvertsUnixMillisecondsToUtcDateTime()
    {
        DateTime value = BridgeClock.FromUtcMilliseconds(1779960000000);

        AssertEqual(DateTimeKind.Utc, value.Kind, "bridge clock conversion should return UTC");
        AssertEqual(2026, value.Year, "bridge clock year mismatch");
        AssertEqual(5, value.Month, "bridge clock month mismatch");
        AssertEqual(28, value.Day, "bridge clock day mismatch");
    }

    private static void TotpGeneratorMatchesRfcVector()
    {
        TotpResult result = TotpGenerator.Generate("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 59000);

        AssertTrue(result.Success, "TOTP generation should succeed: " + result.Error);
        AssertEqual("287082", result.Code, "TOTP RFC vector mismatch");
    }

    private static void TotpGeneratorParsesOtpAuthUri()
    {
        TotpResult result = TotpGenerator.Generate(
            "otpauth://totp/Example:alice?secret=JBSWY3DPEHPK3PXP&issuer=Example&digits=8&period=60",
            1779960000000);

        AssertTrue(result.Success, "otpauth URI generation should succeed: " + result.Error);
        AssertEqual(8, result.Code.Length, "otpauth digits parameter should control code length");
    }

    private static void PasskeyRpIdValidationAllowsMatchingOriginAndSubdomain()
    {
        AssertTrue(PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin("example.com", "https://example.com/login"),
            "passkey RP ID should match the exact HTTPS origin host");
        AssertTrue(PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin("example.com", "https://accounts.example.com/login"),
            "passkey RP ID should match a subdomain origin host");
    }

    private static void PasskeyRpIdValidationRejectsMismatchedOrigin()
    {
        AssertFalse(PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin("example.com", "https://evil-example.com/login"),
            "passkey RP ID validation must reject suffix lookalike hosts");
        AssertFalse(PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin("example.com", "http://example.com/login"),
            "passkey RP ID validation must reject non-local HTTP origins");
        AssertFalse(PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin("127.0.0.1", "https://127.0.0.1/login"),
            "passkey RP ID validation must reject IP-address RP IDs");
    }

    private static void PasskeyBase64UrlRejectsStandardBase64Alphabet()
    {
        byte[] bytes;

        AssertFalse(Base64Url.TryDecode("+w", out bytes),
            "passkey base64url decoder must reject standard base64 plus characters");
        AssertFalse(Base64Url.TryDecode("_/8", out bytes),
            "passkey base64url decoder must reject standard base64 slash characters");
        AssertTrue(Base64Url.TryDecode("-_8", out bytes),
            "passkey base64url decoder should accept URL-safe alphabet characters");
    }

    private static void PasskeyBase64UrlRejectsMalformedPadding()
    {
        byte[] bytes;

        AssertFalse(Base64Url.TryDecode("AA=", out bytes),
            "passkey base64url decoder must reject short malformed padding");
        AssertFalse(Base64Url.TryDecode("AAA==", out bytes),
            "passkey base64url decoder must reject overpadded values");
        AssertFalse(Base64Url.TryDecode("AA=A", out bytes),
            "passkey base64url decoder must reject data after padding");
        AssertTrue(Base64Url.TryDecode("AA==", out bytes),
            "passkey base64url decoder should accept valid double padding");
        AssertTrue(Base64Url.TryDecode("AAA=", out bytes),
            "passkey base64url decoder should accept valid single padding");
    }

    private static void PasskeyBase64UrlRejectsWhitespace()
    {
        byte[] bytes;

        AssertFalse(Base64Url.TryDecode(" YQ==", out bytes),
            "passkey base64url decoder must reject leading whitespace");
        AssertFalse(Base64Url.TryDecode("YQ== ", out bytes),
            "passkey base64url decoder must reject trailing whitespace");
        AssertFalse(Base64Url.TryDecode("Y Q==", out bytes),
            "passkey base64url decoder must reject embedded whitespace");
    }

    private static void PasskeyRegistrationCreatesCredentialAndAttestation()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationRequest request = CreatePasskeyRegistrationRequest();
        string canonicalChallenge = request.Challenge;
        string canonicalOrigin = "https://example.com";
        request.Challenge = canonicalChallenge + "==";
        request.RpId = "Example.com.";

        PasskeyRegistrationResult result = service.CreateCredential(request);

        AssertTrue(result.Success, "passkey registration prototype should create credential material: " + result.Error);
        AssertTrue(!string.IsNullOrWhiteSpace(result.Credential.CredentialId), "passkey credential ID should be generated");
        AssertTrue(!string.IsNullOrWhiteSpace(result.Credential.PublicKeyCose), "passkey COSE public key should be generated");
        AssertTrue(!string.IsNullOrWhiteSpace(result.PublicKey), "passkey registration result should include public key SPKI");
        AssertTrue(!string.IsNullOrWhiteSpace(result.Credential.PrivateKey), "passkey private key material should be generated for protected KeePass storage");
        AssertEqual("example.com", result.Credential.RpId, "passkey RP ID should be normalized");
        AssertEqual(canonicalOrigin, result.Credential.Origin, "passkey credential origin should be normalized to a WebAuthn origin");
        AssertEqual("preferred", result.Credential.UserVerification, "passkey user verification should be normalized");
        AssertEqual("preferred", result.Credential.ResidentKey, "passkey resident-key requirement should be normalized");
        AssertEqual(2, result.Credential.Transports.Length, "passkey transports should be normalized and de-duplicated");
        AssertEqual("internal", result.Credential.Transports[0], "first passkey transport mismatch");
        AssertEqual("usb", result.Credential.Transports[1], "second passkey transport mismatch");
        AssertEqual((uint)0, result.Credential.SignCount, "new passkey credential should start with sign count 0");

        byte[] clientDataJson;
        byte[] attestationObject;
        byte[] credentialId;
        byte[] publicKeyCose;
        byte[] publicKeySpki;
        AssertTrue(Base64Url.TryDecode(result.ClientDataJson, out clientDataJson), "passkey clientDataJSON should be base64url encoded");
        AssertTrue(Base64Url.TryDecode(result.AttestationObject, out attestationObject), "passkey attestationObject should be base64url encoded");
        AssertTrue(Base64Url.TryDecode(result.Credential.CredentialId, out credentialId), "passkey credential ID should be base64url encoded");
        AssertTrue(Base64Url.TryDecode(result.Credential.PublicKeyCose, out publicKeyCose), "passkey public key COSE should be base64url encoded");
        AssertTrue(Base64Url.TryDecode(result.PublicKey, out publicKeySpki), "passkey public key SPKI should be base64url encoded");
        AssertP256SubjectPublicKeyInfo(publicKeySpki, publicKeyCose, "registration public key SPKI");
        AssertWebAuthnClientData(clientDataJson, "webauthn.create", canonicalChallenge, canonicalOrigin,
            "registration clientDataJSON");
        byte[] authData = ReadNoneAttestationAuthData(attestationObject);
        AssertEqual(37 + 16 + 2 + credentialId.Length + publicKeyCose.Length, authData.Length,
            "registration authenticatorData should include fixed header, AAGUID, credential ID, and public key");
        AssertByteArrayEqual(Sha256(Encoding.ASCII.GetBytes("example.com")), Slice(authData, 0, 32),
            "registration authenticatorData RP ID hash mismatch");
        AssertEqual((byte)0x41, authData[32],
            "registration authenticatorData should set user-present and attested-credential flags only");
        AssertEqual((uint)0, ReadUInt32BigEndian(authData, 33),
            "registration authenticatorData sign count should start at zero");
        AssertByteArrayEqual(new byte[16], Slice(authData, 37, 16),
            "registration authenticatorData should use a zero AAGUID for none attestation prototype");
        AssertEqual(credentialId.Length, ReadUInt16BigEndian(authData, 53),
            "registration authenticatorData credential ID length mismatch");
        AssertByteArrayEqual(credentialId, Slice(authData, 55, credentialId.Length),
            "registration authenticatorData credential ID mismatch");
        AssertByteArrayEqual(publicKeyCose, Slice(authData, 55 + credentialId.Length, publicKeyCose.Length),
            "registration authenticatorData public key COSE mismatch");
    }

    private static void PasskeyRegistrationRejectsRequiredUserVerification()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationRequest request = CreatePasskeyRegistrationRequest();
        request.UserVerification = "required";

        PasskeyRegistrationResult result = service.CreateCredential(request);

        AssertFalse(result.Success, "passkey registration should reject required user verification until KeePass-side verification exists");
        AssertEqual("unsupported_user_verification", result.ErrorCode,
            "required user verification registration error code mismatch");
    }

    private static void PasskeyRegistrationRejectsUnknownUserVerification()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationRequest request = CreatePasskeyRegistrationRequest();
        request.UserVerification = "future-required";

        PasskeyRegistrationResult result = service.CreateCredential(request);

        AssertFalse(result.Success, "passkey registration should reject unknown user verification policy values");
        AssertEqual("unsupported_user_verification", result.ErrorCode,
            "unknown user verification registration error code mismatch");
    }

    private static void PasskeyRegistrationRejectsUnknownResidentKey()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationRequest request = CreatePasskeyRegistrationRequest();
        request.ResidentKey = "future-resident-key";

        PasskeyRegistrationResult result = service.CreateCredential(request);

        AssertFalse(result.Success, "passkey registration should reject unknown resident-key requirement values");
        AssertEqual("unsupported_resident_key", result.ErrorCode,
            "unknown resident-key registration error code mismatch");
    }

    private static void PasskeyCredentialIdsAreUnique()
    {
        PasskeyService service = new PasskeyService();

        PasskeyRegistrationResult first = service.CreateCredential(CreatePasskeyRegistrationRequest());
        PasskeyRegistrationResult second = service.CreateCredential(CreatePasskeyRegistrationRequest());

        AssertTrue(first.Success, "first passkey registration should succeed: " + first.Error);
        AssertTrue(second.Success, "second passkey registration should succeed: " + second.Error);
        AssertFalse(string.Equals(first.Credential.CredentialId, second.Credential.CredentialId, StringComparison.Ordinal),
            "passkey credential IDs should be generated uniquely");
    }

    private static void PasskeyAssertionSignsChallengeAndIncrementsCounter()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before assertion: " + registration.Error);
        string canonicalChallenge = Base64Url.Encode(Encoding.ASCII.GetBytes("fedcba9876543210"));
        string canonicalOrigin = "https://example.com";
        string canonicalUserHandle = Base64Url.Encode(Encoding.ASCII.GetBytes("alice"));
        registration.Credential.UserHandle = canonicalUserHandle + "=";

        PasskeyAssertionResult assertion = service.CreateAssertion(registration.Credential, new PasskeyAssertionRequest
        {
            RpId = "Example.com.",
            Origin = "https://example.com/login",
            Challenge = canonicalChallenge + "=="
        });

        AssertTrue(assertion.Success, "passkey assertion prototype should sign a challenge: " + assertion.Error);
        AssertEqual(canonicalUserHandle, assertion.Assertion.UserHandle,
            "passkey assertion should return canonical user handle bytes");
        AssertEqual((uint)1, assertion.Assertion.SignCount, "passkey assertion should return incremented sign count");
        AssertEqual((uint)1, registration.Credential.SignCount, "passkey assertion should persist incremented sign count in material");
        AssertTrue(service.VerifyAssertionSignature(registration.Credential, assertion.Assertion),
            "passkey assertion signature should verify against the generated public key");
        AssertTrue(service.VerifyAssertionSignature(registration.Credential, assertion.Assertion, canonicalChallenge),
            "passkey assertion signature should verify against the generated public key and expected challenge");
        PasskeyCredentialMaterial wrongOriginCredential = CopyPasskeyCredential(registration.Credential);
        wrongOriginCredential.Origin = "https://evil.example";
        AssertFalse(service.VerifyAssertionSignature(wrongOriginCredential, assertion.Assertion),
            "passkey assertion verification must reject clientDataJSON origin mismatches");
        PasskeyAssertionResponse wrongCredentialId = CopyPasskeyAssertion(assertion.Assertion);
        wrongCredentialId.CredentialId = Base64Url.Encode(Encoding.ASCII.GetBytes("wrong-credential-id"));
        AssertFalse(service.VerifyAssertionSignature(registration.Credential, wrongCredentialId),
            "passkey assertion verification must reject credential ID mismatches");
        PasskeyAssertionResponse wrongUserHandle = CopyPasskeyAssertion(assertion.Assertion);
        wrongUserHandle.UserHandle = Base64Url.Encode(Encoding.ASCII.GetBytes("wrong-user"));
        AssertFalse(service.VerifyAssertionSignature(registration.Credential, wrongUserHandle),
            "passkey assertion verification must reject user handle mismatches");
        PasskeyAssertionResponse wrongSignCount = CopyPasskeyAssertion(assertion.Assertion);
        wrongSignCount.SignCount = 2;
        AssertFalse(service.VerifyAssertionSignature(registration.Credential, wrongSignCount),
            "passkey assertion verification must reject sign count metadata mismatches");

        byte[] authenticatorData;
        byte[] clientDataJson;
        AssertTrue(Base64Url.TryDecode(assertion.Assertion.AuthenticatorData, out authenticatorData),
            "passkey assertion authenticatorData should be base64url encoded");
        AssertTrue(Base64Url.TryDecode(assertion.Assertion.ClientDataJson, out clientDataJson),
            "passkey assertion clientDataJSON should be base64url encoded");
        AssertWebAuthnClientData(clientDataJson, "webauthn.get",
            canonicalChallenge,
            canonicalOrigin,
            "assertion clientDataJSON");
        AssertEqual(37, authenticatorData.Length, "assertion authenticatorData should contain rpIdHash, flags, and sign count");
        AssertByteArrayEqual(Sha256(Encoding.ASCII.GetBytes("example.com")), Slice(authenticatorData, 0, 32),
            "assertion authenticatorData RP ID hash mismatch");
        AssertEqual((byte)0x01, authenticatorData[32], "assertion authenticatorData should set user-present flag");
        AssertEqual((uint)1, ReadUInt32BigEndian(authenticatorData, 33),
            "assertion authenticatorData should encode sign count 1");

        byte[] privateKey;
        AssertTrue(Base64Url.TryDecode(registration.Credential.PrivateKey, out privateKey),
            "passkey private key should be base64url encoded for flag verification fixture");
        byte[] missingUserPresentAuthenticatorData = (byte[])authenticatorData.Clone();
        missingUserPresentAuthenticatorData[32] = 0x00;
        PasskeyAssertionResponse missingUserPresent = ResignPasskeyAssertion(assertion.Assertion,
            missingUserPresentAuthenticatorData, clientDataJson, privateKey);
        AssertFalse(service.VerifyAssertionSignature(registration.Credential, missingUserPresent),
            "passkey assertion verification must reject authenticatorData without user-present flag");
        byte[] unsupportedFlagAuthenticatorData = (byte[])authenticatorData.Clone();
        unsupportedFlagAuthenticatorData[32] = 0x41;
        PasskeyAssertionResponse unsupportedFlag = ResignPasskeyAssertion(assertion.Assertion,
            unsupportedFlagAuthenticatorData, clientDataJson, privateKey);
        AssertFalse(service.VerifyAssertionSignature(registration.Credential, unsupportedFlag),
            "passkey assertion verification must reject unsupported authenticatorData flags");
        byte[] trailingAuthenticatorData = CombineBytes(authenticatorData, new byte[] { 0x00 });
        PasskeyAssertionResponse trailingData = ResignPasskeyAssertion(assertion.Assertion,
            trailingAuthenticatorData, clientDataJson, privateKey);
        AssertFalse(service.VerifyAssertionSignature(registration.Credential, trailingData),
            "passkey assertion verification must reject trailing authenticatorData bytes");
        byte[] wrongRpIdHashAuthenticatorData = (byte[])authenticatorData.Clone();
        wrongRpIdHashAuthenticatorData[0] ^= 0xff;
        PasskeyAssertionResponse wrongRpIdHash = ResignPasskeyAssertion(assertion.Assertion,
            wrongRpIdHashAuthenticatorData, clientDataJson, privateKey);
        AssertFalse(service.VerifyAssertionSignature(registration.Credential, wrongRpIdHash),
            "passkey assertion verification must reject authenticatorData RP ID hash mismatches");
        byte[] wrongChallengeClientDataJson = WebAuthnClientDataJson.Create("webauthn.get",
            Base64Url.Encode(Encoding.ASCII.GetBytes("0123456789abcdef")), canonicalOrigin);
        PasskeyAssertionResponse wrongChallenge = ResignPasskeyAssertion(assertion.Assertion,
            authenticatorData, wrongChallengeClientDataJson, privateKey);
        AssertFalse(service.VerifyAssertionSignature(registration.Credential, wrongChallenge, canonicalChallenge),
            "passkey assertion verification must reject clientDataJSON challenge mismatches");
    }

    private static void PasskeyAssertionRejectsNonEs256PublicKeyCose()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before malformed COSE verification test: " + registration.Error);

        PasskeyAssertionResult assertion = service.CreateAssertion(registration.Credential, new PasskeyAssertionRequest
        {
            RpId = "example.com",
            Origin = "https://example.com/login",
            Challenge = Base64Url.Encode(Encoding.ASCII.GetBytes("fedcba9876543210"))
        });
        AssertTrue(assertion.Success, "passkey assertion should succeed before malformed COSE verification test: " + assertion.Error);

        string validPublicKeyCose = registration.Credential.PublicKeyCose;
        AssertRejectsPublicKeyCoseMutation(service, registration.Credential, assertion.Assertion, validPublicKeyCose,
            0x01, 0x02, 0x01, "passkey assertion verification must reject public key COSE when kty is not EC2");
        AssertRejectsPublicKeyCoseMutation(service, registration.Credential, assertion.Assertion, validPublicKeyCose,
            0x03, 0x26, 0x20, "passkey assertion verification must reject public key COSE when alg is not ES256");
        AssertRejectsPublicKeyCoseMutation(service, registration.Credential, assertion.Assertion, validPublicKeyCose,
            0x20, 0x01, 0x02, "passkey assertion verification must reject public key COSE when crv is not P-256");
    }

    private static void PasskeyAssertionRejectsRequiredUserVerification()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before required-UV assertion test: " + registration.Error);

        PasskeyAssertionResult assertion = service.CreateAssertion(registration.Credential, new PasskeyAssertionRequest
        {
            RpId = "example.com",
            Origin = "https://example.com/login",
            Challenge = Base64Url.Encode(Encoding.ASCII.GetBytes("fedcba9876543210")),
            UserVerification = "required"
        });

        AssertFalse(assertion.Success, "passkey assertion should reject required user verification until KeePass-side verification exists");
        AssertEqual("unsupported_user_verification", assertion.ErrorCode,
            "required user verification assertion error code mismatch");
        AssertEqual((uint)0, registration.Credential.SignCount,
            "rejected required-UV assertion must not increment sign count");
    }

    private static void PasskeyAssertionRejectsUnknownUserVerification()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before unknown-UV assertion test: " + registration.Error);

        PasskeyAssertionResult assertion = service.CreateAssertion(registration.Credential, new PasskeyAssertionRequest
        {
            RpId = "example.com",
            Origin = "https://example.com/login",
            Challenge = Base64Url.Encode(Encoding.ASCII.GetBytes("fedcba9876543210")),
            UserVerification = "future-required"
        });

        AssertFalse(assertion.Success, "passkey assertion should reject unknown user verification policy values");
        AssertEqual("unsupported_user_verification", assertion.ErrorCode,
            "unknown user verification assertion error code mismatch");
        AssertEqual((uint)0, registration.Credential.SignCount,
            "rejected unknown-UV assertion must not increment sign count");
    }

    private static void PasskeyEntryStoreProtectsPrivateKeyMaterial()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before storage: " + registration.Error);

        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);

        AssertTrue(PasskeyEntryStore.IsPasskeyEntry(entry), "stored passkey entry should be identifiable by KBB passkey fields");
        AssertTrue(entry.Strings.Get(PasskeyEntryStore.PrivateKeyField).IsProtected,
            "stored passkey private key material must use a protected KeePass string");
        AssertEqual(string.Empty, entry.Strings.ReadSafe(PwDefs.PasswordField),
            "passkey-only storage should not create a normal password field");

        PasskeyCredentialMaterial restored = PasskeyEntryStore.Read(entry);
        AssertEqual(registration.Credential.CredentialId, restored.CredentialId, "stored passkey credential ID mismatch");
        AssertEqual(registration.Credential.PrivateKey, restored.PrivateKey, "stored passkey private key mismatch");
        AssertEqual(registration.Credential.Origin, restored.Origin, "stored passkey origin mismatch");
        AssertEqual(registration.Credential.UserVerification, restored.UserVerification, "stored passkey user verification mismatch");
        AssertEqual(registration.Credential.ResidentKey, restored.ResidentKey, "stored passkey resident-key requirement mismatch");
        AssertEqual(registration.Credential.Transports.Length, restored.Transports.Length, "stored passkey transport count mismatch");
        AssertEqual(registration.Credential.Transports[0], restored.Transports[0], "stored passkey first transport mismatch");
        AssertEqual(registration.Credential.Transports[1], restored.Transports[1], "stored passkey second transport mismatch");

        entry.Strings.Remove(PasskeyEntryStore.OriginField);
        PasskeyCredentialMaterial legacyRestored = PasskeyEntryStore.Read(entry);
        AssertEqual(registration.Credential.Origin, legacyRestored.Origin, "stored passkey origin fallback mismatch");
    }

    private static void PasskeyLookupListsMatchingRpIdWithoutPrivateKeyMaterial()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult matching = service.CreateCredential(CreatePasskeyRegistrationRequest());
        PasskeyRegistrationResult other = service.CreateCredential(CreatePasskeyRegistrationRequest(
            "other.example.com", "https://other.example.com/login", "bob@example.com", "bob-handle", "Bob Example"));
        AssertTrue(matching.Success, "matching passkey registration should succeed before lookup: " + matching.Error);
        AssertTrue(other.Success, "other passkey registration should succeed before lookup: " + other.Error);

        PwEntry matchingEntry = new PwEntry(true, true);
        matchingEntry.UsageCount = 3;
        PasskeyEntryStore.Write(matchingEntry, matching.Credential);

        PwEntry otherEntry = new PwEntry(true, true);
        PasskeyEntryStore.Write(otherEntry, other.Credential);

        PwDatabase database = CreateDatabase(matchingEntry, otherEntry);
        PasskeyCredentialLookupResult result = new PasskeyCredentialLookupService().List(database, new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://accounts.example.com/login"
        });

        AssertTrue(result.Success, "passkey lookup should succeed for RP ID subdomain origin: " + result.Error);
        AssertEqual(1, result.Credentials.Length, "passkey lookup should return only matching RP ID credentials");
        AssertEqual("example.com", result.Credentials[0].RpId, "passkey lookup RP ID mismatch");
        AssertEqual(matching.Credential.CredentialId, result.Credentials[0].CredentialId, "passkey lookup credential ID mismatch");
        AssertEqual(matching.Credential.UserHandle, result.Credentials[0].UserHandle, "passkey lookup user handle mismatch");
        AssertEqual("preferred", result.Credentials[0].UserVerification, "passkey lookup user verification mismatch");
        AssertEqual(2, result.Credentials[0].Transports.Length, "passkey lookup transport count mismatch");
        AssertEqual((ulong)3, result.Credentials[0].UsageCount, "passkey lookup should preserve usage metadata");

        string serialized = BridgeJsonSerializer.Serialize(result.Credentials[0]);
        AssertFalse(serialized.IndexOf("PrivateKey", StringComparison.OrdinalIgnoreCase) >= 0,
            "passkey lookup summary must not expose a private key property");
        AssertFalse(serialized.IndexOf(matching.Credential.PrivateKey, StringComparison.Ordinal) >= 0,
            "passkey lookup summary must not expose private key material");
    }

    private static void PasskeyLookupFiltersAllowedCredentialIds()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult first = service.CreateCredential(CreatePasskeyRegistrationRequest());
        PasskeyRegistrationResult second = service.CreateCredential(CreatePasskeyRegistrationRequest(
            "example.com", "https://example.com/login", "bob@example.com", "bob-handle", "Bob Example"));
        AssertTrue(first.Success, "first passkey registration should succeed before allow-list lookup: " + first.Error);
        AssertTrue(second.Success, "second passkey registration should succeed before allow-list lookup: " + second.Error);

        PwEntry firstEntry = new PwEntry(true, true);
        PasskeyEntryStore.Write(firstEntry, first.Credential);
        PwEntry secondEntry = new PwEntry(true, true);
        PasskeyEntryStore.Write(secondEntry, second.Credential);

        PwDatabase database = CreateDatabase(firstEntry, secondEntry);
        PasskeyCredentialLookupResult result = new PasskeyCredentialLookupService().List(database, new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://example.com/login",
            AllowCredentialIds = new string[] { second.Credential.CredentialId, second.Credential.CredentialId }
        });

        AssertTrue(result.Success, "passkey allow-list lookup should succeed: " + result.Error);
        AssertEqual(1, result.Credentials.Length, "passkey allow-list lookup should return only allowed credential IDs");
        AssertEqual(second.Credential.CredentialId, result.Credentials[0].CredentialId,
            "passkey allow-list lookup returned the wrong credential");
    }

    private static void PasskeyLookupRejectsInvalidAllowedCredentialIds()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before invalid allow-list lookup: " + registration.Error);

        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PasskeyCredentialLookupResult result = new PasskeyCredentialLookupService().List(CreateDatabase(entry), new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://example.com/login",
            AllowCredentialIds = new string[] { registration.Credential.CredentialId, "not@base64url" }
        });

        AssertFalse(result.Success, "passkey list lookup should reject invalid allowCredentialIds instead of dropping them");
        AssertEqual("invalid_allow_credential", result.ErrorCode,
            "passkey list invalid allowCredentialIds error code mismatch");
    }

    private static void PasskeyLookupRejectsMismatchedOrigin()
    {
        PasskeyCredentialLookupResult result = new PasskeyCredentialLookupService().List(CreateDatabase(), new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://evil.example.net/login"
        });

        AssertFalse(result.Success, "passkey lookup should reject an origin outside the requested RP ID");
        AssertEqual("invalid_rp_id", result.ErrorCode, "passkey lookup origin mismatch error code mismatch");
    }

    private static void PasskeyPendingCreateBindsRequestContext()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload payload = CreatePasskeyCreateBeginPayload("webauthn-create-1");
        payload.RequestedExtensions = new PasskeyRequestedExtensions { CredProps = true };
        payload.Hints = new string[] { "hybrid", "security-key" };

        PasskeyPendingSessionResult result = store.BeginCreate("client-1", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-1", payload, now);

        AssertTrue(result.Success, "passkey create begin should create a pending session: " + result.Error);
        AssertEqual(1, store.Count, "passkey pending store count mismatch after create begin");
        AssertEqual(PasskeyPendingOperation.Create, result.Session.Operation, "pending create operation mismatch");
        AssertEqual("client-1", result.Session.ClientId, "pending create client binding mismatch");
        AssertEqual("chrome-extension://abcdefghijklmnopabcdefghijklmnop", result.Session.ExtensionOrigin,
            "pending create extension origin binding mismatch");
        AssertEqual("bridge-request-1", result.Session.BeginBridgeRequestId, "pending create bridge request binding mismatch");
        AssertEqual("webauthn-create-1", result.Session.WebAuthnRequestId, "pending create WebAuthn request binding mismatch");
        AssertEqual("example.com", result.Session.RpId, "pending create RP ID should be normalized");
        AssertEqual(payload.Challenge, result.Session.Challenge, "pending create challenge binding mismatch");
        AssertEqual("preferred", result.Session.ResidentKey, "pending create should retain resident-key requirement");
        AssertEqual(2, result.Session.Hints.Length, "pending create should retain WebAuthn hints");
        AssertEqual("hybrid", result.Session.Hints[0], "pending create first hint mismatch");
        AssertEqual("security-key", result.Session.Hints[1], "pending create second hint mismatch");
        AssertTrue(result.Session.RequestedExtensions != null && result.Session.RequestedExtensions.CredProps,
            "pending create should retain requested credProps extension state");
        AssertEqual(now + PasskeyPendingSessionStore.MaxPendingLifetimeMs, result.Session.ExpiresUtcMs,
            "pending create expiration mismatch");
    }

    private static void PasskeyPendingRejectsUnsupportedRequestedExtension()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload payload = CreatePasskeyCreateBeginPayload("webauthn-create-unsupported-extension");
        payload.RequestedExtensions = new PasskeyRequestedExtensions
        {
            CredProps = true,
            UnsupportedExtensions = new string[] { "prf" }
        };

        PasskeyPendingSessionResult result = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-unsupported-extension",
            payload,
            now);

        AssertFalse(result.Success, "pending create should reject unsupported requested WebAuthn extensions");
        AssertEqual("unsupported_extension", result.ErrorCode,
            "pending create unsupported requested extension error code mismatch");
        AssertEqual(0, store.Count, "unsupported requested extensions should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsUnsupportedGetExtension()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyGetBeginPayload payload = CreatePasskeyGetBeginPayload("webauthn-get-unsupported-extension", new string[0]);
        payload.UnsupportedExtensions = new string[] { "appid" };

        PasskeyPendingSessionResult result = store.BeginGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-get-unsupported-extension",
            payload,
            now);

        AssertFalse(result.Success, "pending get should reject unsupported requested WebAuthn extensions");
        AssertEqual("unsupported_extension", result.ErrorCode,
            "pending get unsupported requested extension error code mismatch");
        AssertEqual(0, store.Count, "unsupported requested get extensions should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsInvalidCreateUserHandle()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload invalidBase64 = CreatePasskeyCreateBeginPayload("webauthn-create-invalid-user-handle");
        invalidBase64.UserHandle = "not@base64url";

        PasskeyPendingSessionResult invalid = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-invalid-user-handle",
            invalidBase64,
            now);

        AssertFalse(invalid.Success, "pending create should reject invalid base64url user handles");
        AssertEqual("invalid_user_handle", invalid.ErrorCode, "pending invalid user handle error code mismatch");

        PasskeyCreateBeginPayload tooLong = CreatePasskeyCreateBeginPayload("webauthn-create-long-user-handle");
        tooLong.UserHandle = Base64Url.Encode(new byte[65]);
        PasskeyPendingSessionResult oversized = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-long-user-handle",
            tooLong,
            now);

        AssertFalse(oversized.Success, "pending create should reject user handles longer than 64 bytes");
        AssertEqual("invalid_user_handle", oversized.ErrorCode, "pending oversized user handle error code mismatch");
        AssertEqual(0, store.Count, "invalid user handles should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsInvalidExcludeCredentialIds()
    {
        long now = 1779960000000;
        string existingCredentialId = Base64Url.Encode(Encoding.ASCII.GetBytes("existing-credential"));
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload payload = CreatePasskeyCreateBeginPayload("webauthn-create-invalid-exclude");
        payload.ExcludeCredentialIds = new string[] { existingCredentialId, "not@base64url" };

        PasskeyPendingSessionResult result = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-invalid-exclude",
            payload,
            now);

        AssertFalse(result.Success, "pending create should reject invalid excludeCredentialIds instead of dropping them");
        AssertEqual("invalid_exclude_credential", result.ErrorCode, "pending invalid excludeCredentialIds error code mismatch");
        AssertEqual(0, store.Count, "pending invalid excludeCredentialIds rejection should not leave pending sessions");
    }

    private static void PasskeyPendingHonorsRequestedTimeoutUpToMaximum()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-timeout");
        createPayload.TimeoutMs = 30000;

        PasskeyPendingSessionResult create = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-create-timeout",
            createPayload,
            now);

        AssertTrue(create.Success, "passkey create begin should accept a browser timeout: " + create.Error);
        AssertEqual(now + 30000, create.Session.ExpiresUtcMs,
            "pending create should honor shorter browser request timeout");

        PasskeyGetBeginPayload getPayload = CreatePasskeyGetBeginPayload("webauthn-get-timeout", new string[0]);
        getPayload.TimeoutMs = PasskeyPendingSessionStore.MaxPendingLifetimeMs + 1000;
        PasskeyPendingSessionResult get = store.BeginGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-get-timeout",
            getPayload,
            now);

        AssertTrue(get.Success, "passkey get begin should accept a browser timeout: " + get.Error);
        AssertEqual(now + PasskeyPendingSessionStore.MaxPendingLifetimeMs, get.Session.ExpiresUtcMs,
            "pending get should clamp long browser request timeout to the backend maximum");

        PasskeyCreateBeginPayload invalidTimeout = CreatePasskeyCreateBeginPayload("webauthn-create-invalid-timeout");
        invalidTimeout.TimeoutMs = -1;
        PasskeyPendingSessionResult fallback = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-invalid-timeout",
            invalidTimeout,
            now);

        AssertTrue(fallback.Success, "passkey create begin should accept missing or invalid timeout hints: " + fallback.Error);
        AssertEqual(now + PasskeyPendingSessionStore.MaxPendingLifetimeMs, fallback.Session.ExpiresUtcMs,
            "invalid browser timeout should fall back to the backend maximum");
    }

    private static void PasskeyPendingCompletionRequiresMatchingBindingAndConsumes()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload beginPayload = CreatePasskeyCreateBeginPayload("webauthn-create-2");
        PasskeyPendingSessionResult begin = store.BeginCreate("client-1", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-2", beginPayload, now);
        AssertTrue(begin.Success, "passkey create begin should succeed before completion binding test: " + begin.Error);

        PasskeyPendingSessionResult mismatch = store.CompleteCreate("client-1",
            "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            new PasskeyCreateCompletePayload
            {
                WebAuthnRequestId = "webauthn-create-2",
                RpId = "example.com",
                Origin = "https://example.com/login"
            },
            now + 1000);

        AssertFalse(mismatch.Success, "passkey completion from a different extension origin should fail");
        AssertEqual("binding_mismatch", mismatch.ErrorCode, "pending create binding mismatch error code mismatch");
        AssertEqual(1, store.Count, "failed passkey completion should not consume the pending session");

        PasskeyPendingSessionResult complete = store.CompleteCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            new PasskeyCreateCompletePayload
            {
                WebAuthnRequestId = "webauthn-create-2",
                RpId = "Example.com",
                Origin = "https://example.com/login"
            },
            now + 1000);

        AssertTrue(complete.Success, "matching passkey completion should consume the pending session: " + complete.Error);
        AssertEqual("bridge-request-2", complete.Session.BeginBridgeRequestId,
            "completed passkey session should retain begin bridge request ID");
        AssertEqual(0, store.Count, "matching passkey completion should remove the pending session");
    }

    private static void PasskeyPendingGetRejectsCredentialOutsideAllowList()
    {
        long now = 1779960000000;
        string allowedCredentialId = Base64Url.Encode(Encoding.ASCII.GetBytes("allowed-credential"));
        string blockedCredentialId = Base64Url.Encode(Encoding.ASCII.GetBytes("blocked-credential"));
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyGetBeginPayload beginPayload = CreatePasskeyGetBeginPayload("webauthn-get-1",
            new string[] { allowedCredentialId, allowedCredentialId });
        beginPayload.Hints = new string[] { "client-device", "hybrid" };
        PasskeyPendingSessionResult begin = store.BeginGet("client-1", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-3", beginPayload, now);
        AssertTrue(begin.Success, "passkey get begin should succeed before allow-list completion test: " + begin.Error);
        AssertEqual(1, begin.Session.AllowCredentialIds.Length, "pending get should normalize allowed credential IDs");
        AssertEqual(allowedCredentialId, begin.Session.AllowCredentialIds[0], "pending get allowed credential ID mismatch");
        AssertEqual(2, begin.Session.Hints.Length, "pending get should retain WebAuthn hints");
        AssertEqual("client-device", begin.Session.Hints[0], "pending get first hint mismatch");
        AssertEqual("hybrid", begin.Session.Hints[1], "pending get second hint mismatch");

        PasskeyPendingSessionResult blocked = store.CompleteGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            new PasskeyGetCompletePayload
            {
                WebAuthnRequestId = "webauthn-get-1",
                RpId = "example.com",
                Origin = "https://example.com/login",
                CredentialId = blockedCredentialId
            },
            now + 1000);

        AssertFalse(blocked.Success, "pending get should reject a credential outside allowCredentialIds");
        AssertEqual("credential_not_allowed", blocked.ErrorCode, "pending get allow-list error code mismatch");
        AssertEqual(1, store.Count, "blocked get completion should not consume the pending session");

        PasskeyPendingSessionResult allowed = store.CompleteGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            new PasskeyGetCompletePayload
            {
                WebAuthnRequestId = "webauthn-get-1",
                RpId = "example.com",
                Origin = "https://example.com/login",
                CredentialId = allowedCredentialId
            },
            now + 1000);

        AssertTrue(allowed.Success, "pending get should accept an allowed credential ID: " + allowed.Error);
        AssertEqual(0, store.Count, "allowed get completion should consume the pending session");
    }

    private static void PasskeyPendingRejectsInvalidAllowCredentialIds()
    {
        long now = 1779960000000;
        string allowedCredentialId = Base64Url.Encode(Encoding.ASCII.GetBytes("allowed-credential"));
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyGetBeginPayload beginPayload = CreatePasskeyGetBeginPayload("webauthn-get-invalid-allow",
            new string[] { allowedCredentialId, "not@base64url" });

        PasskeyPendingSessionResult begin = store.BeginGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-invalid-allow",
            beginPayload,
            now);

        AssertFalse(begin.Success, "pending get should reject invalid allowCredentialIds instead of dropping them");
        AssertEqual("invalid_allow_credential", begin.ErrorCode, "pending invalid allowCredentialIds error code mismatch");
        AssertEqual(0, store.Count, "pending invalid allowCredentialIds rejection should not leave pending sessions");
    }

    private static void PasskeyPendingRejectsRequiredUserVerification()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-required-uv");
        createPayload.UserVerification = "required";

        PasskeyPendingSessionResult create = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-required-uv-create",
            createPayload,
            now);
        AssertFalse(create.Success, "pending create should reject required user verification");
        AssertEqual("unsupported_user_verification", create.ErrorCode,
            "pending create required user verification error code mismatch");

        PasskeyGetBeginPayload getPayload = CreatePasskeyGetBeginPayload("webauthn-get-required-uv", new string[0]);
        getPayload.UserVerification = "required";
        PasskeyPendingSessionResult get = store.BeginGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-required-uv-get",
            getPayload,
            now);
        AssertFalse(get.Success, "pending get should reject required user verification");
        AssertEqual("unsupported_user_verification", get.ErrorCode,
            "pending get required user verification error code mismatch");
        AssertEqual(0, store.Count, "required user verification should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsUnknownUserVerification()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-unknown-uv");
        createPayload.UserVerification = "future-required";

        PasskeyPendingSessionResult create = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-unknown-uv-create",
            createPayload,
            now);
        AssertFalse(create.Success, "pending create should reject unknown user verification policy values");
        AssertEqual("unsupported_user_verification", create.ErrorCode,
            "pending create unknown user verification error code mismatch");

        PasskeyGetBeginPayload getPayload = CreatePasskeyGetBeginPayload("webauthn-get-unknown-uv", new string[0]);
        getPayload.UserVerification = "future-required";
        PasskeyPendingSessionResult get = store.BeginGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-unknown-uv-get",
            getPayload,
            now);
        AssertFalse(get.Success, "pending get should reject unknown user verification policy values");
        AssertEqual("unsupported_user_verification", get.ErrorCode,
            "pending get unknown user verification error code mismatch");
        AssertEqual(0, store.Count, "unknown user verification should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsUnsupportedCredentialAlgorithm()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload missingAlgorithms = CreatePasskeyCreateBeginPayload("webauthn-create-missing-alg");
        missingAlgorithms.CredentialAlgorithms = null;

        PasskeyPendingSessionResult missing = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-missing-alg",
            missingAlgorithms,
            now);
        AssertFalse(missing.Success, "pending create should reject missing credential algorithms");
        AssertEqual("unsupported_algorithm", missing.ErrorCode,
            "pending create missing credential algorithms error code mismatch");

        PasskeyCreateBeginPayload unsupportedAlgorithms = CreatePasskeyCreateBeginPayload("webauthn-create-unsupported-alg");
        unsupportedAlgorithms.CredentialAlgorithms = new int[] { -257, -37 };
        PasskeyPendingSessionResult unsupported = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-unsupported-alg",
            unsupportedAlgorithms,
            now);
        AssertFalse(unsupported.Success, "pending create should reject credential algorithms that do not include ES256");
        AssertEqual("unsupported_algorithm", unsupported.ErrorCode,
            "pending create unsupported credential algorithms error code mismatch");
        AssertEqual(0, store.Count, "unsupported credential algorithms should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsUnsupportedAttestation()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload payload = CreatePasskeyCreateBeginPayload("webauthn-create-direct-attestation");
        payload.Attestation = "direct";

        PasskeyPendingSessionResult result = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-direct-attestation",
            payload,
            now);

        AssertFalse(result.Success, "pending create should reject unsupported attestation conveyance");
        AssertEqual("unsupported_attestation", result.ErrorCode,
            "pending create unsupported attestation error code mismatch");
        AssertEqual(0, store.Count, "unsupported attestation should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsUnsupportedAuthenticatorAttachment()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload payload = CreatePasskeyCreateBeginPayload("webauthn-create-platform-attachment");
        payload.AuthenticatorAttachment = "platform";

        PasskeyPendingSessionResult result = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-platform-attachment",
            payload,
            now);

        AssertFalse(result.Success, "pending create should reject unsupported authenticator attachment");
        AssertEqual("unsupported_authenticator_attachment", result.ErrorCode,
            "pending create unsupported authenticator attachment error code mismatch");
        AssertEqual(0, store.Count, "unsupported authenticator attachment should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsUnsupportedResidentKey()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyCreateBeginPayload payload = CreatePasskeyCreateBeginPayload("webauthn-create-unknown-resident-key");
        payload.ResidentKey = "future-resident-key";

        PasskeyPendingSessionResult result = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-unknown-resident-key",
            payload,
            now);

        AssertFalse(result.Success, "pending create should reject unknown resident-key requirement values");
        AssertEqual("unsupported_resident_key", result.ErrorCode,
            "pending create unsupported resident-key requirement error code mismatch");
        AssertEqual(0, store.Count, "unsupported resident-key requirements should not create pending passkey sessions");
    }

    private static void PasskeyPendingRejectsDuplicateLiveWebAuthnRequestId()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();

        PasskeyPendingSessionResult first = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-duplicate-1",
            CreatePasskeyCreateBeginPayload("webauthn-duplicate"),
            now);
        AssertTrue(first.Success, "first pending passkey request should be created: " + first.Error);

        PasskeyPendingSessionResult duplicate = store.BeginGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-duplicate-2",
            CreatePasskeyGetBeginPayload("webauthn-duplicate", new string[0]),
            now + 1000);
        AssertFalse(duplicate.Success, "duplicate live WebAuthn request ID should not replace the existing pending session");
        AssertEqual("pending_exists", duplicate.ErrorCode, "duplicate pending session error code mismatch");
        AssertEqual(1, store.Count, "duplicate pending begin should not add another session");

        PasskeyPendingSessionResult completeOriginal = store.CompleteCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            new PasskeyCreateCompletePayload
            {
                WebAuthnRequestId = "webauthn-duplicate",
                RpId = "example.com",
                Origin = "https://example.com/login"
            },
            now + 2000);
        AssertTrue(completeOriginal.Success, "duplicate pending begin should not corrupt the original create session: " + completeOriginal.Error);

        PasskeyPendingSessionResult expiring = store.BeginCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-expiring-duplicate",
            CreatePasskeyCreateBeginPayload("webauthn-expiring-duplicate"),
            now);
        AssertTrue(expiring.Success, "expiring pending request should be created: " + expiring.Error);

        PasskeyPendingSessionResult afterExpiry = store.BeginGet("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-after-expiry",
            CreatePasskeyGetBeginPayload("webauthn-expiring-duplicate", new string[0]),
            now + PasskeyPendingSessionStore.MaxPendingLifetimeMs + 1);
        AssertTrue(afterExpiry.Success, "expired pending request ID should be reusable for a new browser request: " + afterExpiry.Error);
        AssertEqual(PasskeyPendingOperation.Get, afterExpiry.Session.Operation,
            "expired duplicate replacement should use the new pending operation");
        AssertEqual("bridge-request-after-expiry", afterExpiry.Session.BeginBridgeRequestId,
            "expired duplicate replacement should keep the new bridge request ID");
        AssertEqual(1, store.Count, "expired duplicate replacement should leave one active pending session");
    }

    private static void PasskeyPendingCompletionExpiresStaleSession()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        PasskeyPendingSessionResult begin = store.BeginCreate("client-1", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-expired", CreatePasskeyCreateBeginPayload("webauthn-create-expired"), now);
        AssertTrue(begin.Success, "passkey pending session should be created before expiry test: " + begin.Error);

        PasskeyPendingSessionResult expired = store.CompleteCreate("client-1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            new PasskeyCreateCompletePayload
            {
                WebAuthnRequestId = "webauthn-create-expired",
                RpId = "example.com",
                Origin = "https://example.com/login"
            },
            now + PasskeyPendingSessionStore.MaxPendingLifetimeMs + 1);

        AssertFalse(expired.Success, "stale passkey completion should fail");
        AssertEqual("pending_expired", expired.ErrorCode, "stale passkey completion error code mismatch");
        AssertEqual(0, store.Count, "expired passkey completion should remove the stale pending session");
    }

    private static void PasskeyPendingClearForClientRemovesOnlyClientSessions()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        AssertTrue(store.BeginCreate("client-1", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-4", CreatePasskeyCreateBeginPayload("webauthn-create-4"), now).Success,
            "first client pending session should be created");
        AssertTrue(store.BeginCreate("client-1", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-5", CreatePasskeyCreateBeginPayload("webauthn-create-5"), now).Success,
            "second client pending session should be created");
        AssertTrue(store.BeginCreate("client-2", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-6", CreatePasskeyCreateBeginPayload("webauthn-create-6"), now).Success,
            "other client pending session should be created");

        int removed = store.ClearForClient("client-1");

        AssertEqual(2, removed, "clear-for-client should remove only the selected client's pending sessions");
        AssertEqual(1, store.Count, "clear-for-client should leave other clients' pending sessions");
        AssertTrue(store.Cancel("client-2", "webauthn-create-6"), "remaining client session should be cancelable");
        AssertEqual(0, store.Count, "cancel should remove the remaining pending session");
    }

    private static void PasskeyPendingClearAllRemovesEverySession()
    {
        long now = 1779960000000;
        PasskeyPendingSessionStore store = new PasskeyPendingSessionStore();
        AssertTrue(store.BeginCreate("client-1", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-7", CreatePasskeyCreateBeginPayload("webauthn-create-7"), now).Success,
            "first pending session should be created before clear-all");
        AssertTrue(store.BeginCreate("client-2", "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            "bridge-request-8", CreatePasskeyCreateBeginPayload("webauthn-create-8"), now).Success,
            "second pending session should be created before clear-all");

        int removed = store.ClearAll();

        AssertEqual(2, removed, "clear-all should report every removed pending session");
        AssertEqual(0, store.Count, "clear-all should remove every pending session");
    }

    private static void ValidHelloRequestPassesValidation()
    {
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);

        ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

        AssertTrue(result.IsValid, "valid hello request should pass validation: " + result.Error);
    }

    private static void UnknownMethodFailsValidation()
    {
        BridgeRequest request = CreateValidRequest("unknown.method");

        ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

        AssertFalse(result.IsValid, "unknown method should fail validation");
        AssertEqual("unknown_method", result.ErrorCode, "unknown method error code mismatch");
    }

    private static void MissingOriginFailsValidation()
    {
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);
        request.Origin = "";

        ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

        AssertFalse(result.IsValid, "missing origin should fail validation");
        AssertEqual("missing_origin", result.ErrorCode, "missing origin error code mismatch");
    }

    private static void WebPageOriginFailsValidation()
    {
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);
        request.Origin = "https://evil.example";

        ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

        AssertFalse(result.IsValid, "web page origin should fail validation");
        AssertEqual("invalid_origin", result.ErrorCode, "web page origin error code mismatch");
    }

    private static void FirefoxExtensionOriginPassesValidation()
    {
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);
        request.Origin = "moz-extension://12345678-90ab-cdef-1234-567890abcdef";

        ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

        AssertTrue(result.IsValid, "Firefox extension origin should pass validation: " + result.Error);
    }

    private static void MalformedExtensionOriginFailsValidation()
    {
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);
        request.Origin = "chrome-extension://not-a-valid-extension-id";

        ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

        AssertFalse(result.IsValid, "malformed extension origin should fail validation");
        AssertEqual("invalid_origin", result.ErrorCode, "malformed extension origin error code mismatch");
    }

    private static void NonCanonicalExtensionOriginFailsValidation()
    {
        string[] origins = new[]
        {
            " CHROME-EXTENSION://abcdefghijklmnopabcdefghijklmnop",
            "CHROME-EXTENSION://abcdefghijklmnopabcdefghijklmnop",
            "chrome-extension://ABCDEFGHIJKLMNOPABCDEFGHIJKLMNOP",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop/",
            "chrome-extension://user@abcdefghijklmnopabcdefghijklmnop",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop:443",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop?query=1",
            "chrome-extension://abcdefghijklmnopabcdefghijklmnop#fragment",
            "moz-extension://12345678-90AB-CDEF-1234-567890ABCDEF",
            "moz-extension://12345678-90ab-cdef-1234-567890abcdef/",
            "moz-extension://12345678-90ab-cdef-1234-567890abcdef?query=1"
        };

        foreach (string origin in origins)
        {
            BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);
            request.Origin = origin;

            ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

            AssertFalse(result.IsValid, "non-canonical extension origin should fail validation: " + origin);
            AssertEqual("invalid_origin", result.ErrorCode, "non-canonical extension origin error code mismatch");
        }
    }

    private static void StaleTimestampFailsValidation()
    {
        long now = NowMs();
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);
        request.TimestampUtcMs = now - ProtocolValidator.MaxClockSkewMs - 1;

        ProtocolValidationResult result = ProtocolValidator.Validate(request, now);

        AssertFalse(result.IsValid, "stale timestamp should fail validation");
        AssertEqual("stale_timestamp", result.ErrorCode, "stale timestamp error code mismatch");
    }

    private static void WrongProtocolVersionFailsValidation()
    {
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);
        request.ProtocolVersion = ProtocolValidator.ProtocolVersion + 1;

        ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

        AssertFalse(result.IsValid, "wrong protocol version should fail validation");
        AssertEqual("unsupported_protocol", result.ErrorCode, "protocol version error code mismatch");
    }

    private static void PasskeyMethodPassesProtocolValidation()
    {
        BridgeRequest request = CreateValidRequest(BridgeMethods.PasskeysList);

        ProtocolValidationResult result = ProtocolValidator.Validate(request, NowMs());

        AssertTrue(result.IsValid, "reserved passkey protocol methods should pass envelope validation: " + result.Error);
    }

    private static void BridgeMethodPolicyCoversEveryBridgeMethod()
    {
        HashSet<string> constants = new HashSet<string>(StringComparer.Ordinal);
        foreach (FieldInfo field in typeof(BridgeMethods).GetFields(BindingFlags.Public | BindingFlags.Static))
        {
            if (!field.IsLiteral || field.FieldType != typeof(string)) continue;
            string method = (string)field.GetRawConstantValue();
            constants.Add(method);
            AssertTrue(BridgeMethodPolicy.IsKnownMethod(method), "bridge method policy should include " + method);
        }

        HashSet<string> policyMethods = new HashSet<string>(StringComparer.Ordinal);
        foreach (string method in BridgeMethodPolicy.AllMethods())
        {
            AssertTrue(policyMethods.Add(method), "bridge method policy should not contain duplicate method " + method);
            AssertTrue(constants.Contains(method), "bridge method policy should not contain stale method " + method);

            string permission = BridgeMethodPolicy.RequiredPermission(method);
            if (BridgeMethodPolicy.RequiresAuthentication(method))
            {
                AssertFalse(string.IsNullOrEmpty(permission), "authenticated bridge method needs an explicit permission: " + method);
            }
            else
            {
                AssertEqual(string.Empty, permission, "unauthenticated bridge method should not require permission: " + method);
            }
        }

        AssertEqual(constants.Count, policyMethods.Count, "bridge method policy count should match BridgeMethods constants");
    }

    private static void BridgeMethodPolicyAssignsExpectedPermissions()
    {
        AssertPolicy(BridgeMethods.Hello, false, string.Empty);
        AssertPolicy(BridgeMethods.PairBegin, false, string.Empty);
        AssertPolicy(BridgeMethods.PairComplete, false, string.Empty);
        AssertPolicy(BridgeMethods.PairCancel, false, string.Empty);
        AssertPolicy(BridgeMethods.ClientStatus, true, TrustedClientPermissions.Read);
        AssertPolicy(BridgeMethods.LoginsQuery, true, TrustedClientPermissions.Read);
        AssertPolicy(BridgeMethods.LoginsCreate, true, TrustedClientPermissions.Write);
        AssertPolicy(BridgeMethods.LoginsUpdate, true, TrustedClientPermissions.Write);
        AssertPolicy(BridgeMethods.LoginsFillAck, true, TrustedClientPermissions.Write);
        AssertPolicy(BridgeMethods.ClientsList, true, TrustedClientPermissions.ManageClients);
        AssertPolicy(BridgeMethods.ClientsRevoke, true, TrustedClientPermissions.ManageClients);
        AssertPolicy(BridgeMethods.ClientsUpdatePermissions, true, TrustedClientPermissions.ManageClients);
        AssertPolicy(BridgeMethods.PasskeysList, true, TrustedClientPermissions.PasskeyRead);
        AssertPolicy(BridgeMethods.PasskeysGetBegin, true, TrustedClientPermissions.PasskeyRead);
        AssertPolicy(BridgeMethods.PasskeysGetComplete, true, TrustedClientPermissions.PasskeyRead);
        AssertPolicy(BridgeMethods.PasskeysCreateBegin, true, TrustedClientPermissions.PasskeyWrite);
        AssertPolicy(BridgeMethods.PasskeysCreateComplete, true, TrustedClientPermissions.PasskeyWrite);
        AssertPolicy(BridgeMethods.PasskeysCancel, true, TrustedClientPermissions.Read);
        AssertPolicy(BridgeMethods.PasskeysRevoke, true, TrustedClientPermissions.PasskeyWrite);

        AssertTrue(BridgeMethodPolicy.IsPasskeyMethod(BridgeMethods.PasskeysList),
            "passkey list should be classified as passkey method");
        AssertTrue(BridgeMethodPolicy.IsPasskeyMethod(BridgeMethods.PasskeysCancel),
            "passkey cancel should be classified as passkey method");
        AssertFalse(BridgeMethodPolicy.IsPasskeyMethod(BridgeMethods.LoginsQuery),
            "password query should not be classified as passkey method");
    }

    private static void AssertPolicy(string method, bool requiresAuthentication, string requiredPermission)
    {
        AssertTrue(BridgeMethodPolicy.IsKnownMethod(method), "bridge method should be known: " + method);
        AssertEqual(requiresAuthentication, BridgeMethodPolicy.RequiresAuthentication(method),
            "authentication policy mismatch for " + method);
        AssertEqual(requiredPermission, BridgeMethodPolicy.RequiredPermission(method),
            "required permission mismatch for " + method);
    }

    private static void UpdateCheckerDetectsNewerSemanticVersions()
    {
        AssertTrue(UpdateChecker.IsNewerVersion("0.9.0", "v0.9.1"), "patch update should be detected");
        AssertTrue(UpdateChecker.IsNewerVersion("0.9.0", "v1.0.0"), "major update should be detected");
    }

    private static void UpdateCheckerReadsCurrentVersionFromAssembly()
    {
        string currentVersion = UpdateChecker.GetCurrentVersion();

        AssertFalse(currentVersion.Contains("+"),
            "update checker should strip build metadata from the running assembly version");
        AssertTrue(UpdateChecker.IsNewerVersion(currentVersion, "v9.0.0"),
            "current version should remain parseable after reading it from the running assembly");
    }

    private static void UpdateCheckerIgnoresSameOrInvalidVersions()
    {
        AssertFalse(UpdateChecker.IsNewerVersion("0.9.0", "0.9.0"), "same version should not be detected as update");
        AssertFalse(UpdateChecker.IsNewerVersion("0.9.0", "latest"), "non-version tags should not be detected as update");
    }

    private static void UpdateCheckerSelectsNewestSemanticTag()
    {
        string tag = UpdateChecker.GetNewestVersionTag(new string[] { "latest", "v0.9.1", "v1.0.0", "draft" });

        AssertEqual("v1.0.0", tag, "newest semantic release tag mismatch");
    }

    private static void UpdateCheckerBuildsPluginAssetUrl()
    {
        UpdateInfo info = UpdateChecker.CreateUpdateInfo("v1.2.3");

        AssertEqual("v1.2.3", info.LatestVersion, "latest version mismatch");
        AssertEqual("https://github.com/hieuck/KeePassBrowserBridge/releases/tag/v1.2.3", info.ReleaseUrl,
            "release URL mismatch");
        AssertEqual("https://github.com/hieuck/KeePassBrowserBridge/releases/download/v1.2.3/KeePassBrowserBridge.plgx",
            info.AssetUrl, "PLGX asset URL mismatch");
        AssertEqual("https://github.com/hieuck/KeePassBrowserBridge/releases/download/v1.2.3/SHA256SUMS.txt",
            info.ChecksumAssetUrl, "checksum asset URL mismatch");
    }

    private static void UpdateCheckerAlwaysBuildsPlgxAssetUrl()
    {
        UpdateInfo info = UpdateChecker.CreateUpdateInfo("v1.2.3", "KeePassBrowserBridge.dll");

        AssertEqual("https://github.com/hieuck/KeePassBrowserBridge/releases/download/v1.2.3/KeePassBrowserBridge.plgx",
            info.AssetUrl, "plugin auto-update should always use the PLGX release asset");
    }

    private static void UpdateCheckerSelectsNewestReleaseWithPlgxAsset()
    {
        string json =
            "[" +
            "{\"tag_name\":\"v1.0.0\",\"prerelease\":false,\"draft\":false,\"assets\":[{\"name\":\"KeePassBrowserBridge.dll\",\"browser_download_url\":\"https://example.invalid/v1/KeePassBrowserBridge.dll\"},{\"name\":\"SHA256SUMS.txt\",\"browser_download_url\":\"https://example.invalid/v1/SHA256SUMS.txt\"}]}," +
            "{\"tag_name\":\"v0.9.1\",\"prerelease\":false,\"draft\":false,\"assets\":[{\"name\":\"KeePassBrowserBridge.plgx\",\"browser_download_url\":\"https://example.invalid/v091/KeePassBrowserBridge.plgx\"},{\"name\":\"SHA256SUMS.txt\",\"browser_download_url\":\"https://example.invalid/v091/SHA256SUMS.txt\"}]}" +
            "]";

        UpdateInfo info = UpdateChecker.CreateUpdateInfoFromReleasesJson(json);

        AssertEqual("v0.9.1", info.LatestVersion, "update checker should choose newest release with a PLGX asset");
        AssertEqual("https://example.invalid/v091/KeePassBrowserBridge.plgx", info.AssetUrl,
            "update checker should use the PLGX asset download URL from GitHub");
        AssertEqual("https://example.invalid/v091/SHA256SUMS.txt", info.ChecksumAssetUrl,
            "update checker should use the checksum asset download URL from GitHub");
    }

    private static void UpdateCheckerSkipsReleaseWithoutChecksumAsset()
    {
        string json =
            "[" +
            "{\"tag_name\":\"v9.0.0\",\"prerelease\":false,\"draft\":false,\"assets\":[{\"name\":\"KeePassBrowserBridge.plgx\",\"browser_download_url\":\"https://example.invalid/v9/KeePassBrowserBridge.plgx\"}]}," +
            "{\"tag_name\":\"v0.9.1\",\"prerelease\":false,\"draft\":false,\"assets\":[{\"name\":\"KeePassBrowserBridge.plgx\",\"browser_download_url\":\"https://example.invalid/v091/KeePassBrowserBridge.plgx\"},{\"name\":\"SHA256SUMS.txt\",\"browser_download_url\":\"https://example.invalid/v091/SHA256SUMS.txt\"}]}" +
            "]";

        UpdateInfo info = UpdateChecker.CreateUpdateInfoFromReleasesJson(json);

        AssertEqual("v0.9.1", info.LatestVersion,
            "update checker should skip PLGX releases that do not publish SHA256SUMS.txt");
        AssertEqual("https://example.invalid/v091/SHA256SUMS.txt", info.ChecksumAssetUrl,
            "selected update should include checksum asset URL");
    }

    private static void UpdateCheckerExtractsExpectedPluginChecksum()
    {
        string checksumText =
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  KeePassBrowserBridge.dll\n" +
            "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB  KeePassBrowserBridge.plgx\n";

        string expected = UpdateChecker.GetExpectedSha256(checksumText, "KeePassBrowserBridge.plgx");

        AssertEqual("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", expected,
            "update checker should extract and normalize the plugin checksum");
    }

    private static void UpdateCheckerVerifiesDownloadedPluginChecksum()
    {
        string tempFile = Path.Combine(Path.GetTempPath(), "KeePassBrowserBridge-checksum-test.bin");
        try
        {
            File.WriteAllBytes(tempFile, Encoding.ASCII.GetBytes("abc"));

            AssertTrue(UpdateChecker.VerifyFileSha256(tempFile,
                    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"),
                "known SHA-256 should verify for downloaded plugin bytes");
            AssertFalse(UpdateChecker.VerifyFileSha256(tempFile,
                    "0000000000000000000000000000000000000000000000000000000000000000"),
                "wrong SHA-256 should not verify for downloaded plugin bytes");
        }
        finally
        {
            File.Delete(tempFile);
        }
    }

    private static void PairingSessionGeneratesSixDigitCode()
    {
        PairingService service = new PairingService(new DeterministicSecretGenerator("111111", "secret"));

        PairingSession session = service.BeginPairing("Chrome");

        AssertEqual(6, session.PairingCode.Length, "pairing code length mismatch");
        AssertTrue(IsDigitsOnly(session.PairingCode), "pairing code should contain digits only");
    }

    private static void PairingSessionStoresExtensionOriginFromBegin()
    {
        PairingService service = new PairingService(new DeterministicSecretGenerator("111111", "secret"));

        PairingSession session = service.BeginPairing("Chrome", "chrome-extension://abcdefghijklmnopabcdefghijklmnop");

        AssertEqual("chrome-extension://abcdefghijklmnopabcdefghijklmnop", session.ExtensionOrigin,
            "pairing session should remember the extension origin that started pairing");
    }

    private static void WrongPairingCodeIsRejected()
    {
        TrustedClientStore store = new TrustedClientStore();
        PairingService service = new PairingService(new DeterministicSecretGenerator("123456", "secret"));
        PairingSession session = service.BeginPairing("Chrome");

        PairingResult result = service.CompletePairing(store, session.PairingSessionId, "000000", "Chrome");

        AssertFalse(result.Success, "wrong pairing code should fail");
        AssertEqual(0, store.ListClients().Length, "wrong code should not add a trusted client");
    }

    private static void PairingCompletionRejectsDifferentOrigin()
    {
        TrustedClientStore store = new TrustedClientStore();
        PairingService service = new PairingService(new DeterministicSecretGenerator("123456", "secret"));
        PairingSession session = service.BeginPairing("Chrome", "chrome-extension://abcdefghijklmnopabcdefghijklmnop");

        PairingResult result = service.CompletePairing(store, session.PairingSessionId, "123456", "Chrome",
            "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");

        AssertFalse(result.Success, "pairing completion from a different extension origin should fail");
        AssertEqual("origin_mismatch", result.ErrorCode, "pairing origin mismatch error code mismatch");
        AssertEqual(0, store.ListClients().Length, "origin mismatch should not add a trusted client");
    }

    private static void NewPairingSessionCancelsOlderSessionForSameClient()
    {
        TrustedClientStore store = new TrustedClientStore();
        PairingService service = new PairingService(new DeterministicSecretGenerator("123456", "secret"));
        PairingSession oldSession = service.BeginPairing("Chrome");
        PairingSession newSession = service.BeginPairing("Chrome");

        PairingResult oldResult = service.CompletePairing(store, oldSession.PairingSessionId, "123456", "Chrome");
        PairingResult newResult = service.CompletePairing(store, newSession.PairingSessionId, "123456", "Chrome");

        AssertFalse(oldResult.Success, "older pairing session for the same client should be cancelled");
        AssertEqual("pairing_session_not_found", oldResult.ErrorCode, "cancelled older session error mismatch");
        AssertTrue(newResult.Success, "newest pairing session for the same client should remain usable");
        AssertEqual(1, store.ListClients().Length, "only the newest session should add a trusted client");
    }

    private static void PairingSessionLocksAfterRepeatedWrongCodes()
    {
        TrustedClientStore store = new TrustedClientStore();
        PairingService service = new PairingService(new DeterministicSecretGenerator("123456", "secret"));
        PairingSession session = service.BeginPairing("Chrome");
        PairingResult result = null;

        for (int i = 0; i < PairingService.MaxInvalidPairingAttempts; ++i)
        {
            result = service.CompletePairing(store, session.PairingSessionId, "000000", "Chrome");
        }

        AssertFalse(result.Success, "last wrong pairing attempt should fail");
        AssertEqual("too_many_pairing_attempts", result.ErrorCode, "pairing lockout error mismatch");

        PairingResult correctAfterLock = service.CompletePairing(store, session.PairingSessionId, "123456", "Chrome");
        AssertFalse(correctAfterLock.Success, "locked pairing session should not accept the correct code later");
        AssertEqual("pairing_session_not_found", correctAfterLock.ErrorCode, "locked pairing session should be removed");
        AssertEqual(0, store.ListClients().Length, "locked pairing session should not add a trusted client");
    }

    private static void CancelledPairingSessionCannotComplete()
    {
        TrustedClientStore store = new TrustedClientStore();
        PairingService service = new PairingService(new DeterministicSecretGenerator("123456", "secret"));
        PairingSession session = service.BeginPairing("Chrome");

        bool cancelled = service.CancelPairing(session.PairingSessionId);
        PairingResult result = service.CompletePairing(store, session.PairingSessionId, "123456", "Chrome");

        AssertTrue(cancelled, "cancel should report true for an active pairing session");
        AssertFalse(result.Success, "cancelled pairing session should not complete");
        AssertEqual("pairing_session_not_found", result.ErrorCode, "cancelled pairing session error mismatch");
        AssertEqual(0, store.ListClients().Length, "cancelled pairing session should not add a trusted client");
    }

    private static void ExpiredPairingCodeIsRejected()
    {
        long now = 1779960000000;
        TrustedClientStore store = new TrustedClientStore();
        PairingService service = new PairingService(
            new DeterministicSecretGenerator("123456", "secret"),
            delegate { return now; });
        PairingSession session = service.BeginPairing("Chrome");
        now += PairingService.MaxPairingSessionAgeMs + 1;

        PairingResult result = service.CompletePairing(store, session.PairingSessionId, "123456", "Chrome");

        AssertFalse(result.Success, "expired pairing code should fail");
        AssertEqual("pairing_session_expired", result.ErrorCode, "expired pairing code error mismatch");
        AssertEqual(0, store.ListClients().Length, "expired code should not add a trusted client");
    }

    private static void SuccessfulPairingCreatesTrustedClient()
    {
        TrustedClientStore store = new TrustedClientStore();
        PairingService service = new PairingService(new DeterministicSecretGenerator("123456", "shared-secret"));
        PairingSession session = service.BeginPairing("Chrome");

        PairingResult result = service.CompletePairing(store, session.PairingSessionId, "123456", "Chrome");

        AssertTrue(result.Success, "correct pairing code should succeed");
        AssertTrue(!string.IsNullOrEmpty(result.Client.ClientId), "paired client should have an ID");
        AssertEqual("Chrome", result.Client.ClientName, "paired client name mismatch");
        AssertEqual("shared-secret", result.Client.SharedSecret, "paired client secret mismatch");
        AssertTrue(store.IsTrusted(result.Client.ClientId), "paired client should be trusted");
    }

    private static void RevokedClientIsNoLongerTrusted()
    {
        TrustedClientStore store = new TrustedClientStore();
        PairingService service = new PairingService(new DeterministicSecretGenerator("123456", "shared-secret"));
        PairingSession session = service.BeginPairing("Chrome");
        PairingResult result = service.CompletePairing(store, session.PairingSessionId, "123456", "Chrome");

        bool removed = store.Revoke(result.Client.ClientId);

        AssertTrue(removed, "revoke should report true for an existing client");
        AssertFalse(store.IsTrusted(result.Client.ClientId), "revoked client should not remain trusted");
    }

    private static void TrustedClientStorePersistsRoundTrip()
    {
        TrustedClientStore original = new TrustedClientStore();
        original.AddOrUpdate(new TrustedClient
        {
            ClientId = "client-1",
            ClientName = "Chrome",
            SharedSecret = "shared-secret",
            ExtensionOrigin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
            CreatedUtcMs = 1779960000000,
            LastUsedUtcMs = 1779961000000
        });

        string json = original.ExportJson();
        TrustedClientStore restored = new TrustedClientStore();
        restored.ImportJson(json);
        TrustedClient client = restored.Get("client-1");

        AssertTrue(client != null, "restored store should contain trusted client");
        AssertEqual("Chrome", client.ClientName, "restored client name mismatch");
        AssertEqual("shared-secret", client.SharedSecret, "restored client secret mismatch");
        AssertEqual("chrome-extension://abcdefghijklmnopabcdefghijklmnop", client.ExtensionOrigin,
            "restored client origin mismatch");
        AssertEqual(1779960000000, client.CreatedUtcMs, "restored client timestamp mismatch");
        AssertEqual(1779961000000, client.LastUsedUtcMs, "restored client last-used timestamp mismatch");
    }

    private static void TrustedClientDefaultPermissionsDoNotGrantPasskeys()
    {
        string[] defaults = TrustedClientPermissions.Default();

        AssertTrue(Array.IndexOf(defaults, TrustedClientPermissions.Read) >= 0,
            "default trusted browser permissions should keep password read access");
        AssertTrue(Array.IndexOf(defaults, TrustedClientPermissions.Write) >= 0,
            "default trusted browser permissions should keep password write access");
        AssertFalse(Array.IndexOf(defaults, TrustedClientPermissions.PasskeyRead) >= 0,
            "default trusted browser permissions must not grant passkey read access");
        AssertFalse(Array.IndexOf(defaults, TrustedClientPermissions.PasskeyWrite) >= 0,
            "default trusted browser permissions must not grant passkey write access");
    }

    private static void TrustedClientPermissionUpdateAcceptsPasskeyPermissions()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret", new string[] { TrustedClientPermissions.Read });

        bool updated = store.UpdatePermissions("client-1", new string[] { TrustedClientPermissions.PasskeyWrite });
        TrustedClient client = store.Get("client-1");

        AssertTrue(updated, "trusted client permission update should accept reserved passkey permission bits");
        AssertEqual(2, client.Permissions.Length, "passkey permission update should keep read baseline and requested passkey permission");
        AssertEqual(TrustedClientPermissions.Read, client.Permissions[0], "passkey permission update should keep read baseline first");
        AssertEqual(TrustedClientPermissions.PasskeyWrite, client.Permissions[1], "passkey permission update should persist requested passkey write permission");
    }

    private static void CredentialQueryReturnsExactHostMatch()
    {
        PwDatabase database = CreateDatabase(
            CreateEntry("Example", "alice", "secret", "https://example.com/login"),
            CreateEntry("Other", "mallory", "bad", "https://evil.example.net/login"));
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult result = service.Query(database, "https://example.com/account");

        AssertTrue(result.Success, "credential query should succeed: " + result.Error);
        AssertEqual(1, result.Entries.Length, "exact host query should return one entry");
        AssertEqual("Example", result.Entries[0].Title, "entry title mismatch");
        AssertEqual("alice", result.Entries[0].UserName, "entry username mismatch");
        AssertEqual("secret", result.Entries[0].Password, "entry password mismatch");
    }

    private static void CredentialQueryMatchesParentDomainWhenStrictMatchingIsDisabled()
    {
        PwDatabase database = CreateDatabase(CreateEntry("Example", "alice", "secret", "https://example.com/login"));
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult looseResult = service.Query(database, "https://accounts.example.com/login", new CredentialQueryOptions
        {
            StrictUrlMatching = false,
            RegexUrlMatching = false
        });
        CredentialQueryResult strictResult = service.Query(database, "https://accounts.example.com/login", new CredentialQueryOptions
        {
            StrictUrlMatching = true,
            RegexUrlMatching = false
        });

        AssertEqual(1, looseResult.Entries.Length, "loose URL matching should match child hosts");
        AssertEqual(0, strictResult.Entries.Length, "strict URL matching should reject child hosts");
    }

    private static void CredentialQueryMatchesWwwEntryToApexPageWhenStrictMatchingIsDisabled()
    {
        PwDatabase database = CreateDatabase(CreateEntry("Example", "alice", "secret", "https://www.example.com/login"));
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult looseResult = service.Query(database, "https://example.com/login", new CredentialQueryOptions
        {
            StrictUrlMatching = false,
            RegexUrlMatching = false
        });
        CredentialQueryResult strictResult = service.Query(database, "https://example.com/login", new CredentialQueryOptions
        {
            StrictUrlMatching = true,
            RegexUrlMatching = false
        });

        AssertEqual(1, looseResult.Entries.Length, "loose URL matching should match www entry hosts to apex pages");
        AssertEqual(0, strictResult.Entries.Length, "strict URL matching should reject www/apex host differences");
    }

    private static void CredentialQueryIgnoresRegexPatternWhenRegexMatchingIsDisabled()
    {
        PwDatabase database = CreateDatabase(CreateEntry("Regex", "alice", "secret", "regex:^https://accounts\\.example\\.com/login$"));
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult disabledResult = service.Query(database, "https://accounts.example.com/login", new CredentialQueryOptions
        {
            StrictUrlMatching = false,
            RegexUrlMatching = false
        });
        CredentialQueryResult enabledResult = service.Query(database, "https://accounts.example.com/login", new CredentialQueryOptions
        {
            StrictUrlMatching = false,
            RegexUrlMatching = true
        });

        AssertEqual(0, disabledResult.Entries.Length, "regex URL matching should be opt-in");
        AssertEqual(1, enabledResult.Entries.Length, "enabled regex URL matching should match regex entries");
    }

    private static void CredentialQueryMatchesAdditionalUrlField()
    {
        PwEntry entry = CreateEntry("ChatGPT", "alice@example.com", "secret", "https://auth.openai.com/");
        entry.Strings.Set("URL (2)", new ProtectedString(false, "https://chatgpt.com/"));
        PwDatabase database = CreateDatabase(entry);
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult result = service.Query(database, "https://chatgpt.com/codex/cloud/settings/analytics");

        AssertTrue(result.Success, "credential query with URL (2) should succeed: " + result.Error);
        AssertEqual(1, result.Entries.Length, "URL (2) query should return one entry");
        AssertEqual("ChatGPT", result.Entries[0].Title, "URL (2) entry title mismatch");
        AssertEqual("alice@example.com", result.Entries[0].UserName, "URL (2) username mismatch");
        AssertEqual("https://auth.openai.com/", result.Entries[0].Url, "primary URL should remain visible");
        AssertEqual(0, result.Entries[0].CustomFields.Length, "additional URL fields should not be exposed as custom fields");
    }

    private static void CredentialQueryIncludesKeePassGroupPath()
    {
        PwDatabase database = CreateDatabase();
        PwGroup accounts = new PwGroup(true, true, "Accounts", PwIcon.Folder);
        PwGroup work = new PwGroup(true, true, "Work", PwIcon.Folder);
        PwEntry entry = CreateEntry("Example", "alice", "secret", "https://example.com/login");
        database.RootGroup.AddGroup(accounts, true);
        accounts.AddGroup(work, true);
        work.AddEntry(entry, true);
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult result = service.Query(database, "https://example.com/account");

        AssertTrue(result.Success, "credential query should include group path: " + result.Error);
        AssertEqual(1, result.Entries.Length, "group path query should return one entry");
        AssertEqual("Accounts/Work", result.Entries[0].Group, "entry group path mismatch");
    }

    private static void CredentialQueryIncludesUsageMetadata()
    {
        PwEntry entry = CreateEntry("Example", "alice", "secret", "https://example.com/login");
        entry.UsageCount = 7;
        PwDatabase database = CreateDatabase(entry);
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult result = service.Query(database, "https://example.com/account");

        AssertTrue(result.Success, "credential query should include usage metadata: " + result.Error);
        AssertEqual(1, result.Entries.Length, "usage metadata query should return one entry");
        AssertEqual((ulong)7, result.Entries[0].UsageCount, "entry usage count mismatch");
        AssertTrue(result.Entries[0].LastUsed > 0, "entry last used timestamp should be populated");
    }

    private static void CredentialQueryIncludesOneTimePassword()
    {
        PwEntry entry = CreateEntry("Example", "alice", "secret", "https://example.com/login");
        entry.Strings.Set("TOTP Seed", new ProtectedString(true, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"));
        PwDatabase database = CreateDatabase(entry);
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult result = service.Query(database, "https://example.com/account");

        AssertTrue(result.Success, "credential query with TOTP should succeed: " + result.Error);
        AssertEqual(1, result.Entries.Length, "TOTP query result count mismatch");
        AssertTrue(!string.IsNullOrEmpty(result.Entries[0].OneTimePassword), "query should include generated TOTP");
        AssertEqual(6, result.Entries[0].OneTimePassword.Length, "default TOTP length mismatch");
        AssertTrue(IsDigitsOnly(result.Entries[0].OneTimePassword), "TOTP should contain digits only");
    }

    private static void CredentialQueryRedactsProtectedCustomFieldValues()
    {
        PwEntry entry = CreateEntry("Example", "alice", "secret", "https://example.com/login");
        entry.Strings.Set("Tenant", new ProtectedString(false, "production"));
        entry.Strings.Set("ApiKey", new ProtectedString(true, "protected-secret"));
        PwDatabase database = CreateDatabase(entry);
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult result = service.Query(database, "https://example.com/account");

        AssertTrue(result.Success, "credential query with custom fields should succeed: " + result.Error);
        AssertEqual(1, result.Entries.Length, "custom field query result count mismatch");
        AssertEqual(2, result.Entries[0].CustomFields.Length, "custom field count mismatch");
        CustomField tenant = FindCustomField(result.Entries[0].CustomFields, "Tenant");
        CustomField apiKey = FindCustomField(result.Entries[0].CustomFields, "ApiKey");
        AssertTrue(tenant != null, "public custom field should be returned");
        AssertTrue(apiKey != null, "protected custom field metadata should be returned");
        AssertEqual("production", tenant.Value, "public custom field value mismatch");
        AssertFalse(tenant.IsProtected, "public custom field should not be protected");
        AssertEqual(string.Empty, apiKey.Value, "protected custom field value should be redacted");
        AssertTrue(apiKey.IsProtected, "protected custom field flag mismatch");
    }

    private static void CredentialQuerySkipsPasskeyOnlyEntries()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before query skip test: " + registration.Error);

        PwEntry passkeyEntry = new PwEntry(true, true);
        PasskeyEntryStore.Write(passkeyEntry, registration.Credential);
        PwDatabase database = CreateDatabase(
            passkeyEntry,
            CreateEntry("Example Password", "alice", "secret", "https://example.com/login"));

        CredentialQueryResult result = new CredentialQueryService().Query(database, "https://example.com/login");

        AssertTrue(result.Success, "credential query with passkey-only entry should succeed: " + result.Error);
        AssertEqual(1, result.Entries.Length, "passkey-only entry should not appear as a password login");
        AssertEqual("Example Password", result.Entries[0].Title, "query should return the normal password entry");
    }

    private static void CredentialQueryRejectsUnrelatedDomain()
    {
        PwDatabase database = CreateDatabase(CreateEntry("Example", "alice", "secret", "https://example.com/login"));
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult result = service.Query(database, "https://evil.example.net/login");

        AssertTrue(result.Success, "credential query should succeed with empty results");
        AssertEqual(0, result.Entries.Length, "unrelated domain should not return entries");
    }

    private static void CredentialQueryRejectsClosedDatabase()
    {
        CredentialQueryService service = new CredentialQueryService();

        CredentialQueryResult result = service.Query(null, "https://example.com/login");

        AssertFalse(result.Success, "null database should be rejected");
        AssertEqual("database_not_open", result.ErrorCode, "closed database error code mismatch");
    }

    private static void CredentialMutationCreatesEntryInDatabase()
    {
        PwDatabase database = CreateDatabase();
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Create(database, new CreateLoginPayload
        {
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "secret"
        });

        AssertTrue(result.Success, "credential create should succeed: " + result.Error);
        AssertTrue(database.Modified, "database should be marked modified after create");
        AssertEqual(1, (int)database.RootGroup.Entries.UCount, "root group should contain created entry");
        AssertEqual("example.com", result.Entry.Title, "default title should use host");
        AssertEqual("alice", result.Entry.UserName, "created username mismatch");
        AssertEqual("secret", result.Entry.Password, "created password mismatch");
    }

    private static void CredentialMutationCreatesEntryInRequestedGroup()
    {
        PwDatabase database = CreateDatabase();
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Create(database, new CreateLoginPayload
        {
            Title = "Example",
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "secret",
            Group = "Accounts/Work"
        });

        AssertTrue(result.Success, "credential create in group should succeed: " + result.Error);
        AssertEqual(0, (int)database.RootGroup.Entries.UCount, "root group should not contain grouped entry");
        PwGroup accounts = FindChildGroup(database.RootGroup, "Accounts");
        PwGroup work = accounts == null ? null : FindChildGroup(accounts, "Work");
        AssertTrue(work != null, "requested group path should exist");
        AssertEqual(1, (int)work.Entries.UCount, "requested group should contain created entry");
        AssertEqual("Accounts/Work", result.Entry.Group, "created result group mismatch");
    }

    private static void CredentialMutationCreatesEntryWithTotpSecret()
    {
        PwDatabase database = CreateDatabase();
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Create(database, new CreateLoginPayload
        {
            Title = "Example",
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "secret",
            Otp = "JBSWY3DPEHPK3PXP"
        });

        AssertTrue(result.Success, "credential create with TOTP should succeed: " + result.Error);
        PwEntry entry = database.RootGroup.Entries.GetAt(0);
        AssertEqual("JBSWY3DPEHPK3PXP", entry.Strings.ReadSafe("otp"), "created entry should store TOTP secret in otp field");
    }

    private static void CredentialMutationCreatesEntryWithCustomField()
    {
        PwDatabase database = CreateDatabase();
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Create(database, new CreateLoginPayload
        {
            Title = "Example",
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "secret",
            CustomFields = new[]
            {
                new CustomField { Name = "Tenant", Value = "production", IsProtected = false },
                new CustomField { Name = "Password", Value = "should-not-overwrite", IsProtected = false },
                new CustomField { Name = "ApiKey", Value = "protected-secret", IsProtected = true }
            }
        });

        AssertTrue(result.Success, "credential create with custom field should succeed: " + result.Error);
        PwEntry entry = database.RootGroup.Entries.GetAt(0);
        AssertEqual("production", entry.Strings.ReadSafe("Tenant"), "created entry should store public custom field");
        AssertEqual("secret", entry.Strings.ReadSafe(PwDefs.PasswordField), "reserved custom field name should not overwrite password");
        AssertTrue(entry.Strings.Get("ApiKey").IsProtected, "protected custom field should be stored as protected");
        AssertEqual("protected-secret", entry.Strings.ReadSafe("ApiKey"), "protected custom field value mismatch");
        AssertTrue(FindCustomField(result.Entry.CustomFields, "Tenant") != null, "created result should include public custom field metadata");
    }

    private static void CredentialMutationUpdatesExistingEntryPassword()
    {
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        PwDatabase database = CreateDatabase(entry);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "new-secret"
        });

        AssertTrue(result.Success, "credential update should succeed: " + result.Error);
        AssertTrue(database.Modified, "database should be marked modified after update");
        AssertEqual(1, (int)database.RootGroup.Entries.UCount, "update should not create a new entry");
        AssertEqual("new-secret", entry.Strings.ReadSafe(PwDefs.PasswordField), "entry password should be updated");
        AssertEqual("new-secret", result.Entry.Password, "updated result password mismatch");
    }

    private static void CredentialMutationAcceptsPageUrlFromAdditionalUrlField()
    {
        PwEntry entry = CreateEntry("ChatGPT", "alice@example.com", "old-secret", "https://auth.openai.com/");
        entry.Strings.Set("URL (2)", new ProtectedString(false, "https://chatgpt.com/"));
        PwDatabase database = CreateDatabase(entry);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            PageUrl = "https://chatgpt.com/codex/cloud/settings/analytics",
            Password = "new-secret"
        });

        AssertTrue(result.Success, "credential update should accept matching URL (2): " + result.Error);
        AssertEqual("new-secret", entry.Strings.ReadSafe(PwDefs.PasswordField), "password should update when PageUrl matches URL (2)");
    }

    private static void CredentialMutationUpdatesExistingEntryFields()
    {
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        PwDatabase database = CreateDatabase(entry);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            Title = "Updated Example",
            Url = "https://accounts.example.com/sign-in",
            UserName = "alice.updated@example.com",
            Password = "new-secret"
        });

        AssertTrue(result.Success, "credential field update should succeed: " + result.Error);
        AssertEqual("Updated Example", entry.Strings.ReadSafe(PwDefs.TitleField), "entry title should be updated");
        AssertEqual("https://accounts.example.com/sign-in", entry.Strings.ReadSafe(PwDefs.UrlField), "entry URL should be updated");
        AssertEqual("alice.updated@example.com", entry.Strings.ReadSafe(PwDefs.UserNameField), "entry username should be updated");
        AssertEqual("new-secret", entry.Strings.ReadSafe(PwDefs.PasswordField), "entry password should be updated");
        AssertEqual("Updated Example", result.Entry.Title, "updated result title mismatch");
        AssertEqual("alice.updated@example.com", result.Entry.UserName, "updated result username mismatch");
        AssertEqual("https://accounts.example.com/sign-in", result.Entry.Url, "updated result URL mismatch");
    }

    private static void CredentialMutationUpdatesExistingEntryCustomField()
    {
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        entry.Strings.Set("Tenant", new ProtectedString(false, "staging"));
        PwDatabase database = CreateDatabase(entry);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            CustomFields = new[]
            {
                new CustomField { Name = "Tenant", Value = "production", IsProtected = false },
                new CustomField { Name = "Password", Value = "should-not-overwrite", IsProtected = false }
            }
        });

        AssertTrue(result.Success, "credential update with custom field should succeed: " + result.Error);
        AssertEqual("production", entry.Strings.ReadSafe("Tenant"), "updated entry should store public custom field");
        AssertEqual("old-secret", entry.Strings.ReadSafe(PwDefs.PasswordField), "reserved custom field name should not overwrite password");
        AssertTrue(FindCustomField(result.Entry.CustomFields, "Tenant") != null, "updated result should include public custom field metadata");
    }

    private static void CredentialMutationReplacesExistingEntryCustomFields()
    {
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        entry.Strings.Set("Tenant", new ProtectedString(false, "staging"));
        entry.Strings.Set("Environment", new ProtectedString(false, "dev"));
        entry.Strings.Set("ApiKey", new ProtectedString(true, "protected-secret"));
        PwDatabase database = CreateDatabase(entry);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            ReplaceCustomFields = true,
            CustomFields = new[]
            {
                new CustomField { Name = "Tenant", Value = "production", IsProtected = false }
            }
        });

        AssertTrue(result.Success, "credential update should replace custom fields: " + result.Error);
        AssertEqual("production", entry.Strings.ReadSafe("Tenant"), "kept custom field should update value");
        AssertEqual(string.Empty, entry.Strings.ReadSafe("Environment"), "removed custom field should be deleted");
        AssertEqual("protected-secret", entry.Strings.ReadSafe("ApiKey"), "protected custom field should not be deleted by replace");
        AssertTrue(FindCustomField(result.Entry.CustomFields, "Tenant") != null, "updated result should include kept custom field");
        AssertTrue(FindCustomField(result.Entry.CustomFields, "Environment") == null, "updated result should not include removed custom field");
    }

    private static void CredentialMutationMovesExistingEntryToRequestedGroup()
    {
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        PwDatabase database = CreateDatabase(entry);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            Group = "Accounts/Work"
        });

        AssertTrue(result.Success, "credential update should move entry to requested group: " + result.Error);
        AssertEqual(0, (int)database.RootGroup.Entries.UCount, "root group should no longer contain moved entry");
        PwGroup accounts = FindChildGroup(database.RootGroup, "Accounts");
        PwGroup work = accounts == null ? null : FindChildGroup(accounts, "Work");
        AssertTrue(work != null, "requested destination group should exist");
        AssertEqual(1, (int)work.Entries.UCount, "destination group should contain moved entry");
        AssertEqual(entry.Uuid.ToHexString(), work.Entries.GetAt(0).Uuid.ToHexString(), "destination group should contain original entry");
        AssertEqual("Accounts/Work", result.Entry.Group, "updated result group mismatch");
    }

    private static void CredentialMutationMovesExistingEntryToRootWhenGroupIsBlank()
    {
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        PwDatabase database = CreateDatabase();
        PwGroup accounts = new PwGroup(true, true, "Accounts", PwIcon.Folder);
        PwGroup work = new PwGroup(true, true, "Work", PwIcon.Folder);
        database.RootGroup.AddGroup(accounts, true);
        accounts.AddGroup(work, true);
        work.AddEntry(entry, true);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            Group = string.Empty
        });

        AssertTrue(result.Success, "credential update should move entry to root when group is blank: " + result.Error);
        AssertEqual(1, (int)database.RootGroup.Entries.UCount, "root group should contain moved entry");
        AssertEqual(entry.Uuid.ToHexString(), database.RootGroup.Entries.GetAt(0).Uuid.ToHexString(), "root group should contain original entry");
        AssertEqual(0, (int)work.Entries.UCount, "source group should no longer contain moved entry");
        AssertEqual(string.Empty, result.Entry.Group, "updated result group should be root path");
    }

    private static void CredentialMutationUpdatesExistingEntryTotpSecret()
    {
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        PwDatabase database = CreateDatabase(entry);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            Otp = "JBSWY3DPEHPK3PXP"
        });

        AssertTrue(result.Success, "credential update should store TOTP secret: " + result.Error);
        AssertEqual("JBSWY3DPEHPK3PXP", entry.Strings.ReadSafe("otp"), "updated entry should store TOTP secret in otp field");
    }

    private static void CredentialMutationClearsExistingEntryTotpSecret()
    {
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        entry.Strings.Set("otp", new ProtectedString(true, "JBSWY3DPEHPK3PXP"));
        PwDatabase database = CreateDatabase(entry);
        CredentialMutationService service = new CredentialMutationService();

        CredentialMutationResult result = service.Update(database, new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            ClearOtp = true
        });

        AssertTrue(result.Success, "credential update should clear TOTP secret: " + result.Error);
        AssertEqual(string.Empty, entry.Strings.ReadSafe("otp"), "updated entry should remove TOTP secret");
    }

    private static void BridgeHandlerHelloDoesNotRequireAuthentication()
    {
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);

        BridgeResponse response = handler.Handle(request);
        HelloResponsePayload payload = BridgeJsonSerializer.Deserialize<HelloResponsePayload>(response.Payload);

        AssertTrue(response.Success, "hello should succeed without authentication: " + response.Error);
        AssertEqual(request.RequestId, response.RequestId, "hello response request ID mismatch");
        AssertEqual("0.9.0", payload.PluginVersion, "hello should expose the KeePass plugin version");
        AssertEqual(BridgeSettings.UpdateInfoUrl, payload.PluginUpdateUrl, "hello should expose the KeePass plugin update URL");
        AssertTrue(Array.IndexOf(payload.SupportedMethods, BridgeMethods.LoginsQuery) >= 0,
            "hello should advertise password query support");
        AssertTrue(Array.IndexOf(payload.SupportedMethods, BridgeMethods.PasskeysCancel) >= 0,
            "hello should advertise reserved passkey cancel support");
        BridgeFeatureInfo saveUpdate = FindFeature(payload.Features, "saveUpdate");
        BridgeFeatureInfo passkeys = FindFeature(payload.Features, "passkeys");
        AssertEqual(true, saveUpdate.Enabled, "hello should advertise enabled save/update support");
        AssertEqual("available", saveUpdate.Status, "hello should advertise available save/update status");
        AssertEqual(false, passkeys.Enabled, "hello should advertise that browser-facing passkeys are disabled");
        AssertEqual("prototype_disabled", passkeys.Status, "hello should advertise disabled passkey prototype status");
        AssertTrue((passkeys.Reason ?? string.Empty).IndexOf("browser-facing WebAuthn", StringComparison.OrdinalIgnoreCase) >= 0,
            "hello should explain why browser-facing passkeys are disabled");
    }

    private static void BridgeHandlerRejectsBadHmacForTrustedMethod()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientStatus, "client-1", "bad-secret", "");

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "bad HMAC should be rejected");
        AssertEqual("invalid_authentication", response.ErrorCode, "bad HMAC error code mismatch");
    }

    private static void BridgeHandlerAcceptsValidHmacForClientStatus()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientStatus, "client-1", "secret", "");

        BridgeResponse response = handler.Handle(request);
        ClientStatusResponsePayload payload = BridgeJsonSerializer.Deserialize<ClientStatusResponsePayload>(response.Payload);

        AssertTrue(response.Success, "valid HMAC client.status should succeed: " + response.Error);
        AssertTrue(payload.Trusted, "client.status should report trusted client");
    }

    private static void BridgeHandlerClientStatusIncludesPermissions()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret", new string[] { TrustedClientPermissions.Read });
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientStatus, "client-1", "secret", "");

        BridgeResponse response = handler.Handle(request);
        ClientStatusResponsePayload payload = BridgeJsonSerializer.Deserialize<ClientStatusResponsePayload>(response.Payload);

        AssertTrue(response.Success, "client.status should succeed for permission inspection: " + response.Error);
        AssertEqual(1, payload.Permissions.Length, "client.status should include trusted client permissions");
        AssertEqual(TrustedClientPermissions.Read, payload.Permissions[0], "client.status permission mismatch");
    }

    private static void BridgeHandlerPairBeginPassesOriginToPairingPrompt()
    {
        PairingService pairing = new PairingService(new DeterministicSecretGenerator("123456", "shared-secret"));
        PairingSession promptedSession = null;
        BridgeRequestHandler handler = new BridgeRequestHandler(
            pairing,
            new TrustedClientStore(),
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return (PwDatabase)null; },
            delegate(PairingSession session) { promptedSession = session; },
            delegate(PwDatabase database) { });
        BridgeRequest request = CreateValidRequest(BridgeMethods.PairBegin);
        request.Payload = BridgeJsonSerializer.Serialize(new PairBeginPayload
        {
            ClientName = "Chrome"
        });

        BridgeResponse response = handler.Handle(request);

        AssertTrue(response.Success, "pair.begin should succeed: " + response.Error);
        AssertTrue(promptedSession != null, "pair.begin should surface a pairing session to KeePass UI");
        AssertEqual("chrome-extension://abcdefghijklmnopabcdefghijklmnop", promptedSession.ExtensionOrigin,
            "pair.begin should pass the extension origin into the KeePass pairing prompt");
    }

    private static void BridgeHandlerPairCompleteStoresExtensionOrigin()
    {
        PairingService pairing = new PairingService(new DeterministicSecretGenerator("123456", "shared-secret"));
        TrustedClientStore store = new TrustedClientStore();
        BridgeRequestHandler handler = new BridgeRequestHandler(
            pairing,
            store,
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return (PwDatabase)null; },
            delegate(PairingSession session) { },
            delegate(PwDatabase database) { });
        PairingSession session = pairing.BeginPairing("Chrome");
        BridgeRequest request = CreateValidRequest(BridgeMethods.PairComplete);
        request.Payload = BridgeJsonSerializer.Serialize(new PairCompletePayload
        {
            PairingSessionId = session.PairingSessionId,
            PairingCode = "123456",
            ClientName = "Chrome"
        });

        BridgeResponse response = handler.Handle(request);
        PairCompleteResponsePayload payload = BridgeJsonSerializer.Deserialize<PairCompleteResponsePayload>(response.Payload);
        TrustedClient client = store.Get(payload.ClientId);

        AssertTrue(response.Success, "pair.complete should succeed: " + response.Error);
        AssertTrue(client != null, "paired client should be stored");
        AssertEqual("chrome-extension://abcdefghijklmnopabcdefghijklmnop", client.ExtensionOrigin,
            "paired client should store the extension origin");
    }

    private static void BridgeHandlerRejectsAuthenticatedRequestFromDifferentExtensionOrigin()
    {
        TrustedClientStore store = new TrustedClientStore();
        store.ImportJson("{\"Clients\":[{\"ClientId\":\"client-1\",\"ClientName\":\"Chrome\",\"SharedSecret\":\"secret\",\"ExtensionOrigin\":\"chrome-extension://abcdefghijklmnopabcdefghijklmnop\",\"CreatedUtcMs\":1779960000000}]}");
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateValidRequest(BridgeMethods.ClientStatus);
        request.Origin = "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        request.ClientId = "client-1";
        request.Authentication = BridgeAuthentication.CreateAuthentication(request, "secret");

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "trusted client secret should not authenticate a different extension origin");
        AssertEqual("invalid_authentication", response.ErrorCode, "origin-bound auth error code mismatch");
    }

    private static void BridgeHandlerRejectsReplayedAuthenticatedRequestId()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientStatus, "client-1", "secret", "");

        BridgeResponse first = handler.Handle(request);
        BridgeResponse second = handler.Handle(request);

        AssertTrue(first.Success, "first authenticated request should succeed: " + first.Error);
        AssertFalse(second.Success, "replayed authenticated request should fail");
        AssertEqual("replayed_request", second.ErrorCode, "replayed request error code mismatch");
    }

    private static void BridgeHandlerReturnsStructuredErrorForMalformedPayload()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsQuery, "client-1", "secret", "{not-json");

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "malformed payload should return bridge error");
        AssertEqual("invalid_payload", response.ErrorCode, "malformed payload error code mismatch");
        AssertEqual(request.RequestId, response.RequestId, "malformed payload response request ID mismatch");
    }

    private static void BridgeHandlerCancelsPairingSession()
    {
        PairingService pairing = new PairingService(new DeterministicSecretGenerator("123456", "shared-secret"));
        TrustedClientStore store = new TrustedClientStore();
        BridgeRequestHandler handler = new BridgeRequestHandler(
            pairing,
            store,
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return (PwDatabase)null; },
            delegate(PairingSession session) { },
            delegate(PwDatabase database) { });
        PairingSession session = pairing.BeginPairing("Chrome");
        string payload = BridgeJsonSerializer.Serialize(new PairCancelPayload { PairingSessionId = session.PairingSessionId });
        BridgeRequest request = CreateValidRequest(BridgeMethods.PairCancel);
        request.Payload = payload;

        BridgeResponse response = handler.Handle(request);
        PairCancelResponsePayload result = BridgeJsonSerializer.Deserialize<PairCancelResponsePayload>(response.Payload);
        PairingResult completeAfterCancel = pairing.CompletePairing(store, session.PairingSessionId, "123456", "Chrome");

        AssertTrue(response.Success, "pair.cancel should return bridge success: " + response.Error);
        AssertTrue(result.Cancelled, "pair.cancel should report cancelled");
        AssertFalse(completeAfterCancel.Success, "handler-cancelled session should not complete");
        AssertEqual("pairing_session_not_found", completeAfterCancel.ErrorCode, "handler-cancelled session error mismatch");
    }

    private static void BridgeHandlerListsTrustedClientsWithoutSecrets()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = "client-2",
            ClientName = "Second Browser",
            SharedSecret = "second-secret",
            CreatedUtcMs = 1779960000000
        });
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientsList, "client-1", "secret", "{}");

        BridgeResponse response = handler.Handle(request);
        ClientsListResponsePayload payload = BridgeJsonSerializer.Deserialize<ClientsListResponsePayload>(response.Payload);

        AssertTrue(response.Success, "clients.list should succeed: " + response.Error);
        AssertEqual(2, payload.Clients.Length, "clients.list count mismatch");
        AssertEqual("client-1", payload.Clients[0].ClientId, "first client id mismatch");
        AssertTrue(payload.Clients[0].Trusted, "current client should be trusted");
    }

    private static void BridgeHandlerListsTrustedClientOrigins()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = "client-2",
            ClientName = "Second Browser",
            SharedSecret = "second-secret",
            ExtensionOrigin = "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CreatedUtcMs = 1779960000000
        });
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientsList, "client-1", "secret", "{}");

        BridgeResponse response = handler.Handle(request);
        ClientsListResponsePayload payload = BridgeJsonSerializer.Deserialize<ClientsListResponsePayload>(response.Payload);

        AssertTrue(response.Success, "clients.list should succeed for origin inspection: " + response.Error);
        AssertEqual("chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            payload.Clients[1].ExtensionOrigin, "clients.list should expose paired extension origin");
    }

    private static void BridgeHandlerTracksTrustedClientLastUsed()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        TrustedClient client = store.Get("client-1");
        AssertEqual(0, client.LastUsedUtcMs, "new trusted client should start without last-used timestamp");
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientStatus, "client-1", "secret", "{}");

        BridgeResponse response = handler.Handle(request);

        AssertTrue(response.Success, "authenticated client.status should succeed before tracking last-used: " + response.Error);
        AssertTrue(client.LastUsedUtcMs > 0, "authenticated request should update trusted client last-used timestamp");
    }

    private static void BridgeHandlerListsTrustedClientLastUsed()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = "client-2",
            ClientName = "Second Browser",
            SharedSecret = "second-secret",
            CreatedUtcMs = 1779960000000,
            LastUsedUtcMs = 1779961234567
        });
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientsList, "client-1", "secret", "{}");

        BridgeResponse response = handler.Handle(request);
        ClientsListResponsePayload payload = BridgeJsonSerializer.Deserialize<ClientsListResponsePayload>(response.Payload);

        AssertTrue(response.Success, "clients.list should succeed for last-used inspection: " + response.Error);
        AssertEqual(1779961234567, payload.Clients[1].LastUsedUtcMs, "clients.list should expose trusted client last-used timestamp");
    }

    private static void BridgeHandlerRevokesTrustedClient()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = "client-2",
            ClientName = "Second Browser",
            SharedSecret = "second-secret",
            CreatedUtcMs = 1779960000000
        });
        BridgeRequestHandler handler = CreateHandler(null, store);
        string payload = BridgeJsonSerializer.Serialize(new ClientRevokePayload { ClientId = "client-2" });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientsRevoke, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        ClientRevokeResponsePayload result = BridgeJsonSerializer.Deserialize<ClientRevokeResponsePayload>(response.Payload);

        AssertTrue(response.Success, "clients.revoke should return bridge success: " + response.Error);
        AssertTrue(result.Revoked, "clients.revoke should report revoked");
        AssertFalse(store.IsTrusted("client-2"), "revoked client should not remain trusted");
        AssertTrue(store.IsTrusted("client-1"), "requesting client should remain trusted when revoking another client");
    }

    private static void BridgeHandlerRejectsWriteWhenTrustedClientIsReadOnly()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret", new string[] { TrustedClientPermissions.Read });
        PwDatabase database = CreateDatabase();
        BridgeRequestHandler handler = CreateHandler(database, store);
        string payload = BridgeJsonSerializer.Serialize(new CreateLoginPayload
        {
            Title = "Example",
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "secret"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsCreate, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "read-only trusted clients should not create KeePass entries");
        AssertEqual("permission_denied", response.ErrorCode, "write permission error code mismatch");
        AssertEqual(0, (int)database.RootGroup.Entries.UCount, "permission denied write should not mutate the database");
    }

    private static void BridgeHandlerListsTrustedClientPermissions()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret", new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.Write, TrustedClientPermissions.ManageClients });
        BridgeRequestHandler handler = CreateHandler(null, store);
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientsList, "client-1", "secret", "{}");

        BridgeResponse response = handler.Handle(request);
        ClientsListResponsePayload payload = BridgeJsonSerializer.Deserialize<ClientsListResponsePayload>(response.Payload);

        AssertTrue(response.Success, "clients.list should succeed for permission inspection: " + response.Error);
        AssertEqual(3, payload.Clients[0].Permissions.Length, "clients.list should include trusted client permissions");
        AssertEqual(TrustedClientPermissions.Read, payload.Clients[0].Permissions[0], "first listed permission mismatch");
        AssertEqual(TrustedClientPermissions.Write, payload.Clients[0].Permissions[1], "second listed permission mismatch");
        AssertEqual(TrustedClientPermissions.ManageClients, payload.Clients[0].Permissions[2], "third listed permission mismatch");
    }

    private static void BridgeHandlerUpdatesTrustedClientPermissions()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret", new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.ManageClients });
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = "client-2",
            ClientName = "Limited Browser",
            SharedSecret = "second-secret",
            Permissions = new string[] { TrustedClientPermissions.Read },
            CreatedUtcMs = NowMs()
        });
        BridgeRequestHandler handler = CreateHandler(null, store);
        string payload = BridgeJsonSerializer.Serialize(new ClientPermissionsUpdatePayload
        {
            ClientId = "client-2",
            Permissions = new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.Write }
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientsUpdatePermissions, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        ClientPermissionsUpdateResponsePayload result = BridgeJsonSerializer.Deserialize<ClientPermissionsUpdateResponsePayload>(response.Payload);
        TrustedClient updated = store.Get("client-2");

        AssertTrue(response.Success, "clients.updatePermissions should return bridge success: " + response.Error);
        AssertTrue(result.Updated, "clients.updatePermissions should report updated");
        AssertEqual("client-2", result.ClientId, "updated permissions client id mismatch");
        AssertEqual(2, updated.Permissions.Length, "updated client permission count mismatch");
        AssertEqual(TrustedClientPermissions.Read, updated.Permissions[0], "updated read permission mismatch");
        AssertEqual(TrustedClientPermissions.Write, updated.Permissions[1], "updated write permission mismatch");
    }

    private static void BridgeHandlerDoesNotGrantFullPermissionsForEmptyPermissionUpdate()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret", new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.ManageClients });
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = "client-2",
            ClientName = "Limited Browser",
            SharedSecret = "second-secret",
            Permissions = new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.Write },
            CreatedUtcMs = NowMs()
        });
        BridgeRequestHandler handler = CreateHandler(null, store);
        string payload = BridgeJsonSerializer.Serialize(new ClientPermissionsUpdatePayload
        {
            ClientId = "client-2",
            Permissions = new string[0]
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientsUpdatePermissions, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        TrustedClient updated = store.Get("client-2");

        AssertTrue(response.Success, "empty clients.updatePermissions should return bridge success: " + response.Error);
        AssertEqual(1, updated.Permissions.Length, "empty permission update should leave only read permission");
        AssertEqual(TrustedClientPermissions.Read, updated.Permissions[0], "empty permission update should not grant write or manage-clients");
    }

    private static void BridgeHandlerKeepsReadPermissionWhenUpdatingElevatedPermissions()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret", new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.ManageClients });
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = "client-2",
            ClientName = "Limited Browser",
            SharedSecret = "second-secret",
            Permissions = new string[] { TrustedClientPermissions.Read },
            CreatedUtcMs = NowMs()
        });
        BridgeRequestHandler handler = CreateHandler(null, store);
        string payload = BridgeJsonSerializer.Serialize(new ClientPermissionsUpdatePayload
        {
            ClientId = "client-2",
            Permissions = new string[] { TrustedClientPermissions.Write }
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.ClientsUpdatePermissions, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        TrustedClient updated = store.Get("client-2");

        AssertTrue(response.Success, "write-only clients.updatePermissions should return bridge success: " + response.Error);
        AssertEqual(2, updated.Permissions.Length, "elevated permission update should keep read baseline");
        AssertEqual(TrustedClientPermissions.Read, updated.Permissions[0], "read baseline should be first");
        AssertEqual(TrustedClientPermissions.Write, updated.Permissions[1], "requested write permission should remain");
    }

    private static void BridgeHandlerRejectsPasskeyReadWithoutPasskeyPermission()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        BridgeRequestHandler handler = CreateHandler(null, store);
        string payload = BridgeJsonSerializer.Serialize(new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://example.com/login"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysList, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "default trusted clients should not reach passkey read methods");
        AssertEqual("permission_denied", response.ErrorCode, "passkey read permission error code mismatch");
    }

    private static void BridgeHandlerRejectsPasskeyWriteWithOnlyPasskeyRead()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        BridgeRequestHandler handler = CreateHandler(null, store);
        string payload = BridgeJsonSerializer.Serialize(new PasskeyCreateBeginPayload
        {
            WebAuthnRequestId = "request-1",
            RpId = "example.com",
            Origin = "https://example.com/login",
            Challenge = Base64Url.Encode(Encoding.ASCII.GetBytes("0123456789abcdef")),
            UserHandle = Base64Url.Encode(Encoding.ASCII.GetBytes("alice-handle")),
            UserName = "alice@example.com"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "passkey read permission should not authorize passkey registration");
        AssertEqual("permission_denied", response.ErrorCode, "passkey write permission error code mismatch");
    }

    private static void BridgeHandlerReturnsFeatureDisabledForPermittedPasskeyMethod()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        TrustedClient client = store.Get("client-1");
        BridgeRequestHandler handler = CreateHandler(null, store);
        string payload = BridgeJsonSerializer.Serialize(new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://example.com/login"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysList, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "permitted passkey methods should remain disabled until browser-facing support is ready");
        AssertEqual("feature_disabled", response.ErrorCode, "disabled passkey method error code mismatch");
        AssertTrue(client.LastUsedUtcMs > 0, "permitted passkey method should pass authenticated tracking before feature-disabled response");
    }

    private static void BridgeHandlerReturnsFeatureDisabledForPermittedPasskeyWriteMethod()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        BridgeRequestHandler handler = CreateHandler(null, store);
        string payload = BridgeJsonSerializer.Serialize(CreatePasskeyCreateBeginPayload("webauthn-create-disabled"));
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "permitted passkey write methods should remain disabled until browser-facing support is ready");
        AssertEqual("feature_disabled", response.ErrorCode, "disabled passkey write method error code mismatch");
    }

    private static void BridgeHandlerListsPasskeysWhenFeatureGateIsEnabled()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before bridge list test: " + registration.Error);

        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PwDatabase database = CreateDatabase(entry);
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store);
        string payload = BridgeJsonSerializer.Serialize(new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://example.com/login",
            AllowCredentialIds = new string[] { registration.Credential.CredentialId }
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysList, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        PasskeyCredentialLookupResult result = BridgeJsonSerializer.Deserialize<PasskeyCredentialLookupResult>(response.Payload);

        AssertTrue(response.Success, "enabled passkeys.list should return a bridge success envelope: " + response.Error);
        AssertTrue(result.Success, "enabled passkeys.list payload should succeed: " + result.Error);
        AssertEqual(1, result.Credentials.Length, "enabled passkeys.list should return matching passkey summaries");
        AssertEqual(registration.Credential.CredentialId, result.Credentials[0].CredentialId,
            "enabled passkeys.list credential ID mismatch");
    }

    private static void BridgeHandlerRejectsInvalidPasskeyListAllowCredentialWhenFeatureGateIsEnabled()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store);
        string payload = BridgeJsonSerializer.Serialize(new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://example.com/login",
            AllowCredentialIds = new string[] { "not@base64url" }
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysList, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "enabled passkeys.list should reject invalid allowCredentialIds");
        AssertEqual("invalid_allow_credential", response.ErrorCode,
            "enabled passkeys.list invalid allowCredentialIds error code mismatch");
    }

    private static void BridgeHandlerBeginsPasskeyCreateWhenFeatureGateIsEnabled()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending);
        string payload = BridgeJsonSerializer.Serialize(CreatePasskeyCreateBeginPayload("webauthn-create-bridge"));
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        PasskeyCreateBeginResponsePayload result = BridgeJsonSerializer.Deserialize<PasskeyCreateBeginResponsePayload>(response.Payload);

        AssertTrue(response.Success, "enabled passkeys.create.begin should return a bridge success envelope: " + response.Error);
        AssertTrue(result.PendingApproval, "enabled passkeys.create.begin should create a pending approval");
        AssertEqual("webauthn-create-bridge", result.WebAuthnRequestId, "create begin WebAuthn request ID mismatch");
        AssertEqual("example.com", result.RpId, "create begin RP ID mismatch");
        AssertEqual("https://example.com/login", result.Origin, "create begin caller origin mismatch");
        AssertTrue(result.ExpiresUtcMs > request.TimestampUtcMs, "create begin should return a future expiration");
        AssertEqual(1, pending.Count, "create begin should leave one pending session for approval");
    }

    private static void BridgeHandlerBeginsPasskeyGetWithCredentialSummariesWhenFeatureGateIsEnabled()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before bridge get begin test: " + registration.Error);

        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PwDatabase database = CreateDatabase(entry);
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending);
        string payload = BridgeJsonSerializer.Serialize(CreatePasskeyGetBeginPayload("webauthn-get-bridge",
            new string[] { registration.Credential.CredentialId }));
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        PasskeyGetBeginResponsePayload result = BridgeJsonSerializer.Deserialize<PasskeyGetBeginResponsePayload>(response.Payload);

        AssertTrue(response.Success, "enabled passkeys.get.begin should return a bridge success envelope: " + response.Error);
        AssertTrue(result.PendingApproval, "enabled passkeys.get.begin should create a pending approval");
        AssertEqual("webauthn-get-bridge", result.WebAuthnRequestId, "get begin WebAuthn request ID mismatch");
        AssertEqual(1, result.Credentials.Length, "get begin should return matching passkey summaries");
        AssertEqual(registration.Credential.CredentialId, result.Credentials[0].CredentialId,
            "get begin passkey summary credential ID mismatch");
        AssertEqual(1, pending.Count, "get begin should leave one pending session for approval");
    }

    private static void BridgeHandlerRejectsInvalidPasskeyAllowCredentialBeforeApprovalWhenFeatureGateIsEnabled()
    {
        int approvalCount = 0;
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyGetBeginPayload getPayload = CreatePasskeyGetBeginPayload("webauthn-get-invalid-allow-credential-bridge",
            new string[] { "not@base64url" });
        BridgeResponse getResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(getPayload)));

        AssertFalse(getResponse.Success, "bridge get begin should reject invalid allowCredentials");
        AssertEqual("invalid_allow_credential", getResponse.ErrorCode,
            "bridge get invalid allowCredentials error code mismatch");
        AssertEqual(0, approvalCount, "bridge invalid allowCredentials rejection should not prompt for approval");
        AssertEqual(0, pending.Count, "bridge invalid allowCredentials rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsInvalidPasskeyExcludeCredentialBeforeApprovalWhenFeatureGateIsEnabled()
    {
        int approvalCount = 0;
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-invalid-exclude-credential-bridge");
        createPayload.ExcludeCredentialIds = new string[] { "not@base64url" };
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject invalid excludeCredentials");
        AssertEqual("invalid_exclude_credential", createResponse.ErrorCode,
            "bridge create invalid excludeCredentials error code mismatch");
        AssertEqual(0, approvalCount, "bridge invalid excludeCredentials rejection should not prompt for approval");
        AssertEqual(0, pending.Count, "bridge invalid excludeCredentials rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsRequiredPasskeyUserVerificationWhenFeatureGateIsEnabled()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending);

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-required-uv-bridge");
        createPayload.UserVerification = "required";
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject required user verification");
        AssertEqual("unsupported_user_verification", createResponse.ErrorCode,
            "bridge create required user verification error code mismatch");

        PasskeyGetBeginPayload getPayload = CreatePasskeyGetBeginPayload("webauthn-get-required-uv-bridge", new string[0]);
        getPayload.UserVerification = "required";
        BridgeResponse getResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(getPayload)));

        AssertFalse(getResponse.Success, "bridge get begin should reject required user verification");
        AssertEqual("unsupported_user_verification", getResponse.ErrorCode,
            "bridge get required user verification error code mismatch");
        AssertEqual(0, pending.Count, "bridge required user verification rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsUnknownPasskeyUserVerificationWhenFeatureGateIsEnabled()
    {
        int approvalCount = 0;
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-unknown-uv-bridge");
        createPayload.UserVerification = "future-required";
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject unknown user verification policy values");
        AssertEqual("unsupported_user_verification", createResponse.ErrorCode,
            "bridge create unknown user verification error code mismatch");

        PasskeyGetBeginPayload getPayload = CreatePasskeyGetBeginPayload("webauthn-get-unknown-uv-bridge", new string[0]);
        getPayload.UserVerification = "future-required";
        BridgeResponse getResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(getPayload)));

        AssertFalse(getResponse.Success, "bridge get begin should reject unknown user verification policy values");
        AssertEqual("unsupported_user_verification", getResponse.ErrorCode,
            "bridge get unknown user verification error code mismatch");
        AssertEqual(0, approvalCount, "bridge unknown user verification rejection should not prompt for approval");
        AssertEqual(0, pending.Count, "bridge unknown user verification rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsInvalidPasskeyUserHandleBeforeApprovalWhenFeatureGateIsEnabled()
    {
        int approvalCount = 0;
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-invalid-user-handle-bridge");
        createPayload.UserHandle = "not@base64url";
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject invalid user handles");
        AssertEqual("invalid_user_handle", createResponse.ErrorCode,
            "bridge create invalid user handle error code mismatch");
        AssertEqual(0, approvalCount, "bridge invalid user handle rejection should not prompt for approval");
        AssertEqual(0, pending.Count, "bridge invalid user handle rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsUnsupportedPasskeyCredentialAlgorithmWhenFeatureGateIsEnabled()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending);

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-unsupported-alg-bridge");
        createPayload.CredentialAlgorithms = new int[] { -257 };
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject unsupported credential algorithms");
        AssertEqual("unsupported_algorithm", createResponse.ErrorCode,
            "bridge create unsupported credential algorithm error code mismatch");
        AssertEqual(0, pending.Count, "bridge unsupported credential algorithm rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsUnsupportedPasskeyAttestationWhenFeatureGateIsEnabled()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending);

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-direct-attestation-bridge");
        createPayload.Attestation = "direct";
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject unsupported attestation conveyance");
        AssertEqual("unsupported_attestation", createResponse.ErrorCode,
            "bridge create unsupported attestation error code mismatch");
        AssertEqual(0, pending.Count, "bridge unsupported attestation rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsUnsupportedPasskeyAuthenticatorAttachmentWhenFeatureGateIsEnabled()
    {
        int approvalCount = 0;
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-platform-attachment-bridge");
        createPayload.AuthenticatorAttachment = "platform";
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject unsupported authenticator attachment");
        AssertEqual("unsupported_authenticator_attachment", createResponse.ErrorCode,
            "bridge create unsupported authenticator attachment error code mismatch");
        AssertEqual(0, approvalCount, "bridge unsupported authenticator attachment rejection should not prompt for approval");
        AssertEqual(0, pending.Count, "bridge unsupported authenticator attachment rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsUnsupportedPasskeyResidentKeyWhenFeatureGateIsEnabled()
    {
        int approvalCount = 0;
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-unknown-resident-key-bridge");
        createPayload.ResidentKey = "future-resident-key";
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject unknown resident-key requirement values");
        AssertEqual("unsupported_resident_key", createResponse.ErrorCode,
            "bridge create unsupported resident-key requirement error code mismatch");
        AssertEqual(0, approvalCount, "bridge unsupported resident-key rejection should not prompt for approval");
        AssertEqual(0, pending.Count, "bridge unsupported resident-key rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsUnsupportedPasskeyExtensionWhenFeatureGateIsEnabled()
    {
        int approvalCount = 0;
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-unsupported-extension-bridge");
        createPayload.RequestedExtensions = new PasskeyRequestedExtensions
        {
            CredProps = true,
            UnsupportedExtensions = new string[] { "largeBlob" }
        };
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject unsupported requested WebAuthn extensions");
        AssertEqual("unsupported_extension", createResponse.ErrorCode,
            "bridge create unsupported requested extension error code mismatch");
        AssertEqual(0, approvalCount, "bridge unsupported requested extension rejection should not prompt for approval");
        AssertEqual(0, pending.Count, "bridge unsupported requested extension rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsUnsupportedPasskeyGetExtensionWhenFeatureGateIsEnabled()
    {
        int approvalCount = 0;
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyGetBeginPayload getPayload = CreatePasskeyGetBeginPayload("webauthn-get-unsupported-extension-bridge",
            new string[0]);
        getPayload.UnsupportedExtensions = new string[] { "appid" };
        BridgeResponse getResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(getPayload)));

        AssertFalse(getResponse.Success, "bridge get begin should reject unsupported requested WebAuthn extensions");
        AssertEqual("unsupported_extension", getResponse.ErrorCode,
            "bridge get unsupported requested extension error code mismatch");
        AssertEqual(0, approvalCount, "bridge unsupported requested get extension rejection should not prompt for approval");
        AssertEqual(0, pending.Count, "bridge unsupported requested get extension rejection should not leave pending sessions");
    }

    private static void BridgeHandlerRejectsPasskeyCreateExcludedCredentialWhenFeatureGateIsEnabled()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before excluded credential test: " + registration.Error);

        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PwDatabase database = CreateDatabase(entry);
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        int approvalCount = 0;
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                approvalCount += 1;
                return PasskeyApprovalResult.Approve();
            });

        PasskeyCreateBeginPayload createPayload = CreatePasskeyCreateBeginPayload("webauthn-create-excluded");
        createPayload.ExcludeCredentialIds = new string[] { registration.Credential.CredentialId, registration.Credential.CredentialId };
        BridgeResponse createResponse = handler.Handle(CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin,
            "client-1", "secret", BridgeJsonSerializer.Serialize(createPayload)));

        AssertFalse(createResponse.Success, "bridge create begin should reject excluded existing credentials");
        AssertEqual("excluded_credential_exists", createResponse.ErrorCode,
            "bridge create excluded credential error code mismatch");
        AssertEqual(0, pending.Count, "bridge excluded credential rejection should not leave pending sessions");
        AssertEqual(0, approvalCount, "bridge excluded credential rejection should not prompt for approval");
    }

    private static void BridgeHandlerDeniedPasskeyCreateApprovalCancelsPendingSession()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                AssertEqual(PasskeyPendingOperation.Create, approval.Operation, "create approval operation mismatch");
                AssertEqual("example.com", approval.RpId, "create approval RP ID mismatch");
                AssertEqual("https://example.com/login", approval.Origin, "create approval origin mismatch");
                AssertEqual("alice@example.com", approval.UserName, "create approval user name mismatch");
                return PasskeyApprovalResult.Deny("user_denied", "Denied by test.");
            });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyCreateBeginPayload("webauthn-create-denied")));

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "denied passkey create approval should fail the begin request");
        AssertEqual("user_denied", response.ErrorCode, "denied create approval error code mismatch");
        AssertEqual(0, pending.Count, "denied create approval should cancel the pending session");
    }

    private static void BridgeHandlerDeniedPasskeyGetApprovalCancelsPendingSession()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before denied approval test: " + registration.Error);

        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PwDatabase database = CreateDatabase(entry);
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending,
            delegate(PwDatabase changedDatabase) { },
            delegate(PasskeyApprovalRequest approval)
            {
                AssertEqual(PasskeyPendingOperation.Get, approval.Operation, "get approval operation mismatch");
                AssertEqual(1, approval.Credentials.Length, "get approval should receive matching passkey summaries");
                AssertEqual(registration.Credential.CredentialId, approval.Credentials[0].CredentialId,
                    "get approval credential summary mismatch");
                return PasskeyApprovalResult.Deny("user_denied", "Denied by test.");
            });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyGetBeginPayload("webauthn-get-denied",
                new string[] { registration.Credential.CredentialId })));

        BridgeResponse response = handler.Handle(request);

        AssertFalse(response.Success, "denied passkey get approval should fail the begin request");
        AssertEqual("user_denied", response.ErrorCode, "denied get approval error code mismatch");
        AssertEqual(0, pending.Count, "denied get approval should cancel the pending session");
    }

    private static void BridgeHandlerCompletesPasskeyCreateAndSavesDatabaseWhenFeatureGateIsEnabled()
    {
        int saveCount = 0;
        PwDatabase database = CreateDatabase();
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending,
            delegate(PwDatabase changedDatabase) { saveCount += 1; });

        PasskeyCreateBeginPayload beginPayload = CreatePasskeyCreateBeginPayload("webauthn-create-complete");
        beginPayload.RequestedExtensions = new PasskeyRequestedExtensions { CredProps = true };
        BridgeRequest beginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(beginPayload));
        BridgeResponse beginResponse = handler.Handle(beginRequest);
        AssertTrue(beginResponse.Success, "passkey create begin should succeed before complete: " + beginResponse.Error);

        BridgeRequest completeRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateComplete, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyCreateCompletePayload
            {
                WebAuthnRequestId = "webauthn-create-complete",
                RpId = "example.com",
                Origin = "https://example.com/login"
            }));

        BridgeResponse completeResponse = handler.Handle(completeRequest);
        PasskeyCreateCompleteResponsePayload result =
            BridgeJsonSerializer.Deserialize<PasskeyCreateCompleteResponsePayload>(completeResponse.Payload);

        AssertTrue(completeResponse.Success, "enabled passkeys.create.complete should succeed: " + completeResponse.Error);
        AssertEqual(0, pending.Count, "passkeys.create.complete should consume the pending session");
        AssertEqual(1, (int)database.RootGroup.Entries.UCount, "passkeys.create.complete should create one KeePass entry");
        AssertEqual(1, saveCount, "passkeys.create.complete should save the database once");
        AssertTrue(!string.IsNullOrWhiteSpace(result.EntryId), "create complete response should include entry ID");
        AssertTrue(!string.IsNullOrWhiteSpace(result.CredentialId), "create complete response should include credential ID");
        AssertTrue(!string.IsNullOrWhiteSpace(result.ClientDataJson), "create complete response should include clientDataJSON");
        AssertTrue(!string.IsNullOrWhiteSpace(result.AttestationObject), "create complete response should include attestationObject");
        AssertTrue(!string.IsNullOrWhiteSpace(result.AuthenticatorData), "create complete response should include authenticatorData");
        AssertTrue(!string.IsNullOrWhiteSpace(result.PublicKey), "create complete response should include public key SPKI");
        byte[] responseAttestationObject;
        byte[] responseAuthenticatorData;
        byte[] responsePublicKeySpki;
        AssertTrue(Base64Url.TryDecode(result.AttestationObject, out responseAttestationObject),
            "create complete response attestationObject should be base64url encoded");
        AssertTrue(Base64Url.TryDecode(result.AuthenticatorData, out responseAuthenticatorData),
            "create complete response authenticatorData should be base64url encoded");
        AssertTrue(Base64Url.TryDecode(result.PublicKey, out responsePublicKeySpki),
            "create complete response public key SPKI should be base64url encoded");
        AssertByteArrayEqual(ReadNoneAttestationAuthData(responseAttestationObject), responseAuthenticatorData,
            "create complete response authenticatorData mismatch");
        AssertEqual("cross-platform", result.AuthenticatorAttachment,
            "create complete response should include cross-platform authenticator attachment");
        AssertEqual(1, result.Transports.Length, "create complete response should include normalized transport metadata");
        AssertEqual("internal", result.Transports[0], "create complete response transport mismatch");
        AssertTrue(result.ClientExtensionResults != null && result.ClientExtensionResults.CredProps != null &&
            result.ClientExtensionResults.CredProps.Rk, "create complete response should include requested credProps resident-key result");
        AssertTrue(PasskeyEntryStore.IsPasskeyEntry(database.RootGroup.Entries.GetAt(0)),
            "created entry should be a passkey entry");
    }

    private static void BridgeHandlerCompletesPasskeyGetSignsAssertionAndSavesDatabaseWhenFeatureGateIsEnabled()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before bridge get complete test: " + registration.Error);

        int saveCount = 0;
        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PwDatabase database = CreateDatabase(entry);
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending,
            delegate(PwDatabase changedDatabase) { saveCount += 1; });

        BridgeRequest beginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyGetBeginPayload("webauthn-get-complete",
                new string[] { registration.Credential.CredentialId })));
        BridgeResponse beginResponse = handler.Handle(beginRequest);
        AssertTrue(beginResponse.Success, "passkey get begin should succeed before complete: " + beginResponse.Error);

        BridgeRequest completeRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetComplete, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyGetCompletePayload
            {
                WebAuthnRequestId = "webauthn-get-complete",
                RpId = "example.com",
                Origin = "https://example.com/login",
                CredentialId = registration.Credential.CredentialId
            }));

        BridgeResponse completeResponse = handler.Handle(completeRequest);
        PasskeyGetCompleteResponsePayload result =
            BridgeJsonSerializer.Deserialize<PasskeyGetCompleteResponsePayload>(completeResponse.Payload);
        PasskeyCredentialMaterial restored = PasskeyEntryStore.Read(entry);

        AssertTrue(completeResponse.Success, "enabled passkeys.get.complete should succeed: " + completeResponse.Error);
        AssertEqual(0, pending.Count, "passkeys.get.complete should consume the pending session");
        AssertEqual(1, saveCount, "passkeys.get.complete should save the database once");
        AssertEqual("example.com", result.RpId, "get complete response RP ID mismatch");
        AssertEqual("cross-platform", result.AuthenticatorAttachment,
            "get complete response should include cross-platform authenticator attachment");
        AssertEqual((uint)1, result.SignCount, "get complete response sign count mismatch");
        AssertEqual((uint)1, restored.SignCount, "get complete should persist incremented sign count");
        AssertTrue(service.VerifyAssertionSignature(restored, new PasskeyAssertionResponse
        {
            CredentialId = result.CredentialId,
            AuthenticatorData = result.AuthenticatorData,
            ClientDataJson = result.ClientDataJson,
            Signature = result.Signature,
            UserHandle = result.UserHandle,
            SignCount = result.SignCount
        }), "get complete response signature should verify against the stored public key");
    }

    private static void BridgeHandlerPersistsPasskeySignCountAcrossGetSessions()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before repeated get complete test: " + registration.Error);

        int saveCount = 0;
        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PwDatabase database = CreateDatabase(entry);
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending,
            delegate(PwDatabase changedDatabase) { saveCount += 1; });

        BridgeRequest firstBeginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyGetBeginPayload("webauthn-get-count-1",
                new string[] { registration.Credential.CredentialId })));
        BridgeResponse firstBeginResponse = handler.Handle(firstBeginRequest);
        AssertTrue(firstBeginResponse.Success, "first passkey get begin should succeed: " + firstBeginResponse.Error);

        BridgeRequest firstCompleteRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetComplete, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyGetCompletePayload
            {
                WebAuthnRequestId = "webauthn-get-count-1",
                RpId = "example.com",
                Origin = "https://example.com/login",
                CredentialId = registration.Credential.CredentialId
            }));
        BridgeResponse firstCompleteResponse = handler.Handle(firstCompleteRequest);
        PasskeyGetCompleteResponsePayload firstResult =
            BridgeJsonSerializer.Deserialize<PasskeyGetCompleteResponsePayload>(firstCompleteResponse.Payload);
        PasskeyCredentialMaterial afterFirst = PasskeyEntryStore.Read(entry);

        AssertTrue(firstCompleteResponse.Success, "first passkey get complete should succeed: " + firstCompleteResponse.Error);
        AssertEqual((uint)1, firstResult.SignCount, "first assertion sign count mismatch");
        AssertEqual((uint)1, afterFirst.SignCount, "first assertion should persist sign count in entry storage");

        BridgeRequest secondBeginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyGetBeginPayload("webauthn-get-count-2",
                new string[] { registration.Credential.CredentialId })));
        BridgeResponse secondBeginResponse = handler.Handle(secondBeginRequest);
        AssertTrue(secondBeginResponse.Success, "second passkey get begin should succeed: " + secondBeginResponse.Error);

        BridgeRequest secondCompleteRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetComplete, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyGetCompletePayload
            {
                WebAuthnRequestId = "webauthn-get-count-2",
                RpId = "example.com",
                Origin = "https://example.com/login",
                CredentialId = registration.Credential.CredentialId
            }));
        BridgeResponse secondCompleteResponse = handler.Handle(secondCompleteRequest);
        PasskeyGetCompleteResponsePayload secondResult =
            BridgeJsonSerializer.Deserialize<PasskeyGetCompleteResponsePayload>(secondCompleteResponse.Payload);
        PasskeyCredentialMaterial afterSecond = PasskeyEntryStore.Read(entry);

        AssertTrue(secondCompleteResponse.Success, "second passkey get complete should succeed: " + secondCompleteResponse.Error);
        AssertEqual((uint)2, secondResult.SignCount, "second assertion should use the persisted sign count from the first session");
        AssertEqual((uint)2, afterSecond.SignCount, "second assertion should persist the incremented sign count in entry storage");
        AssertEqual(0, pending.Count, "repeated passkey get completes should consume every pending session");
        AssertEqual(2, saveCount, "each successful passkey assertion should save the database once");

        string listPayload = BridgeJsonSerializer.Serialize(new PasskeysListPayload
        {
            RpId = "example.com",
            Origin = "https://example.com/login",
            AllowCredentialIds = new string[] { registration.Credential.CredentialId }
        });
        BridgeRequest listRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysList, "client-1", "secret", listPayload);
        BridgeResponse listResponse = handler.Handle(listRequest);
        PasskeyCredentialLookupResult lookup = BridgeJsonSerializer.Deserialize<PasskeyCredentialLookupResult>(listResponse.Payload);

        AssertTrue(listResponse.Success, "passkeys.list should succeed after repeated assertions: " + listResponse.Error);
        AssertTrue(lookup.Success, "passkeys.list payload should succeed after repeated assertions: " + lookup.Error);
        AssertEqual(1, lookup.Credentials.Length, "passkeys.list should return the persisted credential after repeated assertions");
        AssertEqual((uint)2, lookup.Credentials[0].SignCount, "passkeys.list should expose the persisted sign count summary");
    }

    private static void BridgeHandlerRejectsReplayedPasskeyCreateCompletionRequestId()
    {
        int saveCount = 0;
        PwDatabase database = CreateDatabase();
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending,
            delegate(PwDatabase changedDatabase) { saveCount += 1; });

        BridgeRequest beginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyCreateBeginPayload("webauthn-create-replay")));
        BridgeResponse beginResponse = handler.Handle(beginRequest);
        AssertTrue(beginResponse.Success, "passkey create begin should succeed before replay test: " + beginResponse.Error);

        BridgeRequest completeRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateComplete, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyCreateCompletePayload
            {
                WebAuthnRequestId = "webauthn-create-replay",
                RpId = "example.com",
                Origin = "https://example.com/login"
            }));

        BridgeResponse firstResponse = handler.Handle(completeRequest);
        BridgeResponse replayedResponse = handler.Handle(completeRequest);

        AssertTrue(firstResponse.Success, "first passkeys.create.complete should succeed before replay: " + firstResponse.Error);
        AssertFalse(replayedResponse.Success, "replayed passkeys.create.complete should fail");
        AssertEqual("replayed_request", replayedResponse.ErrorCode,
            "replayed passkeys.create.complete error code mismatch");
        AssertEqual(0, pending.Count, "replayed passkeys.create.complete should not restore pending state");
        AssertEqual(1, (int)database.RootGroup.Entries.UCount,
            "replayed passkeys.create.complete should not create a second KeePass entry");
        AssertEqual(1, saveCount, "replayed passkeys.create.complete should not save the database again");
    }

    private static void BridgeHandlerRejectsReplayedPasskeyGetCompletionRequestId()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before get replay test: " + registration.Error);

        int saveCount = 0;
        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PwDatabase database = CreateDatabase(entry);
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyRead });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending,
            delegate(PwDatabase changedDatabase) { saveCount += 1; });

        BridgeRequest beginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyGetBeginPayload("webauthn-get-replay",
                new string[] { registration.Credential.CredentialId })));
        BridgeResponse beginResponse = handler.Handle(beginRequest);
        AssertTrue(beginResponse.Success, "passkey get begin should succeed before replay test: " + beginResponse.Error);

        BridgeRequest completeRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysGetComplete, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyGetCompletePayload
            {
                WebAuthnRequestId = "webauthn-get-replay",
                RpId = "example.com",
                Origin = "https://example.com/login",
                CredentialId = registration.Credential.CredentialId
            }));

        BridgeResponse firstResponse = handler.Handle(completeRequest);
        BridgeResponse replayedResponse = handler.Handle(completeRequest);
        PasskeyCredentialMaterial restored = PasskeyEntryStore.Read(entry);

        AssertTrue(firstResponse.Success, "first passkeys.get.complete should succeed before replay: " + firstResponse.Error);
        AssertFalse(replayedResponse.Success, "replayed passkeys.get.complete should fail");
        AssertEqual("replayed_request", replayedResponse.ErrorCode,
            "replayed passkeys.get.complete error code mismatch");
        AssertEqual(0, pending.Count, "replayed passkeys.get.complete should not restore pending state");
        AssertEqual(1, saveCount, "replayed passkeys.get.complete should not save the database again");
        AssertEqual((uint)1, restored.SignCount,
            "replayed passkeys.get.complete should not increment the passkey sign count again");
    }

    private static void BridgeHandlerRevokesPasskeyAndSavesDatabaseWhenFeatureGateIsEnabled()
    {
        PasskeyService service = new PasskeyService();
        PasskeyRegistrationResult registration = service.CreateCredential(CreatePasskeyRegistrationRequest());
        AssertTrue(registration.Success, "passkey registration should succeed before bridge revoke test: " + registration.Error);

        int saveCount = 0;
        PwEntry entry = new PwEntry(true, true);
        PasskeyEntryStore.Write(entry, registration.Credential);
        PwDatabase database = CreateDatabase(entry);
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(database, store, pending,
            delegate(PwDatabase changedDatabase) { saveCount += 1; });

        BridgeRequest beginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyCreateBeginPayload("webauthn-revoke-clear")));
        BridgeResponse beginResponse = handler.Handle(beginRequest);
        AssertTrue(beginResponse.Success, "passkey create begin should succeed before passkey revoke: " + beginResponse.Error);
        AssertEqual(1, pending.Count, "pending store should contain a session before passkey revoke");

        BridgeRequest revokeRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysRevoke, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyRevokePayload
            {
                RpId = "example.com",
                Origin = "https://example.com/login",
                CredentialId = registration.Credential.CredentialId
            }));

        BridgeResponse revokeResponse = handler.Handle(revokeRequest);
        PasskeyRevokeResponsePayload result = BridgeJsonSerializer.Deserialize<PasskeyRevokeResponsePayload>(revokeResponse.Payload);

        AssertTrue(revokeResponse.Success, "enabled passkeys.revoke should succeed: " + revokeResponse.Error);
        AssertTrue(result.Revoked, "passkeys.revoke should report revoked");
        AssertEqual(registration.Credential.CredentialId, result.CredentialId, "passkeys.revoke credential ID mismatch");
        AssertEqual(0, (int)database.RootGroup.Entries.UCount, "passkeys.revoke should remove the passkey entry");
        AssertEqual(0, pending.Count, "passkeys.revoke should clear pending sessions for the client");
        AssertEqual(1, saveCount, "passkeys.revoke should save the database once");
    }

    private static void BridgeHandlerCancelsPendingPasskeySessionWhenFeatureGateIsEnabled()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending);
        BridgeRequest beginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyCreateBeginPayload("webauthn-create-cancel")));
        BridgeResponse beginResponse = handler.Handle(beginRequest);
        AssertTrue(beginResponse.Success, "passkey create begin should succeed before cancel: " + beginResponse.Error);
        AssertEqual(1, pending.Count, "pending store should contain a session before passkey cancel");

        BridgeRequest cancelRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCancel, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyCancelPayload
            {
                WebAuthnRequestId = "webauthn-create-cancel"
            }));
        BridgeResponse cancelResponse = handler.Handle(cancelRequest);
        PasskeyCancelResponsePayload result = BridgeJsonSerializer.Deserialize<PasskeyCancelResponsePayload>(cancelResponse.Payload);

        BridgeRequest completeRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateComplete, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyCreateCompletePayload
            {
                WebAuthnRequestId = "webauthn-create-cancel",
                RpId = "example.com",
                Origin = "https://example.com/login"
            }));
        BridgeResponse completeResponse = handler.Handle(completeRequest);

        AssertTrue(cancelResponse.Success, "enabled passkeys.cancel should return a bridge success envelope: " + cancelResponse.Error);
        AssertTrue(result.Cancelled, "passkeys.cancel should report a canceled pending session");
        AssertEqual("webauthn-create-cancel", result.WebAuthnRequestId, "passkeys.cancel WebAuthn request ID mismatch");
        AssertEqual(0, pending.Count, "passkeys.cancel should clear the pending session");
        AssertFalse(completeResponse.Success, "completion after passkeys.cancel should fail");
        AssertEqual("pending_not_found", completeResponse.ErrorCode, "completion after passkeys.cancel error code mismatch");
    }

    private static void BridgeHandlerRevokingClientClearsPendingPasskeySessions()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.Write, TrustedClientPermissions.ManageClients, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending);
        string createPayload = BridgeJsonSerializer.Serialize(CreatePasskeyCreateBeginPayload("webauthn-create-revoke"));
        BridgeRequest createRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret", createPayload);
        BridgeResponse createResponse = handler.Handle(createRequest);
        AssertTrue(createResponse.Success, "passkey create begin should succeed before revoke clear test: " + createResponse.Error);
        AssertEqual(1, pending.Count, "pending store should contain a session before revoke");

        string revokePayload = BridgeJsonSerializer.Serialize(new ClientRevokePayload { ClientId = "client-1" });
        BridgeRequest revokeRequest = CreateAuthenticatedRequest(BridgeMethods.ClientsRevoke, "client-1", "secret", revokePayload);
        BridgeResponse revokeResponse = handler.Handle(revokeRequest);

        AssertTrue(revokeResponse.Success, "self revoke should return a bridge success envelope: " + revokeResponse.Error);
        AssertEqual(0, pending.Count, "revoking a client should clear its pending passkey sessions");
        AssertFalse(store.IsTrusted("client-1"), "revoked client should no longer be trusted");
    }

    private static void BridgeHandlerClearPendingPasskeySessionsRejectsLaterCompletion()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret",
            new string[] { TrustedClientPermissions.Read, TrustedClientPermissions.PasskeyWrite });
        PasskeyPendingSessionStore pending = new PasskeyPendingSessionStore();
        BridgeRequestHandler handler = CreatePasskeyEnabledHandler(CreateDatabase(), store, pending);
        BridgeRequest beginRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateBegin, "client-1", "secret",
            BridgeJsonSerializer.Serialize(CreatePasskeyCreateBeginPayload("webauthn-create-db-close")));
        BridgeResponse beginResponse = handler.Handle(beginRequest);
        AssertTrue(beginResponse.Success, "passkey create begin should succeed before lifecycle cleanup: " + beginResponse.Error);
        AssertEqual(1, pending.Count, "pending store should contain a session before lifecycle cleanup");

        int removed = handler.ClearPendingPasskeySessions();

        BridgeRequest completeRequest = CreateAuthenticatedRequest(BridgeMethods.PasskeysCreateComplete, "client-1", "secret",
            BridgeJsonSerializer.Serialize(new PasskeyCreateCompletePayload
            {
                WebAuthnRequestId = "webauthn-create-db-close",
                RpId = "example.com",
                Origin = "https://example.com/login"
            }));
        BridgeResponse completeResponse = handler.Handle(completeRequest);

        AssertEqual(1, removed, "lifecycle cleanup should report the cleared pending passkey session");
        AssertEqual(0, pending.Count, "lifecycle cleanup should clear pending passkey sessions");
        AssertFalse(completeResponse.Success, "completion after database lifecycle cleanup should fail");
        AssertEqual("pending_not_found", completeResponse.ErrorCode, "completion after lifecycle cleanup error code mismatch");
    }

    private static void BridgeHandlerReturnsLoginsForAuthenticatedQuery()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        PwDatabase database = CreateDatabase(CreateEntry("Example", "alice", "secret", "https://example.com/login"));
        BridgeRequestHandler handler = CreateHandler(database, store);
        string payload = BridgeJsonSerializer.Serialize(new LoginsQueryPayload { Url = "https://example.com/account" });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsQuery, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        CredentialQueryResult result = BridgeJsonSerializer.Deserialize<CredentialQueryResult>(response.Payload);

        AssertTrue(response.Success, "authenticated logins.query should succeed: " + response.Error);
        AssertEqual(1, result.Entries.Length, "logins.query result count mismatch");
        AssertEqual("alice", result.Entries[0].UserName, "logins.query username mismatch");
    }

    private static void BridgeHandlerCreatesLoginForAuthenticatedRequest()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        PwDatabase database = CreateDatabase();
        BridgeRequestHandler handler = CreateHandler(database, store);
        string payload = BridgeJsonSerializer.Serialize(new CreateLoginPayload
        {
            Title = "Example",
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "secret"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsCreate, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        CredentialMutationResult result = BridgeJsonSerializer.Deserialize<CredentialMutationResult>(response.Payload);

        AssertTrue(response.Success, "authenticated logins.create should return bridge success: " + response.Error);
        AssertTrue(result.Success, "authenticated logins.create should create entry: " + result.Error);
        AssertEqual(1, (int)database.RootGroup.Entries.UCount, "logins.create should add one entry");
        AssertEqual("alice", result.Entry.UserName, "logins.create username mismatch");
    }

    private static void BridgeHandlerSavesDatabaseAfterSuccessfulCreate()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        PwDatabase database = CreateDatabase();
        int saveCount = 0;
        BridgeRequestHandler handler = CreateHandler(database, store, delegate(PwDatabase changedDatabase)
        {
            if (object.ReferenceEquals(database, changedDatabase)) saveCount += 1;
        });
        string payload = BridgeJsonSerializer.Serialize(new CreateLoginPayload
        {
            Title = "Example",
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "secret"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsCreate, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertTrue(response.Success, "authenticated logins.create should return bridge success: " + response.Error);
        AssertEqual(1, saveCount, "successful logins.create should save the database once");
    }

    private static void BridgeHandlerDoesNotSaveDatabaseAfterFailedCreate()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        PwDatabase database = CreateDatabase();
        int saveCount = 0;
        BridgeRequestHandler handler = CreateHandler(database, store, delegate(PwDatabase changedDatabase)
        {
            saveCount += 1;
        });
        string payload = BridgeJsonSerializer.Serialize(new CreateLoginPayload
        {
            Title = "Example",
            Url = "not a url",
            UserName = "alice",
            Password = "secret"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsCreate, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        CredentialMutationResult result = BridgeJsonSerializer.Deserialize<CredentialMutationResult>(response.Payload);

        AssertTrue(response.Success, "failed mutation should still return bridge success envelope: " + response.Error);
        AssertFalse(result.Success, "invalid create payload should fail mutation");
        AssertEqual(0, saveCount, "failed logins.create should not save the database");
    }

    private static void BridgeHandlerUpdatesLoginForAuthenticatedRequest()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        PwDatabase database = CreateDatabase(entry);
        BridgeRequestHandler handler = CreateHandler(database, store);
        string payload = BridgeJsonSerializer.Serialize(new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            Url = "https://example.com/login",
            UserName = "alice",
            Password = "new-secret"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsUpdate, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);
        CredentialMutationResult result = BridgeJsonSerializer.Deserialize<CredentialMutationResult>(response.Payload);

        AssertTrue(response.Success, "authenticated logins.update should return bridge success: " + response.Error);
        AssertTrue(result.Success, "authenticated logins.update should update entry: " + result.Error);
        AssertEqual("new-secret", entry.Strings.ReadSafe(PwDefs.PasswordField), "logins.update password mismatch");
    }

    private static void BridgeHandlerSavesDatabaseAfterSuccessfulUpdate()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        PwEntry entry = CreateEntry("Example", "alice", "old-secret", "https://example.com/login");
        PwDatabase database = CreateDatabase(entry);
        int saveCount = 0;
        BridgeRequestHandler handler = CreateHandler(database, store, delegate(PwDatabase changedDatabase)
        {
            if (object.ReferenceEquals(database, changedDatabase)) saveCount += 1;
        });
        string payload = BridgeJsonSerializer.Serialize(new UpdateLoginPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            Password = "new-secret"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsUpdate, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertTrue(response.Success, "authenticated logins.update should return bridge success: " + response.Error);
        AssertEqual(1, saveCount, "successful logins.update should save the database once");
    }

    private static void BridgeHandlerUpdatesUsageAfterFillAck()
    {
        TrustedClientStore store = CreateTrustedStore("client-1", "secret");
        PwEntry entry = CreateEntry("Example", "alice", "secret", "https://example.com/login");
        entry.UsageCount = 3;
        PwDatabase database = CreateDatabase(entry);
        int saveCount = 0;
        BridgeRequestHandler handler = CreateHandler(database, store, delegate(PwDatabase changedDatabase)
        {
            if (object.ReferenceEquals(database, changedDatabase)) saveCount += 1;
        });
        string payload = BridgeJsonSerializer.Serialize(new FillAckPayload
        {
            EntryId = entry.Uuid.ToHexString(),
            Url = "https://example.com/account"
        });
        BridgeRequest request = CreateAuthenticatedRequest(BridgeMethods.LoginsFillAck, "client-1", "secret", payload);

        BridgeResponse response = handler.Handle(request);

        AssertTrue(response.Success, "authenticated logins.fillAck should return bridge success: " + response.Error);
        AssertEqual((ulong)4, entry.UsageCount, "fillAck should increment KeePass usage count");
        AssertTrue(database.Modified, "fillAck should mark database modified");
        AssertEqual(1, saveCount, "successful fillAck should save the database once");
    }

    private static void LoopbackBridgeServerRespondsToHello()
    {
        int port = FindFreePort();
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);

            string body = BridgeJsonSerializer.Serialize(CreateValidRequest(BridgeMethods.Hello));
            string responseJson = PostRawHttp(port, body);
            BridgeResponse response = BridgeJsonSerializer.Deserialize<BridgeResponse>(responseJson);

            AssertTrue(response.Success, "loopback hello should succeed: " + response.Error);
        }
    }

    private static void LoopbackBridgeServerRejectsWebPreflightOrigin()
    {
        int port = FindFreePort();
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);

            RawHttpResponse response = SendRawHttp(port,
                "OPTIONS /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: https://evil.example\r\n" +
                "Access-Control-Request-Method: POST\r\n" +
                "Connection: close\r\n\r\n");

            AssertEqual(403, response.StatusCode, "web preflight should be rejected");
            AssertFalse(response.Headers.ContainsKey("Access-Control-Allow-Origin"),
                "rejected web preflight should not include an allow-origin header");
        }
    }

    private static void LoopbackBridgeServerRejectsPreflightWithoutOrigin()
    {
        int port = FindFreePort();
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);

            RawHttpResponse response = SendRawHttp(port,
                "OPTIONS /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Access-Control-Request-Method: POST\r\n" +
                "Connection: close\r\n\r\n");

            AssertEqual(403, response.StatusCode, "preflight without Origin should be rejected");
            AssertFalse(response.Headers.ContainsKey("Access-Control-Allow-Origin"),
                "preflight without Origin should not include an allow-origin header");
        }
    }

    private static void LoopbackBridgeServerAllowsExtensionPreflightOrigin()
    {
        int port = FindFreePort();
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);
            const string origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";

            RawHttpResponse response = SendRawHttp(port,
                "OPTIONS /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: " + origin + "\r\n" +
                "Access-Control-Request-Method: POST\r\n" +
                "Connection: close\r\n\r\n");

            AssertEqual(204, response.StatusCode, "extension preflight should be allowed");
            AssertEqual(origin, response.Headers["Access-Control-Allow-Origin"],
                "extension preflight should echo the extension origin");
        }
    }

    private static void LoopbackBridgeServerRejectsExtensionPreflightForWrongPath()
    {
        int port = FindFreePort();
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);
            const string origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";

            RawHttpResponse response = SendRawHttp(port,
                "OPTIONS /not-bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: " + origin + "\r\n" +
                "Access-Control-Request-Method: POST\r\n" +
                "Connection: close\r\n\r\n");

            AssertEqual(404, response.StatusCode, "extension preflight should be scoped to /bridge");
            AssertFalse(response.Headers.ContainsKey("Access-Control-Allow-Origin"),
                "wrong-path extension preflight should not include an allow-origin header");
        }
    }

    private static void LoopbackBridgeServerRejectsUnsupportedPreflightMethod()
    {
        int port = FindFreePort();
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);
            const string origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";

            RawHttpResponse response = SendRawHttp(port,
                "OPTIONS /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: " + origin + "\r\n" +
                "Access-Control-Request-Method: DELETE\r\n" +
                "Connection: close\r\n\r\n");

            AssertEqual(405, response.StatusCode, "extension preflight should reject unsupported requested methods");
            AssertFalse(response.Headers.ContainsKey("Access-Control-Allow-Origin"),
                "unsupported preflight method should not include an allow-origin header");
        }
    }

    private static void LoopbackBridgeServerRejectsUnsupportedPreflightHeaders()
    {
        int port = FindFreePort();
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);
            const string origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";

            RawHttpResponse response = SendRawHttp(port,
                "OPTIONS /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: " + origin + "\r\n" +
                "Access-Control-Request-Method: POST\r\n" +
                "Access-Control-Request-Headers: Content-Type, X-Debug\r\n" +
                "Connection: close\r\n\r\n");

            AssertEqual(400, response.StatusCode, "extension preflight should reject unsupported requested headers");
            AssertFalse(response.Headers.ContainsKey("Access-Control-Allow-Origin"),
                "unsupported preflight headers should not include an allow-origin header");
        }
    }

    private static void LoopbackBridgeServerRejectsWebPostOriginBeforeHandling()
    {
        int port = FindFreePort();
        int pairingPromptCount = 0;
        BridgeRequestHandler handler = new BridgeRequestHandler(
            new PairingService(new DeterministicSecretGenerator("123456", "shared-secret")),
            new TrustedClientStore(),
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return (PwDatabase)null; },
            delegate(PairingSession session) { pairingPromptCount += 1; },
            delegate(PwDatabase changedDatabase) { });

        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);

            BridgeRequest request = CreateValidRequest(BridgeMethods.PairBegin);
            request.Payload = BridgeJsonSerializer.Serialize(new PairBeginPayload
            {
                ClientName = "Evil Web"
            });
            byte[] bodyBytes = Encoding.UTF8.GetBytes(BridgeJsonSerializer.Serialize(request));
            RawHttpResponse response = SendRawHttp(port,
                "POST /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: https://evil.example\r\n" +
                "Content-Type: text/plain\r\n" +
                "Content-Length: " + bodyBytes.Length + "\r\n" +
                "Connection: close\r\n\r\n",
                bodyBytes);

            AssertEqual(403, response.StatusCode, "web-origin POST should be rejected");
            AssertFalse(response.Headers.ContainsKey("Access-Control-Allow-Origin"),
                "rejected web-origin POST should not include an allow-origin header");
            AssertEqual(0, pairingPromptCount, "web-origin POST should not reach pair.begin handler");
        }
    }

    private static void LoopbackBridgeServerRejectsNonJsonPostBeforeHandling()
    {
        int port = FindFreePort();
        int pairingPromptCount = 0;
        BridgeRequestHandler handler = new BridgeRequestHandler(
            new PairingService(new DeterministicSecretGenerator("123456", "shared-secret")),
            new TrustedClientStore(),
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return (PwDatabase)null; },
            delegate(PairingSession session) { pairingPromptCount += 1; },
            delegate(PwDatabase changedDatabase) { });

        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);
            const string origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";

            BridgeRequest request = CreateValidRequest(BridgeMethods.PairBegin);
            request.Payload = BridgeJsonSerializer.Serialize(new PairBeginPayload
            {
                ClientName = "Wrong content type"
            });
            byte[] bodyBytes = Encoding.UTF8.GetBytes(BridgeJsonSerializer.Serialize(request));
            RawHttpResponse response = SendRawHttp(port,
                "POST /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: " + origin + "\r\n" +
                "Content-Type: text/plain\r\n" +
                "Content-Length: " + bodyBytes.Length + "\r\n" +
                "Connection: close\r\n\r\n",
                bodyBytes);

            AssertEqual(415, response.StatusCode, "non-JSON bridge POST should be rejected");
            AssertEqual(0, pairingPromptCount, "non-JSON bridge POST should not reach pair.begin handler");
        }
    }

    private static void LoopbackBridgeServerRejectsMalformedJsonBeforeHandling()
    {
        int port = FindFreePort();
        int pairingPromptCount = 0;
        BridgeRequestHandler handler = new BridgeRequestHandler(
            new PairingService(new DeterministicSecretGenerator("123456", "shared-secret")),
            new TrustedClientStore(),
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return (PwDatabase)null; },
            delegate(PairingSession session) { pairingPromptCount += 1; },
            delegate(PwDatabase changedDatabase) { });

        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);
            const string origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";
            byte[] bodyBytes = Encoding.UTF8.GetBytes("{");
            RawHttpResponse response = SendRawHttp(port,
                "POST /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: " + origin + "\r\n" +
                "Content-Type: application/json\r\n" +
                "Content-Length: " + bodyBytes.Length + "\r\n" +
                "Connection: close\r\n\r\n",
                bodyBytes);
            BridgeResponse payload = BridgeJsonSerializer.Deserialize<BridgeResponse>(ExtractRawHttpBody(response.Raw));

            AssertEqual(400, response.StatusCode, "malformed bridge JSON should return a client error");
            AssertFalse(payload.Success, "malformed bridge JSON should return a failed bridge response");
            AssertEqual("invalid_request", payload.ErrorCode, "malformed bridge JSON error code mismatch");
            AssertEqual(0, pairingPromptCount, "malformed bridge JSON should not reach pair.begin handler");
        }
    }

    private static void LoopbackBridgeServerRejectsOversizedPostBeforeHandling()
    {
        int port = FindFreePort();
        int pairingPromptCount = 0;
        BridgeRequestHandler handler = new BridgeRequestHandler(
            new PairingService(new DeterministicSecretGenerator("123456", "shared-secret")),
            new TrustedClientStore(),
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return (PwDatabase)null; },
            delegate(PairingSession session) { pairingPromptCount += 1; },
            delegate(PwDatabase changedDatabase) { });

        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);
            const string origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";

            RawHttpResponse response = SendRawHttp(port,
                "POST /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: " + origin + "\r\n" +
                "Content-Type: application/json; charset=utf-8\r\n" +
                "Content-Length: " + (LoopbackBridgeServer.MaxRequestBodyBytes + 1) + "\r\n" +
                "Connection: close\r\n\r\n");

            AssertEqual(413, response.StatusCode, "oversized bridge POST should be rejected");
            AssertEqual(0, pairingPromptCount, "oversized bridge POST should not reach pair.begin handler");
        }
    }

    private static void LoopbackBridgeServerRejectsMismatchedHeaderAndRequestOriginBeforeHandling()
    {
        int port = FindFreePort();
        int pairingPromptCount = 0;
        BridgeRequestHandler handler = new BridgeRequestHandler(
            new PairingService(new DeterministicSecretGenerator("123456", "shared-secret")),
            new TrustedClientStore(),
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return (PwDatabase)null; },
            delegate(PairingSession session) { pairingPromptCount += 1; },
            delegate(PwDatabase changedDatabase) { });

        using (LoopbackBridgeServer server = new LoopbackBridgeServer(handler))
        {
            server.Start(port);
            const string headerOrigin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";

            BridgeRequest request = CreateValidRequest(BridgeMethods.PairBegin);
            request.Origin = "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
            request.Payload = BridgeJsonSerializer.Serialize(new PairBeginPayload
            {
                ClientName = "Mismatched Origin"
            });
            byte[] bodyBytes = Encoding.UTF8.GetBytes(BridgeJsonSerializer.Serialize(request));
            RawHttpResponse response = SendRawHttp(port,
                "POST /bridge HTTP/1.1\r\n" +
                "Host: 127.0.0.1:" + port + "\r\n" +
                "Origin: " + headerOrigin + "\r\n" +
                "Content-Type: application/json\r\n" +
                "Content-Length: " + bodyBytes.Length + "\r\n" +
                "Connection: close\r\n\r\n",
                bodyBytes);

            AssertEqual(403, response.StatusCode, "mismatched HTTP Origin and request Origin should be rejected");
            AssertEqual(0, pairingPromptCount, "mismatched Origin POST should not reach pair.begin handler");
        }
    }

    private static void LoopbackBridgeServerTryStartReportsPortConflict()
    {
        int port = FindFreePort();
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        using (LoopbackBridgeServer first = new LoopbackBridgeServer(handler))
        using (LoopbackBridgeServer second = new LoopbackBridgeServer(handler))
        {
            first.Start(port);

            BridgeServerStartResult result = second.TryStart(port);

            AssertFalse(result.Success, "second server should not start on an occupied port");
            AssertEqual("port_unavailable", result.ErrorCode, "port conflict error code mismatch");
            AssertFalse(second.IsRunning, "second server should not be running after port conflict");
        }
    }

    private static PwDatabase CreateDatabase(params PwEntry[] entries)
    {
        PwDatabase database = new PwDatabase();
        database.RootGroup = new PwGroup(true, true, "Root", PwIcon.Folder);
        foreach (PwEntry entry in entries)
        {
            database.RootGroup.AddEntry(entry, false);
        }
        return database;
    }

    private static PwEntry CreateEntry(string title, string userName, string password, string url)
    {
        PwEntry entry = new PwEntry(true, true);
        entry.Strings.Set(PwDefs.TitleField, new ProtectedString(false, title));
        entry.Strings.Set(PwDefs.UserNameField, new ProtectedString(false, userName));
        entry.Strings.Set(PwDefs.PasswordField, new ProtectedString(true, password));
        entry.Strings.Set(PwDefs.UrlField, new ProtectedString(false, url));
        return entry;
    }

    private static PasskeyRegistrationRequest CreatePasskeyRegistrationRequest()
    {
        return CreatePasskeyRegistrationRequest("Example.com", "https://example.com/login",
            "alice@example.com", "alice-handle", "Alice Example");
    }

    private static PasskeyRegistrationRequest CreatePasskeyRegistrationRequest(
        string rpId,
        string origin,
        string userName,
        string userHandle,
        string userDisplayName)
    {
        return new PasskeyRegistrationRequest
        {
            RpId = rpId,
            Origin = origin,
            Challenge = Base64Url.Encode(Encoding.ASCII.GetBytes("0123456789abcdef")),
            UserHandle = Base64Url.Encode(Encoding.ASCII.GetBytes(userHandle)),
            UserName = userName,
            UserDisplayName = userDisplayName,
            UserVerification = "Preferred",
            ResidentKey = "Preferred",
            Transports = new string[] { "Internal", "usb", "usb", "invalid value" }
        };
    }

    private static PasskeyCreateBeginPayload CreatePasskeyCreateBeginPayload(string webAuthnRequestId)
    {
        return new PasskeyCreateBeginPayload
        {
            WebAuthnRequestId = webAuthnRequestId,
            RpId = "Example.com",
            Origin = "https://example.com/login",
            Challenge = Base64Url.Encode(Encoding.ASCII.GetBytes("0123456789abcdef")),
            UserHandle = Base64Url.Encode(Encoding.ASCII.GetBytes("alice-handle")),
            UserName = "alice@example.com",
            UserDisplayName = "Alice Example",
            UserVerification = "preferred",
            Attestation = "none",
            AuthenticatorAttachment = "cross-platform",
            ResidentKey = "preferred",
            CredentialAlgorithms = new int[] { -7 },
            Transports = new string[] { "internal" }
        };
    }

    private static PasskeyGetBeginPayload CreatePasskeyGetBeginPayload(string webAuthnRequestId, string[] allowCredentialIds)
    {
        return new PasskeyGetBeginPayload
        {
            WebAuthnRequestId = webAuthnRequestId,
            RpId = "Example.com",
            Origin = "https://example.com/login",
            Challenge = Base64Url.Encode(Encoding.ASCII.GetBytes("0123456789abcdef")),
            AllowCredentialIds = allowCredentialIds,
            UserVerification = "preferred"
        };
    }

    private static PwGroup FindChildGroup(PwGroup parent, string name)
    {
        if (parent == null) return null;
        foreach (PwGroup child in parent.Groups)
        {
            if (string.Equals(child.Name, name, StringComparison.Ordinal)) return child;
        }
        return null;
    }

    private static CustomField FindCustomField(CustomField[] fields, string name)
    {
        if (fields == null) return null;
        foreach (CustomField field in fields)
        {
            if (field != null && string.Equals(field.Name, name, StringComparison.OrdinalIgnoreCase))
                return field;
        }
        return null;
    }

    private static BridgeRequest CreateValidRequest(string method)
    {
        return new BridgeRequest
        {
            ProtocolVersion = ProtocolValidator.ProtocolVersion,
            Method = method,
            RequestId = Guid.NewGuid().ToString("N"),
            TimestampUtcMs = NowMs(),
            Origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop"
        };
    }

    private static BridgeRequest CreateAuthenticatedRequest(string method, string clientId, string secret, string payload)
    {
        BridgeRequest request = CreateValidRequest(method);
        request.ClientId = clientId;
        request.Payload = payload;
        request.Authentication = BridgeAuthentication.CreateAuthentication(request, secret);
        return request;
    }

    private static BridgeRequestHandler CreateHandler(PwDatabase database, TrustedClientStore store)
    {
        return CreateHandler(database, store, delegate(PwDatabase changedDatabase) { });
    }

    private static BridgeRequestHandler CreateHandler(PwDatabase database, TrustedClientStore store, Action<PwDatabase> databaseChanged)
    {
        return new BridgeRequestHandler(
            new PairingService(new DeterministicSecretGenerator("123456", "shared-secret")),
            store,
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return database; },
            delegate(PairingSession session) { },
            databaseChanged);
    }

    private static BridgeRequestHandler CreatePasskeyEnabledHandler(PwDatabase database, TrustedClientStore store)
    {
        return CreatePasskeyEnabledHandler(database, store, new PasskeyPendingSessionStore());
    }

    private static BridgeRequestHandler CreatePasskeyEnabledHandler(
        PwDatabase database,
        TrustedClientStore store,
        PasskeyPendingSessionStore pendingSessionStore)
    {
        return CreatePasskeyEnabledHandler(database, store, pendingSessionStore,
            delegate(PwDatabase changedDatabase) { });
    }

    private static BridgeRequestHandler CreatePasskeyEnabledHandler(
        PwDatabase database,
        TrustedClientStore store,
        PasskeyPendingSessionStore pendingSessionStore,
        Action<PwDatabase> databaseChanged)
    {
        return CreatePasskeyEnabledHandler(database, store, pendingSessionStore, databaseChanged,
            delegate(PasskeyApprovalRequest request) { return PasskeyApprovalResult.Approve(); });
    }

    private static BridgeRequestHandler CreatePasskeyEnabledHandler(
        PwDatabase database,
        TrustedClientStore store,
        PasskeyPendingSessionStore pendingSessionStore,
        Action<PwDatabase> databaseChanged,
        Func<PasskeyApprovalRequest, PasskeyApprovalResult> passkeyApproval)
    {
        return new BridgeRequestHandler(
            new PairingService(new DeterministicSecretGenerator("123456", "shared-secret")),
            store,
            new CredentialQueryService(),
            new CredentialMutationService(),
            new PasskeyService(),
            new PasskeyCredentialLookupService(),
            pendingSessionStore,
            delegate { return database; },
            delegate { return true; },
            delegate(PairingSession session) { },
            databaseChanged,
            passkeyApproval);
    }

    private static TrustedClientStore CreateTrustedStore(string clientId, string secret)
    {
        return CreateTrustedStore(clientId, secret, TrustedClientPermissions.Default());
    }

    private static TrustedClientStore CreateTrustedStore(string clientId, string secret, string[] permissions)
    {
        TrustedClientStore store = new TrustedClientStore();
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = clientId,
            ClientName = "Chrome",
            SharedSecret = secret,
            Permissions = permissions,
            CreatedUtcMs = NowMs()
        });
        return store;
    }

    private static long NowMs()
    {
        return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }

    private static int FindFreePort()
    {
        for (int attempt = 0; attempt < 20; attempt++)
        {
            TcpListener listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            int port = ((IPEndPoint)listener.LocalEndpoint).Port;
            listener.Stop();

            if (CanStartHttpListener(port)) return port;
        }

        throw new InvalidOperationException("Could not find a loopback port usable by HttpListener.");
    }

    private static bool CanStartHttpListener(int port)
    {
        HttpListener listener = new HttpListener();
        listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
        try
        {
            listener.Start();
            return true;
        }
        catch (HttpListenerException)
        {
            return false;
        }
        finally
        {
            try { listener.Stop(); }
            catch { }

            try { listener.Close(); }
            catch { }
        }
    }

    private static string PostRawHttp(int port, string body)
    {
        byte[] bodyBytes = Encoding.UTF8.GetBytes(body);
        string header = "POST /bridge HTTP/1.1\r\n" +
            "Host: 127.0.0.1:" + port + "\r\n" +
            "Content-Type: application/json\r\n" +
            "Content-Length: " + bodyBytes.Length + "\r\n" +
            "Connection: close\r\n\r\n";

        return ExtractRawHttpBody(SendRawHttp(port, header, bodyBytes).Raw);
    }

    private static string ExtractRawHttpBody(string raw)
    {
        int bodyStart = raw.IndexOf("\r\n\r\n", StringComparison.Ordinal);
        if (bodyStart < 0) throw new Exception("HTTP response did not contain a body separator.");
        return raw.Substring(bodyStart + 4);
    }

    private static RawHttpResponse SendRawHttp(int port, string header)
    {
        return SendRawHttp(port, header, new byte[0]);
    }

    private static RawHttpResponse SendRawHttp(int port, string header, byte[] bodyBytes)
    {
        using (TcpClient client = new TcpClient("127.0.0.1", port))
        using (NetworkStream stream = client.GetStream())
        {
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (bodyBytes.Length > 0) stream.Write(bodyBytes, 0, bodyBytes.Length);

            byte[] buffer = new byte[8192];
            int read;
            StringBuilder response = new StringBuilder();
            while ((read = stream.Read(buffer, 0, buffer.Length)) > 0)
            {
                response.Append(Encoding.UTF8.GetString(buffer, 0, read));
            }

            return RawHttpResponse.Parse(response.ToString());
        }
    }

    private static bool IsDigitsOnly(string value)
    {
        if (string.IsNullOrEmpty(value)) return false;
        for (int i = 0; i < value.Length; ++i)
        {
            if (!char.IsDigit(value[i])) return false;
        }
        return true;
    }

    private static BridgeFeatureInfo FindFeature(BridgeFeatureInfo[] features, string name)
    {
        if (features == null) throw new Exception("hello response did not include feature metadata");
        for (int i = 0; i < features.Length; ++i)
        {
            if (features[i] != null && string.Equals(features[i].Name, name, StringComparison.Ordinal))
                return features[i];
        }

        throw new Exception("hello response did not include feature metadata for " + name);
    }

    private static void AssertWebAuthnClientData(byte[] clientDataJson, string expectedType, string expectedChallenge, string expectedOrigin, string label)
    {
        WebAuthnClientDataForTest clientData = BridgeJsonSerializer.Deserialize<WebAuthnClientDataForTest>(
            Encoding.UTF8.GetString(clientDataJson ?? new byte[0]));
        AssertEqual(expectedType, clientData.Type, label + " type mismatch");
        AssertEqual(expectedChallenge, clientData.Challenge, label + " challenge mismatch");
        AssertEqual(expectedOrigin, clientData.Origin, label + " origin mismatch");
        AssertFalse(clientData.CrossOrigin, label + " crossOrigin should be false");
    }

    private static byte[] ReadNoneAttestationAuthData(byte[] attestationObject)
    {
        int offset = 0;
        AssertEqual(3, (int)ReadCborLength(attestationObject, ref offset, 5),
            "registration attestationObject should be a three-entry CBOR map");
        AssertEqual("fmt", ReadCborTextString(attestationObject, ref offset),
            "registration attestationObject first key mismatch");
        AssertEqual("none", ReadCborTextString(attestationObject, ref offset),
            "registration attestationObject fmt mismatch");
        AssertEqual("attStmt", ReadCborTextString(attestationObject, ref offset),
            "registration attestationObject second key mismatch");
        AssertEqual(0, (int)ReadCborLength(attestationObject, ref offset, 5),
            "registration attestationObject none attStmt should be empty");
        AssertEqual("authData", ReadCborTextString(attestationObject, ref offset),
            "registration attestationObject third key mismatch");
        byte[] authData = ReadCborByteString(attestationObject, ref offset);
        AssertEqual(attestationObject.Length, offset,
            "registration attestationObject should not contain trailing CBOR bytes");
        return authData;
    }

    private static string ReadCborTextString(byte[] bytes, ref int offset)
    {
        ulong length = ReadCborLength(bytes, ref offset, 3);
        if (length > int.MaxValue || offset + (int)length > bytes.Length)
            throw new Exception("CBOR text string length is invalid.");
        string text = Encoding.UTF8.GetString(bytes, offset, (int)length);
        offset += (int)length;
        return text;
    }

    private static byte[] ReadCborByteString(byte[] bytes, ref int offset)
    {
        ulong length = ReadCborLength(bytes, ref offset, 2);
        if (length > int.MaxValue || offset + (int)length > bytes.Length)
            throw new Exception("CBOR byte string length is invalid.");
        byte[] value = Slice(bytes, offset, (int)length);
        offset += (int)length;
        return value;
    }

    private static ulong ReadCborLength(byte[] bytes, ref int offset, int expectedMajorType)
    {
        if (bytes == null || offset >= bytes.Length) throw new Exception("CBOR value is truncated.");
        byte initial = bytes[offset++];
        int majorType = initial >> 5;
        int additionalInfo = initial & 0x1f;
        if (majorType != expectedMajorType)
            throw new Exception("CBOR major type mismatch. Expected: " + expectedMajorType + ", actual: " + majorType);
        if (additionalInfo < 24) return (ulong)additionalInfo;
        if (additionalInfo == 24)
        {
            if (offset >= bytes.Length) throw new Exception("CBOR uint8 length is truncated.");
            return bytes[offset++];
        }
        if (additionalInfo == 25)
        {
            if (offset + 2 > bytes.Length) throw new Exception("CBOR uint16 length is truncated.");
            return (ulong)((bytes[offset++] << 8) | bytes[offset++]);
        }
        throw new Exception("CBOR additional info is not supported by this test reader.");
    }

    private static int ReadUInt16BigEndian(byte[] bytes, int offset)
    {
        if (bytes == null || offset < 0 || offset + 2 > bytes.Length)
            throw new Exception("UInt16 read is out of range.");
        return (bytes[offset] << 8) | bytes[offset + 1];
    }

    private static uint ReadUInt32BigEndian(byte[] bytes, int offset)
    {
        if (bytes == null || offset < 0 || offset + 4 > bytes.Length)
            throw new Exception("UInt32 read is out of range.");
        return ((uint)bytes[offset] << 24) |
            ((uint)bytes[offset + 1] << 16) |
            ((uint)bytes[offset + 2] << 8) |
            bytes[offset + 3];
    }

    private static byte[] Sha256(byte[] bytes)
    {
        using (SHA256 sha256 = SHA256.Create())
        {
            return sha256.ComputeHash(bytes);
        }
    }

    private static byte[] Slice(byte[] bytes, int offset, int length)
    {
        if (bytes == null || offset < 0 || length < 0 || offset + length > bytes.Length)
            throw new Exception("Byte slice is out of range.");
        byte[] value = new byte[length];
        Buffer.BlockCopy(bytes, offset, value, 0, length);
        return value;
    }

    private static byte[] CombineBytes(byte[] first, byte[] second)
    {
        byte[] combined = new byte[(first == null ? 0 : first.Length) + (second == null ? 0 : second.Length)];
        if (first != null) Buffer.BlockCopy(first, 0, combined, 0, first.Length);
        if (second != null) Buffer.BlockCopy(second, 0, combined, first == null ? 0 : first.Length, second.Length);
        return combined;
    }

    private static void AssertRejectsPublicKeyCoseMutation(
        PasskeyService service,
        PasskeyCredentialMaterial credential,
        PasskeyAssertionResponse assertion,
        string validPublicKeyCose,
        byte keyMarker,
        byte expectedValue,
        byte replacementValue,
        string message)
    {
        credential.PublicKeyCose = ReplaceCoseValueAfterKey(validPublicKeyCose, keyMarker, expectedValue, replacementValue);
        AssertFalse(service.VerifyAssertionSignature(credential, assertion), message);
        credential.PublicKeyCose = validPublicKeyCose;
    }

    private static PasskeyCredentialMaterial CopyPasskeyCredential(PasskeyCredentialMaterial credential)
    {
        return new PasskeyCredentialMaterial
        {
            RpId = credential.RpId,
            Origin = credential.Origin,
            CredentialId = credential.CredentialId,
            UserHandle = credential.UserHandle,
            UserName = credential.UserName,
            UserDisplayName = credential.UserDisplayName,
            UserVerification = credential.UserVerification,
            ResidentKey = credential.ResidentKey,
            Transports = credential.Transports,
            PublicKeyCose = credential.PublicKeyCose,
            PrivateKey = credential.PrivateKey,
            SignCount = credential.SignCount
        };
    }

    private static PasskeyAssertionResponse CopyPasskeyAssertion(PasskeyAssertionResponse assertion)
    {
        return new PasskeyAssertionResponse
        {
            CredentialId = assertion.CredentialId,
            AuthenticatorData = assertion.AuthenticatorData,
            ClientDataJson = assertion.ClientDataJson,
            Signature = assertion.Signature,
            UserHandle = assertion.UserHandle,
            SignCount = assertion.SignCount
        };
    }

    private static PasskeyAssertionResponse ResignPasskeyAssertion(
        PasskeyAssertionResponse assertion,
        byte[] authenticatorData,
        byte[] clientDataJson,
        byte[] privateKey)
    {
        PasskeyAssertionResponse copy = CopyPasskeyAssertion(assertion);
        copy.AuthenticatorData = Base64Url.Encode(authenticatorData);
        copy.ClientDataJson = Base64Url.Encode(clientDataJson);
#if NET8_0_OR_GREATER
        if (!OperatingSystem.IsWindows()) throw new Exception("Passkey assertion verification fixture requires Windows CNG.");
#endif
        copy.Signature = Base64Url.Encode(EccKeyBlob.SignDer(privateKey,
            CombineBytes(authenticatorData, Sha256(clientDataJson))));
        return copy;
    }

    private static string ReplaceCoseValueAfterKey(string publicKeyCose, byte keyMarker, byte expectedValue, byte replacementValue)
    {
        byte[] cose;
        AssertTrue(Base64Url.TryDecode(publicKeyCose, out cose), "test public key COSE should be base64url encoded");
        for (int i = 0; i < cose.Length - 1; ++i)
        {
            if (cose[i] == keyMarker && cose[i + 1] == expectedValue)
            {
                cose[i + 1] = replacementValue;
                return Base64Url.Encode(cose);
            }
        }

        throw new Exception("test public key COSE did not contain the expected key/value marker.");
    }

    private static void AssertP256SubjectPublicKeyInfo(byte[] spki, byte[] publicKeyCose, string label)
    {
        byte[] x = ReadCoseCoordinate(publicKeyCose, (byte)0x21);
        byte[] y = ReadCoseCoordinate(publicKeyCose, (byte)0x22);
        byte[] expectedPrefix = new byte[]
        {
            0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
            0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a,
            0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03,
            0x42, 0x00, 0x04
        };

        AssertEqual(expectedPrefix.Length + x.Length + y.Length, spki.Length,
            label + " length mismatch");
        AssertByteArrayEqual(expectedPrefix, Slice(spki, 0, expectedPrefix.Length),
            label + " DER prefix mismatch");
        AssertByteArrayEqual(x, Slice(spki, expectedPrefix.Length, x.Length),
            label + " X coordinate mismatch");
        AssertByteArrayEqual(y, Slice(spki, expectedPrefix.Length + x.Length, y.Length),
            label + " Y coordinate mismatch");
    }

    private static byte[] ReadCoseCoordinate(byte[] cose, byte keyMarker)
    {
        for (int i = 0; i < cose.Length - 34; ++i)
        {
            if (cose[i] == keyMarker && cose[i + 1] == 0x58 && cose[i + 2] == 0x20)
                return Slice(cose, i + 3, 32);
        }

        throw new Exception("test public key COSE did not contain expected coordinate marker.");
    }

    private static void AssertByteArrayEqual(byte[] expected, byte[] actual, string message)
    {
        if (expected == null || actual == null || expected.Length != actual.Length)
            throw new Exception(message + ". Expected length: " +
                (expected == null ? -1 : expected.Length) + ", actual length: " +
                (actual == null ? -1 : actual.Length));
        for (int i = 0; i < expected.Length; ++i)
        {
            if (expected[i] != actual[i])
                throw new Exception(message + ". Byte mismatch at index " + i +
                    ". Expected: " + expected[i] + ", actual: " + actual[i]);
        }
    }

    private static void AssertTrue(bool value, string message)
    {
        if (!value) throw new Exception(message);
    }

    private static void AssertFalse(bool value, string message)
    {
        if (value) throw new Exception(message);
    }

    private static void AssertEqual<T>(T expected, T actual, string message)
    {
        if (!object.Equals(expected, actual))
            throw new Exception(message + ". Expected: " + expected + ", actual: " + actual);
    }

    [DataContract]
    private sealed class WebAuthnClientDataForTest
    {
        [DataMember(Name = "type")]
        public string Type { get; set; }

        [DataMember(Name = "challenge")]
        public string Challenge { get; set; }

        [DataMember(Name = "origin")]
        public string Origin { get; set; }

        [DataMember(Name = "crossOrigin")]
        public bool CrossOrigin { get; set; }
    }

    private sealed class DeterministicSecretGenerator : ISecretGenerator
    {
        private readonly string m_pairingCode;
        private readonly string m_secret;

        public DeterministicSecretGenerator(string pairingCode, string secret)
        {
            m_pairingCode = pairingCode;
            m_secret = secret;
        }

        public string CreatePairingCode()
        {
            return m_pairingCode;
        }

        public string CreateSecret()
        {
            return m_secret;
        }
    }

    private sealed class RawHttpResponse
    {
        public int StatusCode { get; private set; }
        public System.Collections.Generic.Dictionary<string, string> Headers { get; private set; }
        public string Raw { get; private set; }

        public static RawHttpResponse Parse(string raw)
        {
            string[] lines = raw.Split(new[] { "\r\n" }, StringSplitOptions.None);
            string[] statusParts = lines[0].Split(' ');
            RawHttpResponse response = new RawHttpResponse
            {
                Raw = raw,
                StatusCode = int.Parse(statusParts[1]),
                Headers = new System.Collections.Generic.Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            };

            for (int i = 1; i < lines.Length; ++i)
            {
                if (lines[i].Length == 0) break;
                int separator = lines[i].IndexOf(':');
                if (separator <= 0) continue;
                response.Headers[lines[i].Substring(0, separator)] = lines[i].Substring(separator + 1).Trim();
            }

            return response;
        }
    }
}
