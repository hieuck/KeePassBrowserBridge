using System;
using System.Collections.Generic;
using System.Net;
using System.Text.RegularExpressions;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class UpdateInfo
    {
        public string LatestVersion;
        public string ReleaseUrl;
        public string AssetUrl;
        public bool IsUpdateAvailable;
    }

    internal static class UpdateChecker
    {
        public const string ReleasesApiUrl = "https://api.github.com/repos/hieuck/KeePassBrowserBridge/releases";
        public const string ReleasesUrl = "https://github.com/hieuck/KeePassBrowserBridge/releases";
        private const string PluginAssetName = "KeePassBrowserBridge.plgx";

        public static bool IsNewerVersion(string currentVersion, string candidateVersion)
        {
            Version current;
            Version candidate;
            if (!TryParseVersion(currentVersion, out current)) return false;
            if (!TryParseVersion(candidateVersion, out candidate)) return false;
            return candidate.CompareTo(current) > 0;
        }

        public static UpdateInfo CheckLatest()
        {
            using (WebClient client = new WebClient())
            {
                client.Headers[HttpRequestHeader.UserAgent] = "KeePassBrowserBridge";
                client.Headers[HttpRequestHeader.Accept] = "application/vnd.github+json";
                string json = client.DownloadString(ReleasesApiUrl);
                string tagName = GetNewestVersionTag(ExtractJsonStrings(json, "tag_name").ToArray());
                UpdateInfo info = CreateUpdateInfo(tagName);
                info.IsUpdateAvailable = IsNewerVersion(BridgeSettings.PluginVersion, tagName);
                return info;
            }
        }

        public static UpdateInfo CreateUpdateInfo(string tagName)
        {
            UpdateInfo info = new UpdateInfo();
            info.LatestVersion = tagName ?? string.Empty;
            info.ReleaseUrl = BuildReleaseUrl(tagName);
            info.AssetUrl = BuildPlgxAssetUrl(tagName);
            info.IsUpdateAvailable = IsNewerVersion(BridgeSettings.PluginVersion, tagName);
            return info;
        }

        public static string GetNewestVersionTag(string[] tags)
        {
            string newestTag = string.Empty;
            Version newestVersion = null;

            foreach (string tag in tags ?? new string[0])
            {
                Version version;
                if (!TryParseVersion(tag, out version)) continue;

                if (newestVersion == null || version.CompareTo(newestVersion) > 0)
                {
                    newestVersion = version;
                    newestTag = tag;
                }
            }

            return newestTag;
        }

        private static bool TryParseVersion(string value, out Version version)
        {
            version = null;
            if (string.IsNullOrEmpty(value)) return false;

            string normalized = value.Trim();
            if (normalized.StartsWith("v", StringComparison.OrdinalIgnoreCase))
                normalized = normalized.Substring(1);

            return Version.TryParse(normalized, out version);
        }

        private static string BuildPlgxAssetUrl(string tagName)
        {
            if (string.IsNullOrEmpty(tagName)) return ReleasesUrl;
            return ReleasesUrl + "/download/" + tagName + "/" + PluginAssetName;
        }

        private static string BuildReleaseUrl(string tagName)
        {
            if (string.IsNullOrEmpty(tagName)) return ReleasesUrl;
            return ReleasesUrl + "/tag/" + tagName;
        }

        private static List<string> ExtractJsonStrings(string json, string name)
        {
            List<string> values = new List<string>();
            if (string.IsNullOrEmpty(json)) return values;

            MatchCollection matches = Regex.Matches(json,
                "\"" + Regex.Escape(name) + "\"\\s*:\\s*\"(?<value>(?:\\\\.|[^\"])*)\"");
            foreach (Match match in matches)
            {
                if (match.Success)
                    values.Add(Regex.Unescape(match.Groups["value"].Value));
            }

            return values;
        }
    }
}
