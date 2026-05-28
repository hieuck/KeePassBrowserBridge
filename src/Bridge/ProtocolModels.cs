namespace KeePassBrowserBridge.Bridge
{
    internal static class BridgeMethods
    {
        public const string Hello = "hello";
        public const string PairBegin = "pair.begin";
        public const string PairComplete = "pair.complete";
        public const string ClientStatus = "client.status";
        public const string LoginsQuery = "logins.query";
        public const string LoginsFillAck = "logins.fillAck";
    }

    internal sealed class BridgeRequest
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

    internal sealed class BridgeResponse
    {
        public int ProtocolVersion { get; set; }
        public string RequestId { get; set; }
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public string Payload { get; set; }
    }

    internal sealed class HelloPayload
    {
        public string ExtensionName { get; set; }
        public string ExtensionVersion { get; set; }
    }

    internal sealed class PairBeginPayload
    {
        public string ClientName { get; set; }
    }

    internal sealed class PairCompletePayload
    {
        public string PairingSessionId { get; set; }
        public string PairingCode { get; set; }
        public string ClientName { get; set; }
    }

    internal sealed class ClientStatusPayload
    {
        public string ClientId { get; set; }
    }

    internal sealed class LoginsQueryPayload
    {
        public string Url { get; set; }
    }
}
