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
            if (!string.IsNullOrWhiteSpace(payload.Otp))
                entry.Strings.Set("otp", new ProtectedString(true, payload.Otp.Trim()));
            AddCustomFields(entry, payload.CustomFields);
            entry.Touch(true, false);

            PwGroup targetGroup = FindOrCreateGroupPath(database.RootGroup, payload.Group);
            string groupPath = GroupPathFromPayload(payload.Group);
            targetGroup.AddEntry(entry, true);
            database.Modified = true;

            return CredentialMutationResult.Ok(new CredentialEntry
            {
                EntryId = entry.Uuid.ToHexString(),
                Title = entry.Strings.ReadSafe(PwDefs.TitleField),
                UserName = entry.Strings.ReadSafe(PwDefs.UserNameField),
                Url = entry.Strings.ReadSafe(PwDefs.UrlField),
                Group = groupPath,
                Password = payload.Password ?? string.Empty,
                CustomFields = ExtractResultCustomFields(payload.CustomFields)
            });
        }

        public CredentialMutationResult Update(PwDatabase database, UpdateLoginPayload payload)
        {
            if (database == null || database.RootGroup == null)
                return CredentialMutationResult.Fail("database_not_open", "KeePass database is not open.");

            if (payload == null)
                return CredentialMutationResult.Fail("invalid_payload", "Login update payload is required.");

            if (string.IsNullOrWhiteSpace(payload.EntryId))
                return CredentialMutationResult.Fail("missing_entry_id", "Entry ID is required.");

            if (string.IsNullOrWhiteSpace(payload.Title) &&
                string.IsNullOrWhiteSpace(payload.Url) &&
                payload.Group == null &&
                string.IsNullOrWhiteSpace(payload.UserName) &&
                string.IsNullOrWhiteSpace(payload.Password) &&
                string.IsNullOrWhiteSpace(payload.Otp) &&
                !HasCustomFields(payload.CustomFields) &&
                !payload.ReplaceCustomFields &&
                !payload.ClearOtp)
                return CredentialMutationResult.Fail("missing_update_fields", "At least one login field is required.");

            EntryLocation location = FindEntryLocation(database.RootGroup, payload.EntryId);
            if (location == null || location.Entry == null)
                return CredentialMutationResult.Fail("entry_not_found", "KeePass entry was not found.");
            PwEntry entry = location.Entry;

            string entryUrl = entry.Strings.ReadSafe(PwDefs.UrlField);
            if (!string.IsNullOrWhiteSpace(payload.PageUrl) && !EntryUrlMatcher.IsMatch(entry, payload.PageUrl))
                return CredentialMutationResult.Fail("url_mismatch", "Entry URL does not match the page URL.");

            if (!string.IsNullOrWhiteSpace(payload.Title))
                entry.Strings.Set(PwDefs.TitleField, new ProtectedString(false, payload.Title.Trim()));

            if (!string.IsNullOrWhiteSpace(payload.Url))
                entry.Strings.Set(PwDefs.UrlField, new ProtectedString(false, payload.Url.Trim()));

            if (!string.IsNullOrWhiteSpace(payload.UserName))
                entry.Strings.Set(PwDefs.UserNameField, new ProtectedString(false, payload.UserName));

            if (!string.IsNullOrWhiteSpace(payload.Password))
                entry.Strings.Set(PwDefs.PasswordField, new ProtectedString(true, payload.Password));

            if (payload.ClearOtp)
                entry.Strings.Remove("otp");

            if (!string.IsNullOrWhiteSpace(payload.Otp))
                entry.Strings.Set("otp", new ProtectedString(true, payload.Otp.Trim()));

            if (payload.ReplaceCustomFields)
                RemoveReplacedCustomFields(entry, payload.CustomFields);

            AddCustomFields(entry, payload.CustomFields);

            string groupPath = string.Empty;
            if (payload.Group != null)
            {
                PwGroup targetGroup = FindOrCreateGroupPath(database.RootGroup, payload.Group);
                groupPath = GroupPathFromPayload(payload.Group);
                if (!object.ReferenceEquals(location.Group, targetGroup))
                {
                    location.Group.Entries.Remove(entry);
                    targetGroup.AddEntry(entry, true);
                }
            }

            entry.Touch(true, false);
            database.Modified = true;

            return CredentialMutationResult.Ok(new CredentialEntry
            {
                EntryId = entry.Uuid.ToHexString(),
                Title = entry.Strings.ReadSafe(PwDefs.TitleField),
                UserName = entry.Strings.ReadSafe(PwDefs.UserNameField),
                Url = entry.Strings.ReadSafe(PwDefs.UrlField),
                Group = groupPath,
                Password = entry.Strings.ReadSafe(PwDefs.PasswordField),
                CustomFields = ExtractResultCustomFields(payload.CustomFields)
            });
        }

        public CredentialMutationResult AcknowledgeFill(PwDatabase database, FillAckPayload payload)
        {
            if (database == null || database.RootGroup == null)
                return CredentialMutationResult.Fail("database_not_open", "KeePass database is not open.");

            if (payload == null)
                return CredentialMutationResult.Fail("invalid_payload", "Fill acknowledgement payload is required.");

            if (string.IsNullOrWhiteSpace(payload.EntryId))
                return CredentialMutationResult.Fail("missing_entry_id", "Entry ID is required.");

            PwEntry entry = FindEntryById(database.RootGroup, payload.EntryId);
            if (entry == null)
                return CredentialMutationResult.Fail("entry_not_found", "KeePass entry was not found.");

            if (!string.IsNullOrWhiteSpace(payload.Url) && !EntryUrlMatcher.IsMatch(entry, payload.Url))
                return CredentialMutationResult.Fail("url_mismatch", "Entry URL does not match the page URL.");

            entry.Touch(false, false);
            database.Modified = true;

            return CredentialMutationResult.Ok(new CredentialEntry
            {
                EntryId = entry.Uuid.ToHexString(),
                Title = entry.Strings.ReadSafe(PwDefs.TitleField),
                UserName = entry.Strings.ReadSafe(PwDefs.UserNameField),
                Url = entry.Strings.ReadSafe(PwDefs.UrlField)
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

        private static void AddCustomFields(PwEntry entry, CustomField[] fields)
        {
            if (entry == null || fields == null) return;

            foreach (CustomField field in fields)
            {
                if (field == null || string.IsNullOrWhiteSpace(field.Name)) continue;
                string name = field.Name.Trim();
                if (IsReservedStringField(name)) continue;
                string value = field.Value ?? string.Empty;
                if (string.IsNullOrWhiteSpace(value)) continue;
                entry.Strings.Set(name, new ProtectedString(field.IsProtected, value));
            }
        }

        private static bool HasCustomFields(CustomField[] fields)
        {
            if (fields == null) return false;
            foreach (CustomField field in fields)
            {
                if (field != null &&
                    !string.IsNullOrWhiteSpace(field.Name) &&
                    !string.IsNullOrWhiteSpace(field.Value) &&
                    !IsReservedStringField(field.Name.Trim()))
                    return true;
            }
            return false;
        }

        private static void RemoveReplacedCustomFields(PwEntry entry, CustomField[] replacementFields)
        {
            if (entry == null || entry.Strings == null) return;

            System.Collections.Generic.HashSet<string> keep = new System.Collections.Generic.HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (replacementFields != null)
            {
                foreach (CustomField field in replacementFields)
                {
                    if (field == null || string.IsNullOrWhiteSpace(field.Name) || string.IsNullOrWhiteSpace(field.Value)) continue;
                    string name = field.Name.Trim();
                    if (!IsReservedStringField(name)) keep.Add(name);
                }
            }

            System.Collections.Generic.List<string> remove = new System.Collections.Generic.List<string>();
            foreach (System.Collections.Generic.KeyValuePair<string, ProtectedString> item in entry.Strings)
            {
                if (IsReservedStringField(item.Key)) continue;
                if (item.Value != null && item.Value.IsProtected) continue;
                if (!keep.Contains(item.Key)) remove.Add(item.Key);
            }

            foreach (string name in remove)
            {
                entry.Strings.Remove(name);
            }
        }

        private static CustomField[] ExtractResultCustomFields(CustomField[] fields)
        {
            if (fields == null) return new CustomField[0];
            System.Collections.Generic.List<CustomField> result = new System.Collections.Generic.List<CustomField>();
            foreach (CustomField field in fields)
            {
                if (field == null || string.IsNullOrWhiteSpace(field.Name) || string.IsNullOrWhiteSpace(field.Value)) continue;
                string name = field.Name.Trim();
                if (IsReservedStringField(name)) continue;
                result.Add(new CustomField
                {
                    Name = name,
                    Value = field.IsProtected ? string.Empty : field.Value,
                    IsProtected = field.IsProtected
                });
            }
            return result.ToArray();
        }

        private static bool IsReservedStringField(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return true;
            if (string.Equals(name, PwDefs.TitleField, StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(name, PwDefs.UserNameField, StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(name, PwDefs.PasswordField, StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(name, PwDefs.UrlField, StringComparison.OrdinalIgnoreCase)) return true;
            if (name.StartsWith(PwDefs.UrlField + " (", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(name, "otp", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(name, "TOTP Seed", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(name, "TOTP Secret", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(name, "TOTP", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(name, "TimeOtp-Secret-Base32", StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        private static PwGroup FindOrCreateGroupPath(PwGroup rootGroup, string groupPath)
        {
            PwGroup current = rootGroup;
            foreach (string segment in GroupSegments(groupPath))
            {
                PwGroup child = FindChildGroup(current, segment);
                if (child == null)
                {
                    child = new PwGroup(true, true, segment, PwIcon.Folder);
                    current.AddGroup(child, true);
                }
                current = child;
            }
            return current;
        }

        private static PwGroup FindChildGroup(PwGroup parent, string name)
        {
            foreach (PwGroup child in parent.Groups)
            {
                if (string.Equals(child.Name, name, StringComparison.OrdinalIgnoreCase))
                    return child;
            }
            return null;
        }

        private static string GroupPathFromPayload(string groupPath)
        {
            return string.Join("/", GroupSegments(groupPath));
        }

        private static string[] GroupSegments(string groupPath)
        {
            if (string.IsNullOrWhiteSpace(groupPath)) return new string[0];
            string[] rawSegments = groupPath.Split(new[] { '/', '\\' }, StringSplitOptions.RemoveEmptyEntries);
            System.Collections.Generic.List<string> segments = new System.Collections.Generic.List<string>();
            foreach (string rawSegment in rawSegments)
            {
                string segment = rawSegment.Trim();
                if (segment.Length > 0) segments.Add(segment);
            }
            return segments.ToArray();
        }

        private static PwEntry FindEntryById(PwGroup group, string entryId)
        {
            EntryLocation location = FindEntryLocation(group, entryId);
            return location == null ? null : location.Entry;
        }

        private static EntryLocation FindEntryLocation(PwGroup group, string entryId)
        {
            if (group == null) return null;

            foreach (PwEntry entry in group.Entries)
            {
                if (string.Equals(entry.Uuid.ToHexString(), entryId, StringComparison.OrdinalIgnoreCase))
                    return new EntryLocation { Group = group, Entry = entry };
            }

            foreach (PwGroup child in group.Groups)
            {
                EntryLocation match = FindEntryLocation(child, entryId);
                if (match != null) return match;
            }

            return null;
        }

        private sealed class EntryLocation
        {
            public PwGroup Group { get; set; }
            public PwEntry Entry { get; set; }
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
