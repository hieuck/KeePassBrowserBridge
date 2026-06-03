using System;
using System.Collections.Generic;
using System.Security.Cryptography;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class PairingService
    {
        public const long MaxPairingSessionAgeMs = 5 * 60 * 1000;
        public const int MaxInvalidPairingAttempts = 5;

        private readonly ISecretGenerator m_secretGenerator;
        private readonly Func<long> m_nowProvider;
        private readonly Dictionary<string, PairingSession> m_sessions = new Dictionary<string, PairingSession>(StringComparer.Ordinal);

        public PairingService()
            : this(new CryptoSecretGenerator())
        {
        }

        public PairingService(ISecretGenerator secretGenerator)
            : this(secretGenerator, BridgeClock.UtcNowMilliseconds)
        {
        }

        public PairingService(ISecretGenerator secretGenerator, Func<long> nowProvider)
        {
            if (secretGenerator == null) throw new ArgumentNullException("secretGenerator");
            if (nowProvider == null) throw new ArgumentNullException("nowProvider");
            m_secretGenerator = secretGenerator;
            m_nowProvider = nowProvider;
        }

        public PairingSession BeginPairing(string clientName)
        {
            return BeginPairing(clientName, null);
        }

        public PairingSession BeginPairing(string clientName, string extensionOrigin)
        {
            string normalizedClientName = NormalizeClientName(clientName);
            CancelExistingSessionsForClient(normalizedClientName);

            PairingSession session = new PairingSession
            {
                PairingSessionId = Guid.NewGuid().ToString("N"),
                PairingCode = m_secretGenerator.CreatePairingCode(),
                ClientName = normalizedClientName,
                ExtensionOrigin = NormalizeExtensionOrigin(extensionOrigin),
                CreatedUtcMs = m_nowProvider()
            };

            m_sessions[session.PairingSessionId] = session;
            return session;
        }

        public PairingResult CompletePairing(TrustedClientStore store, string pairingSessionId, string pairingCode, string clientName)
        {
            return CompletePairing(store, pairingSessionId, pairingCode, clientName, null);
        }

        public PairingResult CompletePairing(TrustedClientStore store, string pairingSessionId, string pairingCode, string clientName, string extensionOrigin)
        {
            if (store == null) throw new ArgumentNullException("store");

            PairingSession session;
            if (string.IsNullOrWhiteSpace(pairingSessionId) || !m_sessions.TryGetValue(pairingSessionId, out session))
                return PairingResult.Fail("pairing_session_not_found", "Pairing session was not found.");

            if (m_nowProvider() - session.CreatedUtcMs > MaxPairingSessionAgeMs)
            {
                m_sessions.Remove(pairingSessionId);
                return PairingResult.Fail("pairing_session_expired", "Pairing session has expired.");
            }

            if (!string.Equals(session.PairingCode, pairingCode, StringComparison.Ordinal))
            {
                session.InvalidAttempts += 1;
                if (session.InvalidAttempts >= MaxInvalidPairingAttempts)
                {
                    m_sessions.Remove(pairingSessionId);
                    return PairingResult.Fail("too_many_pairing_attempts", "Pairing session had too many invalid attempts.");
                }

                return PairingResult.Fail("invalid_pairing_code", "Pairing code is invalid.");
            }

            string normalizedExtensionOrigin = NormalizeExtensionOrigin(extensionOrigin);
            if (!string.IsNullOrWhiteSpace(session.ExtensionOrigin) &&
                !string.Equals(session.ExtensionOrigin, normalizedExtensionOrigin, StringComparison.OrdinalIgnoreCase))
            {
                return PairingResult.Fail("origin_mismatch", "Pairing completion origin does not match the browser that started pairing.");
            }

            TrustedClient client = new TrustedClient
            {
                ClientId = Guid.NewGuid().ToString("N"),
                ClientName = NormalizeClientName(clientName),
                SharedSecret = m_secretGenerator.CreateSecret(),
                ExtensionOrigin = normalizedExtensionOrigin,
                Permissions = TrustedClientPermissions.Default(),
                CreatedUtcMs = m_nowProvider()
            };

            store.AddOrUpdate(client);
            m_sessions.Remove(pairingSessionId);

            return PairingResult.Ok(client);
        }

        public bool CancelPairing(string pairingSessionId)
        {
            if (string.IsNullOrWhiteSpace(pairingSessionId)) return false;
            return m_sessions.Remove(pairingSessionId);
        }

        private static string NormalizeClientName(string clientName)
        {
            return string.IsNullOrWhiteSpace(clientName) ? "Browser" : clientName.Trim();
        }

        private static string NormalizeExtensionOrigin(string extensionOrigin)
        {
            if (string.IsNullOrWhiteSpace(extensionOrigin)) return string.Empty;
            string trimmed = extensionOrigin.Trim();
            return ProtocolValidator.IsAllowedExtensionOrigin(trimmed) ? trimmed : string.Empty;
        }

        private void CancelExistingSessionsForClient(string clientName)
        {
            List<string> sessionIds = new List<string>();
            foreach (KeyValuePair<string, PairingSession> item in m_sessions)
            {
                if (string.Equals(item.Value.ClientName, clientName, StringComparison.OrdinalIgnoreCase))
                {
                    sessionIds.Add(item.Key);
                }
            }

            foreach (string sessionId in sessionIds)
            {
                m_sessions.Remove(sessionId);
            }
        }
    }

    internal sealed class PairingSession
    {
        public string PairingSessionId { get; set; }
        public string PairingCode { get; set; }
        public string ClientName { get; set; }
        public string ExtensionOrigin { get; set; }
        public long CreatedUtcMs { get; set; }
        public int InvalidAttempts { get; set; }
    }

    internal sealed class PairingResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public TrustedClient Client { get; set; }

        public static PairingResult Ok(TrustedClient client)
        {
            return new PairingResult { Success = true, Client = client };
        }

        public static PairingResult Fail(string errorCode, string error)
        {
            return new PairingResult { Success = false, ErrorCode = errorCode, Error = error };
        }
    }

    internal interface ISecretGenerator
    {
        string CreatePairingCode();
        string CreateSecret();
    }

    internal sealed class CryptoSecretGenerator : ISecretGenerator
    {
        public string CreatePairingCode()
        {
            byte[] bytes = new byte[4];
            using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }

            int value = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1000000;
            return value.ToString("D6");
        }

        public string CreateSecret()
        {
            byte[] bytes = new byte[32];
            using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }

            return Convert.ToBase64String(bytes);
        }
    }
}
