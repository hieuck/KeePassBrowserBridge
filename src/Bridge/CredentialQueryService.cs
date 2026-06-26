using System;
using System.Collections.Generic;
using System.Linq;
using KeePassLib;
using KeePassLib.Security;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class CredentialQueryService
    {
        public CredentialQueryResult Query(PwDatabase database, string pageUrl)
        {
            return Query(database, pageUrl, new CredentialQueryOptions
            {
                StrictUrlMatching = true,
                RegexUrlMatching = true
            });
        }

        public CredentialQueryResult Query(PwDatabase database, string pageUrl, CredentialQueryOptions options)
        {
            return Query(database, pageUrl, options, null);
        }

        public CredentialQueryResult Query(PwDatabase database, string pageUrl, CredentialQueryOptions options, string[] relatedUrls)
        {
            if (database == null || database.RootGroup == null)
                return CredentialQueryResult.Fail("database_not_open", "KeePass database is not open.");

            string pageHost;
            if (string.IsNullOrWhiteSpace(pageUrl) || !UrlMatcher.TryGetHost(pageUrl, out pageHost))
                return CredentialQueryResult.Fail("invalid_url", "Page URL is invalid.");

            List<CredentialEntry> matches = new List<CredentialEntry>();
            CollectMatches(database.RootGroup, pageUrl, options ?? new CredentialQueryOptions(), matches, string.Empty);

            if (relatedUrls != null)
            {
                HashSet<string> matchedIds = new HashSet<string>(matches.Select(m => m.EntryId));
                foreach (string relatedUrl in relatedUrls)
                {
                    if (string.IsNullOrWhiteSpace(relatedUrl)) continue;
                    if (!UrlMatcher.TryGetHost(relatedUrl, out _)) continue;

                    List<CredentialEntry> relatedMatches = new List<CredentialEntry>();
                    CollectMatches(database.RootGroup, relatedUrl, options ?? new CredentialQueryOptions(), relatedMatches, string.Empty);

                    foreach (var entry in relatedMatches)
                    {
                        if (matchedIds.Add(entry.EntryId))
                        {
                            matches.Add(entry);
                        }
                    }
                }
            }

            return CredentialQueryResult.Ok(matches.ToArray());
        }

        private static void CollectMatches(PwGroup group, string pageUrl, CredentialQueryOptions options, List<CredentialEntry> matches, string groupPath)
        {
            if (group == null) return;

            foreach (PwEntry entry in group.Entries)
            {
                string entryUrl = entry.Strings.ReadSafe(PwDefs.UrlField);
                if (!EntryUrlMatcher.IsMatch(entry, pageUrl, options)) continue;

                string password = ReadProtectedString(entry.Strings.Get(PwDefs.PasswordField));
                if (PasskeyEntryStore.IsPasskeyEntry(entry) && string.IsNullOrWhiteSpace(password))
                    continue;

                var customFields = ExtractCustomFields(entry);

                matches.Add(new CredentialEntry
                {
                    EntryId = entry.Uuid.ToHexString(),
                    Title = entry.Strings.ReadSafe(PwDefs.TitleField),
                    UserName = entry.Strings.ReadSafe(PwDefs.UserNameField),
                    Url = entryUrl,
                    Group = groupPath,
                    UsageCount = entry.UsageCount,
                    LastUsed = ToUnixTimeMilliseconds(entry.LastAccessTime),
                    Password = password,
                    OneTimePassword = GenerateOneTimePassword(entry),
                    CustomFields = customFields
                });
            }

            foreach (PwGroup child in group.Groups)
            {
                string childPath = JoinGroupPath(groupPath, child.Name);
                CollectMatches(child, pageUrl, options, matches, childPath);
            }
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

        private static CustomField[] ExtractCustomFields(PwEntry entry)
        {
            if (entry == null || entry.Strings == null)
                return new CustomField[0];

            List<CustomField> fields = new List<CustomField>();
            var standardFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                PwDefs.TitleField,
                PwDefs.UserNameField,
                PwDefs.PasswordField,
                PwDefs.UrlField,
                "otp",
                "TOTP Seed",
                "TOTP Secret",
                "TOTP",
                "TimeOtp-Secret-Base32"
            };

            foreach (KeyValuePair<string, ProtectedString> item in entry.Strings)
            {
                if (IsUrlFieldName(item.Key))
                    continue;

                if (standardFields.Contains(item.Key))
                    continue;

                string value = ReadProtectedString(item.Value);
                if (string.IsNullOrWhiteSpace(value))
                    continue;

                fields.Add(new CustomField
                {
                    Name = item.Key,
                    Value = item.Value.IsProtected ? string.Empty : value,
                    IsProtected = item.Value.IsProtected
                });
            }

            return fields.ToArray();
        }

        private static bool IsUrlFieldName(string fieldName)
        {
            if (string.IsNullOrWhiteSpace(fieldName)) return false;
            if (string.Equals(fieldName, PwDefs.UrlField, StringComparison.OrdinalIgnoreCase)) return true;
            return fieldName.StartsWith(PwDefs.UrlField + " (", StringComparison.OrdinalIgnoreCase);
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

    public sealed class CredentialQueryOptions
    {
        public bool StrictUrlMatching { get; set; }
        public bool RegexUrlMatching { get; set; }
    }

    public sealed class CredentialEntry
    {
        public string EntryId { get; set; }
        public string Title { get; set; }
        public string UserName { get; set; }
        public string Url { get; set; }
        public string Group { get; set; }
        public ulong UsageCount { get; set; }
        public long LastUsed { get; set; }
        public string Password { get; set; }
        public string OneTimePassword { get; set; }
        public CustomField[] CustomFields { get; set; }
    }

    public sealed class CustomField
    {
        public string Name { get; set; }
        public string Value { get; set; }
        public bool IsProtected { get; set; }
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
}
