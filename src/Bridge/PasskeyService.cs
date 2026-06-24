using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Runtime.Serialization;
#if NET8_0_OR_GREATER
using System.Runtime.Versioning;
#endif
using System.Security.Cryptography;
using System.Text;
using KeePassLib;
using KeePassLib.Security;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class PasskeyService
    {
        internal const string UnsupportedUserVerificationErrorCode = "unsupported_user_verification";
        internal const string UnsupportedUserVerificationError = "Passkey user verification is not supported by this build.";
        internal const string UnsupportedCredentialAlgorithmErrorCode = "unsupported_algorithm";
        internal const string UnsupportedCredentialAlgorithmError = "Passkey ES256 public-key credential algorithm is not allowed by this request.";
        internal const string UnsupportedAttestationErrorCode = "unsupported_attestation";
        internal const string UnsupportedAttestationError = "Passkey attestation conveyance is not supported by this build.";
        internal const string UnsupportedAuthenticatorAttachmentErrorCode = "unsupported_authenticator_attachment";
        internal const string UnsupportedAuthenticatorAttachmentError = "Passkey authenticator attachment is not supported by this build.";
        internal const string CrossPlatformAuthenticatorAttachment = "cross-platform";
        internal const string UnsupportedResidentKeyErrorCode = "unsupported_resident_key";
        internal const string UnsupportedResidentKeyError = "Passkey resident-key requirement is not supported by this build.";
        internal const string UnsupportedExtensionErrorCode = "unsupported_extension";
        internal const string UnsupportedExtensionError = "Passkey requested WebAuthn extension is not supported by this build.";

        public PasskeyRegistrationResult CreateCredential(PasskeyRegistrationRequest request)
        {
            PasskeyValidationResult validation = ValidateRegistrationRequest(request);
            if (!validation.Success) return PasskeyRegistrationResult.Fail(validation.ErrorCode, validation.Error);

            byte[] challenge;
            if (!Base64Url.TryDecode(request.Challenge, out challenge) || challenge.Length < 16)
                return PasskeyRegistrationResult.Fail("invalid_challenge", "WebAuthn challenge must be base64url-encoded and at least 16 bytes.");
            string canonicalChallenge = Base64Url.Encode(challenge);
            string canonicalOrigin = PasskeyRelyingPartyValidator.NormalizeOrigin(request.Origin);

            byte[] userHandle;
            if (!Base64Url.TryDecode(request.UserHandle, out userHandle) || userHandle.Length == 0 || userHandle.Length > 64)
                return PasskeyRegistrationResult.Fail("invalid_user_handle", "WebAuthn user handle must be base64url-encoded and between 1 and 64 bytes.");

#if NET8_0_OR_GREATER
            if (!OperatingSystem.IsWindows())
                return PasskeyRegistrationResult.Fail("unsupported_platform", "Passkey prototype currently requires Windows CNG key support.");
#endif

            byte[] credentialId = RandomBytes(32);
            EccKeyBlob key = EccKeyBlob.Create();
            byte[] publicKeyCose = CoseKey.EncodeEs256PublicKey(key.PublicX, key.PublicY);
            byte[] publicKeySpki = EccKeyBlob.EncodeSubjectPublicKeyInfo(key.PublicX, key.PublicY);
            byte[] clientDataJson = WebAuthnClientDataJson.Create("webauthn.create", canonicalChallenge, canonicalOrigin);
            byte[] authenticatorData;
            byte[] attestationObject = WebAuthnAttestationObject.CreateNone(request.RpId, credentialId, publicKeyCose, out authenticatorData);

            return PasskeyRegistrationResult.Ok(new PasskeyCredentialMaterial
            {
                RpId = NormalizeRpId(request.RpId),
                Origin = canonicalOrigin,
                CredentialId = Base64Url.Encode(credentialId),
                UserHandle = Base64Url.Encode(userHandle),
                UserName = request.UserName == null ? string.Empty : request.UserName.Trim(),
                UserDisplayName = request.UserDisplayName == null ? string.Empty : request.UserDisplayName.Trim(),
                UserVerification = NormalizeUserVerification(request.UserVerification),
                ResidentKey = NormalizeResidentKeyRequirement(request.ResidentKey),
                Transports = NormalizeTransports(request.Transports),
                PublicKeyCose = Base64Url.Encode(publicKeyCose),
                PrivateKey = Base64Url.Encode(key.PrivateBlob),
                SignCount = 0
            }, Base64Url.Encode(clientDataJson), Base64Url.Encode(attestationObject),
                Base64Url.Encode(authenticatorData), Base64Url.Encode(publicKeySpki));
        }

        public PasskeyAssertionResult CreateAssertion(PasskeyCredentialMaterial credential, PasskeyAssertionRequest request)
        {
            if (credential == null)
                return PasskeyAssertionResult.Fail("missing_credential", "Passkey credential material is required.");
            if (request == null)
                return PasskeyAssertionResult.Fail("invalid_payload", "Passkey assertion request is required.");
            if (!IsKnownUserVerification(request.UserVerification))
                return PasskeyAssertionResult.Fail(UnsupportedUserVerificationErrorCode, UnsupportedUserVerificationError);
            if (IsUserVerificationRequired(request.UserVerification))
                return PasskeyAssertionResult.Fail(UnsupportedUserVerificationErrorCode, UnsupportedUserVerificationError);
            if (!string.Equals(NormalizeRpId(credential.RpId), NormalizeRpId(request.RpId), StringComparison.Ordinal))
                return PasskeyAssertionResult.Fail("rp_id_mismatch", "Passkey RP ID does not match the assertion request.");
            if (!PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin(request.RpId, request.Origin))
                return PasskeyAssertionResult.Fail("invalid_rp_id", "Passkey RP ID is not valid for the requesting origin.");

            byte[] credentialId;
            if (!Base64Url.TryDecode(credential.CredentialId, out credentialId) || credentialId.Length == 0)
                return PasskeyAssertionResult.Fail("invalid_credential_id", "Stored passkey credential ID is invalid.");

            byte[] privateKey;
            if (!Base64Url.TryDecode(credential.PrivateKey, out privateKey) || privateKey.Length == 0)
                return PasskeyAssertionResult.Fail("invalid_private_key", "Stored passkey private key material is invalid.");

            byte[] userHandle;
            if (!Base64Url.TryDecode(credential.UserHandle, out userHandle) || userHandle.Length == 0 || userHandle.Length > 64)
                return PasskeyAssertionResult.Fail("invalid_user_handle", "Stored passkey user handle is invalid.");
            string canonicalUserHandle = Base64Url.Encode(userHandle);

            byte[] challenge;
            if (!Base64Url.TryDecode(request.Challenge, out challenge) || challenge.Length < 16)
                return PasskeyAssertionResult.Fail("invalid_challenge", "WebAuthn challenge must be base64url-encoded and at least 16 bytes.");
            string canonicalChallenge = Base64Url.Encode(challenge);
            string canonicalOrigin = PasskeyRelyingPartyValidator.NormalizeOrigin(request.Origin);

#if NET8_0_OR_GREATER
            if (!OperatingSystem.IsWindows())
                return PasskeyAssertionResult.Fail("unsupported_platform", "Passkey prototype currently requires Windows CNG key support.");
#endif

            uint nextSignCount = credential.SignCount == uint.MaxValue ? uint.MaxValue : credential.SignCount + 1;
            byte[] authenticatorData = WebAuthnAuthenticatorData.CreateAssertionData(request.RpId, nextSignCount);
            byte[] clientDataJson = WebAuthnClientDataJson.Create("webauthn.get", canonicalChallenge, canonicalOrigin);
            byte[] clientDataHash = Sha256(clientDataJson);
            byte[] signedData = Combine(authenticatorData, clientDataHash);
            byte[] signatureDer = EccKeyBlob.SignDer(privateKey, signedData);

            credential.SignCount = nextSignCount;

            return PasskeyAssertionResult.Ok(new PasskeyAssertionResponse
            {
                CredentialId = Base64Url.Encode(credentialId),
                AuthenticatorData = Base64Url.Encode(authenticatorData),
                ClientDataJson = Base64Url.Encode(clientDataJson),
                Signature = Base64Url.Encode(signatureDer),
                UserHandle = canonicalUserHandle,
                SignCount = nextSignCount
            });
        }

        public bool VerifyAssertionSignature(PasskeyCredentialMaterial credential, PasskeyAssertionResponse assertion)
        {
            return VerifyAssertionSignature(credential, assertion, null);
        }

        public bool VerifyAssertionSignature(PasskeyCredentialMaterial credential, PasskeyAssertionResponse assertion, string expectedChallenge)
        {
            if (credential == null || assertion == null) return false;

            byte[] publicKeyCose;
            byte[] storedCredentialId;
            byte[] assertionCredentialId;
            byte[] storedUserHandle;
            byte[] assertionUserHandle;
            byte[] authenticatorData;
            byte[] clientDataJson;
            byte[] signatureDer;
            if (!Base64Url.TryDecode(credential.PublicKeyCose, out publicKeyCose)) return false;
            if (!Base64Url.TryDecode(credential.CredentialId, out storedCredentialId) || storedCredentialId.Length == 0) return false;
            if (!Base64Url.TryDecode(assertion.CredentialId, out assertionCredentialId) || assertionCredentialId.Length == 0) return false;
            if (!FixedTimeEquals(storedCredentialId, assertionCredentialId)) return false;
            if (!Base64Url.TryDecode(credential.UserHandle, out storedUserHandle) || storedUserHandle.Length == 0 || storedUserHandle.Length > 64) return false;
            if (!Base64Url.TryDecode(assertion.UserHandle, out assertionUserHandle) || assertionUserHandle.Length == 0 || assertionUserHandle.Length > 64) return false;
            if (!FixedTimeEquals(storedUserHandle, assertionUserHandle)) return false;
            if (!Base64Url.TryDecode(assertion.AuthenticatorData, out authenticatorData)) return false;
            if (authenticatorData.Length != WebAuthnAuthenticatorData.AssertionDataLength ||
                authenticatorData[32] != WebAuthnAuthenticatorData.UserPresentFlag ||
                assertion.SignCount != ReadUInt32BigEndian(authenticatorData, 33)) return false;
            if (!FixedTimeEquals(Slice(authenticatorData, 0, 32), WebAuthnAuthenticatorData.CreateRpIdHash(credential.RpId))) return false;
            if (!Base64Url.TryDecode(assertion.ClientDataJson, out clientDataJson)) return false;
            if (!WebAuthnClientDataJson.IsAssertionClientDataForOrigin(clientDataJson, credential.Origin, expectedChallenge)) return false;
            if (!Base64Url.TryDecode(assertion.Signature, out signatureDer)) return false;

            EccPublicKey publicKey;
            if (!CoseKey.TryDecodeEs256PublicKey(publicKeyCose, out publicKey)) return false;

#if NET8_0_OR_GREATER
            if (!OperatingSystem.IsWindows()) return false;
#endif

            byte[] signedData = Combine(authenticatorData, Sha256(clientDataJson));
            return EccKeyBlob.VerifyDer(publicKey.X, publicKey.Y, signedData, signatureDer);
        }

        private static bool FixedTimeEquals(byte[] left, byte[] right)
        {
            if (left == null || right == null) return false;

            int diff = left.Length ^ right.Length;
            int count = Math.Min(left.Length, right.Length);
            for (int i = 0; i < count; ++i)
            {
                diff |= left[i] ^ right[i];
            }

            return diff == 0;
        }

        private static uint ReadUInt32BigEndian(byte[] bytes, int offset)
        {
            if (bytes == null || offset < 0 || offset + 4 > bytes.Length) return 0;
            return ((uint)bytes[offset] << 24) |
                ((uint)bytes[offset + 1] << 16) |
                ((uint)bytes[offset + 2] << 8) |
                bytes[offset + 3];
        }

        private static byte[] Slice(byte[] bytes, int offset, int length)
        {
            byte[] slice = new byte[length];
            Buffer.BlockCopy(bytes, offset, slice, 0, length);
            return slice;
        }

        private static PasskeyValidationResult ValidateRegistrationRequest(PasskeyRegistrationRequest request)
        {
            if (request == null)
                return PasskeyValidationResult.Fail("invalid_payload", "Passkey registration request is required.");
            if (!PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin(request.RpId, request.Origin))
                return PasskeyValidationResult.Fail("invalid_rp_id", "Passkey RP ID is not valid for the requesting origin.");
            if (string.IsNullOrWhiteSpace(request.UserName))
                return PasskeyValidationResult.Fail("missing_user_name", "Passkey user name is required.");
            if (!IsKnownUserVerification(request.UserVerification))
                return PasskeyValidationResult.Fail(UnsupportedUserVerificationErrorCode, UnsupportedUserVerificationError);
            if (IsUserVerificationRequired(request.UserVerification))
                return PasskeyValidationResult.Fail(UnsupportedUserVerificationErrorCode, UnsupportedUserVerificationError);
            if (!IsKnownResidentKeyRequirement(request.ResidentKey))
                return PasskeyValidationResult.Fail(UnsupportedResidentKeyErrorCode, UnsupportedResidentKeyError);
            return PasskeyValidationResult.Ok();
        }

        private static string NormalizeRpId(string rpId)
        {
            return (rpId ?? string.Empty).Trim().TrimEnd('.').ToLowerInvariant();
        }

        internal static bool IsUserVerificationRequired(string userVerification)
        {
            return string.Equals(NormalizeUserVerification(userVerification), "required", StringComparison.Ordinal);
        }

        internal static bool IsKnownUserVerification(string userVerification)
        {
            string value = (userVerification ?? string.Empty).Trim().ToLowerInvariant();
            return value.Length == 0 || value == "required" || value == "preferred" || value == "discouraged";
        }

        internal static string NormalizeUserVerification(string userVerification)
        {
            string value = (userVerification ?? string.Empty).Trim().ToLowerInvariant();
            if (value == "required" || value == "preferred" || value == "discouraged") return value;
            return string.Empty;
        }

        internal static bool AllowsEs256CredentialAlgorithm(int[] credentialAlgorithms)
        {
            if (credentialAlgorithms == null) return false;
            for (int i = 0; i < credentialAlgorithms.Length; ++i)
            {
                if (credentialAlgorithms[i] == -7) return true;
            }
            return false;
        }

        internal static bool IsNoneAttestationConveyance(string attestation)
        {
            string value = (attestation ?? string.Empty).Trim().ToLowerInvariant();
            return value.Length == 0 || value == "none";
        }

        internal static bool IsSupportedAuthenticatorAttachment(string authenticatorAttachment)
        {
            string value = (authenticatorAttachment ?? string.Empty).Trim().ToLowerInvariant();
            return value.Length == 0 || value == CrossPlatformAuthenticatorAttachment;
        }

        internal static bool IsKnownResidentKeyRequirement(string residentKey)
        {
            string value = (residentKey ?? string.Empty).Trim().ToLowerInvariant();
            return value.Length == 0 || value == "required" || value == "preferred" || value == "discouraged";
        }

        internal static string NormalizeResidentKeyRequirement(string residentKey)
        {
            string value = (residentKey ?? string.Empty).Trim().ToLowerInvariant();
            if (value == "required" || value == "preferred" || value == "discouraged") return value;
            return string.Empty;
        }

        internal static bool HasUnsupportedRequestedExtensions(PasskeyRequestedExtensions extensions)
        {
            return extensions != null && HasUnsupportedExtensionNames(extensions.UnsupportedExtensions);
        }

        internal static bool HasUnsupportedExtensionNames(string[] extensionNames)
        {
            if (extensionNames == null) return false;
            for (int i = 0; i < extensionNames.Length; ++i)
            {
                if (!string.IsNullOrWhiteSpace(extensionNames[i])) return true;
            }
            return false;
        }

        private static string[] NormalizeTransports(string[] transports)
        {
            if (transports == null || transports.Length == 0) return new string[0];

            string[] normalized = new string[transports.Length];
            int count = 0;
            for (int i = 0; i < transports.Length; ++i)
            {
                string transport = NormalizeTransport(transports[i]);
                if (transport.Length == 0) continue;
                if (Contains(normalized, count, transport)) continue;
                normalized[count++] = transport;
            }

            if (count == normalized.Length) return normalized;

            string[] compacted = new string[count];
            Array.Copy(normalized, compacted, count);
            return compacted;
        }

        private static string NormalizeTransport(string transport)
        {
            string value = (transport ?? string.Empty).Trim().ToLowerInvariant();
            if (value.Length == 0 || value.Length > 32) return string.Empty;

            for (int i = 0; i < value.Length; ++i)
            {
                char ch = value[i];
                bool allowed = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '-';
                if (!allowed) return string.Empty;
            }

            return value;
        }

        private static bool Contains(string[] values, int count, string value)
        {
            for (int i = 0; i < count; ++i)
            {
                if (string.Equals(values[i], value, StringComparison.Ordinal)) return true;
            }
            return false;
        }

        private static byte[] RandomBytes(int length)
        {
            byte[] bytes = new byte[length];
            using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return bytes;
        }

        private static byte[] Sha256(byte[] bytes)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                return sha256.ComputeHash(bytes);
            }
        }

        private static byte[] Combine(byte[] first, byte[] second)
        {
            byte[] combined = new byte[(first == null ? 0 : first.Length) + (second == null ? 0 : second.Length)];
            if (first != null) Buffer.BlockCopy(first, 0, combined, 0, first.Length);
            if (second != null) Buffer.BlockCopy(second, 0, combined, first == null ? 0 : first.Length, second.Length);
            return combined;
        }
    }

    internal static class PasskeyRelyingPartyValidator
    {
        public static bool IsRpIdAllowedForOrigin(string rpId, string origin)
        {
            string normalizedRpId = NormalizeRpId(rpId);
            if (!IsValidRpId(normalizedRpId)) return false;

            Uri uri;
            if (!TryCreatePotentiallyTrustworthyOrigin(origin, out uri)) return false;

            string host = NormalizeRpId(uri.Host);
            if (host.Length == 0) return false;
            if (string.Equals(host, normalizedRpId, StringComparison.Ordinal)) return true;
            return host.EndsWith("." + normalizedRpId, StringComparison.Ordinal);
        }

        public static string NormalizeOrigin(string origin)
        {
            Uri uri;
            if (!TryCreatePotentiallyTrustworthyOrigin(origin, out uri)) return string.Empty;
            return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        }

        private static string NormalizeRpId(string value)
        {
            return (value ?? string.Empty).Trim().TrimEnd('.').ToLowerInvariant();
        }

        private static bool IsValidRpId(string rpId)
        {
            if (string.IsNullOrWhiteSpace(rpId) || rpId.Length > 253) return false;
            if (rpId.StartsWith(".", StringComparison.Ordinal) || rpId.Contains("..")) return false;
            if (rpId.IndexOfAny(new[] { '/', '\\', ':', '@' }) >= 0) return false;

            IPAddress ignored;
            if (IPAddress.TryParse(rpId, out ignored)) return false;

            string[] labels = rpId.Split('.');
            foreach (string label in labels)
            {
                if (label.Length == 0 || label.Length > 63) return false;
                if (label.StartsWith("-", StringComparison.Ordinal) || label.EndsWith("-", StringComparison.Ordinal)) return false;
            }

            return true;
        }

        private static bool TryCreatePotentiallyTrustworthyOrigin(string origin, out Uri uri)
        {
            uri = null;
            if (!Uri.TryCreate((origin ?? string.Empty).Trim(), UriKind.Absolute, out uri)) return false;
            return IsPotentiallyTrustworthyOrigin(uri);
        }

        private static bool IsPotentiallyTrustworthyOrigin(Uri uri)
        {
            if (uri == null) return false;
            if (string.Equals(uri.Scheme, "https", StringComparison.OrdinalIgnoreCase)) return true;

            if (string.Equals(uri.Scheme, "http", StringComparison.OrdinalIgnoreCase))
            {
                string host = NormalizeRpId(uri.Host);
                return host == "localhost";
            }

            return false;
        }
    }

    internal static class PasskeyEntryStore
    {
        public const string RpIdField = "KBB-Passkey-RpId";
        public const string CredentialIdField = "KBB-Passkey-CredentialId";
        public const string OriginField = "KBB-Passkey-Origin";
        public const string UserHandleField = "KBB-Passkey-UserHandle";
        public const string PublicKeyCoseField = "KBB-Passkey-PublicKeyCose";
        public const string PrivateKeyField = "KBB-Passkey-PrivateKey";
        public const string SignCountField = "KBB-Passkey-SignCount";
        public const string UserVerificationField = "KBB-Passkey-UserVerification";
        public const string ResidentKeyField = "KBB-Passkey-ResidentKey";
        public const string TransportsField = "KBB-Passkey-Transports";

        public static bool IsPasskeyEntry(PwEntry entry)
        {
            return entry != null &&
                entry.Strings != null &&
                !string.IsNullOrWhiteSpace(entry.Strings.ReadSafe(RpIdField)) &&
                !string.IsNullOrWhiteSpace(entry.Strings.ReadSafe(CredentialIdField));
        }

        public static void Write(PwEntry entry, PasskeyCredentialMaterial material)
        {
            if (entry == null) throw new ArgumentNullException("entry");
            if (material == null) throw new ArgumentNullException("material");

            string rpId = (material.RpId ?? string.Empty).Trim();
            string origin = PasskeyRelyingPartyValidator.NormalizeOrigin(material.Origin);
            if (origin.Length == 0 && !string.IsNullOrWhiteSpace(rpId))
            {
                origin = OriginFromRpId(rpId);
            }

            string userName = (material.UserName ?? string.Empty).Trim();
            string title = string.IsNullOrWhiteSpace(userName) ? "Passkey: " + rpId : "Passkey: " + userName + " @ " + rpId;

            entry.Strings.Set(PwDefs.TitleField, new ProtectedString(false, title));
            entry.Strings.Set(PwDefs.UserNameField, new ProtectedString(false, userName));
            entry.Strings.Set(PwDefs.UrlField, new ProtectedString(false, "https://" + rpId + "/"));
            entry.Strings.Set(RpIdField, new ProtectedString(false, rpId));
            entry.Strings.Set(CredentialIdField, new ProtectedString(false, material.CredentialId ?? string.Empty));
            entry.Strings.Set(OriginField, new ProtectedString(false, origin));
            entry.Strings.Set(UserHandleField, new ProtectedString(false, material.UserHandle ?? string.Empty));
            entry.Strings.Set(PublicKeyCoseField, new ProtectedString(false, material.PublicKeyCose ?? string.Empty));
            entry.Strings.Set(PrivateKeyField, new ProtectedString(true, material.PrivateKey ?? string.Empty));
            entry.Strings.Set(SignCountField, new ProtectedString(false, material.SignCount.ToString(System.Globalization.CultureInfo.InvariantCulture)));
            entry.Strings.Set(UserVerificationField, new ProtectedString(false, material.UserVerification ?? string.Empty));
            entry.Strings.Set(ResidentKeyField, new ProtectedString(false, material.ResidentKey ?? string.Empty));
            entry.Strings.Set(TransportsField, new ProtectedString(false, BridgeJsonSerializer.Serialize(material.Transports ?? new string[0])));
        }

        public static PasskeyCredentialMaterial Read(PwEntry entry)
        {
            if (!IsPasskeyEntry(entry)) return null;

            uint signCount = 0;
            uint.TryParse(entry.Strings.ReadSafe(SignCountField), out signCount);
            string rpId = entry.Strings.ReadSafe(RpIdField);
            string origin = PasskeyRelyingPartyValidator.NormalizeOrigin(entry.Strings.ReadSafe(OriginField));
            if (origin.Length == 0)
            {
                origin = PasskeyRelyingPartyValidator.NormalizeOrigin(entry.Strings.ReadSafe(PwDefs.UrlField));
            }

            if (origin.Length == 0 && !string.IsNullOrWhiteSpace(rpId))
            {
                origin = OriginFromRpId(rpId);
            }

            return new PasskeyCredentialMaterial
            {
                RpId = rpId,
                Origin = origin,
                CredentialId = entry.Strings.ReadSafe(CredentialIdField),
                UserHandle = entry.Strings.ReadSafe(UserHandleField),
                UserName = entry.Strings.ReadSafe(PwDefs.UserNameField),
                PublicKeyCose = entry.Strings.ReadSafe(PublicKeyCoseField),
                PrivateKey = entry.Strings.ReadSafe(PrivateKeyField),
                SignCount = signCount,
                UserVerification = entry.Strings.ReadSafe(UserVerificationField),
                ResidentKey = entry.Strings.ReadSafe(ResidentKeyField),
                Transports = ReadTransports(entry)
            };
        }

        private static string[] ReadTransports(PwEntry entry)
        {
            string value = entry.Strings.ReadSafe(TransportsField);
            if (string.IsNullOrWhiteSpace(value)) return new string[0];

            try
            {
                string[] transports = BridgeJsonSerializer.Deserialize<string[]>(value);
                return transports ?? new string[0];
            }
            catch (SerializationException)
            {
                return new string[0];
            }
        }

        private static string OriginFromRpId(string rpId)
        {
            string normalizedRpId = (rpId ?? string.Empty).Trim().TrimEnd('.').ToLowerInvariant();
            return normalizedRpId.Length == 0 ? string.Empty : "https://" + normalizedRpId;
        }
    }

    internal sealed class PasskeyCredentialLookupService
    {
        public PasskeyCredentialLookupResult List(PwDatabase database, PasskeysListPayload payload)
        {
            if (database == null || database.RootGroup == null)
                return PasskeyCredentialLookupResult.Fail("database_not_open", "KeePass database is not open.");
            if (payload == null)
                return PasskeyCredentialLookupResult.Fail("invalid_payload", "Passkey list payload is required.");
            if (!PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin(payload.RpId, payload.Origin))
                return PasskeyCredentialLookupResult.Fail("invalid_rp_id", "Passkey RP ID is not valid for the requesting origin.");

            bool hasAllowList;
            HashSet<string> allowedCredentialIds;
            if (!TryNormalizeAllowCredentialIds(payload.AllowCredentialIds, out allowedCredentialIds, out hasAllowList))
                return PasskeyCredentialLookupResult.Fail("invalid_allow_credential",
                    "Passkey allowCredentials contains an invalid credential ID.");
            List<PasskeyCredentialSummary> credentials = new List<PasskeyCredentialSummary>();
            CollectMatches(database.RootGroup, NormalizeRpId(payload.RpId), allowedCredentialIds, hasAllowList, credentials, string.Empty);

            return PasskeyCredentialLookupResult.Ok(credentials.ToArray());
        }

        public PasskeyCredentialSelectionResult Find(PwDatabase database, string rpId, string origin, string credentialId)
        {
            if (database == null || database.RootGroup == null)
                return PasskeyCredentialSelectionResult.Fail("database_not_open", "KeePass database is not open.");
            if (!PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin(rpId, origin))
                return PasskeyCredentialSelectionResult.Fail("invalid_rp_id", "Passkey RP ID is not valid for the requesting origin.");

            string normalizedCredentialId = CanonicalizeCredentialId(credentialId);
            if (normalizedCredentialId.Length == 0)
                return PasskeyCredentialSelectionResult.Fail("invalid_credential_id", "Passkey credential ID is invalid.");

            PasskeyCredentialSelectionResult result = FindMatch(database.RootGroup, NormalizeRpId(rpId), normalizedCredentialId);
            return result ?? PasskeyCredentialSelectionResult.Fail("credential_not_found", "Passkey credential was not found.");
        }

        private static void CollectMatches(
            PwGroup group,
            string rpId,
            HashSet<string> allowedCredentialIds,
            bool hasAllowList,
            List<PasskeyCredentialSummary> credentials,
            string groupPath)
        {
            if (group == null) return;

            foreach (PwEntry entry in group.Entries)
            {
                PasskeyCredentialMaterial material = PasskeyEntryStore.Read(entry);
                if (material == null) continue;

                string credentialId = CanonicalizeCredentialId(material.CredentialId);
                if (credentialId.Length == 0) continue;
                if (!string.Equals(NormalizeRpId(material.RpId), rpId, StringComparison.Ordinal)) continue;
                if (hasAllowList && !allowedCredentialIds.Contains(credentialId)) continue;

                credentials.Add(new PasskeyCredentialSummary
                {
                    EntryId = entry.Uuid.ToHexString(),
                    Title = entry.Strings.ReadSafe(PwDefs.TitleField),
                    UserName = material.UserName ?? string.Empty,
                    RpId = NormalizeRpId(material.RpId),
                    CredentialId = credentialId,
                    UserHandle = material.UserHandle ?? string.Empty,
                    UserVerification = material.UserVerification ?? string.Empty,
                    Transports = material.Transports ?? new string[0],
                    SignCount = material.SignCount,
                    Group = groupPath,
                    UsageCount = entry.UsageCount,
                    LastUsed = ToUnixTimeMilliseconds(entry.LastAccessTime)
                });
            }

            foreach (PwGroup child in group.Groups)
            {
                string childPath = JoinGroupPath(groupPath, child.Name);
                CollectMatches(child, rpId, allowedCredentialIds, hasAllowList, credentials, childPath);
            }
        }

        private static PasskeyCredentialSelectionResult FindMatch(PwGroup group, string rpId, string credentialId)
        {
            if (group == null) return null;

            foreach (PwEntry entry in group.Entries)
            {
                PasskeyCredentialMaterial material = PasskeyEntryStore.Read(entry);
                if (material == null) continue;
                if (!string.Equals(NormalizeRpId(material.RpId), rpId, StringComparison.Ordinal)) continue;
                if (!string.Equals(CanonicalizeCredentialId(material.CredentialId), credentialId, StringComparison.Ordinal)) continue;
                return PasskeyCredentialSelectionResult.Ok(group, entry, material);
            }

            foreach (PwGroup child in group.Groups)
            {
                PasskeyCredentialSelectionResult result = FindMatch(child, rpId, credentialId);
                if (result != null) return result;
            }

            return null;
        }

        private static bool TryNormalizeAllowCredentialIds(
            string[] allowCredentialIds,
            out HashSet<string> normalized,
            out bool hasAllowList)
        {
            hasAllowList = allowCredentialIds != null && allowCredentialIds.Length > 0;
            normalized = new HashSet<string>(StringComparer.Ordinal);
            if (!hasAllowList) return true;

            for (int i = 0; i < allowCredentialIds.Length; ++i)
            {
                string credentialId = CanonicalizeCredentialId(allowCredentialIds[i]);
                if (credentialId.Length == 0) return false;
                normalized.Add(credentialId);
            }

            return true;
        }

        private static string CanonicalizeCredentialId(string credentialId)
        {
            byte[] bytes;
            if (!Base64Url.TryDecode(credentialId, out bytes) || bytes.Length == 0) return string.Empty;
            return Base64Url.Encode(bytes);
        }

        private static string NormalizeRpId(string value)
        {
            return (value ?? string.Empty).Trim().TrimEnd('.').ToLowerInvariant();
        }

        private static string JoinGroupPath(string parentPath, string groupName)
        {
            string name = (groupName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name)) return parentPath ?? string.Empty;
            if (string.IsNullOrWhiteSpace(parentPath)) return name;
            return parentPath + "/" + name;
        }

        private static long ToUnixTimeMilliseconds(DateTime value)
        {
            DateTime utc = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
            DateTime epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            return (long)(utc - epoch).TotalMilliseconds;
        }
    }

    internal sealed class PasskeyPendingSessionStore
    {
        public const long MaxPendingLifetimeMs = 5 * 60 * 1000;

        private readonly Dictionary<string, PasskeyPendingSession> m_sessions =
            new Dictionary<string, PasskeyPendingSession>(StringComparer.Ordinal);

        public PasskeyPendingSessionResult BeginCreate(
            string clientId,
            string extensionOrigin,
            string bridgeRequestId,
            PasskeyCreateBeginPayload payload,
            long nowUtcMs)
        {
            return Begin(PasskeyPendingOperation.Create, clientId, extensionOrigin, bridgeRequestId, payload, nowUtcMs);
        }

        public PasskeyPendingSessionResult BeginGet(
            string clientId,
            string extensionOrigin,
            string bridgeRequestId,
            PasskeyGetBeginPayload payload,
            long nowUtcMs)
        {
            return Begin(PasskeyPendingOperation.Get, clientId, extensionOrigin, bridgeRequestId, payload, nowUtcMs);
        }

        public PasskeyPendingSessionResult CompleteCreate(
            string clientId,
            string extensionOrigin,
            PasskeyCreateCompletePayload payload,
            long nowUtcMs)
        {
            if (payload == null)
                return PasskeyPendingSessionResult.Fail("invalid_payload", "Passkey create completion payload is required.");

            return Complete(PasskeyPendingOperation.Create, clientId, extensionOrigin, payload.WebAuthnRequestId,
                payload.RpId, payload.Origin, null, nowUtcMs);
        }

        public PasskeyPendingSessionResult CompleteGet(
            string clientId,
            string extensionOrigin,
            PasskeyGetCompletePayload payload,
            long nowUtcMs)
        {
            if (payload == null)
                return PasskeyPendingSessionResult.Fail("invalid_payload", "Passkey get completion payload is required.");

            return Complete(PasskeyPendingOperation.Get, clientId, extensionOrigin, payload.WebAuthnRequestId,
                payload.RpId, payload.Origin, payload.CredentialId, nowUtcMs);
        }

        public bool Cancel(string clientId, string webAuthnRequestId)
        {
            return m_sessions.Remove(SessionKey(clientId, webAuthnRequestId));
        }

        public int ClearForClient(string clientId)
        {
            if (string.IsNullOrWhiteSpace(clientId)) return 0;

            List<string> keys = null;
            foreach (KeyValuePair<string, PasskeyPendingSession> item in m_sessions)
            {
                if (!string.Equals(item.Value.ClientId, clientId, StringComparison.Ordinal)) continue;
                if (keys == null) keys = new List<string>();
                keys.Add(item.Key);
            }

            if (keys == null) return 0;
            for (int i = 0; i < keys.Count; ++i)
            {
                m_sessions.Remove(keys[i]);
            }
            return keys.Count;
        }

        public int ClearAll()
        {
            int count = m_sessions.Count;
            m_sessions.Clear();
            return count;
        }

        public int Count
        {
            get { return m_sessions.Count; }
        }

        private PasskeyPendingSessionResult Begin(
            PasskeyPendingOperation operation,
            string clientId,
            string extensionOrigin,
            string bridgeRequestId,
            IPasskeyBeginPayload payload,
            long nowUtcMs)
        {
            if (payload == null)
                return PasskeyPendingSessionResult.Fail("invalid_payload", "Passkey begin payload is required.");

            string normalizedClientId = NormalizeRequired(clientId);
            string normalizedExtensionOrigin = NormalizeRequired(extensionOrigin);
            string normalizedBridgeRequestId = NormalizeRequired(bridgeRequestId);
            string normalizedWebAuthnRequestId = NormalizeRequired(payload.WebAuthnRequestId);
            if (normalizedClientId.Length == 0 || normalizedExtensionOrigin.Length == 0 ||
                normalizedBridgeRequestId.Length == 0 || normalizedWebAuthnRequestId.Length == 0)
                return PasskeyPendingSessionResult.Fail("invalid_binding", "Passkey request is missing required session binding data.");

            if (!PasskeyRelyingPartyValidator.IsRpIdAllowedForOrigin(payload.RpId, payload.Origin))
                return PasskeyPendingSessionResult.Fail("invalid_rp_id", "Passkey RP ID is not valid for the requesting origin.");

            string challenge = CanonicalizeChallenge(payload.Challenge);
            if (challenge.Length == 0)
                return PasskeyPendingSessionResult.Fail("invalid_challenge", "WebAuthn challenge must be base64url-encoded and at least 16 bytes.");
            if (!PasskeyService.IsKnownUserVerification(payload.UserVerification))
                return PasskeyPendingSessionResult.Fail(PasskeyService.UnsupportedUserVerificationErrorCode,
                    PasskeyService.UnsupportedUserVerificationError);
            if (PasskeyService.IsUserVerificationRequired(payload.UserVerification))
                return PasskeyPendingSessionResult.Fail(PasskeyService.UnsupportedUserVerificationErrorCode,
                    PasskeyService.UnsupportedUserVerificationError);

            long pendingLifetimeMs = NormalizePendingTimeoutMs(payload.TimeoutMs);
            PasskeyCreateBeginPayload createPayload = null;
            string canonicalUserHandle = null;
            string[] excludeCredentialIds = new string[0];
            if (operation == PasskeyPendingOperation.Create)
            {
                createPayload = payload as PasskeyCreateBeginPayload;
                if (createPayload == null || !PasskeyService.AllowsEs256CredentialAlgorithm(createPayload.CredentialAlgorithms))
                    return PasskeyPendingSessionResult.Fail(PasskeyService.UnsupportedCredentialAlgorithmErrorCode,
                        PasskeyService.UnsupportedCredentialAlgorithmError);
                if (!PasskeyService.IsNoneAttestationConveyance(createPayload.Attestation))
                    return PasskeyPendingSessionResult.Fail(PasskeyService.UnsupportedAttestationErrorCode,
                        PasskeyService.UnsupportedAttestationError);
                if (!PasskeyService.IsSupportedAuthenticatorAttachment(createPayload.AuthenticatorAttachment))
                    return PasskeyPendingSessionResult.Fail(PasskeyService.UnsupportedAuthenticatorAttachmentErrorCode,
                        PasskeyService.UnsupportedAuthenticatorAttachmentError);
                if (!PasskeyService.IsKnownResidentKeyRequirement(createPayload.ResidentKey))
                    return PasskeyPendingSessionResult.Fail(PasskeyService.UnsupportedResidentKeyErrorCode,
                        PasskeyService.UnsupportedResidentKeyError);
                if (PasskeyService.HasUnsupportedRequestedExtensions(createPayload.RequestedExtensions))
                    return PasskeyPendingSessionResult.Fail(PasskeyService.UnsupportedExtensionErrorCode,
                        PasskeyService.UnsupportedExtensionError);
                canonicalUserHandle = CanonicalizeUserHandle(createPayload.UserHandle);
                if (canonicalUserHandle.Length == 0)
                    return PasskeyPendingSessionResult.Fail("invalid_user_handle",
                        "WebAuthn user handle must be base64url-encoded and between 1 and 64 bytes.");
                if (!TryNormalizeCredentialIds(createPayload.ExcludeCredentialIds, out excludeCredentialIds))
                    return PasskeyPendingSessionResult.Fail("invalid_exclude_credential",
                        "Passkey excludeCredentials contains an invalid credential ID.");
                createPayload.ExcludeCredentialIds = excludeCredentialIds;
            }
            string[] allowCredentialIds = new string[0];
            if (operation == PasskeyPendingOperation.Get)
            {
                PasskeyGetBeginPayload getPayload = payload as PasskeyGetBeginPayload;
                if (getPayload == null)
                    return PasskeyPendingSessionResult.Fail("invalid_payload", "Passkey get begin payload is required.");
                if (PasskeyService.HasUnsupportedExtensionNames(getPayload.UnsupportedExtensions))
                    return PasskeyPendingSessionResult.Fail(PasskeyService.UnsupportedExtensionErrorCode,
                        PasskeyService.UnsupportedExtensionError);
                if (!TryNormalizeCredentialIds(getPayload.AllowCredentialIds, out allowCredentialIds))
                    return PasskeyPendingSessionResult.Fail("invalid_allow_credential",
                        "Passkey allowCredentials contains an invalid credential ID.");
            }

            string sessionKey = SessionKey(normalizedClientId, normalizedWebAuthnRequestId);
            PasskeyPendingSession existingSession;
            if (m_sessions.TryGetValue(sessionKey, out existingSession))
            {
                if (nowUtcMs <= existingSession.ExpiresUtcMs)
                    return PasskeyPendingSessionResult.Fail("pending_exists", "A pending passkey request already exists for this WebAuthn request.");
                m_sessions.Remove(sessionKey);
            }

            PasskeyPendingSession session = new PasskeyPendingSession
            {
                Operation = operation,
                ClientId = normalizedClientId,
                ExtensionOrigin = normalizedExtensionOrigin,
                BeginBridgeRequestId = normalizedBridgeRequestId,
                WebAuthnRequestId = normalizedWebAuthnRequestId,
                RpId = NormalizeRpId(payload.RpId),
                Origin = NormalizeRequired(payload.Origin),
                Challenge = challenge,
                UserVerification = NormalizeRequired(payload.UserVerification),
                Hints = NormalizeHints(payload.Hints),
                CreatedUtcMs = nowUtcMs,
                ExpiresUtcMs = nowUtcMs + pendingLifetimeMs
            };

            if (operation == PasskeyPendingOperation.Get)
            {
                session.AllowCredentialIds = allowCredentialIds;
            }
            else
            {
                if (createPayload != null)
                {
                    session.UserHandle = canonicalUserHandle;
                    session.UserName = NormalizeRequired(createPayload.UserName);
                    session.UserDisplayName = NormalizeRequired(createPayload.UserDisplayName);
                    session.ResidentKey = PasskeyService.NormalizeResidentKeyRequirement(createPayload.ResidentKey);
                    session.RequestedExtensions = NormalizeRequestedExtensions(createPayload.RequestedExtensions);
                    session.Transports = createPayload.Transports ?? new string[0];
                }
                session.AllowCredentialIds = new string[0];
            }

            m_sessions[sessionKey] = session;
            return PasskeyPendingSessionResult.Ok(session);
        }

        private PasskeyPendingSessionResult Complete(
            PasskeyPendingOperation operation,
            string clientId,
            string extensionOrigin,
            string webAuthnRequestId,
            string rpId,
            string origin,
            string credentialId,
            long nowUtcMs)
        {
            string key = SessionKey(clientId, webAuthnRequestId);
            PasskeyPendingSession session;
            if (!m_sessions.TryGetValue(key, out session))
                return PasskeyPendingSessionResult.Fail("pending_not_found", "No pending passkey request matches this completion.");

            if (nowUtcMs > session.ExpiresUtcMs)
            {
                m_sessions.Remove(key);
                return PasskeyPendingSessionResult.Fail("pending_expired", "Pending passkey request has expired.");
            }

            if (session.Operation != operation ||
                !string.Equals(session.ClientId, NormalizeRequired(clientId), StringComparison.Ordinal) ||
                !string.Equals(session.ExtensionOrigin, NormalizeRequired(extensionOrigin), StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(session.RpId, NormalizeRpId(rpId), StringComparison.Ordinal) ||
                !string.Equals(session.Origin, NormalizeRequired(origin), StringComparison.Ordinal))
            {
                return PasskeyPendingSessionResult.Fail("binding_mismatch", "Passkey completion does not match the pending request binding.");
            }

            if (operation == PasskeyPendingOperation.Get && session.AllowCredentialIds.Length > 0)
            {
                string normalizedCredentialId = CanonicalizeCredentialId(credentialId);
                if (normalizedCredentialId.Length == 0 || Array.IndexOf(session.AllowCredentialIds, normalizedCredentialId) < 0)
                    return PasskeyPendingSessionResult.Fail("credential_not_allowed", "Passkey credential ID is not allowed for this request.");
            }

            m_sessions.Remove(key);
            return PasskeyPendingSessionResult.Ok(session);
        }

        private static string SessionKey(string clientId, string webAuthnRequestId)
        {
            return NormalizeRequired(clientId) + "\n" + NormalizeRequired(webAuthnRequestId);
        }

        private static string NormalizeRequired(string value)
        {
            return (value ?? string.Empty).Trim();
        }

        private static string NormalizeRpId(string value)
        {
            return (value ?? string.Empty).Trim().TrimEnd('.').ToLowerInvariant();
        }

        private static string CanonicalizeChallenge(string challenge)
        {
            byte[] bytes;
            if (!Base64Url.TryDecode(challenge, out bytes) || bytes.Length < 16) return string.Empty;
            return Base64Url.Encode(bytes);
        }

        private static string CanonicalizeCredentialId(string credentialId)
        {
            byte[] bytes;
            if (!Base64Url.TryDecode(credentialId, out bytes) || bytes.Length == 0) return string.Empty;
            return Base64Url.Encode(bytes);
        }

        private static string CanonicalizeUserHandle(string userHandle)
        {
            byte[] bytes;
            if (!Base64Url.TryDecode(userHandle, out bytes) || bytes.Length == 0 || bytes.Length > 64) return string.Empty;
            return Base64Url.Encode(bytes);
        }

        private static long NormalizePendingTimeoutMs(long timeoutMs)
        {
            if (timeoutMs <= 0) return MaxPendingLifetimeMs;
            return timeoutMs < MaxPendingLifetimeMs ? timeoutMs : MaxPendingLifetimeMs;
        }

        private static PasskeyRequestedExtensions NormalizeRequestedExtensions(PasskeyRequestedExtensions extensions)
        {
            if (extensions == null || !extensions.CredProps) return null;
            return new PasskeyRequestedExtensions { CredProps = true };
        }

        private static string[] NormalizeHints(string[] hints)
        {
            if (hints == null || hints.Length == 0) return new string[0];

            List<string> normalized = new List<string>();
            for (int i = 0; i < hints.Length; ++i)
            {
                string hint = NormalizeRequired(hints[i]).ToLowerInvariant();
                if (hint != "security-key" && hint != "client-device" && hint != "hybrid") continue;
                if (normalized.Contains(hint)) continue;
                normalized.Add(hint);
            }
            return normalized.ToArray();
        }

        private static bool TryNormalizeCredentialIds(string[] credentialIds, out string[] normalized)
        {
            normalized = new string[0];
            if (credentialIds == null || credentialIds.Length == 0) return true;

            List<string> normalizedIds = new List<string>();
            for (int i = 0; i < credentialIds.Length; ++i)
            {
                string credentialId = CanonicalizeCredentialId(credentialIds[i]);
                if (credentialId.Length == 0) return false;
                if (normalizedIds.Contains(credentialId)) continue;
                normalizedIds.Add(credentialId);
            }
            normalized = normalizedIds.ToArray();
            return true;
        }
    }

    internal sealed class PasskeyRegistrationRequest
    {
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string Challenge { get; set; }
        public string UserHandle { get; set; }
        public string UserName { get; set; }
        public string UserDisplayName { get; set; }
        public string UserVerification { get; set; }
        public string ResidentKey { get; set; }
        public string[] Transports { get; set; }
    }

    internal sealed class PasskeyAssertionRequest
    {
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string Challenge { get; set; }
        public string UserVerification { get; set; }
    }

    internal sealed class PasskeyCredentialMaterial
    {
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string CredentialId { get; set; }
        public string UserHandle { get; set; }
        public string UserName { get; set; }
        public string UserDisplayName { get; set; }
        public string UserVerification { get; set; }
        public string ResidentKey { get; set; }
        public string[] Transports { get; set; }
        public string PublicKeyCose { get; set; }
        public string PrivateKey { get; set; }
        public uint SignCount { get; set; }
    }

    internal sealed class PasskeyRegistrationResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public PasskeyCredentialMaterial Credential { get; set; }
        public string ClientDataJson { get; set; }
        public string AttestationObject { get; set; }
        public string AuthenticatorData { get; set; }
        public string PublicKey { get; set; }

        public static PasskeyRegistrationResult Ok(PasskeyCredentialMaterial credential, string clientDataJson, string attestationObject, string authenticatorData, string publicKey)
        {
            return new PasskeyRegistrationResult
            {
                Success = true,
                Credential = credential,
                ClientDataJson = clientDataJson,
                AttestationObject = attestationObject,
                AuthenticatorData = authenticatorData,
                PublicKey = publicKey
            };
        }

        public static PasskeyRegistrationResult Fail(string errorCode, string error)
        {
            return new PasskeyRegistrationResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }

    internal sealed class PasskeyAssertionResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public PasskeyAssertionResponse Assertion { get; set; }

        public static PasskeyAssertionResult Ok(PasskeyAssertionResponse assertion)
        {
            return new PasskeyAssertionResult
            {
                Success = true,
                Assertion = assertion
            };
        }

        public static PasskeyAssertionResult Fail(string errorCode, string error)
        {
            return new PasskeyAssertionResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }

    internal sealed class PasskeyAssertionResponse
    {
        public string CredentialId { get; set; }
        public string AuthenticatorData { get; set; }
        public string ClientDataJson { get; set; }
        public string Signature { get; set; }
        public string UserHandle { get; set; }
        public uint SignCount { get; set; }
    }

    public sealed class PasskeyCredentialLookupResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public PasskeyCredentialSummary[] Credentials { get; set; }

        public static PasskeyCredentialLookupResult Ok(PasskeyCredentialSummary[] credentials)
        {
            return new PasskeyCredentialLookupResult
            {
                Success = true,
                Credentials = credentials ?? new PasskeyCredentialSummary[0]
            };
        }

        public static PasskeyCredentialLookupResult Fail(string errorCode, string error)
        {
            return new PasskeyCredentialLookupResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error,
                Credentials = new PasskeyCredentialSummary[0]
            };
        }
    }

    public sealed class PasskeyCredentialSummary
    {
        public string EntryId { get; set; }
        public string Title { get; set; }
        public string UserName { get; set; }
        public string RpId { get; set; }
        public string CredentialId { get; set; }
        public string UserHandle { get; set; }
        public string UserVerification { get; set; }
        public string[] Transports { get; set; }
        public uint SignCount { get; set; }
        public string Group { get; set; }
        public ulong UsageCount { get; set; }
        public long LastUsed { get; set; }
    }

    internal sealed class PasskeyCredentialSelectionResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public PwGroup Group { get; set; }
        public PwEntry Entry { get; set; }
        public PasskeyCredentialMaterial Credential { get; set; }

        public static PasskeyCredentialSelectionResult Ok(PwGroup group, PwEntry entry, PasskeyCredentialMaterial credential)
        {
            return new PasskeyCredentialSelectionResult
            {
                Success = true,
                Group = group,
                Entry = entry,
                Credential = credential
            };
        }

        public static PasskeyCredentialSelectionResult Fail(string errorCode, string error)
        {
            return new PasskeyCredentialSelectionResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }

    internal enum PasskeyPendingOperation
    {
        Create,
        Get
    }

    internal sealed class PasskeyPendingSession
    {
        public PasskeyPendingOperation Operation { get; set; }
        public string ClientId { get; set; }
        public string ExtensionOrigin { get; set; }
        public string BeginBridgeRequestId { get; set; }
        public string WebAuthnRequestId { get; set; }
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string Challenge { get; set; }
        public string UserHandle { get; set; }
        public string UserName { get; set; }
        public string UserDisplayName { get; set; }
        public string UserVerification { get; set; }
        public string ResidentKey { get; set; }
        public PasskeyRequestedExtensions RequestedExtensions { get; set; }
        public string[] Hints { get; set; }
        public string[] Transports { get; set; }
        public string[] AllowCredentialIds { get; set; }
        public long CreatedUtcMs { get; set; }
        public long ExpiresUtcMs { get; set; }
    }

    internal sealed class PasskeyPendingSessionResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public PasskeyPendingSession Session { get; set; }

        public static PasskeyPendingSessionResult Ok(PasskeyPendingSession session)
        {
            return new PasskeyPendingSessionResult
            {
                Success = true,
                Session = session
            };
        }

        public static PasskeyPendingSessionResult Fail(string errorCode, string error)
        {
            return new PasskeyPendingSessionResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }

    internal sealed class PasskeyApprovalRequest
    {
        public PasskeyPendingOperation Operation { get; set; }
        public string ClientId { get; set; }
        public string ExtensionOrigin { get; set; }
        public string WebAuthnRequestId { get; set; }
        public string RpId { get; set; }
        public string Origin { get; set; }
        public string UserName { get; set; }
        public string UserDisplayName { get; set; }
        public string ResidentKey { get; set; }
        public PasskeyCredentialSummary[] Credentials { get; set; }
    }

    internal sealed class PasskeyApprovalResult
    {
        public bool Approved { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }

        public static PasskeyApprovalResult Approve()
        {
            return new PasskeyApprovalResult { Approved = true };
        }

        public static PasskeyApprovalResult Deny(string errorCode, string error)
        {
            return new PasskeyApprovalResult
            {
                Approved = false,
                ErrorCode = string.IsNullOrWhiteSpace(errorCode) ? "approval_denied" : errorCode,
                Error = string.IsNullOrWhiteSpace(error) ? "Passkey request was denied." : error
            };
        }
    }

    internal sealed class PasskeyValidationResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }

        public static PasskeyValidationResult Ok()
        {
            return new PasskeyValidationResult { Success = true };
        }

        public static PasskeyValidationResult Fail(string errorCode, string error)
        {
            return new PasskeyValidationResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }

    internal static class WebAuthnClientDataJson
    {
        public static byte[] Create(string type, string challenge, string origin)
        {
            string json = BridgeJsonSerializer.Serialize(new WebAuthnClientData
            {
                Type = type,
                Challenge = challenge,
                Origin = origin,
                CrossOrigin = false
            });
            return Encoding.UTF8.GetBytes(json);
        }

        public static bool IsAssertionClientDataForOrigin(byte[] clientDataJson, string expectedOrigin)
        {
            return IsAssertionClientDataForOrigin(clientDataJson, expectedOrigin, null);
        }

        public static bool IsAssertionClientDataForOrigin(byte[] clientDataJson, string expectedOrigin, string expectedChallenge)
        {
            string canonicalExpectedOrigin = PasskeyRelyingPartyValidator.NormalizeOrigin(expectedOrigin);
            if (canonicalExpectedOrigin.Length == 0) return false;
            string canonicalExpectedChallenge = null;
            if (expectedChallenge != null)
            {
                byte[] expectedChallengeBytes;
                if (!Base64Url.TryDecode(expectedChallenge, out expectedChallengeBytes) || expectedChallengeBytes.Length < 16)
                    return false;
                canonicalExpectedChallenge = Base64Url.Encode(expectedChallengeBytes);
            }

            WebAuthnClientData clientData;
            try
            {
                clientData = BridgeJsonSerializer.Deserialize<WebAuthnClientData>(
                    Encoding.UTF8.GetString(clientDataJson ?? new byte[0]));
            }
            catch
            {
                return false;
            }

            return clientData != null &&
                string.Equals(clientData.Type, "webauthn.get", StringComparison.Ordinal) &&
                string.Equals(clientData.Origin ?? string.Empty, canonicalExpectedOrigin, StringComparison.Ordinal) &&
                (canonicalExpectedChallenge == null ||
                    string.Equals(clientData.Challenge ?? string.Empty, canonicalExpectedChallenge, StringComparison.Ordinal)) &&
                !clientData.CrossOrigin;
        }

        [DataContract]
        private sealed class WebAuthnClientData
        {
            [DataMember(Name = "type")]
            public string Type { get; set; }

            [DataMember(Name = "challenge")]
            public string Challenge { get; set; }

            [DataMember(Name = "origin")]
            public string Origin { get; set; }

            [DataMember(Name = "crossOrigin")]
            public bool CrossOrigin { get; set; }
        }
    }

    internal static class WebAuthnAuthenticatorData
    {
        public const int AssertionDataLength = 37;
        public const byte UserPresentFlag = 0x01;
        private const byte AttestedCredentialDataFlag = 0x40;

        public static byte[] CreateAssertionData(string rpId, uint signCount)
        {
            byte[] rpIdHash = CreateRpIdHash(rpId);
            using (MemoryStream stream = new MemoryStream())
            {
                stream.Write(rpIdHash, 0, rpIdHash.Length);
                stream.WriteByte(UserPresentFlag);
                WriteUInt32BigEndian(stream, signCount);
                return stream.ToArray();
            }
        }

        public static byte[] CreateAttestationData(string rpId, byte[] credentialId, byte[] publicKeyCose)
        {
            byte[] rpIdHash = CreateRpIdHash(rpId);
            using (MemoryStream stream = new MemoryStream())
            {
                stream.Write(rpIdHash, 0, rpIdHash.Length);
                stream.WriteByte((byte)(UserPresentFlag | AttestedCredentialDataFlag));
                WriteUInt32BigEndian(stream, 0);
                for (int i = 0; i < 16; ++i) stream.WriteByte(0);
                WriteUInt16BigEndian(stream, (ushort)(credentialId == null ? 0 : credentialId.Length));
                if (credentialId != null) stream.Write(credentialId, 0, credentialId.Length);
                if (publicKeyCose != null) stream.Write(publicKeyCose, 0, publicKeyCose.Length);
                return stream.ToArray();
            }
        }

        public static byte[] CreateRpIdHash(string rpId)
        {
            return Sha256(Encoding.ASCII.GetBytes(NormalizeRpId(rpId)));
        }

        private static string NormalizeRpId(string rpId)
        {
            return (rpId ?? string.Empty).Trim().TrimEnd('.').ToLowerInvariant();
        }

        private static byte[] Sha256(byte[] bytes)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                return sha256.ComputeHash(bytes);
            }
        }

        private static void WriteUInt16BigEndian(Stream stream, ushort value)
        {
            stream.WriteByte((byte)((value >> 8) & 0xff));
            stream.WriteByte((byte)(value & 0xff));
        }

        private static void WriteUInt32BigEndian(Stream stream, uint value)
        {
            stream.WriteByte((byte)((value >> 24) & 0xff));
            stream.WriteByte((byte)((value >> 16) & 0xff));
            stream.WriteByte((byte)((value >> 8) & 0xff));
            stream.WriteByte((byte)(value & 0xff));
        }
    }

    internal static class WebAuthnAttestationObject
    {
        public static byte[] CreateNone(string rpId, byte[] credentialId, byte[] publicKeyCose, out byte[] authData)
        {
            authData = WebAuthnAuthenticatorData.CreateAttestationData(rpId, credentialId, publicKeyCose);
            CborWriter writer = new CborWriter();
            writer.WriteMap(3);
            writer.WriteTextString("fmt");
            writer.WriteTextString("none");
            writer.WriteTextString("attStmt");
            writer.WriteMap(0);
            writer.WriteTextString("authData");
            writer.WriteByteString(authData);
            return writer.ToArray();
        }
    }

    internal static class CoseKey
    {
        public static byte[] EncodeEs256PublicKey(byte[] x, byte[] y)
        {
            CborWriter writer = new CborWriter();
            writer.WriteMap(5);
            writer.WriteInt(1);
            writer.WriteInt(2);
            writer.WriteInt(3);
            writer.WriteInt(-7);
            writer.WriteInt(-1);
            writer.WriteInt(1);
            writer.WriteInt(-2);
            writer.WriteByteString(x);
            writer.WriteInt(-3);
            writer.WriteByteString(y);
            return writer.ToArray();
        }

        public static bool TryDecodeEs256PublicKey(byte[] coseKey, out EccPublicKey publicKey)
        {
            publicKey = null;
            if (coseKey == null) return false;

            int offset = 0;
            int entryCount;
            if (!TryReadMapLength(coseKey, ref offset, out entryCount)) return false;

            bool hasKty = false;
            bool hasAlg = false;
            bool hasCrv = false;
            bool hasX = false;
            bool hasY = false;
            byte[] x = null;
            byte[] y = null;

            for (int i = 0; i < entryCount; ++i)
            {
                int key;
                if (!TryReadInt(coseKey, ref offset, out key)) return false;

                if (key == 1)
                {
                    int value;
                    if (hasKty || !TryReadInt(coseKey, ref offset, out value) || value != 2) return false;
                    hasKty = true;
                }
                else if (key == 3)
                {
                    int value;
                    if (hasAlg || !TryReadInt(coseKey, ref offset, out value) || value != -7) return false;
                    hasAlg = true;
                }
                else if (key == -1)
                {
                    int value;
                    if (hasCrv || !TryReadInt(coseKey, ref offset, out value) || value != 1) return false;
                    hasCrv = true;
                }
                else if (key == -2)
                {
                    if (hasX || !TryReadByteString(coseKey, ref offset, out x) || x.Length != 32) return false;
                    hasX = true;
                }
                else if (key == -3)
                {
                    if (hasY || !TryReadByteString(coseKey, ref offset, out y) || y.Length != 32) return false;
                    hasY = true;
                }
                else
                {
                    return false;
                }
            }

            if (offset != coseKey.Length || !hasKty || !hasAlg || !hasCrv || !hasX || !hasY) return false;

            publicKey = new EccPublicKey { X = x, Y = y };
            return true;
        }

        private static bool TryReadMapLength(byte[] bytes, ref int offset, out int entryCount)
        {
            entryCount = 0;
            int majorType;
            ulong length;
            if (!TryReadTypeAndLength(bytes, ref offset, out majorType, out length) || majorType != 5 ||
                length > int.MaxValue)
                return false;
            entryCount = (int)length;
            return true;
        }

        private static bool TryReadInt(byte[] bytes, ref int offset, out int value)
        {
            value = 0;
            int majorType;
            ulong rawValue;
            if (!TryReadTypeAndLength(bytes, ref offset, out majorType, out rawValue)) return false;
            if (majorType == 0)
            {
                if (rawValue > int.MaxValue) return false;
                value = (int)rawValue;
                return true;
            }
            if (majorType == 1)
            {
                if (rawValue > int.MaxValue) return false;
                value = -1 - (int)rawValue;
                return true;
            }
            return false;
        }

        private static bool TryReadByteString(byte[] bytes, ref int offset, out byte[] value)
        {
            value = null;
            int majorType;
            ulong length;
            if (!TryReadTypeAndLength(bytes, ref offset, out majorType, out length) || majorType != 2 ||
                length > int.MaxValue || offset + (int)length > bytes.Length)
                return false;

            value = new byte[(int)length];
            Buffer.BlockCopy(bytes, offset, value, 0, (int)length);
            offset += (int)length;
            return true;
        }

        private static bool TryReadTypeAndLength(byte[] bytes, ref int offset, out int majorType, out ulong length)
        {
            majorType = 0;
            length = 0;
            if (bytes == null || offset >= bytes.Length) return false;

            byte initial = bytes[offset++];
            majorType = initial >> 5;
            int additionalInfo = initial & 0x1f;
            if (additionalInfo < 24)
            {
                length = (ulong)additionalInfo;
                return true;
            }
            if (additionalInfo == 24)
            {
                if (offset >= bytes.Length) return false;
                length = bytes[offset++];
                return length >= 24;
            }
            if (additionalInfo == 25)
            {
                if (offset + 2 > bytes.Length) return false;
                length = (ulong)((bytes[offset] << 8) | bytes[offset + 1]);
                offset += 2;
                return length > byte.MaxValue;
            }
            return false;
        }
    }

    internal sealed class EccPublicKey
    {
        public byte[] X { get; set; }
        public byte[] Y { get; set; }
    }

