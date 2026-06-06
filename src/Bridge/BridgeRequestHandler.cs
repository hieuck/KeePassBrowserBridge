using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using KeePassLib;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class BridgeRequestHandler
    {
        private readonly PairingService m_pairingService;
        private readonly TrustedClientStore m_trustedClients;
        private readonly CredentialQueryService m_credentialQueryService;
        private readonly CredentialMutationService m_credentialMutationService;
        private readonly PasskeyService m_passkeyService;
        private readonly PasskeyCredentialLookupService m_passkeyCredentialLookupService;
        private readonly PasskeyPendingSessionStore m_passkeyPendingSessionStore;
        private readonly Func<PwDatabase> m_databaseProvider;
        private readonly Func<bool> m_passkeysEnabled;
        private readonly Func<PasskeyApprovalRequest, PasskeyApprovalResult> m_passkeyApproval;
        private readonly Action<PairingSession> m_pairingSessionCreated;
        private readonly Action<PwDatabase> m_databaseChanged;
        private readonly Dictionary<string, long> m_seenAuthenticatedRequests = new Dictionary<string, long>(StringComparer.Ordinal);
        private readonly object m_seenAuthenticatedRequestsLock = new object();

        public BridgeRequestHandler(
            PairingService pairingService,
            TrustedClientStore trustedClients,
            CredentialQueryService credentialQueryService,
            CredentialMutationService credentialMutationService,
            Func<PwDatabase> databaseProvider,
            Action<PairingSession> pairingSessionCreated,
            Action<PwDatabase> databaseChanged,
            Func<PasskeyApprovalRequest, PasskeyApprovalResult> passkeyApproval = null)
            : this(pairingService, trustedClients, credentialQueryService, credentialMutationService,
                new PasskeyService(), new PasskeyCredentialLookupService(), new PasskeyPendingSessionStore(),
                databaseProvider, delegate { return BridgeSettings.PasskeysEnabled; },
                pairingSessionCreated, databaseChanged, passkeyApproval)
        {
        }

        internal BridgeRequestHandler(
            PairingService pairingService,
            TrustedClientStore trustedClients,
            CredentialQueryService credentialQueryService,
            CredentialMutationService credentialMutationService,
            PasskeyService passkeyService,
            PasskeyCredentialLookupService passkeyCredentialLookupService,
            PasskeyPendingSessionStore passkeyPendingSessionStore,
            Func<PwDatabase> databaseProvider,
            Func<bool> passkeysEnabled,
            Action<PairingSession> pairingSessionCreated,
            Action<PwDatabase> databaseChanged,
            Func<PasskeyApprovalRequest, PasskeyApprovalResult> passkeyApproval = null)
        {
            if (pairingService == null) throw new ArgumentNullException("pairingService");
            if (trustedClients == null) throw new ArgumentNullException("trustedClients");
            if (credentialQueryService == null) throw new ArgumentNullException("credentialQueryService");
            if (credentialMutationService == null) throw new ArgumentNullException("credentialMutationService");
            if (passkeyService == null) throw new ArgumentNullException("passkeyService");
            if (passkeyCredentialLookupService == null) throw new ArgumentNullException("passkeyCredentialLookupService");
            if (passkeyPendingSessionStore == null) throw new ArgumentNullException("passkeyPendingSessionStore");

            m_pairingService = pairingService;
            m_trustedClients = trustedClients;
            m_credentialQueryService = credentialQueryService;
            m_credentialMutationService = credentialMutationService;
            m_passkeyService = passkeyService;
            m_passkeyCredentialLookupService = passkeyCredentialLookupService;
            m_passkeyPendingSessionStore = passkeyPendingSessionStore;
            m_databaseProvider = databaseProvider ?? delegate { return null; };
            m_passkeysEnabled = passkeysEnabled ?? delegate { return false; };
            m_passkeyApproval = passkeyApproval ?? DefaultPasskeyApproval;
            m_pairingSessionCreated = pairingSessionCreated ?? delegate(PairingSession session) { };
            m_databaseChanged = databaseChanged ?? delegate(PwDatabase database) { };
        }

        public BridgeResponse Handle(BridgeRequest request)
        {
            long nowUtcMs = BridgeClock.UtcNowMilliseconds();
            ProtocolValidationResult validation = ProtocolValidator.Validate(request, nowUtcMs);
            if (!validation.IsValid)
                return Error(request, validation.ErrorCode, validation.Error);

            if (BridgeMethodPolicy.RequiresAuthentication(request.Method) && !VerifyAuthentication(request))
                return Error(request, "invalid_authentication", "Request authentication is invalid.");

            if (BridgeMethodPolicy.RequiresAuthentication(request.Method) && !TrackAuthenticatedRequest(request, nowUtcMs))
                return Error(request, "replayed_request", "Request ID has already been used.");

            if (BridgeMethodPolicy.RequiresAuthentication(request.Method) && !HasPermission(request))
                return Error(request, "permission_denied", "Trusted browser is not allowed to perform this action.");

            if (BridgeMethodPolicy.RequiresAuthentication(request.Method))
                m_trustedClients.TouchLastUsed(request.ClientId, nowUtcMs);

            try
            {
                if (request.Method == BridgeMethods.Hello) return Hello(request);
                if (request.Method == BridgeMethods.PairBegin) return PairBegin(request);
                if (request.Method == BridgeMethods.PairComplete) return PairComplete(request);
                if (request.Method == BridgeMethods.PairCancel) return PairCancel(request);
                if (request.Method == BridgeMethods.ClientStatus) return ClientStatus(request);
                if (request.Method == BridgeMethods.ClientsList) return ClientsList(request);
                if (request.Method == BridgeMethods.ClientsRevoke) return ClientsRevoke(request);
                if (request.Method == BridgeMethods.ClientsUpdatePermissions) return ClientsUpdatePermissions(request);
                if (request.Method == BridgeMethods.LoginsQuery) return LoginsQuery(request);
                if (request.Method == BridgeMethods.LoginsCreate) return LoginsCreate(request);
                if (request.Method == BridgeMethods.LoginsUpdate) return LoginsUpdate(request);
                if (request.Method == BridgeMethods.LoginsFillAck) return LoginsFillAck(request);
                if (BridgeMethodPolicy.IsPasskeyMethod(request.Method)) return Passkeys(request);
            }
            catch (SerializationException)
            {
                return Error(request, "invalid_payload", "Request payload is not valid JSON for this method.");
            }

            return Error(request, "unknown_method", "Unknown method.");
        }

        internal int ClearPendingPasskeySessions()
        {
            return m_passkeyPendingSessionStore.ClearAll();
        }

        private BridgeResponse Hello(BridgeRequest request)
        {
            bool passkeysEnabled = m_passkeysEnabled();
            return Success(request, BridgeJsonSerializer.Serialize(new HelloResponsePayload
            {
                ProductName = BridgeSettings.ProductName,
                ProtocolVersion = ProtocolValidator.ProtocolVersion,
                PluginVersion = BridgeSettings.PluginVersion,
                PluginUpdateUrl = BridgeSettings.UpdateInfoUrl,
                SupportedMethods = BridgeMethodPolicy.AllMethods(),
                Features = new BridgeFeatureInfo[]
                {
                    new BridgeFeatureInfo { Name = "passwords", Enabled = true, Status = "available" },
                    new BridgeFeatureInfo { Name = "totp", Enabled = true, Status = "available" },
                    new BridgeFeatureInfo { Name = "customFields", Enabled = true, Status = "available" },
                    new BridgeFeatureInfo { Name = "saveUpdate", Enabled = true, Status = "available" },
                    new BridgeFeatureInfo { Name = "httpAuth", Enabled = true, Status = "available" },
                    new BridgeFeatureInfo
                    {
                        Name = "passkeys",
                        Enabled = passkeysEnabled,
                        Status = passkeysEnabled ? "enabled" : "prototype_disabled",
                        Reason = passkeysEnabled
                            ? string.Empty
                            : "Backend prototype exists, but browser-facing WebAuthn is disabled pending protocol and browser review."
                    }
                }
            }));
        }

        private BridgeResponse PairBegin(BridgeRequest request)
        {
            PairBeginPayload payload = BridgeJsonSerializer.Deserialize<PairBeginPayload>(request.Payload);
            PairingSession session = m_pairingService.BeginPairing(payload.ClientName, request.Origin);
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
                payload.PairingSessionId, payload.PairingCode, payload.ClientName, request.Origin);

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
            TrustedClient client = m_trustedClients.Get(request.ClientId);
            return Success(request, BridgeJsonSerializer.Serialize(new ClientStatusResponsePayload
            {
                Trusted = client != null,
                Permissions = client == null ? new string[0] : TrustedClientPermissions.Normalize(client.Permissions)
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
                    ExtensionOrigin = client.ExtensionOrigin,
                    CreatedUtcMs = client.CreatedUtcMs,
                    LastUsedUtcMs = client.LastUsedUtcMs,
                    Permissions = TrustedClientPermissions.Normalize(client.Permissions),
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
            if (revoked) m_passkeyPendingSessionStore.ClearForClient(clientId);
            return Success(request, BridgeJsonSerializer.Serialize(new ClientRevokeResponsePayload
            {
                ClientId = clientId,
                Revoked = revoked
            }));
        }

        private BridgeResponse ClientsUpdatePermissions(BridgeRequest request)
        {
            ClientPermissionsUpdatePayload payload = BridgeJsonSerializer.Deserialize<ClientPermissionsUpdatePayload>(request.Payload);
            string clientId = payload == null ? null : payload.ClientId;
            string[] permissions = payload == null ? null : payload.Permissions;
            bool updated = m_trustedClients.UpdatePermissions(clientId, permissions);
            TrustedClient client = m_trustedClients.Get(clientId);
            return Success(request, BridgeJsonSerializer.Serialize(new ClientPermissionsUpdateResponsePayload
            {
                ClientId = clientId,
                Updated = updated,
                Permissions = client == null ? new string[0] : TrustedClientPermissions.Normalize(client.Permissions)
            }));
        }

        private BridgeResponse LoginsQuery(BridgeRequest request)
        {
            LoginsQueryPayload payload = BridgeJsonSerializer.Deserialize<LoginsQueryPayload>(request.Payload);
            CredentialQueryResult result = m_credentialQueryService.Query(m_databaseProvider(), payload == null ? null : payload.Url, new CredentialQueryOptions
            {
                StrictUrlMatching = payload == null || payload.StrictUrlMatching.GetValueOrDefault(true),
                RegexUrlMatching = payload != null && payload.RegexUrlMatching.GetValueOrDefault(false)
            });
            return Success(request, BridgeJsonSerializer.Serialize(result));
        }

        private BridgeResponse LoginsCreate(BridgeRequest request)
        {
            CreateLoginPayload payload = BridgeJsonSerializer.Deserialize<CreateLoginPayload>(request.Payload);
            PwDatabase database = m_databaseProvider();
            CredentialMutationResult result = m_credentialMutationService.Create(database, payload);
            if (result.Success) m_databaseChanged(database);
            return Success(request, BridgeJsonSerializer.Serialize(result));
        }

        private BridgeResponse LoginsUpdate(BridgeRequest request)
        {
            UpdateLoginPayload payload = BridgeJsonSerializer.Deserialize<UpdateLoginPayload>(request.Payload);
            PwDatabase database = m_databaseProvider();
            CredentialMutationResult result = m_credentialMutationService.Update(database, payload);
            if (result.Success) m_databaseChanged(database);
            return Success(request, BridgeJsonSerializer.Serialize(result));
        }

        private BridgeResponse LoginsFillAck(BridgeRequest request)
        {
            FillAckPayload payload = BridgeJsonSerializer.Deserialize<FillAckPayload>(request.Payload);
            PwDatabase database = m_databaseProvider();
            CredentialMutationResult result = m_credentialMutationService.AcknowledgeFill(database, payload);
            if (result.Success) m_databaseChanged(database);
            return Success(request, BridgeJsonSerializer.Serialize(result));
        }

        private BridgeResponse Passkeys(BridgeRequest request)
        {
            if (!m_passkeysEnabled())
                return Error(request, "feature_disabled", "Passkey/WebAuthn bridge methods are not enabled in this build.");

            if (request.Method == BridgeMethods.PasskeysCreateBegin) return PasskeysCreateBegin(request);
            if (request.Method == BridgeMethods.PasskeysCreateComplete) return PasskeysCreateComplete(request);
            if (request.Method == BridgeMethods.PasskeysGetBegin) return PasskeysGetBegin(request);
            if (request.Method == BridgeMethods.PasskeysGetComplete) return PasskeysGetComplete(request);
            if (request.Method == BridgeMethods.PasskeysList) return PasskeysList(request);
            if (request.Method == BridgeMethods.PasskeysCancel) return PasskeysCancel(request);
            if (request.Method == BridgeMethods.PasskeysRevoke) return PasskeysRevoke(request);

            return Error(request, "not_implemented", "Passkey/WebAuthn bridge methods are not implemented.");
        }

        private BridgeResponse PasskeysCreateBegin(BridgeRequest request)
        {
            PasskeyCreateBeginPayload payload = BridgeJsonSerializer.Deserialize<PasskeyCreateBeginPayload>(request.Payload);
            PasskeyPendingSessionResult result = m_passkeyPendingSessionStore.BeginCreate(request.ClientId, request.Origin,
                request.RequestId, payload, BridgeClock.UtcNowMilliseconds());

            if (!result.Success) return Error(request, result.ErrorCode, result.Error);

            BridgeResponse excludedCredentialError = RejectExcludedCreateCredential(request, payload, result.Session);
            if (excludedCredentialError != null) return excludedCredentialError;

            PasskeyApprovalResult approval = RequestPasskeyApproval(result.Session, null);
            if (!approval.Approved)
            {
                m_passkeyPendingSessionStore.Cancel(request.ClientId, result.Session.WebAuthnRequestId);
                return Error(request, approval.ErrorCode, approval.Error);
            }

            return Success(request, BridgeJsonSerializer.Serialize(new PasskeyCreateBeginResponsePayload
            {
                WebAuthnRequestId = result.Session.WebAuthnRequestId,
                RpId = result.Session.RpId,
                Origin = result.Session.Origin,
                ExpiresUtcMs = result.Session.ExpiresUtcMs,
                PendingApproval = true
            }));
        }

        private BridgeResponse RejectExcludedCreateCredential(BridgeRequest request, PasskeyCreateBeginPayload payload, PasskeyPendingSession session)
        {
            if (payload == null || payload.ExcludeCredentialIds == null || payload.ExcludeCredentialIds.Length == 0) return null;

            PasskeyCredentialLookupResult lookup = m_passkeyCredentialLookupService.List(m_databaseProvider(), new PasskeysListPayload
            {
                RpId = session.RpId,
                Origin = session.Origin,
                AllowCredentialIds = payload.ExcludeCredentialIds
            });

            if (!lookup.Success)
            {
                m_passkeyPendingSessionStore.Cancel(request.ClientId, session.WebAuthnRequestId);
                return Error(request, lookup.ErrorCode, lookup.Error);
            }

            if (lookup.Credentials.Length == 0) return null;

            m_passkeyPendingSessionStore.Cancel(request.ClientId, session.WebAuthnRequestId);
            return Error(request, "excluded_credential_exists", "Passkey registration excluded credential already exists for this RP.");
        }

        private BridgeResponse PasskeysGetBegin(BridgeRequest request)
        {
            PasskeyGetBeginPayload payload = BridgeJsonSerializer.Deserialize<PasskeyGetBeginPayload>(request.Payload);
            long nowUtcMs = BridgeClock.UtcNowMilliseconds();
            PasskeyPendingSessionResult pending = m_passkeyPendingSessionStore.BeginGet(request.ClientId, request.Origin,
                request.RequestId, payload, nowUtcMs);

            if (!pending.Success) return Error(request, pending.ErrorCode, pending.Error);

            PasskeyCredentialLookupResult lookup = m_passkeyCredentialLookupService.List(m_databaseProvider(), new PasskeysListPayload
            {
                RpId = payload.RpId,
                Origin = payload.Origin,
                AllowCredentialIds = payload.AllowCredentialIds
            });
            if (!lookup.Success)
            {
                m_passkeyPendingSessionStore.Cancel(request.ClientId, payload.WebAuthnRequestId);
                return Error(request, lookup.ErrorCode, lookup.Error);
            }

            PasskeyApprovalResult approval = RequestPasskeyApproval(pending.Session, lookup.Credentials);
            if (!approval.Approved)
            {
                m_passkeyPendingSessionStore.Cancel(request.ClientId, pending.Session.WebAuthnRequestId);
                return Error(request, approval.ErrorCode, approval.Error);
            }

            return Success(request, BridgeJsonSerializer.Serialize(new PasskeyGetBeginResponsePayload
            {
                WebAuthnRequestId = pending.Session.WebAuthnRequestId,
                RpId = pending.Session.RpId,
                Origin = pending.Session.Origin,
                ExpiresUtcMs = pending.Session.ExpiresUtcMs,
                PendingApproval = true,
                Credentials = lookup.Credentials
            }));
        }

        private BridgeResponse PasskeysCreateComplete(BridgeRequest request)
        {
            PwDatabase database = m_databaseProvider();
            if (database == null || database.RootGroup == null)
                return Error(request, "database_not_open", "KeePass database is not open.");

            PasskeyCreateCompletePayload payload = BridgeJsonSerializer.Deserialize<PasskeyCreateCompletePayload>(request.Payload);
            PasskeyPendingSessionResult pending = m_passkeyPendingSessionStore.CompleteCreate(request.ClientId,
                request.Origin, payload, BridgeClock.UtcNowMilliseconds());
            if (!pending.Success) return Error(request, pending.ErrorCode, pending.Error);

            PasskeyRegistrationResult registration = m_passkeyService.CreateCredential(new PasskeyRegistrationRequest
            {
                RpId = pending.Session.RpId,
                Origin = pending.Session.Origin,
                Challenge = pending.Session.Challenge,
                UserHandle = pending.Session.UserHandle,
                UserName = pending.Session.UserName,
                UserDisplayName = pending.Session.UserDisplayName,
                UserVerification = pending.Session.UserVerification,
                Transports = pending.Session.Transports
            });
            if (!registration.Success) return Error(request, registration.ErrorCode, registration.Error);

            PwEntry entry = new PwEntry(true, true);
            PasskeyEntryStore.Write(entry, registration.Credential);
            entry.Touch(true, false);
            database.RootGroup.AddEntry(entry, true);
            database.Modified = true;
            m_databaseChanged(database);

            return Success(request, BridgeJsonSerializer.Serialize(new PasskeyCreateCompleteResponsePayload
            {
                WebAuthnRequestId = pending.Session.WebAuthnRequestId,
                EntryId = entry.Uuid.ToHexString(),
                CredentialId = registration.Credential.CredentialId,
                RpId = registration.Credential.RpId,
                ClientDataJson = registration.ClientDataJson,
                AttestationObject = registration.AttestationObject,
                PublicKeyCose = registration.Credential.PublicKeyCose,
                ClientExtensionResults = CreateClientExtensionResults(pending.Session)
            }));
        }

        private static PasskeyClientExtensionResults CreateClientExtensionResults(PasskeyPendingSession session)
        {
            if (session == null || session.RequestedExtensions == null || !session.RequestedExtensions.CredProps)
                return null;

            return new PasskeyClientExtensionResults
            {
                CredProps = new PasskeyCredPropsExtensionResult { Rk = true }
            };
        }

        private PasskeyApprovalResult RequestPasskeyApproval(PasskeyPendingSession session, PasskeyCredentialSummary[] credentials)
        {
            PasskeyApprovalResult result = m_passkeyApproval(new PasskeyApprovalRequest
            {
                Operation = session.Operation,
                ClientId = session.ClientId,
                ExtensionOrigin = session.ExtensionOrigin,
                WebAuthnRequestId = session.WebAuthnRequestId,
                RpId = session.RpId,
                Origin = session.Origin,
                UserName = session.UserName,
                UserDisplayName = session.UserDisplayName,
                Credentials = credentials ?? new PasskeyCredentialSummary[0]
            });

            if (result == null)
                return PasskeyApprovalResult.Deny("approval_denied", "Passkey request was denied.");
            if (!result.Approved && string.IsNullOrWhiteSpace(result.ErrorCode))
                return PasskeyApprovalResult.Deny("approval_denied", "Passkey request was denied.");
            return result;
        }

        private BridgeResponse PasskeysGetComplete(BridgeRequest request)
        {
            PwDatabase database = m_databaseProvider();
            if (database == null || database.RootGroup == null)
                return Error(request, "database_not_open", "KeePass database is not open.");

            PasskeyGetCompletePayload payload = BridgeJsonSerializer.Deserialize<PasskeyGetCompletePayload>(request.Payload);
            PasskeyPendingSessionResult pending = m_passkeyPendingSessionStore.CompleteGet(request.ClientId,
                request.Origin, payload, BridgeClock.UtcNowMilliseconds());
            if (!pending.Success) return Error(request, pending.ErrorCode, pending.Error);

            PasskeyCredentialSelectionResult selection = m_passkeyCredentialLookupService.Find(database,
                pending.Session.RpId, pending.Session.Origin, payload.CredentialId);
            if (!selection.Success) return Error(request, selection.ErrorCode, selection.Error);

            PasskeyAssertionResult assertion = m_passkeyService.CreateAssertion(selection.Credential, new PasskeyAssertionRequest
            {
                RpId = pending.Session.RpId,
                Origin = pending.Session.Origin,
                Challenge = pending.Session.Challenge,
                UserVerification = pending.Session.UserVerification
            });
            if (!assertion.Success) return Error(request, assertion.ErrorCode, assertion.Error);

            PasskeyEntryStore.Write(selection.Entry, selection.Credential);
            selection.Entry.Touch(true, false);
            database.Modified = true;
            m_databaseChanged(database);

            return Success(request, BridgeJsonSerializer.Serialize(new PasskeyGetCompleteResponsePayload
            {
                WebAuthnRequestId = pending.Session.WebAuthnRequestId,
                EntryId = selection.Entry.Uuid.ToHexString(),
                CredentialId = assertion.Assertion.CredentialId,
                AuthenticatorData = assertion.Assertion.AuthenticatorData,
                ClientDataJson = assertion.Assertion.ClientDataJson,
                Signature = assertion.Assertion.Signature,
                UserHandle = assertion.Assertion.UserHandle,
                SignCount = assertion.Assertion.SignCount
            }));
        }

        private BridgeResponse PasskeysList(BridgeRequest request)
        {
            PasskeysListPayload payload = BridgeJsonSerializer.Deserialize<PasskeysListPayload>(request.Payload);
            PasskeyCredentialLookupResult result = m_passkeyCredentialLookupService.List(m_databaseProvider(), payload);
            if (!result.Success) return Error(request, result.ErrorCode, result.Error);
            return Success(request, BridgeJsonSerializer.Serialize(result));
        }

        private BridgeResponse PasskeysCancel(BridgeRequest request)
        {
            PasskeyCancelPayload payload = BridgeJsonSerializer.Deserialize<PasskeyCancelPayload>(request.Payload);
            string webAuthnRequestId = payload == null ? null : payload.WebAuthnRequestId;
            bool cancelled = m_passkeyPendingSessionStore.Cancel(request.ClientId, webAuthnRequestId);

            return Success(request, BridgeJsonSerializer.Serialize(new PasskeyCancelResponsePayload
            {
                WebAuthnRequestId = webAuthnRequestId,
                Cancelled = cancelled
            }));
        }

        private BridgeResponse PasskeysRevoke(BridgeRequest request)
        {
            PwDatabase database = m_databaseProvider();
            if (database == null || database.RootGroup == null)
                return Error(request, "database_not_open", "KeePass database is not open.");

            PasskeyRevokePayload payload = BridgeJsonSerializer.Deserialize<PasskeyRevokePayload>(request.Payload);
            PasskeyCredentialSelectionResult selection = m_passkeyCredentialLookupService.Find(database,
                payload == null ? null : payload.RpId,
                payload == null ? null : payload.Origin,
                payload == null ? null : payload.CredentialId);
            if (!selection.Success) return Error(request, selection.ErrorCode, selection.Error);

            selection.Group.Entries.Remove(selection.Entry);
            database.Modified = true;
            m_passkeyPendingSessionStore.ClearForClient(request.ClientId);
            m_databaseChanged(database);

            return Success(request, BridgeJsonSerializer.Serialize(new PasskeyRevokeResponsePayload
            {
                EntryId = selection.Entry.Uuid.ToHexString(),
                CredentialId = selection.Credential.CredentialId,
                RpId = selection.Credential.RpId,
                Revoked = true
            }));
        }

        private bool VerifyAuthentication(BridgeRequest request)
        {
            TrustedClient client = m_trustedClients.Get(request.ClientId);
            if (client == null) return false;
            if (!string.IsNullOrWhiteSpace(client.ExtensionOrigin) &&
                !string.Equals(client.ExtensionOrigin, request.Origin, StringComparison.OrdinalIgnoreCase))
                return false;

            return BridgeAuthentication.Verify(request, client.SharedSecret);
        }

        private bool TrackAuthenticatedRequest(BridgeRequest request, long nowUtcMs)
        {
            string key = (request.ClientId ?? string.Empty) + "\n" + request.RequestId;
            lock (m_seenAuthenticatedRequestsLock)
            {
                PruneSeenAuthenticatedRequests(nowUtcMs);
                if (m_seenAuthenticatedRequests.ContainsKey(key)) return false;

                m_seenAuthenticatedRequests[key] = nowUtcMs;
                return true;
            }
        }

        private void PruneSeenAuthenticatedRequests(long nowUtcMs)
        {
            List<string> expiredKeys = null;
            foreach (KeyValuePair<string, long> item in m_seenAuthenticatedRequests)
            {
                if (nowUtcMs - item.Value <= ProtocolValidator.MaxClockSkewMs) continue;
                if (expiredKeys == null) expiredKeys = new List<string>();
                expiredKeys.Add(item.Key);
            }

            if (expiredKeys == null) return;
            foreach (string key in expiredKeys)
            {
                m_seenAuthenticatedRequests.Remove(key);
            }
        }

        private bool HasPermission(BridgeRequest request)
        {
            TrustedClient client = m_trustedClients.Get(request.ClientId);
            if (client == null) return false;

            string required = BridgeMethodPolicy.RequiredPermission(request.Method);
            return string.IsNullOrEmpty(required) || TrustedClientPermissions.Has(client, required);
        }

        private static PasskeyApprovalResult DefaultPasskeyApproval(PasskeyApprovalRequest request)
        {
            return PasskeyApprovalResult.Deny("approval_unavailable", "Passkey approval UI is not available.");
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
