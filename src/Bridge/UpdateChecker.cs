using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class UpdateInfo
    {
        public string LatestVersion;
        public string ReleaseUrl;
        public string AssetUrl;
        public string ChecksumAssetUrl;
        public bool IsUpdateAvailable;
    }

    internal static class UpdateChecker
    {
        public const string ReleasesApiUrl = "https://api.github.com/repos/hieuck/KeePassBrowserBridge/releases";
        public const string ReleasesUrl = "https://github.com/hieuck/KeePassBrowserBridge/releases";
        private const string PluginAssetName = "KeePassBrowserBridge.plgx";
        private const string ChecksumAssetName = "SHA256SUMS.txt";

        public static string GetCurrentVersion()
        {
            Assembly assembly = typeof(UpdateChecker).Assembly;
            object[] attrs = assembly.GetCustomAttributes(typeof(AssemblyInformationalVersionAttribute), false);
            if (attrs.Length > 0)
            {
                AssemblyInformationalVersionAttribute attr = (AssemblyInformationalVersionAttribute)attrs[0];
                if (!string.IsNullOrEmpty(attr.InformationalVersion))
                    return StripVersionMetadata(attr.InformationalVersion);
            }

            Version version = assembly.GetName().Version;
            return (version != null) ? version.ToString(3) : BridgeSettings.PluginVersion;
        }

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
            return CheckLatest(PluginAssetName);
        }

        public static UpdateInfo CheckLatest(string pluginAssetName)
        {
#if NET8_0_OR_GREATER
#pragma warning disable SYSLIB0014
#endif
            using (WebClient client = new WebClient())
#if NET8_0_OR_GREATER
#pragma warning restore SYSLIB0014
#endif
            {
                client.Headers[HttpRequestHeader.UserAgent] = "KeePassBrowserBridge";
                client.Headers[HttpRequestHeader.Accept] = "application/vnd.github+json";
                string json = client.DownloadString(ReleasesApiUrl);
                return CreateUpdateInfoFromReleasesJson(json);
            }
        }

        public static UpdateInfo CreateUpdateInfoFromReleasesJson(string json)
        {
            string newestTag = string.Empty;
            string newestAssetUrl = string.Empty;
            string newestChecksumAssetUrl = string.Empty;
            Version newestVersion = null;

            foreach (string releaseJson in ExtractTopLevelObjects(json))
            {
                if (ExtractJsonBoolean(releaseJson, "draft")) continue;
                if (ExtractJsonBoolean(releaseJson, "prerelease")) continue;

                string tagName = ExtractFirstJsonString(releaseJson, "tag_name");
                Version version;
                if (!TryParseVersion(tagName, out version)) continue;

                string assetUrl = FindAssetDownloadUrl(releaseJson, PluginAssetName);
                if (string.IsNullOrEmpty(assetUrl)) continue;

                string checksumAssetUrl = FindAssetDownloadUrl(releaseJson, ChecksumAssetName);
                if (string.IsNullOrEmpty(checksumAssetUrl)) continue;

                if (newestVersion == null || version.CompareTo(newestVersion) > 0)
                {
                    newestVersion = version;
                    newestTag = tagName;
                    newestAssetUrl = assetUrl;
                    newestChecksumAssetUrl = checksumAssetUrl;
                }
            }

            UpdateInfo info = CreateUpdateInfo(newestTag);
            if (!string.IsNullOrEmpty(newestAssetUrl))
                info.AssetUrl = newestAssetUrl;
            if (!string.IsNullOrEmpty(newestChecksumAssetUrl))
                info.ChecksumAssetUrl = newestChecksumAssetUrl;
            return info;
        }

        public static UpdateInfo CreateUpdateInfo(string tagName)
        {
            return CreateUpdateInfo(tagName, PluginAssetName);
        }

        public static UpdateInfo CreateUpdateInfo(string tagName, string pluginAssetName)
        {
            UpdateInfo info = new UpdateInfo();
            info.LatestVersion = tagName ?? string.Empty;
            info.ReleaseUrl = BuildReleaseUrl(tagName);
            info.AssetUrl = BuildReleaseAssetUrl(tagName, PluginAssetName);
            info.ChecksumAssetUrl = BuildReleaseAssetUrl(tagName, ChecksumAssetName);
            info.IsUpdateAvailable = IsNewerVersion(GetCurrentVersion(), tagName);
            return info;
        }

        public static string GetExpectedSha256(string checksumText, string assetName)
        {
            if (string.IsNullOrEmpty(checksumText) || string.IsNullOrEmpty(assetName)) return string.Empty;

            string[] lines = checksumText.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');
            foreach (string line in lines)
            {
                Match match = Regex.Match(line,
                    "^\\s*(?<hash>[0-9a-fA-F]{64})\\s+(?<name>\\S+)\\s*$");
                if (!match.Success) continue;

                if (string.Equals(match.Groups["name"].Value, assetName, StringComparison.Ordinal))
                    return match.Groups["hash"].Value.ToLowerInvariant();
            }

            return string.Empty;
        }

        public static bool VerifyFileSha256(string filePath, string expectedSha256)
        {
            if (string.IsNullOrEmpty(filePath) || string.IsNullOrEmpty(expectedSha256)) return false;
            if (!Regex.IsMatch(expectedSha256, "^[0-9a-fA-F]{64}$")) return false;
            if (!File.Exists(filePath)) return false;

            string actualSha256 = ComputeFileSha256(filePath);
            return string.Equals(actualSha256, expectedSha256.ToLowerInvariant(), StringComparison.Ordinal);
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

            string normalized = StripVersionMetadata(value);
            if (normalized.StartsWith("v", StringComparison.OrdinalIgnoreCase))
                normalized = normalized.Substring(1);

            return Version.TryParse(normalized, out version);
        }

        private static string StripVersionMetadata(string value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;

            string normalized = value.Trim();
            int metadataIndex = normalized.IndexOf('+');
            if (metadataIndex >= 0)
                normalized = normalized.Substring(0, metadataIndex);

            return normalized;
        }

        private static string BuildReleaseAssetUrl(string tagName, string assetName)
        {
            if (string.IsNullOrEmpty(tagName)) return ReleasesUrl;
            return ReleasesUrl + "/download/" + tagName + "/" + assetName;
        }

        private static string BuildReleaseUrl(string tagName)
        {
            if (string.IsNullOrEmpty(tagName)) return ReleasesUrl;
            return ReleasesUrl + "/tag/" + tagName;
        }

        private static string FindAssetDownloadUrl(string releaseJson, string assetName)
        {
            string assetsJson = ExtractJsonArray(releaseJson, "assets");
            foreach (string assetJson in ExtractTopLevelObjects(assetsJson))
            {
                if (!string.Equals(ExtractFirstJsonString(assetJson, "name"), assetName, StringComparison.Ordinal))
                    continue;

                return ExtractFirstJsonString(assetJson, "browser_download_url");
            }

            return string.Empty;
        }

        private static string ComputeFileSha256(string filePath)
        {
            using (FileStream stream = File.OpenRead(filePath))
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hash = sha256.ComputeHash(stream);
                char[] chars = new char[hash.Length * 2];
                for (int i = 0; i < hash.Length; ++i)
                {
                    byte value = hash[i];
                    chars[i * 2] = ToHexChar(value >> 4);
                    chars[i * 2 + 1] = ToHexChar(value & 0x0F);
                }
                return new string(chars);
            }
        }

        private static char ToHexChar(int value)
        {
            return (char)(value < 10 ? '0' + value : 'a' + value - 10);
        }

        private static string ExtractFirstJsonString(string json, string name)
        {
            List<string> values = ExtractJsonStrings(json, name);
            return values.Count > 0 ? values[0] : string.Empty;
        }

        private static bool ExtractJsonBoolean(string json, string name)
        {
            if (string.IsNullOrEmpty(json)) return false;

            Match match = Regex.Match(json,
                "\"" + Regex.Escape(name) + "\"\\s*:\\s*(?<value>true|false)",
                RegexOptions.IgnoreCase);
            return match.Success && string.Equals(match.Groups["value"].Value, "true", StringComparison.OrdinalIgnoreCase);
        }

        private static string ExtractJsonArray(string json, string name)
        {
            if (string.IsNullOrEmpty(json)) return string.Empty;

            Match match = Regex.Match(json, "\"" + Regex.Escape(name) + "\"\\s*:\\s*\\[");
            if (!match.Success) return string.Empty;

            int start = match.Index + match.Length - 1;
            int depth = 0;
            bool inString = false;
            bool escape = false;

            for (int i = start; i < json.Length; ++i)
            {
                char ch = json[i];
                if (escape)
                {
                    escape = false;
                    continue;
                }

                if (inString)
                {
                    if (ch == '\\') escape = true;
                    else if (ch == '"') inString = false;
                    continue;
                }

                if (ch == '"')
                {
                    inString = true;
                }
                else if (ch == '[')
                {
                    depth += 1;
                }
                else if (ch == ']')
                {
                    depth -= 1;
                    if (depth == 0)
                        return json.Substring(start, i - start + 1);
                }
            }

            return string.Empty;
        }

        private static List<string> ExtractTopLevelObjects(string json)
        {
            List<string> objects = new List<string>();
            if (string.IsNullOrEmpty(json)) return objects;

            int depth = 0;
            int objectStart = -1;
            bool inString = false;
            bool escape = false;

            for (int i = 0; i < json.Length; ++i)
            {
                char ch = json[i];
                if (escape)
                {
                    escape = false;
                    continue;
                }

                if (inString)
                {
                    if (ch == '\\') escape = true;
                    else if (ch == '"') inString = false;
                    continue;
                }

                if (ch == '"')
                {
                    inString = true;
                }
                else if (ch == '{')
                {
                    if (depth == 0) objectStart = i;
                    depth += 1;
                }
                else if (ch == '}')
                {
                    depth -= 1;
                    if (depth == 0 && objectStart >= 0)
                    {
                        objects.Add(json.Substring(objectStart, i - objectStart + 1));
                        objectStart = -1;
                    }
                }
            }

            return objects;
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
