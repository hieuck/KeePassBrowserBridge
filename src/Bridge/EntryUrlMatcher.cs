using System;
using System.Collections.Generic;
using KeePassLib;
using KeePassLib.Security;

namespace KeePassBrowserBridge.Bridge
{
    internal static class EntryUrlMatcher
    {
        public static bool IsMatch(PwEntry entry, string pageUrl)
        {
            if (entry == null) return false;

            foreach (KeyValuePair<string, ProtectedString> item in entry.Strings)
            {
                if (!IsUrlFieldName(item.Key)) continue;
                if (UrlMatcher.IsMatch(ReadProtectedString(item.Value), pageUrl)) return true;
            }

            return false;
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
    }
}
