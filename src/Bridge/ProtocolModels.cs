namespace KeePassBrowserBridge.Bridge
{
    internal static class BridgeMethods
    {
        public const string Hello = "hello";
        public const string PairBegin = "pair.begin";
        public const string PairComplete = "pair.complete";
        public const string PairCancel = "pair.cancel";
        public const string ClientStatus = "client.status";
        public const string ClientsList = "clients.list";
        public const string ClientsRevoke = "clients.revoke";
        public const string ClientsUpdatePermissions = "clients.updatePermissions";
        public const string LoginsQuery = "logins.query";
        public const string LoginsCreate = "logins.create";
        public const string LoginsUpdate = "logins.update";
        public const string LoginsFillAck = "logins.fillAck";
    }

    public sealed class BridgeRequest
    {
        public int ProtocolVersion { get; set; }
        public string Method { get; set; }
        public string RequestId { get; set; }
        public long TimestampUtcMs { get; set; }
        public string Origin { get; set; }
        public string ClientId { get; set; }
        public string Payload { get; set; }
        public string Authentication { get; set; }
    }

    public sealed class BridgeResponse
    {
        public int ProtocolVersion { get; set; }
        public string RequestId { get; set; }
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public string Payload { get; set; }
    }

    public sealed class HelloPayload
    {
        public string ExtensionName { get; set; }
        public string ExtensionVersion { get; set; }
    }

    public sealed class HelloResponsePayload
    {
        public string ProductName { get; set; }
        public int ProtocolVersion { get; set; }
        public string PluginVersion { get; set; }
        public string PluginUpdateUrl { get; set; }
    }

    public sealed class PairBeginPayload
    {
        public string ClientName { get; set; }
    }

    public sealed class PairBeginResponsePayload
    {
        public string PairingSessionId { get; set; }
    }

    public sealed class PairCompletePayload
    {
        public string PairingSessionId { get; set; }
        public string PairingCode { get; set; }
        public string ClientName { get; set; }
    }

    public sealed class PairCompleteResponsePayload
    {
        public string ClientId { get; set; }
        public string ClientName { get; set; }
        public string SharedSecret { get; set; }
    }

    public sealed class PairCancelPayload
    {
        public string PairingSessionId { get; set; }
    }

    public sealed class PairCancelResponsePayload
    {
        public string PairingSessionId { get; set; }
        public bool Cancelled { get; set; }
    }

    public sealed class ClientStatusPayload
    {
        public string ClientId { get; set; }
    }

    public sealed class ClientStatusResponsePayload
    {
        public bool Trusted { get; set; }
        public string[] Permissions { get; set; }
    }

    public sealed class ClientInfo
    {
        public string ClientId { get; set; }
        public string ClientName { get; set; }
        public long CreatedUtcMs { get; set; }
        public bool Trusted { get; set; }
        public bool Current { get; set; }
        public string[] Permissions { get; set; }
    }

    public sealed class ClientsListResponsePayload
    {
        public ClientInfo[] Clients { get; set; }
    }

    public sealed class ClientRevokePayload
    {
        public string ClientId { get; set; }
    }

    public sealed class ClientRevokeResponsePayload
    {
        public bool Revoked { get; set; }
        public string ClientId { get; set; }
    }

    public sealed class ClientPermissionsUpdatePayload
    {
        public string ClientId { get; set; }
        public string[] Permissions { get; set; }
    }

    public sealed class ClientPermissionsUpdateResponsePayload
    {
        public bool Updated { get; set; }
        public string ClientId { get; set; }
        public string[] Permissions { get; set; }
    }

    public sealed class LoginsQueryPayload
    {
        public string Url { get; set; }
        public bool? StrictUrlMatching { get; set; }
        public bool? RegexUrlMatching { get; set; }
    }

    public sealed class CreateLoginPayload
    {
        public string Title { get; set; }
        public string Url { get; set; }
        public string Group { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public string Otp { get; set; }
        public CustomField[] CustomFields { get; set; }
    }

    public sealed class UpdateLoginPayload
    {
        public string EntryId { get; set; }
        public string Title { get; set; }
        public string Url { get; set; }
        public string Group { get; set; }
        public string PageUrl { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public string Otp { get; set; }
        public bool ClearOtp { get; set; }
        public CustomField[] CustomFields { get; set; }
        public bool ReplaceCustomFields { get; set; }
    }

    public sealed class FillAckPayload
    {
        public string EntryId { get; set; }
        public string Url { get; set; }
    }
}
