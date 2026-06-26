namespace KeePassBrowserBridge.Bridge
{
    internal static class BridgeSettings
    {
        public const string ProductName = "KeePass Browser Bridge";
        public const string PluginVersion = "2.1.0";
        public const string EnabledConfigKey = "KeePassBrowserBridge.Enabled";
        public const string PortConfigKey = "KeePassBrowserBridge.Port";
        public const string TrustedClientsConfigKey = "KeePassBrowserBridge.TrustedClients";
        public const string UpdateInfoUrl = "https://raw.githubusercontent.com/hieuck/KeePassBrowserBridge/main/update/versioninfo.txt";
        public const string PasskeysConfigKey = "KeePassBrowserBridge.PasskeysEnabled";
        public const int DefaultPort = 19455;

        private static string s_passkeysConfigValue;

        internal static void TestSetPasskeysConfigValue(string value)
        {
            s_passkeysConfigValue = value;
        }

        public static bool PasskeysEnabled
        {
            get
            {
                if (s_passkeysConfigValue == null) return true;
                bool result;
                return !bool.TryParse(s_passkeysConfigValue, out result) || result;
            }
        }
    }
}
