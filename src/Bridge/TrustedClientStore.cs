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
                    m_clients[client.ClientId] = client;
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
        public long CreatedUtcMs { get; set; }
    }

    [DataContract]
    internal sealed class TrustedClientStoreData
    {
        [DataMember]
        public TrustedClient[] Clients { get; set; }
    }
}
