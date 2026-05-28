using System;
using System.Collections.Generic;

namespace KeePassBrowserBridge.Bridge
{
    internal static class ProtocolValidator
    {
        public const int ProtocolVersion = 1;
        public const long MaxClockSkewMs = 5 * 60 * 1000;

        private static readonly HashSet<string> KnownMethods = new HashSet<string>(StringComparer.Ordinal)
        {
            BridgeMethods.Hello,
            BridgeMethods.PairBegin,
            BridgeMethods.PairComplete,
            BridgeMethods.ClientStatus,
            BridgeMethods.ClientsList,
            BridgeMethods.ClientsRevoke,
            BridgeMethods.LoginsQuery,
            BridgeMethods.LoginsCreate,
            BridgeMethods.LoginsUpdate,
            BridgeMethods.LoginsFillAck
        };

        public static ProtocolValidationResult Validate(BridgeRequest request, long nowUtcMs)
        {
            if (request == null) return ProtocolValidationResult.Fail("missing_request", "Request is required.");

            if (request.ProtocolVersion != ProtocolVersion)
                return ProtocolValidationResult.Fail("unsupported_protocol", "Unsupported protocol version.");

            if (string.IsNullOrWhiteSpace(request.RequestId))
                return ProtocolValidationResult.Fail("missing_request_id", "Request ID is required.");

            if (string.IsNullOrWhiteSpace(request.Method))
                return ProtocolValidationResult.Fail("missing_method", "Method is required.");

            if (!KnownMethods.Contains(request.Method))
                return ProtocolValidationResult.Fail("unknown_method", "Unknown method.");

            if (string.IsNullOrWhiteSpace(request.Origin))
                return ProtocolValidationResult.Fail("missing_origin", "Origin is required.");

            if (request.TimestampUtcMs <= 0)
                return ProtocolValidationResult.Fail("missing_timestamp", "Timestamp is required.");

            long skew = Math.Abs(nowUtcMs - request.TimestampUtcMs);
            if (skew > MaxClockSkewMs)
                return ProtocolValidationResult.Fail("stale_timestamp", "Timestamp is outside the accepted clock skew.");

            return ProtocolValidationResult.Ok();
        }
    }

    internal sealed class ProtocolValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }

        public static ProtocolValidationResult Ok()
        {
            return new ProtocolValidationResult { IsValid = true };
        }

        public static ProtocolValidationResult Fail(string errorCode, string error)
        {
            return new ProtocolValidationResult
            {
                IsValid = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }
}
