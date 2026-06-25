using System;

namespace KeePassBrowserBridge.Bridge
{
    internal static class BridgeMethodPolicy
    {
        private static readonly string[] s_allMethods = new string[]
        {
            BridgeMethods.Hello,
            BridgeMethods.PairBegin,
            BridgeMethods.PairComplete,
            BridgeMethods.PairCancel,
            BridgeMethods.ClientStatus,
            BridgeMethods.ClientsList,
            BridgeMethods.ClientsRevoke,
            BridgeMethods.ClientsUpdatePermissions,
            BridgeMethods.LoginsQuery,
            BridgeMethods.LoginsCreate,
            BridgeMethods.LoginsUpdate,
            BridgeMethods.LoginsFillAck,
            BridgeMethods.PasskeysCreateBegin,
            BridgeMethods.PasskeysCreateComplete,
            BridgeMethods.PasskeysGetBegin,
            BridgeMethods.PasskeysGetComplete,
            BridgeMethods.PasskeysList,
            BridgeMethods.PasskeysCancel,
            BridgeMethods.PasskeysRevoke,
            BridgeMethods.DatabaseLock,
            BridgeMethods.DatabaseGroups
        };

        public static string[] AllMethods()
        {
            string[] copy = new string[s_allMethods.Length];
            Array.Copy(s_allMethods, copy, s_allMethods.Length);
            return copy;
        }

        public static bool IsKnownMethod(string method)
        {
            if (string.IsNullOrEmpty(method)) return false;
            foreach (string knownMethod in s_allMethods)
            {
                if (string.Equals(knownMethod, method, StringComparison.Ordinal))
                    return true;
            }

            return false;
        }

        public static bool RequiresAuthentication(string method)
        {
            return method != BridgeMethods.Hello &&
                method != BridgeMethods.PairBegin &&
                method != BridgeMethods.PairComplete &&
                method != BridgeMethods.PairCancel;
        }

        public static string RequiredPermission(string method)
        {
            if (method == BridgeMethods.LoginsQuery || method == BridgeMethods.ClientStatus)
                return TrustedClientPermissions.Read;
            if (method == BridgeMethods.LoginsCreate ||
                method == BridgeMethods.LoginsUpdate ||
                method == BridgeMethods.LoginsFillAck ||
                method == BridgeMethods.DatabaseLock)
                return TrustedClientPermissions.Write;
            if (method == BridgeMethods.ClientsList ||
                method == BridgeMethods.ClientsRevoke ||
                method == BridgeMethods.ClientsUpdatePermissions)
                return TrustedClientPermissions.ManageClients;
            if (method == BridgeMethods.PasskeysList ||
                method == BridgeMethods.PasskeysGetBegin ||
                method == BridgeMethods.PasskeysGetComplete)
                return TrustedClientPermissions.PasskeyRead;
            if (method == BridgeMethods.PasskeysCancel)
                return TrustedClientPermissions.Read;
            if (method == BridgeMethods.PasskeysCreateBegin ||
                method == BridgeMethods.PasskeysCreateComplete ||
                method == BridgeMethods.PasskeysRevoke)
                return TrustedClientPermissions.PasskeyWrite;
            return string.Empty;
        }

        public static bool IsPasskeyMethod(string method)
        {
            return method == BridgeMethods.PasskeysCreateBegin ||
                method == BridgeMethods.PasskeysCreateComplete ||
                method == BridgeMethods.PasskeysGetBegin ||
                method == BridgeMethods.PasskeysGetComplete ||
                method == BridgeMethods.PasskeysList ||
                method == BridgeMethods.PasskeysCancel ||
                method == BridgeMethods.PasskeysRevoke;
        }
    }
}
