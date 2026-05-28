using System;
using System.Collections.Generic;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class TrustedClientStore
    {
        private readonly Dictionary<string, TrustedClient> m_clients = new Dictionary<string, TrustedClient>(StringComparer.Ordinal);

        public void AddOrUpdate(TrustedClient client)
        {
            if (client == null) throw new ArgumentNullException("client");
            if (string.IsNullOrWhiteSpace(client.ClientId)) throw new ArgumentException("Client ID is required.", "client");

            m_clients[client.ClientId] = client;
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
            return m_clients.Remove(clientId);
        }
    }

    internal sealed class TrustedClient
    {
        public string ClientId { get; set; }
        public string ClientName { get; set; }
        public string SharedSecret { get; set; }
        public long CreatedUtcMs { get; set; }
    }
}
