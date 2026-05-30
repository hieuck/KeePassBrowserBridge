using System;

namespace KeePassBrowserBridge.Bridge
{
    internal static class BridgeClock
    {
        private static readonly DateTime UnixEpochUtc = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        public static long UtcNowMilliseconds()
        {
            return (long)(DateTime.UtcNow - UnixEpochUtc).TotalMilliseconds;
        }

        public static DateTime FromUtcMilliseconds(long utcMilliseconds)
        {
            return UnixEpochUtc.AddMilliseconds(utcMilliseconds);
        }
    }
}
