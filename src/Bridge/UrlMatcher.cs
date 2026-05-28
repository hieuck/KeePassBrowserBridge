using System;

namespace KeePassBrowserBridge.Bridge
{
    internal static class UrlMatcher
    {
        public static bool IsMatch(string entryUrl, string pageUrl)
        {
            string entryHost;
            string pageHost;

            if (!TryGetHost(entryUrl, out entryHost)) return false;
            if (!TryGetHost(pageUrl, out pageHost)) return false;

            return string.Equals(entryHost, pageHost, StringComparison.OrdinalIgnoreCase);
        }

        public static bool TryGetHost(string url, out string host)
        {
            host = null;
            if (string.IsNullOrWhiteSpace(url)) return false;

            Uri uri;
            if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out uri)) return false;
            if (string.IsNullOrWhiteSpace(uri.Host)) return false;

            host = uri.IdnHost.ToLowerInvariant();
            return true;
        }
    }
}
