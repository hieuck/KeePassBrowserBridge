using System;
using System.Security.Cryptography;
using System.Text;

namespace KeePassBrowserBridge.Bridge
{
    internal static class BridgeAuthentication
    {
        public static string CreateAuthentication(BridgeRequest request, string sharedSecret)
        {
            if (request == null) throw new ArgumentNullException("request");
            if (string.IsNullOrEmpty(sharedSecret)) return string.Empty;

            byte[] key = Encoding.UTF8.GetBytes(sharedSecret);
            byte[] data = Encoding.UTF8.GetBytes(CreateCanonicalString(request));

            using (HMACSHA256 hmac = new HMACSHA256(key))
            {
                return Convert.ToBase64String(hmac.ComputeHash(data));
            }
        }

        public static bool Verify(BridgeRequest request, string sharedSecret)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Authentication)) return false;

            string expected = CreateAuthentication(request, sharedSecret);
            return FixedTimeEquals(expected, request.Authentication);
        }

        private static string CreateCanonicalString(BridgeRequest request)
        {
            return request.ProtocolVersion + "\n" +
                (request.Method ?? string.Empty) + "\n" +
                (request.RequestId ?? string.Empty) + "\n" +
                request.TimestampUtcMs + "\n" +
                (request.Origin ?? string.Empty) + "\n" +
                (request.ClientId ?? string.Empty) + "\n" +
                (request.Payload ?? string.Empty);
        }

        private static bool FixedTimeEquals(string left, string right)
        {
            if (left == null || right == null) return false;

            byte[] leftBytes = Encoding.UTF8.GetBytes(left);
            byte[] rightBytes = Encoding.UTF8.GetBytes(right);
            int diff = leftBytes.Length ^ rightBytes.Length;
            int count = Math.Min(leftBytes.Length, rightBytes.Length);

            for (int i = 0; i < count; ++i)
            {
                diff |= leftBytes[i] ^ rightBytes[i];
            }

            return diff == 0;
        }
    }
}
