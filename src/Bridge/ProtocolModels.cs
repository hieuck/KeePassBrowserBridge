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
        public const string PasskeysCreateBegin = "passkeys.create.begin";
        public const string PasskeysCreateComplete = "passkeys.create.complete";
        public const string PasskeysGetBegin = "passkeys.get.begin";
        public const string PasskeysGetComplete = "passkeys.get.complete";
        public const string PasskeysList = "passkeys.list";
        public const string PasskeysCancel = "passkeys.cancel";
        public const string PasskeysRevoke = "passkeys.revoke";
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
        public string[] SupportedMethods { get; set; }
        public BridgeFeatureInfo[] Features { get; set; }
    }

    public sealed class BridgeFeatureInfo
    {
        public string Name { get; set; }
        public bool Enabled { get; set; }
        public string Status { get; set; }
        public string Reason { get; set; }
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
        public string ExtensionOrigin { get; set; }
        public long CreatedUtcMs { get; set; }
        public long LastUsedUtcMs { get; set; }
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

    public interface IPasskeyBeginPayload
    {
        string WebAuthnRequestId { get; set; }
        string RpId { get; set; }
        string Origin { get; set; }
        string Challenge { get; set; }
    }

    public sealed class PasskeyCreateBeginPayload : IPasskeyBeginPayload
    {
        public string WebAuthnRequestId { get; set; }
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string Challenge { get; set; }
        public string UserHandle { get; set; }
        public string UserName { get; set; }
        public string UserDisplayName { get; set; }
        public string UserVerification { get; set; }
        public string[] Transports { get; set; }
    }

    public sealed class PasskeyCreateBeginResponsePayload
    {
        public string WebAuthnRequestId { get; set; }
        public string RpId { get; set; }
        public string Origin { get; set; }
        public long ExpiresUtcMs { get; set; }
        public bool PendingApproval { get; set; }
    }

    public sealed class PasskeyCreateCompletePayload
    {
        public string WebAuthnRequestId { get; set; }
        public string RpId { get; set; }
        public string Origin { get; set; }
    }

    public sealed class PasskeyCreateCompleteResponsePayload
    {
        public string WebAuthnRequestId { get; set; }
        public string EntryId { get; set; }
        public string CredentialId { get; set; }
        public string RpId { get; set; }
        public string ClientDataJson { get; set; }
        public string AttestationObject { get; set; }
        public string PublicKeyCose { get; set; }
    }

    public sealed class PasskeyGetBeginPayload : IPasskeyBeginPayload
    {
        public string WebAuthnRequestId { get; set; }
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string Challenge { get; set; }
        public string[] AllowCredentialIds { get; set; }
        public string UserVerification { get; set; }
    }

    public sealed class PasskeyGetBeginResponsePayload
    {
        public string WebAuthnRequestId { get; set; }
        public string RpId { get; set; }
        public string Origin { get; set; }
        public long ExpiresUtcMs { get; set; }
        public bool PendingApproval { get; set; }
        public PasskeyCredentialSummary[] Credentials { get; set; }
    }

    public sealed class PasskeyGetCompletePayload
    {
        public string WebAuthnRequestId { get; set; }
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string CredentialId { get; set; }
    }

    public sealed class PasskeyGetCompleteResponsePayload
    {
        public string WebAuthnRequestId { get; set; }
        public string EntryId { get; set; }
        public string CredentialId { get; set; }
        public string AuthenticatorData { get; set; }
        public string ClientDataJson { get; set; }
        public string Signature { get; set; }
        public string UserHandle { get; set; }
        public uint SignCount { get; set; }
    }

    public sealed class PasskeysListPayload
    {
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string[] AllowCredentialIds { get; set; }
    }

    public sealed class PasskeyRevokePayload
    {
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string CredentialId { get; set; }
    }

    public sealed class PasskeyCancelPayload
    {
        public string WebAuthnRequestId { get; set; }
    }

    public sealed class PasskeyCancelResponsePayload
    {
        public string WebAuthnRequestId { get; set; }
        public bool Cancelled { get; set; }
    }

    public sealed class PasskeyRevokeResponsePayload
    {
        public string EntryId { get; set; }
        public string CredentialId { get; set; }
        public string RpId { get; set; }
        public bool Revoked { get; set; }
    }
}
