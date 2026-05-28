using System;
using System.Windows.Forms;
using KeePass.Plugins;
using KeePassBrowserBridge.Bridge;

namespace KeePassBrowserBridge
{
    public sealed class KeePassBrowserBridgeExt : Plugin
    {
        private IPluginHost m_host;
        private ToolStripMenuItem m_enableItem;
        private PairingService m_pairingService;
        private TrustedClientStore m_trustedClients;
        private CredentialQueryService m_credentialQueryService;
        private CredentialMutationService m_credentialMutationService;
        private BridgeRequestHandler m_requestHandler;
        private LoopbackBridgeServer m_server;

        public override bool Initialize(IPluginHost host)
        {
            if (host == null) return false;

            m_host = host;
            m_pairingService = new PairingService();
            m_trustedClients = new TrustedClientStore();
            LoadTrustedClients();
            m_trustedClients.Changed += delegate { SaveTrustedClients(); };
            m_credentialQueryService = new CredentialQueryService();
            m_credentialMutationService = new CredentialMutationService();
            m_requestHandler = new BridgeRequestHandler(
                m_pairingService,
                m_trustedClients,
                m_credentialQueryService,
                m_credentialMutationService,
                delegate { return (m_host == null) ? null : m_host.Database; },
                OnPairingSessionCreated);

            if (IsEnabled()) StartServer(false);
            return true;
        }

        public override ToolStripMenuItem GetMenuItem(PluginMenuType t)
        {
            if (t != PluginMenuType.Main) return null;

            ToolStripMenuItem root = new ToolStripMenuItem(BridgeSettings.ProductName);

            m_enableItem = new ToolStripMenuItem("Enable Browser Integration");
            m_enableItem.CheckOnClick = true;
            m_enableItem.Checked = IsEnabled();
            m_enableItem.Click += OnToggleEnabled;
            root.DropDownItems.Add(m_enableItem);

            ToolStripMenuItem pairItem = new ToolStripMenuItem("Pair New Browser...");
            pairItem.Click += OnPairNewBrowser;
            root.DropDownItems.Add(pairItem);

            ToolStripMenuItem clientsItem = new ToolStripMenuItem("Trusted Browsers...");
            clientsItem.Click += OnTrustedBrowsers;
            root.DropDownItems.Add(clientsItem);

            return root;
        }

        private void OnToggleEnabled(object sender, EventArgs e)
        {
            bool enabled = (m_enableItem != null && m_enableItem.Checked);
            m_host.CustomConfig.SetBool(BridgeSettings.EnabledConfigKey, enabled);
            SaveConfig();

            if (enabled) StartServer(true);
            else StopServer();

            if (!enabled || (m_server != null && m_server.IsRunning))
            {
                string status = enabled ? "enabled" : "disabled";
                MessageBox.Show("Browser integration is now " + status + ".",
                    BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private void OnPairNewBrowser(object sender, EventArgs e)
        {
            if (!IsEnabled())
            {
                MessageBox.Show("Enable browser integration before pairing a browser.",
                    BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            PairingSession session = m_pairingService.BeginPairing("Chrome");
            MessageBox.Show("Enter this pairing code in the browser extension:\r\n\r\n" +
                session.PairingCode,
                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void OnTrustedBrowsers(object sender, EventArgs e)
        {
            int count = (m_trustedClients == null) ? 0 : m_trustedClients.ListClients().Length;
            MessageBox.Show("Trusted browsers: " + count + "\r\n\r\n" +
                "Client revoke UI will be implemented after the bridge protocol is connected.",
                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private bool IsEnabled()
        {
            return (m_host != null && m_host.CustomConfig.GetBool(BridgeSettings.EnabledConfigKey, false));
        }

        private void SaveConfig()
        {
            if (m_host != null && m_host.MainWindow != null) m_host.MainWindow.SaveConfig();
        }

        private void LoadTrustedClients()
        {
            if (m_host == null || m_trustedClients == null) return;

            string json = m_host.CustomConfig.GetString(BridgeSettings.TrustedClientsConfigKey, "");
            try
            {
                m_trustedClients.ImportJson(json);
            }
            catch (Exception)
            {
                m_trustedClients.ImportJson("");
            }
        }

        private void SaveTrustedClients()
        {
            if (m_host == null || m_trustedClients == null) return;

            m_host.CustomConfig.SetString(BridgeSettings.TrustedClientsConfigKey, m_trustedClients.ExportJson());
            SaveConfig();
        }

        private int GetPort()
        {
            if (m_host == null) return BridgeSettings.DefaultPort;
            long configured = m_host.CustomConfig.GetLong(BridgeSettings.PortConfigKey, BridgeSettings.DefaultPort);
            if (configured < 1024 || configured > 65535) return BridgeSettings.DefaultPort;
            return (int)configured;
        }

        private void StartServer(bool showSuccessMessage)
        {
            if (m_server != null && m_server.IsRunning) return;

            StopServer();
            m_server = new LoopbackBridgeServer(m_requestHandler);
            BridgeServerStartResult result = m_server.TryStart(GetPort());
            if (result.Success)
            {
                if (showSuccessMessage)
                {
                    MessageBox.Show("Browser integration is now enabled.",
                        BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                return;
            }

            StopServer();
            SetEnabled(false);
            if (m_enableItem != null) m_enableItem.Checked = false;
            MessageBox.Show(result.Error + "\r\n\r\nBrowser integration has been disabled. Remove duplicate plugin artifacts or choose a free port, then enable it again.",
                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }

        private void StopServer()
        {
            if (m_server == null) return;

            m_server.Dispose();
            m_server = null;
        }

        private void SetEnabled(bool enabled)
        {
            if (m_host == null) return;
            m_host.CustomConfig.SetBool(BridgeSettings.EnabledConfigKey, enabled);
            SaveConfig();
        }

        private void OnPairingSessionCreated(PairingSession session)
        {
            if (session == null) return;

            MessageBox.Show("Enter this pairing code in the browser extension:\r\n\r\n" +
                session.PairingCode,
                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        public override void Terminate()
        {
            StopServer();
            m_host = null;
            m_enableItem = null;
            m_pairingService = null;
            m_trustedClients = null;
            m_credentialQueryService = null;
            m_credentialMutationService = null;
            m_requestHandler = null;
        }
    }
}
