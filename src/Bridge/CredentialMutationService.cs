using System;
using KeePassLib;
using KeePassLib.Security;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class CredentialMutationService
    {
        public CredentialMutationResult Create(PwDatabase database, CreateLoginPayload payload)
        {
            if (database == null || database.RootGroup == null)
                return CredentialMutationResult.Fail("database_not_open", "KeePass database is not open.");

            if (payload == null)
                return CredentialMutationResult.Fail("invalid_payload", "Login payload is required.");

            string host;
            if (string.IsNullOrWhiteSpace(payload.Url) || !UrlMatcher.TryGetHost(payload.Url, out host))
                return CredentialMutationResult.Fail("invalid_url", "Login URL is invalid.");

            if (string.IsNullOrWhiteSpace(payload.UserName) && string.IsNullOrWhiteSpace(payload.Password))
                return CredentialMutationResult.Fail("missing_credentials", "A username or password is required.");

            PwEntry entry = new PwEntry(true, true);
            entry.Strings.Set(PwDefs.TitleField, new ProtectedString(false, CreateTitle(payload)));
            entry.Strings.Set(PwDefs.UserNameField, new ProtectedString(false, payload.UserName ?? string.Empty));
            entry.Strings.Set(PwDefs.PasswordField, new ProtectedString(true, payload.Password ?? string.Empty));
            entry.Strings.Set(PwDefs.UrlField, new ProtectedString(false, payload.Url));
            entry.Touch(true, false);

            database.RootGroup.AddEntry(entry, true);
            database.Modified = true;

            return CredentialMutationResult.Ok(new CredentialEntry
            {
                EntryId = entry.Uuid.ToHexString(),
                Title = entry.Strings.ReadSafe(PwDefs.TitleField),
                UserName = entry.Strings.ReadSafe(PwDefs.UserNameField),
                Url = entry.Strings.ReadSafe(PwDefs.UrlField),
                Password = payload.Password ?? string.Empty
            });
        }

        private static string CreateTitle(CreateLoginPayload payload)
        {
            if (!string.IsNullOrWhiteSpace(payload.Title)) return payload.Title.Trim();

            string host;
            if (UrlMatcher.TryGetHost(payload.Url, out host) && !string.IsNullOrWhiteSpace(host))
                return host;

            return "New Login";
        }
    }

    public sealed class CredentialMutationResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public CredentialEntry Entry { get; set; }

        public static CredentialMutationResult Ok(CredentialEntry entry)
        {
            return new CredentialMutationResult
            {
                Success = true,
                Entry = entry
            };
        }

        public static CredentialMutationResult Fail(string errorCode, string error)
        {
            return new CredentialMutationResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error
            };
        }
    }
}
