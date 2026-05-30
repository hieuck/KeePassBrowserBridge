using System;
using Xunit;
using KeePassBrowserBridge.Bridge;

namespace KeePassBrowserBridge.Tests
{
    public class UrlMatcherTests
    {
        [Theory]
        [InlineData("https://example.com", "https://example.com", true)]
        [InlineData("https://example.com", "https://www.example.com", false)]
        [InlineData("https://*.example.com", "https://www.example.com", true)]
        [InlineData("https://*.example.com", "https://mail.example.com", true)]
        [InlineData("https://*.example.com", "https://example.com", false)]
        [InlineData("https://example.com/login", "https://example.com/login", true)]
        [InlineData("https://example.com/login*", "https://example.com/login/page", true)]
        public void IsMatch_WildcardPatterns_WorkCorrectly(string entryUrl, string pageUrl, bool expected)
        {
            bool result = UrlMatcher.IsMatch(entryUrl, pageUrl);
            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData("regex:https://.*\\.example\\.com", "https://www.example.com", true)]
        [InlineData("regex:https://.*\\.example\\.com", "https://mail.example.com", true)]
        [InlineData("regex:https://.*\\.example\\.com", "https://example.com", false)]
        [InlineData("regex:https://example\\.com/login.*", "https://example.com/login", true)]
        [InlineData("regex:https://example\\.com/login.*", "https://example.com/login/page", true)]
        [InlineData("regex:https://example\\.com/login.*", "https://example.com/register", false)]
        public void IsMatch_RegexPatterns_WorkCorrectly(string entryUrl, string pageUrl, bool expected)
        {
            bool result = UrlMatcher.IsMatch(entryUrl, pageUrl);
            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData("regex:invalid[regex", "https://example.com", false)]
        [InlineData("regex:", "https://example.com", false)]
        public void IsMatch_InvalidRegex_ReturnsFalse(string entryUrl, string pageUrl, bool expected)
        {
            bool result = UrlMatcher.IsMatch(entryUrl, pageUrl);
            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData("", "https://example.com", false)]
        [InlineData("https://example.com", "", false)]
        [InlineData(null, "https://example.com", false)]
        [InlineData("https://example.com", null, false)]
        public void IsMatch_EmptyOrNull_ReturnsFalse(string entryUrl, string pageUrl, bool expected)
        {
            bool result = UrlMatcher.IsMatch(entryUrl, pageUrl);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void TryGetHost_ValidUrl_ReturnsHost()
        {
            string host;
            bool result = UrlMatcher.TryGetHost("https://www.example.com/path", out host);
            
            Assert.True(result);
            Assert.Equal("www.example.com", host);
        }

        [Fact]
        public void TryGetHost_InvalidUrl_ReturnsFalse()
        {
            string host;
            bool result = UrlMatcher.TryGetHost("not a url", out host);
            
            Assert.False(result);
            Assert.Null(host);
        }
    }
}
