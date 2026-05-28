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

        public override bool Initialize(IPluginHost host)
        {
            if (host == null) return false;

            m_host = host;
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
            MessageBox.Show("Pairing will be implemented in the next MVP slice.",
                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void OnTrustedBrowsers(object sender, EventArgs e)
        {
            MessageBox.Show("Trusted browser management will be implemented in the next MVP slice.",
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
        }
    }
}
