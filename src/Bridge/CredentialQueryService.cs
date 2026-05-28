using System;
using System.Collections.Generic;
using KeePassLib;
using KeePassLib.Security;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class CredentialQueryService
    {
        public CredentialQueryResult Query(PwDatabase database, string pageUrl)
        {
            if (database == null || database.RootGroup == null)
                return CredentialQueryResult.Fail("database_not_open", "KeePass database is not open.");

            string pageHost;
            if (string.IsNullOrWhiteSpace(pageUrl) || !UrlMatcher.TryGetHost(pageUrl, out pageHost))
                return CredentialQueryResult.Fail("invalid_url", "Page URL is invalid.");

            List<CredentialEntry> matches = new List<CredentialEntry>();
            CollectMatches(database.RootGroup, pageUrl, matches);

            return CredentialQueryResult.Ok(matches.ToArray());
        }

        private static void CollectMatches(PwGroup group, string pageUrl, List<CredentialEntry> matches)
        {
            if (group == null) return;

            foreach (PwEntry entry in group.Entries)
            {
                string entryUrl = entry.Strings.ReadSafe(PwDefs.UrlField);
                if (!UrlMatcher.IsMatch(entryUrl, pageUrl)) continue;

                matches.Add(new CredentialEntry
                {
                    EntryId = entry.Uuid.ToHexString(),
                    Title = entry.Strings.ReadSafe(PwDefs.TitleField),
                    UserName = entry.Strings.ReadSafe(PwDefs.UserNameField),
                    Url = entryUrl,
                    Password = ReadProtectedString(entry.Strings.GetSafe(PwDefs.PasswordField)),
                    OneTimePassword = GenerateOneTimePassword(entry)
                });
            }

            foreach (PwGroup child in group.Groups)
            {
                CollectMatches(child, pageUrl, matches);
            }
        }

        private static string ReadProtectedString(ProtectedString value)
        {
            return value == null ? string.Empty : value.ReadString();
        }

        private static string GenerateOneTimePassword(PwEntry entry)
        {
            string secret = ReadFirstExistingField(entry,
                "otp",
                "TOTP Seed",
                "TOTP Secret",
                "TOTP",
                "TimeOtp-Secret-Base32");
            if (string.IsNullOrWhiteSpace(secret)) return string.Empty;

            TotpResult result = TotpGenerator.Generate(secret, BridgeClock.UtcNowMilliseconds());
            return result.Success ? result.Code : string.Empty;
        }

        private static string ReadFirstExistingField(PwEntry entry, params string[] fieldNames)
        {
            foreach (string fieldName in fieldNames)
            {
                ProtectedString value = entry.Strings.Get(fieldName);
                string text = ReadProtectedString(value);
                if (!string.IsNullOrWhiteSpace(text)) return text;
            }

            return string.Empty;
        }
    }

    public sealed class CredentialQueryResult
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public CredentialEntry[] Entries { get; set; }

        public static CredentialQueryResult Ok(CredentialEntry[] entries)
        {
            return new CredentialQueryResult
            {
                Success = true,
                Entries = entries ?? new CredentialEntry[0]
            };
        }

        public static CredentialQueryResult Fail(string errorCode, string error)
        {
            return new CredentialQueryResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error,
                Entries = new CredentialEntry[0]
            };
        }
    }

    public sealed class CredentialEntry
    {
        public string EntryId { get; set; }
        public string Title { get; set; }
        public string UserName { get; set; }
        public string Url { get; set; }
        public string Password { get; set; }
        public string OneTimePassword { get; set; }
    }
}
