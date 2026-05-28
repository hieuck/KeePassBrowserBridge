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
        InvalidUrlsDoNotMatch();
        HttpAndHttpsWithSameHostMatch();
        DifferentHostsDoNotMatch();
        TotpGeneratorMatchesRfcVector();
        TotpGeneratorParsesOtpAuthUri();
        ValidHelloRequestPassesValidation();
        UnknownMethodFailsValidation();
        MissingOriginFailsValidation();
        StaleTimestampFailsValidation();
        WrongProtocolVersionFailsValidation();
        PairingSessionGeneratesSixDigitCode();
        WrongPairingCodeIsRejected();
        SuccessfulPairingCreatesTrustedClient();
        RevokedClientIsNoLongerTrusted();
        TrustedClientStorePersistsRoundTrip();
        CredentialQueryReturnsExactHostMatch();
        CredentialQueryIncludesOneTimePassword();
        CredentialQueryRejectsUnrelatedDomain();
        CredentialQueryRejectsClosedDatabase();
        CredentialMutationCreatesEntryInDatabase();
        CredentialMutationUpdatesExistingEntryPassword();
        BridgeHandlerHelloDoesNotRequireAuthentication();
        BridgeHandlerRejectsBadHmacForTrustedMethod();
        BridgeHandlerAcceptsValidHmacForClientStatus();
        BridgeHandlerReturnsLoginsForAuthenticatedQuery();
        BridgeHandlerCreatesLoginForAuthenticatedRequest();
        BridgeHandlerUpdatesLoginForAuthenticatedRequest();
        LoopbackBridgeServerRespondsToHello();
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
            CreatedUtcMs = 1779960000000
        });

        string json = original.ExportJson();
        TrustedClientStore restored = new TrustedClientStore();
        restored.ImportJson(json);
        TrustedClient client = restored.Get("client-1");

        AssertTrue(client != null, "restored store should contain trusted client");
        AssertEqual("Chrome", client.ClientName, "restored client name mismatch");
        AssertEqual("shared-secret", client.SharedSecret, "restored client secret mismatch");
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

    private static void BridgeHandlerHelloDoesNotRequireAuthentication()
    {
        BridgeRequestHandler handler = CreateHandler(null, new TrustedClientStore());
        BridgeRequest request = CreateValidRequest(BridgeMethods.Hello);

        BridgeResponse response = handler.Handle(request);

        AssertTrue(response.Success, "hello should succeed without authentication: " + response.Error);
        AssertEqual(request.RequestId, response.RequestId, "hello response request ID mismatch");
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

    private static BridgeRequest CreateValidRequest(string method)
    {
        return new BridgeRequest
        {
            ProtocolVersion = ProtocolValidator.ProtocolVersion,
            Method = method,
            RequestId = Guid.NewGuid().ToString("N"),
            TimestampUtcMs = NowMs(),
            Origin = "chrome-extension://abcdefghijklmnop"
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
        return new BridgeRequestHandler(
            new PairingService(new DeterministicSecretGenerator("123456", "shared-secret")),
            store,
            new CredentialQueryService(),
            new CredentialMutationService(),
            delegate { return database; },
            delegate(PairingSession session) { });
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
        TcpListener listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        int port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    private static string PostRawHttp(int port, string body)
    {
        byte[] bodyBytes = Encoding.UTF8.GetBytes(body);
        string header = "POST /bridge HTTP/1.1\r\n" +
            "Host: 127.0.0.1:" + port + "\r\n" +
            "Content-Type: application/json\r\n" +
            "Content-Length: " + bodyBytes.Length + "\r\n" +
            "Connection: close\r\n\r\n";

        using (TcpClient client = new TcpClient("127.0.0.1", port))
        using (NetworkStream stream = client.GetStream())
        {
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);
            stream.Write(headerBytes, 0, headerBytes.Length);
            stream.Write(bodyBytes, 0, bodyBytes.Length);

            byte[] buffer = new byte[8192];
            int read;
            StringBuilder response = new StringBuilder();
            while ((read = stream.Read(buffer, 0, buffer.Length)) > 0)
            {
                response.Append(Encoding.UTF8.GetString(buffer, 0, read));
            }

            string raw = response.ToString();
            int bodyStart = raw.IndexOf("\r\n\r\n", StringComparison.Ordinal);
            if (bodyStart < 0) throw new Exception("HTTP response did not contain a body separator.");
            return raw.Substring(bodyStart + 4);
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
}