#if NET8_0_OR_GREATER
    [SupportedOSPlatform("windows")]
#endif
    internal sealed class EccKeyBlob
    {
        public byte[] PrivateBlob { get; set; }
        public byte[] PublicX { get; set; }
        public byte[] PublicY { get; set; }

        public static EccKeyBlob Create()
        {
            CngKeyCreationParameters parameters = new CngKeyCreationParameters
            {
                ExportPolicy = CngExportPolicies.AllowPlaintextExport
            };

            using (CngKey key = CngKey.Create(CngAlgorithm.ECDsaP256, null, parameters))
            {
                byte[] privateBlob = key.Export(CngKeyBlobFormat.EccPrivateBlob);
                byte[] publicBlob = key.Export(CngKeyBlobFormat.EccPublicBlob);
                EccBlobParts parts = ParseBlob(publicBlob, false);
                return new EccKeyBlob
                {
                    PrivateBlob = privateBlob,
                    PublicX = parts.X,
                    PublicY = parts.Y
                };
            }
        }

        public static byte[] SignDer(byte[] privateBlob, byte[] data)
        {
            using (CngKey key = CngKey.Import(privateBlob, CngKeyBlobFormat.EccPrivateBlob))
            using (ECDsaCng ecdsa = new ECDsaCng(key))
            {
                byte[] hash = Sha256(data);
                return EcdsaSignatureDer.EncodeFromP1363(ecdsa.SignHash(hash), 32);
            }
        }

        public static bool VerifyDer(byte[] publicX, byte[] publicY, byte[] data, byte[] signatureDer)
        {
            byte[] publicBlob = CreatePublicBlob(publicX, publicY);
            byte[] signatureP1363;
            if (!EcdsaSignatureDer.TryDecodeToP1363(signatureDer, 32, out signatureP1363)) return false;

            using (CngKey key = CngKey.Import(publicBlob, CngKeyBlobFormat.EccPublicBlob))
            using (ECDsaCng ecdsa = new ECDsaCng(key))
            {
                byte[] hash = Sha256(data);
                return ecdsa.VerifyHash(hash, signatureP1363);
            }
        }

        public static byte[] EncodeSubjectPublicKeyInfo(byte[] publicX, byte[] publicY)
        {
            if (publicX == null || publicY == null || publicX.Length != 32 || publicY.Length != 32)
                throw new InvalidOperationException("P-256 public key coordinates must be 32 bytes.");

            byte[] prefix = new byte[]
            {
                0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
                0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a,
                0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03,
                0x42, 0x00, 0x04
            };
            byte[] spki = new byte[prefix.Length + publicX.Length + publicY.Length];
            Buffer.BlockCopy(prefix, 0, spki, 0, prefix.Length);
            Buffer.BlockCopy(publicX, 0, spki, prefix.Length, publicX.Length);
            Buffer.BlockCopy(publicY, 0, spki, prefix.Length + publicX.Length, publicY.Length);
            return spki;
        }

        private static byte[] Sha256(byte[] bytes)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                return sha256.ComputeHash(bytes);
            }
        }

        private static byte[] CreatePublicBlob(byte[] x, byte[] y)
        {
            if (x == null || y == null || x.Length != 32 || y.Length != 32)
                throw new InvalidOperationException("P-256 public key coordinates must be 32 bytes.");

            byte[] blob = new byte[8 + x.Length + y.Length];
            WriteUInt32LittleEndian(blob, 0, 0x31534345);
            WriteUInt32LittleEndian(blob, 4, 32);
            Buffer.BlockCopy(x, 0, blob, 8, x.Length);
            Buffer.BlockCopy(y, 0, blob, 8 + x.Length, y.Length);
            return blob;
        }

        private static EccBlobParts ParseBlob(byte[] blob, bool privateBlob)
        {
            if (blob == null || blob.Length < 8)
                throw new InvalidOperationException("Invalid P-256 key blob.");

            int keyLength = BitConverter.ToInt32(blob, 4);
            int expectedLength = 8 + (privateBlob ? keyLength * 3 : keyLength * 2);
            if (keyLength != 32 || blob.Length < expectedLength)
                throw new InvalidOperationException("Only P-256 key blobs are supported.");

            byte[] x = new byte[keyLength];
            byte[] y = new byte[keyLength];
            Buffer.BlockCopy(blob, 8, x, 0, keyLength);
            Buffer.BlockCopy(blob, 8 + keyLength, y, 0, keyLength);
            return new EccBlobParts { X = x, Y = y };
        }

        private static void WriteUInt32LittleEndian(byte[] bytes, int offset, int value)
        {
            bytes[offset] = (byte)(value & 0xff);
            bytes[offset + 1] = (byte)((value >> 8) & 0xff);
            bytes[offset + 2] = (byte)((value >> 16) & 0xff);
            bytes[offset + 3] = (byte)((value >> 24) & 0xff);
        }
    }

    internal sealed class EccBlobParts
    {
        public byte[] X { get; set; }
        public byte[] Y { get; set; }
    }

    internal static class EcdsaSignatureDer
    {
        public static byte[] EncodeFromP1363(byte[] signature, int coordinateLength)
        {
            if (signature == null || signature.Length != coordinateLength * 2)
                throw new InvalidOperationException("Invalid ECDSA signature length.");

            byte[] r = EncodeInteger(signature, 0, coordinateLength);
            byte[] s = EncodeInteger(signature, coordinateLength, coordinateLength);
            int sequenceLength = 2 + r.Length + 2 + s.Length;

            using (MemoryStream stream = new MemoryStream())
            {
                stream.WriteByte(0x30);
                stream.WriteByte((byte)sequenceLength);
                stream.WriteByte(0x02);
                stream.WriteByte((byte)r.Length);
                stream.Write(r, 0, r.Length);
                stream.WriteByte(0x02);
                stream.WriteByte((byte)s.Length);
                stream.Write(s, 0, s.Length);
                return stream.ToArray();
            }
        }

        public static bool TryDecodeToP1363(byte[] der, int coordinateLength, out byte[] signature)
        {
            signature = null;
            if (der == null || der.Length < 8) return false;
            int offset = 0;
            if (der[offset++] != 0x30) return false;
            int sequenceLength = der[offset++];
            if (sequenceLength != der.Length - 2) return false;

            byte[] r;
            byte[] s;
            if (!ReadInteger(der, ref offset, coordinateLength, out r)) return false;
            if (!ReadInteger(der, ref offset, coordinateLength, out s)) return false;
            if (offset != der.Length) return false;

            signature = new byte[coordinateLength * 2];
            Buffer.BlockCopy(r, 0, signature, 0, coordinateLength);
            Buffer.BlockCopy(s, 0, signature, coordinateLength, coordinateLength);
            return true;
        }

        private static byte[] EncodeInteger(byte[] bytes, int offset, int length)
        {
            int start = offset;
            int end = offset + length;
            while (start < end - 1 && bytes[start] == 0) ++start;

            int encodedLength = end - start;
            bool prependZero = (bytes[start] & 0x80) != 0;
            byte[] encoded = new byte[encodedLength + (prependZero ? 1 : 0)];
            if (prependZero) encoded[0] = 0;
            Buffer.BlockCopy(bytes, start, encoded, prependZero ? 1 : 0, encodedLength);
            return encoded;
        }

        private static bool ReadInteger(byte[] der, ref int offset, int coordinateLength, out byte[] integer)
        {
            integer = null;
            if (offset + 2 > der.Length || der[offset++] != 0x02) return false;
            int length = der[offset++];
            if (length <= 0 || offset + length > der.Length) return false;

            int start = offset;
            offset += length;
            if (length > coordinateLength + 1) return false;

            if (der[start] == 0)
            {
                if (length == 1 || (der[start + 1] & 0x80) == 0) return false;
                ++start;
                --length;
            }
            else if ((der[start] & 0x80) != 0)
            {
                return false;
            }

            if (length > coordinateLength) return false;

            integer = new byte[coordinateLength];
            Buffer.BlockCopy(der, start, integer, coordinateLength - length, length);
            return true;
        }
    }

    internal sealed class CborWriter
    {
        private readonly MemoryStream m_stream = new MemoryStream();

        public void WriteMap(int count)
        {
            WriteTypeAndLength(5, (ulong)count);
        }

        public void WriteInt(int value)
        {
            if (value >= 0)
                WriteTypeAndLength(0, (ulong)value);
            else
                WriteTypeAndLength(1, (ulong)(-1 - value));
        }

        public void WriteByteString(byte[] bytes)
        {
            byte[] value = bytes ?? new byte[0];
            WriteTypeAndLength(2, (ulong)value.Length);
            m_stream.Write(value, 0, value.Length);
        }

        public void WriteTextString(string text)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(text ?? string.Empty);
            WriteTypeAndLength(3, (ulong)bytes.Length);
            m_stream.Write(bytes, 0, bytes.Length);
        }

        public byte[] ToArray()
        {
            return m_stream.ToArray();
        }

        private void WriteTypeAndLength(int majorType, ulong length)
        {
            if (length < 24)
            {
                m_stream.WriteByte((byte)((majorType << 5) | (byte)length));
            }
            else if (length <= byte.MaxValue)
            {
                m_stream.WriteByte((byte)((majorType << 5) | 24));
                m_stream.WriteByte((byte)length);
            }
            else if (length <= ushort.MaxValue)
            {
                m_stream.WriteByte((byte)((majorType << 5) | 25));
                m_stream.WriteByte((byte)((length >> 8) & 0xff));
                m_stream.WriteByte((byte)(length & 0xff));
            }
            else
            {
                throw new InvalidOperationException("CBOR value is too large for this writer.");
            }
        }
    }

    internal static class Base64Url
    {
        public static string Encode(byte[] bytes)
        {
            if (bytes == null || bytes.Length == 0) return string.Empty;
            return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }

        public static bool TryDecode(string text, out byte[] bytes)
        {
            bytes = null;
            if (string.IsNullOrEmpty(text)) return false;

            string normalized = text;
            if (normalized.Length != normalized.Trim().Length) return false;
            int paddingStart = normalized.IndexOf('=');
            if (paddingStart >= 0)
            {
                int paddingLength = normalized.Length - paddingStart;
                if (normalized.Length % 4 != 0 || paddingLength < 1 || paddingLength > 2) return false;
            }
            for (int i = 0; i < normalized.Length; ++i)
            {
                char ch = normalized[i];
                if (ch == '=')
                {
                    if (i < paddingStart) return false;
                    continue;
                }
                if (paddingStart >= 0 && i > paddingStart) return false;
                bool allowed = (ch >= 'A' && ch <= 'Z') ||
                    (ch >= 'a' && ch <= 'z') ||
                    (ch >= '0' && ch <= '9') ||
                    ch == '-' ||
                    ch == '_';
                if (!allowed) return false;
            }

            string value = normalized.Replace('-', '+').Replace('_', '/');
            int padding = value.Length % 4;
            if (padding == 2) value += "==";
            else if (padding == 3) value += "=";
            else if (padding != 0) return false;

            try
            {
                bytes = Convert.FromBase64String(value);
                return true;
            }
            catch (FormatException)
            {
                bytes = null;
                return false;
            }
        }
    }
}
