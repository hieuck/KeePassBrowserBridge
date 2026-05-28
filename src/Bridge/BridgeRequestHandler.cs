using System;
using KeePassLib;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class BridgeRequestHandler
    {
        private readonly PairingService m_pairingService;
        private readonly TrustedClientStore m_trustedClients;
        private readonly CredentialQueryService m_credentialQueryService;
        private readonly Func<PwDatabase> m_databaseProvider;
        private readonly Action<PairingSession> m_pairingSessionCreated;

        public BridgeRequestHandler(
            PairingService pairingService,
            TrustedClientStore trustedClients,
            CredentialQueryService credentialQueryService,
            Func<PwDatabase> databaseProvider,
            Action<PairingSession> pairingSessionCreated)
        {
            if (pairingService == null) throw new ArgumentNullException("pairingService");
            if (trustedClients == null) throw new ArgumentNullException("trustedClients");
            if (credentialQueryService == null) throw new ArgumentNullException("credentialQueryService");

            m_pairingService = pairingService;
            m_trustedClients = trustedClients;
            m_credentialQueryService = credentialQueryService;
            m_databaseProvider = databaseProvider ?? delegate { return null; };
            m_pairingSessionCreated = pairingSessionCreated ?? delegate(PairingSession session) { };
        }

        public BridgeResponse Handle(BridgeRequest request)
        {
            ProtocolValidationResult validation = ProtocolValidator.Validate(request, BridgeClock.UtcNowMilliseconds());
            if (!validation.IsValid)
                return Error(request, validation.ErrorCode, validation.Error);

            if (RequiresAuthentication(request.Method) && !VerifyAuthentication(request))
                return Error(request, "invalid_authentication", "Request authentication is invalid.");

            if (request.Method == BridgeMethods.Hello) return Hello(request);
            if (request.Method == BridgeMethods.PairBegin) return PairBegin(request);
            if (request.Method == BridgeMethods.PairComplete) return PairComplete(request);
            if (request.Method == BridgeMethods.ClientStatus) return ClientStatus(request);
            if (request.Method == BridgeMethods.LoginsQuery) return LoginsQuery(request);
            if (request.Method == BridgeMethods.LoginsFillAck) return Success(request, "{}");

            return Error(request, "unknown_method", "Unknown method.");
        }

        private BridgeResponse Hello(BridgeRequest request)
        {
            return Success(request, BridgeJsonSerializer.Serialize(new HelloResponsePayload
            {
                ProductName = BridgeSettings.ProductName,
                ProtocolVersion = ProtocolValidator.ProtocolVersion
            }));
        }

        private BridgeResponse PairBegin(BridgeRequest request)
        {
            PairBeginPayload payload = BridgeJsonSerializer.Deserialize<PairBeginPayload>(request.Payload);
            PairingSession session = m_pairingService.BeginPairing(payload.ClientName);
            m_pairingSessionCreated(session);

            return Success(request, BridgeJsonSerializer.Serialize(new PairBeginResponsePayload
            {
                PairingSessionId = session.PairingSessionId
            }));
        }

        private BridgeResponse PairComplete(BridgeRequest request)
        {
            PairCompletePayload payload = BridgeJsonSerializer.Deserialize<PairCompletePayload>(request.Payload);
            PairingResult result = m_pairingService.CompletePairing(m_trustedClients,
                payload.PairingSessionId, payload.PairingCode, payload.ClientName);

            if (!result.Success) return Error(request, result.ErrorCode, result.Error);

            return Success(request, BridgeJsonSerializer.Serialize(new PairCompleteResponsePayload
            {
                ClientId = result.Client.ClientId,
                ClientName = result.Client.ClientName,
                SharedSecret = result.Client.SharedSecret
            }));
        }

        private BridgeResponse ClientStatus(BridgeRequest request)
        {
            return Success(request, BridgeJsonSerializer.Serialize(new ClientStatusResponsePayload
            {
                Trusted = m_trustedClients.IsTrusted(request.ClientId)
            }));
        }

        private BridgeResponse LoginsQuery(BridgeRequest request)
        {
            LoginsQueryPayload payload = BridgeJsonSerializer.Deserialize<LoginsQueryPayload>(request.Payload);
            CredentialQueryResult result = m_credentialQueryService.Query(m_databaseProvider(), payload.Url);
            return Success(request, BridgeJsonSerializer.Serialize(result));
        }

        private bool VerifyAuthentication(BridgeRequest request)
        {
            TrustedClient client = m_trustedClients.Get(request.ClientId);
            return client != null && BridgeAuthentication.Verify(request, client.SharedSecret);
        }

        private static bool RequiresAuthentication(string method)
        {
            return method != BridgeMethods.Hello &&
                method != BridgeMethods.PairBegin &&
                method != BridgeMethods.PairComplete;
        }

        private static BridgeResponse Success(BridgeRequest request, string payload)
        {
            return new BridgeResponse
            {
                ProtocolVersion = ProtocolValidator.ProtocolVersion,
                RequestId = request.RequestId,
                Success = true,
                Payload = payload
            };
        }

        private static BridgeResponse Error(BridgeRequest request, string errorCode, string error)
        {
            return new BridgeResponse
            {
                ProtocolVersion = ProtocolValidator.ProtocolVersion,
                RequestId = request == null ? null : request.RequestId,
                Success = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }
}
