using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace KeePassBrowserBridge.Bridge
{
    internal static class TotpGenerator
    {
        private const int DefaultDigits = 6;
        private const int DefaultPeriodSeconds = 30;

        public static TotpResult Generate(string secretOrUri, long unixTimeMs)
        {
            TotpParameters parameters = Parse(secretOrUri);
            if (!parameters.Success)
                return TotpResult.Fail(parameters.ErrorCode, parameters.Error);

            byte[] secret = DecodeBase32(parameters.Secret);
            if (secret == null || secret.Length == 0)
                return TotpResult.Fail("invalid_totp_secret", "TOTP secret is invalid.");

            long counter = (unixTimeMs / 1000L) / parameters.PeriodSeconds;
            byte[] counterBytes = CounterToBigEndianBytes(counter);
            byte[] hash = ComputeHash(secret, counterBytes, parameters.Algorithm);
            if (hash == null)
                return TotpResult.Fail("unsupported_totp_algorithm", "TOTP algorithm is not supported.");

            int offset = hash[hash.Length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24) |
                ((hash[offset + 1] & 0xFF) << 16) |
                ((hash[offset + 2] & 0xFF) << 8) |
                (hash[offset + 3] & 0xFF);

            int modulus = 1;
            for (int i = 0; i < parameters.Digits; ++i) modulus *= 10;
            string code = (binary % modulus).ToString().PadLeft(parameters.Digits, '0');
            return TotpResult.Ok(code);
        }

        private static TotpParameters Parse(string secretOrUri)
        {
            if (string.IsNullOrWhiteSpace(secretOrUri))
                return TotpParameters.Fail("missing_totp_secret", "TOTP secret is empty.");

            string value = secretOrUri.Trim();
            if (!value.StartsWith("otpauth://", StringComparison.OrdinalIgnoreCase))
            {
                return TotpParameters.Ok(value, DefaultDigits, DefaultPeriodSeconds, "SHA1");
            }

            Uri uri;
            if (!Uri.TryCreate(value, UriKind.Absolute, out uri))
                return TotpParameters.Fail("invalid_otpauth_uri", "otpauth URI is invalid.");

            Dictionary<string, string> query = ParseQuery(uri.Query);
            string secret;
            if (!query.TryGetValue("secret", out secret) || string.IsNullOrWhiteSpace(secret))
                return TotpParameters.Fail("missing_totp_secret", "otpauth URI does not contain a secret.");

            int digits = GetInt(query, "digits", DefaultDigits);
            int period = GetInt(query, "period", DefaultPeriodSeconds);
            string algorithm;
            if (!query.TryGetValue("algorithm", out algorithm) || string.IsNullOrWhiteSpace(algorithm))
                algorithm = "SHA1";

            if (digits < 6 || digits > 8)
                return TotpParameters.Fail("invalid_totp_digits", "TOTP digits must be between 6 and 8.");
            if (period <= 0 || period > 300)
                return TotpParameters.Fail("invalid_totp_period", "TOTP period is invalid.");

            return TotpParameters.Ok(secret, digits, period, algorithm);
        }

        private static Dictionary<string, string> ParseQuery(string query)
        {
            Dictionary<string, string> result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            string trimmed = (query ?? string.Empty).TrimStart('?');
            if (trimmed.Length == 0) return result;

            string[] parts = trimmed.Split('&');
            foreach (string part in parts)
            {
                int equals = part.IndexOf('=');
                string name = equals >= 0 ? part.Substring(0, equals) : part;
                string value = equals >= 0 ? part.Substring(equals + 1) : string.Empty;
                result[Uri.UnescapeDataString(name)] = Uri.UnescapeDataString(value.Replace("+", " "));
            }

            return result;
        }

        private static int GetInt(Dictionary<string, string> query, string key, int fallback)
        {
            string raw;
            int parsed;
            return query.TryGetValue(key, out raw) && int.TryParse(raw, out parsed) ? parsed : fallback;
        }

        private static byte[] DecodeBase32(string value)
        {
            string normalized = value.Trim().Replace(" ", string.Empty).Replace("-", string.Empty).TrimEnd('=').ToUpperInvariant();
            if (normalized.Length == 0) return null;

            List<byte> bytes = new List<byte>();
            int buffer = 0;
            int bitsLeft = 0;
            foreach (char c in normalized)
            {
                int val;
                if (c >= 'A' && c <= 'Z') val = c - 'A';
                else if (c >= '2' && c <= '7') val = c - '2' + 26;
                else return null;

                buffer = (buffer << 5) | val;
                bitsLeft += 5;
                if (bitsLeft >= 8)
                {
                    bytes.Add((byte)((buffer >> (bitsLeft - 8)) & 0xFF));
                    bitsLeft -= 8;
                }
            }

            return bytes.ToArray();
        }

        private static byte[] CounterToBigEndianBytes(long counter)
        {
            byte[] bytes = BitConverter.GetBytes(counter);
            if (BitConverter.IsLittleEndian) Array.Reverse(bytes);
            return bytes;
        }

        private static byte[] ComputeHash(byte[] key, byte[] data, string algorithm)
        {
            string normalized = (algorithm ?? "SHA1").Replace("-", string.Empty).ToUpperInvariant();
            if (normalized == "SHA1")
            {
                using (HMACSHA1 hmac = new HMACSHA1(key)) return hmac.ComputeHash(data);
            }
            if (normalized == "SHA256")
            {
                using (HMACSHA256 hmac = new HMACSHA256(key)) return hmac.ComputeHash(data);
            }
            if (normalized == "SHA512")
            {
                using (HMACSHA512 hmac = new HMACSHA512(key)) return hmac.ComputeHash(data);
            }
            return null;
        }

        private sealed class TotpParameters
        {
            public bool Success { get; set; }
            public string ErrorCode { get; set; }
            public string Error { get; set; }
            public string Secret { get; set; }
            public int Digits { get; set; }
            public int PeriodSeconds { get; set; }
            public string Algorithm { get; set; }

            public static TotpParameters Ok(string secret, int digits, int periodSeconds, string algorithm)
            {
                return new TotpParameters
                {
                    Success = true,
                    Secret = secret,
                    Digits = digits,
                    PeriodSeconds = periodSeconds,
                    Algorithm = algorithm
                };
            }

            public static TotpParameters Fail(string errorCode, string error)
            {
                return new TotpParameters
                {
                    Success = false,
                    ErrorCode = errorCode,
                    Error = error
                };
            }
        }
    }

    internal sealed class TotpResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public string Code { get; set; }

        public static TotpResult Ok(string code)
        {
            return new TotpResult
            {
                Success = true,
                Code = code
            };
        }

        public static TotpResult Fail(string errorCode, string error)
        {
            return new TotpResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }
}
