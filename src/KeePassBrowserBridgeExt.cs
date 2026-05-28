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

        public override bool Initialize(IPluginHost host)
        {
            if (host == null) return false;

            m_host = host;
            m_pairingService = new PairingService();
            m_trustedClients = new TrustedClientStore();
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

            string status = enabled ? "enabled" : "disabled";
            MessageBox.Show("Browser integration is now " + status + ".",
                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
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
                session.PairingCode + "\r\n\r\n" +
                "Session ID: " + session.PairingSessionId,
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

        public override void Terminate()
        {
            m_host = null;
            m_enableItem = null;
            m_pairingService = null;
            m_trustedClients = null;
        }
    }
}
