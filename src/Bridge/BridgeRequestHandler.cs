using System;
using KeePassLib;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class BridgeRequestHandler
    {
        private readonly PairingService m_pairingService;
        private readonly TrustedClientStore m_trustedClients;
        private readonly CredentialQueryService m_credentialQueryService;
        private readonly CredentialMutationService m_credentialMutationService;
        private readonly Func<PwDatabase> m_databaseProvider;
        private readonly Action<PairingSession> m_pairingSessionCreated;

        public BridgeRequestHandler(
            PairingService pairingService,
            TrustedClientStore trustedClients,
            CredentialQueryService credentialQueryService,
            CredentialMutationService credentialMutationService,
            Func<PwDatabase> databaseProvider,
            Action<PairingSession> pairingSessionCreated)
        {
            if (pairingService == null) throw new ArgumentNullException("pairingService");
            if (trustedClients == null) throw new ArgumentNullException("trustedClients");
            if (credentialQueryService == null) throw new ArgumentNullException("credentialQueryService");
            if (credentialMutationService == null) throw new ArgumentNullException("credentialMutationService");

            m_pairingService = pairingService;
            m_trustedClients = trustedClients;
            m_credentialQueryService = credentialQueryService;
            m_credentialMutationService = credentialMutationService;
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
            if (request.Method == BridgeMethods.PairCancel) return PairCancel(request);
            if (request.Method == BridgeMethods.ClientStatus) return ClientStatus(request);
            if (request.Method == BridgeMethods.ClientsList) return ClientsList(request);
            if (request.Method == BridgeMethods.ClientsRevoke) return ClientsRevoke(request);
            if (request.Method == BridgeMethods.LoginsQuery) return LoginsQuery(request);
            if (request.Method == BridgeMethods.LoginsCreate) return LoginsCreate(request);
            if (request.Method == BridgeMethods.LoginsUpdate) return LoginsUpdate(request);
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

        private BridgeResponse PairCancel(BridgeRequest request)
        {
            PairCancelPayload payload = BridgeJsonSerializer.Deserialize<PairCancelPayload>(request.Payload);
            string pairingSessionId = payload == null ? null : payload.PairingSessionId;
            bool cancelled = m_pairingService.CancelPairing(pairingSessionId);

            return Success(request, BridgeJsonSerializer.Serialize(new PairCancelResponsePayload
            {
                PairingSessionId = pairingSessionId,
                Cancelled = cancelled
            }));
        }

        private BridgeResponse ClientStatus(BridgeRequest request)
        {
            return Success(request, BridgeJsonSerializer.Serialize(new ClientStatusResponsePayload
            {
                Trusted = m_trustedClients.IsTrusted(request.ClientId)
            }));
        }

        private BridgeResponse ClientsList(BridgeRequest request)
        {
            TrustedClient[] clients = m_trustedClients.ListClients();
            ClientInfo[] infos = new ClientInfo[clients.Length];
            for (int i = 0; i < clients.Length; ++i)
            {
                TrustedClient client = clients[i];
                infos[i] = new ClientInfo
                {
                    ClientId = client.ClientId,
                    ClientName = client.ClientName,
                    CreatedUtcMs = client.CreatedUtcMs,
                    Trusted = true,
                    Current = string.Equals(client.ClientId, request.ClientId, StringComparison.Ordinal)
                };
            }

            return Success(request, BridgeJsonSerializer.Serialize(new ClientsListResponsePayload
            {
                Clients = infos
            }));
        }

        private BridgeResponse ClientsRevoke(BridgeRequest request)
        {
            ClientRevokePayload payload = BridgeJsonSerializer.Deserialize<ClientRevokePayload>(request.Payload);
            string clientId = payload == null ? null : payload.ClientId;
            bool revoked = m_trustedClients.Revoke(clientId);
            return Success(request, BridgeJsonSerializer.Serialize(new ClientRevokeResponsePayload
            {
                ClientId = clientId,
                Revoked = revoked
            }));
        }

        private BridgeResponse LoginsQuery(BridgeRequest request)
        {
            LoginsQueryPayload payload = BridgeJsonSerializer.Deserialize<LoginsQueryPayload>(request.Payload);
            CredentialQueryResult result = m_credentialQueryService.Query(m_databaseProvider(), payload.Url);
            return Success(request, BridgeJsonSerializer.Serialize(result));
        }

        private BridgeResponse LoginsCreate(BridgeRequest request)
        {
            CreateLoginPayload payload = BridgeJsonSerializer.Deserialize<CreateLoginPayload>(request.Payload);
            CredentialMutationResult result = m_credentialMutationService.Create(m_databaseProvider(), payload);
            return Success(request, BridgeJsonSerializer.Serialize(result));
        }

        private BridgeResponse LoginsUpdate(BridgeRequest request)
        {
            UpdateLoginPayload payload = BridgeJsonSerializer.Deserialize<UpdateLoginPayload>(request.Payload);
            CredentialMutationResult result = m_credentialMutationService.Update(m_databaseProvider(), payload);
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
                method != BridgeMethods.PairComplete &&
                method != BridgeMethods.PairCancel;
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
