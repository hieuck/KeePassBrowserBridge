using System;
using System.Text.RegularExpressions;

namespace KeePassBrowserBridge.Bridge
{
    internal static class UrlMatcher
    {
        public static bool IsMatch(string entryUrl, string pageUrl)
        {
            UrlPattern entryPattern;
            Uri pageUri;

            if (!TryGetPattern(entryUrl, out entryPattern)) return false;
            if (!TryGetUri(pageUrl, out pageUri)) return false;

            if (!HostMatches(entryPattern.Host, pageUri.IdnHost)) return false;
            return PathMatches(entryPattern.Path, pageUri.AbsolutePath);
        }

        public static bool TryGetHost(string url, out string host)
        {
            host = null;
            Uri uri;
            if (!TryGetUri(url, out uri)) return false;

            host = uri.IdnHost.ToLowerInvariant();
            return true;
        }

        private static bool TryGetUri(string url, out Uri uri)
        {
            uri = null;
            if (string.IsNullOrWhiteSpace(url)) return false;
            if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out uri)) return false;
            return !string.IsNullOrWhiteSpace(uri.Host);
        }

        private static bool TryGetPattern(string url, out UrlPattern pattern)
        {
            pattern = null;
            Uri uri;
            if (TryGetUri(url, out uri))
            {
                pattern = new UrlPattern(uri.IdnHost, uri.AbsolutePath);
                return true;
            }

            string value = string.IsNullOrWhiteSpace(url) ? string.Empty : url.Trim();
            int schemeIndex = value.IndexOf("://", StringComparison.Ordinal);
            if (schemeIndex <= 0) return false;

            int hostStart = schemeIndex + 3;
            int pathStart = value.IndexOf('/', hostStart);
            string host = pathStart < 0 ? value.Substring(hostStart) : value.Substring(hostStart, pathStart - hostStart);
            string path = pathStart < 0 ? "/" : value.Substring(pathStart);
            if (string.IsNullOrWhiteSpace(host)) return false;
            if (host.IndexOf('*') < 0 && path.IndexOf('*') < 0) return false;

            pattern = new UrlPattern(host.ToLowerInvariant(), string.IsNullOrEmpty(path) ? "/" : path);
            return true;
        }

        private static bool HostMatches(string entryHost, string pageHost)
        {
            if (string.IsNullOrWhiteSpace(entryHost) || string.IsNullOrWhiteSpace(pageHost)) return false;

            string entry = entryHost.ToLowerInvariant();
            string page = pageHost.ToLowerInvariant();
            if (entry.StartsWith("*.", StringComparison.Ordinal))
            {
                string suffix = entry.Substring(1);
                return page.EndsWith(suffix, StringComparison.Ordinal) && page.Length > suffix.Length;
            }

            if (entry.IndexOf('*') >= 0)
            {
                return WildcardMatches(entry, page);
            }

            return string.Equals(entry, page, StringComparison.OrdinalIgnoreCase);
        }

        private static bool PathMatches(string entryPath, string pagePath)
        {
            string entry = string.IsNullOrEmpty(entryPath) ? "/" : entryPath;
            string page = string.IsNullOrEmpty(pagePath) ? "/" : pagePath;

            if (entry.IndexOf('*') >= 0) return WildcardMatches(entry, page);
            return true;
        }

        private static bool WildcardMatches(string pattern, string value)
        {
            string regex = "^" + Regex.Escape(pattern).Replace("\\*", ".*") + "$";
            return Regex.IsMatch(value, regex, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }

        private sealed class UrlPattern
        {
            public readonly string Host;
            public readonly string Path;

            public UrlPattern(string host, string path)
            {
                Host = host;
                Path = path;
            }
        }
    }
}
