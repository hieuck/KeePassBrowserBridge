using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class TrustedClientStore
    {
        private readonly Dictionary<string, TrustedClient> m_clients = new Dictionary<string, TrustedClient>(StringComparer.Ordinal);

        public event EventHandler Changed;

        public void AddOrUpdate(TrustedClient client)
        {
            if (client == null) throw new ArgumentNullException("client");
            if (string.IsNullOrWhiteSpace(client.ClientId)) throw new ArgumentException("Client ID is required.", "client");

            m_clients[client.ClientId] = client;
            OnChanged();
        }

        public bool IsTrusted(string clientId)
        {
            return !string.IsNullOrWhiteSpace(clientId) && m_clients.ContainsKey(clientId);
        }

        public TrustedClient Get(string clientId)
        {
            TrustedClient client;
            return (clientId != null && m_clients.TryGetValue(clientId, out client)) ? client : null;
        }

        public TrustedClient[] ListClients()
        {
            TrustedClient[] clients = new TrustedClient[m_clients.Count];
            m_clients.Values.CopyTo(clients, 0);
            return clients;
        }

        public bool Revoke(string clientId)
        {
            if (string.IsNullOrWhiteSpace(clientId)) return false;
            bool removed = m_clients.Remove(clientId);
            if (removed) OnChanged();
            return removed;
        }

        public bool UpdatePermissions(string clientId, string[] permissions)
        {
            TrustedClient client = Get(clientId);
            if (client == null) return false;

            client.Permissions = TrustedClientPermissions.Normalize(permissions);
            OnChanged();
            return true;
        }

        public string ExportJson()
        {
            TrustedClientStoreData data = new TrustedClientStoreData
            {
                Clients = ListClients()
            };
            return BridgeJsonSerializer.Serialize(data);
        }

        public void ImportJson(string json)
        {
            m_clients.Clear();
            if (string.IsNullOrWhiteSpace(json)) return;

            TrustedClientStoreData data = BridgeJsonSerializer.Deserialize<TrustedClientStoreData>(json);
            if (data == null || data.Clients == null) return;

            foreach (TrustedClient client in data.Clients)
            {
                if (client != null && !string.IsNullOrWhiteSpace(client.ClientId))
                {
                    client.Permissions = TrustedClientPermissions.Normalize(client.Permissions);
                    m_clients[client.ClientId] = client;
                }
            }
        }

        private void OnChanged()
        {
            EventHandler handler = Changed;
            if (handler != null) handler(this, EventArgs.Empty);
        }
    }

    [DataContract]
    internal sealed class TrustedClient
    {
        [DataMember]
        public string ClientId { get; set; }

        [DataMember]
        public string ClientName { get; set; }

        [DataMember]
        public string SharedSecret { get; set; }

        [DataMember]
        public string ExtensionOrigin { get; set; }

        [DataMember]
        public long CreatedUtcMs { get; set; }

        [DataMember]
        public string[] Permissions { get; set; }
    }

    internal static class TrustedClientPermissions
    {
        public const string Read = "read";
        public const string Write = "write";
        public const string ManageClients = "manageClients";

        public static string[] Default()
        {
            return new string[] { Read, Write, ManageClients };
        }

        public static string[] Normalize(string[] permissions)
        {
            if (permissions == null || permissions.Length == 0) return Default();

            List<string> normalized = new List<string>();
            foreach (string permission in permissions)
            {
                if (string.IsNullOrWhiteSpace(permission)) continue;
                string trimmed = permission.Trim();
                if (!IsKnown(trimmed)) continue;
                if (!normalized.Contains(trimmed)) normalized.Add(trimmed);
            }

            return normalized.Count == 0 ? Default() : normalized.ToArray();
        }

        public static bool Has(TrustedClient client, string permission)
        {
            if (client == null) return false;
            string[] permissions = Normalize(client.Permissions);
            foreach (string value in permissions)
            {
                if (string.Equals(value, permission, StringComparison.Ordinal)) return true;
            }
            return false;
        }

        private static bool IsKnown(string permission)
        {
            return permission == Read || permission == Write || permission == ManageClients;
        }
    }

    [DataContract]
    internal sealed class TrustedClientStoreData
    {
        [DataMember]
        public TrustedClient[] Clients { get; set; }
    }
}
