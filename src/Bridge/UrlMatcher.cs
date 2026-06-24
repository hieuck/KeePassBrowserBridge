using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace KeePassBrowserBridge.Bridge
{
    internal static class UrlMatcher
    {
        private static readonly Dictionary<string, Regex> _regexCache = new Dictionary<string, Regex>();
        private static readonly object _cacheLock = new object();

        public static bool IsMatch(string entryUrl, string pageUrl)
        {
            return IsMatch(entryUrl, pageUrl, new CredentialQueryOptions
            {
                StrictUrlMatching = true,
                RegexUrlMatching = true
            });
        }

        public static bool IsMatch(string entryUrl, string pageUrl, CredentialQueryOptions options)
        {
            if (string.IsNullOrWhiteSpace(entryUrl) || string.IsNullOrWhiteSpace(pageUrl))
                return false;

            CredentialQueryOptions effectiveOptions = options ?? new CredentialQueryOptions();

            // Support regex: prefix for regex patterns
            if (entryUrl.StartsWith("regex:", StringComparison.OrdinalIgnoreCase))
            {
                if (!effectiveOptions.RegexUrlMatching) return false;

                string regexPattern = entryUrl.Substring(6);
                if (string.IsNullOrWhiteSpace(regexPattern))
                    return false;

                try
                {
                    Regex regex;
                    lock (_cacheLock)
                    {
                        if (!_regexCache.TryGetValue(regexPattern, out regex))
                        {
                            regex = new Regex(regexPattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
                            _regexCache[regexPattern] = regex;
                        }
                    }
                    return regex.IsMatch(pageUrl);
                }
                catch (ArgumentException)
                {
                    return false;
                }
            }

            UrlPattern entryPattern;
            Uri pageUri;

            if (!TryGetPattern(entryUrl, out entryPattern)) return false;
            if (!TryGetUri(pageUrl, out pageUri)) return false;

            if (!HostMatches(entryPattern.Host, pageUri.Host, effectiveOptions.StrictUrlMatching)) return false;
            return PathMatches(entryPattern.Path, pageUri.AbsolutePath);
        }

        public static bool TryGetHost(string url, out string host)
        {
            host = null;
            Uri uri;
            if (!TryGetUri(url, out uri)) return false;

            host = uri.Host.ToLowerInvariant();
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
                pattern = new UrlPattern(uri.Host, uri.AbsolutePath);
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

        private static bool HostMatches(string entryHost, string pageHost, bool strictUrlMatching)
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

            if (string.Equals(entry, page, StringComparison.OrdinalIgnoreCase)) return true;
            if (strictUrlMatching) return false;

            if (page.EndsWith("." + entry, StringComparison.OrdinalIgnoreCase)) return true;

            string entryWithoutWww = StripWwwPrefix(entry);
            string pageWithoutWww = StripWwwPrefix(page);
            return string.Equals(entryWithoutWww, pageWithoutWww, StringComparison.OrdinalIgnoreCase);
        }

        private static string StripWwwPrefix(string host)
        {
            const string Prefix = "www.";
            if (string.IsNullOrWhiteSpace(host)) return host;
            return host.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase)
                ? host.Substring(Prefix.Length)
                : host;
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
