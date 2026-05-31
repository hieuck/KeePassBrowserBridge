using System;
using System.Net;
using System.Net.Sockets;
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
        ValidHelloRequestPassesValidation();
        UnknownMethodFailsValidation();
        MissingOriginFailsValidation();
        WebPageOriginFailsValidation();
        FirefoxExtensionOriginPassesValidation();
        MalformedExtensionOriginFailsValidation();
        StaleTimestampFailsValidation();
        WrongProtocolVersionFailsValidation();
        UpdateCheckerReadsCurrentVersionFromAssembly();
        UpdateCheckerDetectsNewerSemanticVersions();
        UpdateCheckerIgnoresSameOrInvalidVersions();
        UpdateCheckerSelectsNewestSemanticTag();
        UpdateCheckerBuildsPluginAssetUrl();
        PairingSessionGeneratesSixDigitCode();
        WrongPairingCodeIsRejected();
        NewPairingSessionCancelsOlderSessionForSameClient();
        PairingSessionLocksAfterRepeatedWrongCodes();
        CancelledPairingSessionCannotComplete();
        ExpiredPairingCodeIsRejected();
        SuccessfulPairingCreatesTrustedClient();
        RevokedClientIsNoLongerTrusted();
        TrustedClientStorePersistsRoundTrip();
        CredentialQueryReturnsExactHostMatch();
        CredentialQueryMatchesParentDomainWhenStrictMatchingIsDisabled();
        CredentialQueryMatchesWwwEntryToApexPageWhenStrictMatchingIsDisabled();
        CredentialQueryIgnoresRegexPatternWhenRegexMatchingIsDisabled();
        CredentialQueryMatchesAdditionalUrlField();
        CredentialQueryIncludesKeePassGroupPath();
        CredentialQueryIncludesUsageMetadata();
        CredentialQueryIncludesOneTimePassword();
        CredentialQueryRedactsProtectedCustomFieldValues();
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
        BridgeHandlerPairCompleteStoresExtensionOrigin();
        BridgeHandlerRejectsAuthenticatedRequestFromDifferentExtensionOrigin();
        BridgeHandlerRejectsReplayedAuthenticatedRequestId();
        BridgeHandlerReturnsStructuredErrorForMalformedPayload();
        BridgeHandlerCancelsPairingSession();
        BridgeHandlerListsTrustedClientsWithoutSecrets();
        BridgeHandlerRevokesTrustedClient();
        BridgeHandlerReturnsLoginsForAuthenticatedQuery();
        BridgeHandlerCreatesLoginForAuthenticatedRequest();
        BridgeHandlerSavesDatabaseAfterSuccessfulCreate();
        BridgeHandlerDoesNotSaveDatabaseAfterFailedCreate();
        BridgeHandlerUpdatesLoginForAuthenticatedRequest();
        BridgeHandlerSavesDatabaseAfterSuccessfulUpdate();
        BridgeHandlerUpdatesUsageAfterFillAck();
        LoopbackBridgeServerRespondsToHello();
        LoopbackBridgeServerRejectsWebPreflightOrigin();
        LoopbackBridgeServerAllowsExtensionPreflightOrigin();
        LoopbackBridgeServerRejectsWebPostOriginBeforeHandling();
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
    }

    private static void PairingSessionGeneratesSixDigitCode()
    {
        PairingService service = new PairingService(new DeterministicSecretGenerator("111111", "secret"));

        PairingSession session = service.BeginPairing("Chrome");

        AssertEqual(6, session.PairingCode.Length, "pairing code length mismatch");
        AssertTrue(IsDigitsOnly(session.PairingCode), "pairing code should contain digits only");
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
            CreatedUtcMs = 1779960000000
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

    private static TrustedClientStore CreateTrustedStore(string clientId, string secret)
    {
        TrustedClientStore store = new TrustedClientStore();
        store.AddOrUpdate(new TrustedClient
        {
            ClientId = clientId,
            ClientName = "Chrome",
            SharedSecret = secret,
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

        string raw = SendRawHttp(port, header, bodyBytes).Raw;
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
