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
        private Form m_pairingDialog;

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
                OnPairingSessionCreated,
                SaveDatabaseAfterMutation);

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
            ShowPairingSession(session);
        }

        private void OnTrustedBrowsers(object sender, EventArgs e)
        {
            if (m_trustedClients == null) return;

            using (Form dialog = CreateTrustedBrowsersDialog())
            {
                IWin32Window owner = (m_host == null) ? null : m_host.MainWindow;
                dialog.ShowDialog(owner);
            }
        }

        private bool IsEnabled()
        {
            return (m_host != null && m_host.CustomConfig.GetBool(BridgeSettings.EnabledConfigKey, false));
        }

        private void SaveConfig()
        {
            if (m_host != null && m_host.MainWindow != null) m_host.MainWindow.SaveConfig();
        }

        private void SaveDatabaseAfterMutation(KeePassLib.PwDatabase database)
        {
            if (m_host == null || m_host.MainWindow == null || database == null) return;

            if (m_host.MainWindow.InvokeRequired)
            {
                m_host.MainWindow.BeginInvoke(new Action<KeePassLib.PwDatabase>(SaveDatabaseAfterMutation), database);
                return;
            }

            m_host.MainWindow.SaveDatabase(database, null);
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

            ShowPairingSession(session);
        }

        private void ShowPairingSession(PairingSession session)
        {
            if (session == null || m_host == null) return;

            if (m_host.MainWindow != null && m_host.MainWindow.InvokeRequired)
            {
                m_host.MainWindow.BeginInvoke(new Action<PairingSession>(ShowPairingSession), session);
                return;
            }

            if (m_pairingDialog != null && !m_pairingDialog.IsDisposed)
            {
                m_pairingDialog.Close();
            }

            Form dialog = CreatePairingDialog(session);
            m_pairingDialog = dialog;
            dialog.FormClosed += delegate
            {
                if (m_pairingService != null)
                {
                    m_pairingService.CancelPairing(session.PairingSessionId);
                }
                if (object.ReferenceEquals(m_pairingDialog, dialog))
                {
                    m_pairingDialog = null;
                }
            };

            IWin32Window owner = (m_host == null) ? null : m_host.MainWindow;
            dialog.Show(owner);
        }

        private Form CreatePairingDialog(PairingSession session)
        {
            Form dialog = new Form();
            dialog.Text = "Pair Browser";
            dialog.Width = 430;
            dialog.Height = 250;
            dialog.MinimizeBox = false;
            dialog.MaximizeBox = false;
            dialog.StartPosition = FormStartPosition.CenterParent;
            dialog.ShowInTaskbar = false;

            TableLayoutPanel layout = new TableLayoutPanel();
            layout.Dock = DockStyle.Fill;
            layout.ColumnCount = 1;
            layout.RowCount = 5;
            layout.Padding = new Padding(14);
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 46));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));

            Label caption = new Label();
            caption.Dock = DockStyle.Fill;
            caption.Text = "Enter this pairing code in the browser extension.";

            TextBox code = new TextBox();
            code.Dock = DockStyle.Fill;
            code.ReadOnly = true;
            code.TextAlign = HorizontalAlignment.Center;
            code.Font = new System.Drawing.Font(code.Font.FontFamily, 18, System.Drawing.FontStyle.Bold);
            code.Text = session.PairingCode;

            Label timerLabel = new Label();
            timerLabel.Dock = DockStyle.Fill;

            Label hint = new Label();
            hint.Dock = DockStyle.Fill;
            hint.Text = "Closing this dialog cancels the current pairing session.";

            FlowLayoutPanel actions = new FlowLayoutPanel();
            actions.Dock = DockStyle.Fill;
            actions.FlowDirection = FlowDirection.RightToLeft;
            actions.WrapContents = false;

            Button cancel = new Button();
            cancel.Text = "Cancel Pairing";
            cancel.AutoSize = true;
            cancel.Click += delegate
            {
                if (m_pairingService != null)
                {
                    m_pairingService.CancelPairing(session.PairingSessionId);
                }
                dialog.Close();
            };

            Button copy = new Button();
            copy.Text = "Copy Code";
            copy.AutoSize = true;
            copy.Click += delegate
            {
                try
                {
                    Clipboard.SetText(session.PairingCode);
                    hint.Text = "Pairing code copied. Paste it into the browser extension.";
                }
                catch (Exception ex)
                {
                    hint.Text = "Could not copy pairing code: " + ex.Message;
                }
            };

            Button close = new Button();
            close.Text = "Close";
            close.AutoSize = true;
            close.Click += delegate { dialog.Close(); };

            actions.Controls.Add(cancel);
            actions.Controls.Add(copy);
            actions.Controls.Add(close);

            Timer timer = new Timer();
            timer.Interval = 1000;
            Action updateTimer = delegate
            {
                long expiresAt = session.CreatedUtcMs + PairingService.MaxPairingSessionAgeMs;
                long remainingMs = Math.Max(0, expiresAt - BridgeClock.UtcNowMilliseconds());
                TimeSpan remaining = TimeSpan.FromMilliseconds(remainingMs);
                timerLabel.Text = "Code expires in " + ((int)remaining.TotalMinutes).ToString("0") + ":" + remaining.Seconds.ToString("00");
                if (remainingMs <= 0)
                {
                    timer.Stop();
                    if (m_pairingService != null)
                    {
                        m_pairingService.CancelPairing(session.PairingSessionId);
                    }
                    hint.Text = "Pairing code expired. Start pairing again from the browser extension.";
                    cancel.Enabled = false;
                    copy.Enabled = false;
                }
            };
            timer.Tick += delegate { updateTimer(); };
            dialog.FormClosed += delegate
            {
                timer.Stop();
                timer.Dispose();
            };

            layout.Controls.Add(caption, 0, 0);
            layout.Controls.Add(code, 0, 1);
            layout.Controls.Add(timerLabel, 0, 2);
            layout.Controls.Add(hint, 0, 3);
            layout.Controls.Add(actions, 0, 4);
            dialog.Controls.Add(layout);

            dialog.Shown += delegate
            {
                updateTimer();
                timer.Start();
                code.SelectAll();
                code.Focus();
            };

            return dialog;
        }

        private Form CreateTrustedBrowsersDialog()
        {
            Form dialog = new Form();
            dialog.Text = "Trusted Browsers";
            dialog.Width = 620;
            dialog.Height = 360;
            dialog.MinimizeBox = false;
            dialog.MaximizeBox = false;
            dialog.StartPosition = FormStartPosition.CenterParent;
            dialog.ShowInTaskbar = false;

            TableLayoutPanel layout = new TableLayoutPanel();
            layout.Dock = DockStyle.Fill;
            layout.ColumnCount = 1;
            layout.RowCount = 3;
            layout.Padding = new Padding(12);
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 24));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));

            Label caption = new Label();
            caption.Dock = DockStyle.Fill;
            caption.Text = "Browsers paired with this KeePass database can query and fill entries.";

            ListView list = new ListView();
            list.Dock = DockStyle.Fill;
            list.View = View.Details;
            list.FullRowSelect = true;
            list.MultiSelect = false;
            list.HideSelection = false;
            list.Columns.Add("Name", 180);
            list.Columns.Add("Created", 170);
            list.Columns.Add("Client ID", 220);

            Button revoke = new Button();
            revoke.Text = "Revoke";
            revoke.Width = 96;
            revoke.Enabled = false;

            Button close = new Button();
            close.Text = "Close";
            close.Width = 96;
            close.DialogResult = DialogResult.Cancel;

            FlowLayoutPanel buttons = new FlowLayoutPanel();
            buttons.Dock = DockStyle.Fill;
            buttons.FlowDirection = FlowDirection.RightToLeft;
            buttons.Controls.Add(close);
            buttons.Controls.Add(revoke);

            FillTrustedBrowsersList(list);
            list.SelectedIndexChanged += delegate
            {
                revoke.Enabled = (list.SelectedItems.Count == 1);
            };
            revoke.Click += delegate
            {
                if (list.SelectedItems.Count != 1) return;

                ListViewItem selected = list.SelectedItems[0];
                TrustedClient client = selected.Tag as TrustedClient;
                if (client == null) return;

                DialogResult confirm = MessageBox.Show(dialog,
                    "Revoke browser \"" + client.ClientName + "\"?\r\n\r\nIt will need to pair again before accessing KeePass.",
                    BridgeSettings.ProductName,
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Warning);
                if (confirm != DialogResult.Yes) return;

                if (m_trustedClients.Revoke(client.ClientId))
                {
                    selected.Remove();
                    revoke.Enabled = false;
                }
            };

            layout.Controls.Add(caption, 0, 0);
            layout.Controls.Add(list, 0, 1);
            layout.Controls.Add(buttons, 0, 2);
            dialog.Controls.Add(layout);
            dialog.AcceptButton = revoke;
            dialog.CancelButton = close;

            return dialog;
        }

        private void FillTrustedBrowsersList(ListView list)
        {
            list.Items.Clear();
            TrustedClient[] clients = m_trustedClients.ListClients();
            foreach (TrustedClient client in clients)
            {
                ListViewItem item = new ListViewItem(client.ClientName);
                item.SubItems.Add(FormatUtcMilliseconds(client.CreatedUtcMs));
                item.SubItems.Add(ShortenClientId(client.ClientId));
                item.Tag = client;
                list.Items.Add(item);
            }
        }

        private static string FormatUtcMilliseconds(long utcMilliseconds)
        {
            if (utcMilliseconds <= 0) return "Unknown";
            return BridgeClock.FromUtcMilliseconds(utcMilliseconds).ToLocalTime().ToString("g");
        }

        private static string ShortenClientId(string clientId)
        {
            if (string.IsNullOrEmpty(clientId) || clientId.Length <= 16) return clientId ?? "";
            return clientId.Substring(0, 16) + "...";
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
