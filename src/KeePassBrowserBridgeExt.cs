using System;
using System.IO;
using System.Net;
using System.Windows.Forms;
using KeePass.Forms;
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

        public override string UpdateUrl
        {
            get { return BridgeSettings.UpdateInfoUrl; }
        }

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
                SaveDatabaseAfterMutation,
                ShowPasskeyApprovalPrompt);
            SubscribeKeePassLifecycleEvents();

            if (IsEnabled()) StartServer(false);
            StartAutoUpdateCheck();
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

            root.DropDownItems.Add(new ToolStripSeparator());

            ToolStripMenuItem updateItem = new ToolStripMenuItem("Check for Updates...");
            updateItem.Click += OnCheckForUpdates;
            root.DropDownItems.Add(updateItem);

            ToolStripMenuItem aboutItem = new ToolStripMenuItem("About...");
            aboutItem.Click += OnAbout;
            root.DropDownItems.Add(aboutItem);

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

        private void OnAbout(object sender, EventArgs e)
        {
            using (Form dialog = CreateAboutDialog())
            {
                IWin32Window owner = (m_host == null) ? null : m_host.MainWindow;
                dialog.ShowDialog(owner);
            }
        }

        private void OnCheckForUpdates(object sender, EventArgs e)
        {
            CheckForUpdatesAsync(true);
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

        private void SubscribeKeePassLifecycleEvents()
        {
            if (m_host == null || m_host.MainWindow == null) return;
            m_host.MainWindow.FileClosingPre += OnKeePassFileClosingPre;
            m_host.MainWindow.FileClosed += OnKeePassFileClosed;
        }

        private void UnsubscribeKeePassLifecycleEvents()
        {
            if (m_host == null || m_host.MainWindow == null) return;
            m_host.MainWindow.FileClosingPre -= OnKeePassFileClosingPre;
            m_host.MainWindow.FileClosed -= OnKeePassFileClosed;
        }

        private void OnKeePassFileClosingPre(object sender, FileClosingEventArgs e)
        {
            ClearPendingPasskeySessions();
        }

        private void OnKeePassFileClosed(object sender, FileClosedEventArgs e)
        {
            ClearPendingPasskeySessions();
        }

        private void ClearPendingPasskeySessions()
        {
            if (m_requestHandler != null) m_requestHandler.ClearPendingPasskeySessions();
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
            dialog.Height = 330;
            dialog.MinimizeBox = false;
            dialog.MaximizeBox = false;
            dialog.StartPosition = FormStartPosition.CenterParent;
            dialog.ShowInTaskbar = false;

            TableLayoutPanel layout = new TableLayoutPanel();
            layout.Dock = DockStyle.Fill;
            layout.ColumnCount = 1;
            layout.RowCount = 7;
            layout.Padding = new Padding(14);
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 46));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));
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

            Label client = new Label();
            client.Dock = DockStyle.Fill;
            client.Text = "Browser: " + SafeDisplay(session.ClientName);

            Label origin = new Label();
            origin.Dock = DockStyle.Fill;
            origin.Text = "Extension origin: " + SafeDisplay(string.IsNullOrWhiteSpace(session.ExtensionOrigin)
                ? "not available for this manual pairing request"
                : session.ExtensionOrigin);

            Label hint = new Label();
            hint.Dock = DockStyle.Fill;
            hint.Text = "Only pair if you just started this request from your browser extension. Closing this dialog cancels the current pairing session.";

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
            layout.Controls.Add(client, 0, 3);
            layout.Controls.Add(origin, 0, 4);
            layout.Controls.Add(hint, 0, 5);
            layout.Controls.Add(actions, 0, 6);
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

        private static string SafeDisplay(string value)
        {
            string text = string.IsNullOrWhiteSpace(value) ? "unknown" : value.Trim();
            return text.Length <= 160 ? text : text.Substring(0, 157) + "...";
        }

        private PasskeyApprovalResult ShowPasskeyApprovalPrompt(PasskeyApprovalRequest request)
        {
            if (request == null)
                return PasskeyApprovalResult.Deny("invalid_payload", "Passkey approval request is missing.");
            if (m_host == null || m_host.MainWindow == null)
                return PasskeyApprovalResult.Deny("approval_unavailable", "KeePass approval UI is not available.");

            if (m_host.MainWindow.InvokeRequired)
            {
                return (PasskeyApprovalResult)m_host.MainWindow.Invoke(
                    new Func<PasskeyApprovalRequest, PasskeyApprovalResult>(ShowPasskeyApprovalPrompt),
                    request);
            }

            using (Form dialog = CreatePasskeyApprovalDialog(request))
            {
                DialogResult result = dialog.ShowDialog(m_host.MainWindow);
                return result == DialogResult.OK
                    ? PasskeyApprovalResult.Approve()
                    : PasskeyApprovalResult.Deny("user_denied", "Passkey request was denied in KeePass.");
            }
        }

        private Form CreatePasskeyApprovalDialog(PasskeyApprovalRequest request)
        {
            Form dialog = new Form();
            dialog.Text = "Approve Passkey Request";
            dialog.Width = 520;
            dialog.Height = 360;
            dialog.MinimizeBox = false;
            dialog.MaximizeBox = false;
            dialog.StartPosition = FormStartPosition.CenterParent;
            dialog.ShowInTaskbar = false;

            TableLayoutPanel layout = new TableLayoutPanel();
            layout.Dock = DockStyle.Fill;
            layout.ColumnCount = 1;
            layout.RowCount = 8;
            layout.Padding = new Padding(14);
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));

            Label title = new Label();
            title.Dock = DockStyle.Fill;
            title.Font = new System.Drawing.Font(title.Font, System.Drawing.FontStyle.Bold);
            title.Text = request.Operation == PasskeyPendingOperation.Create
                ? "Create a passkey in this KeePass database?"
                : "Use a passkey from this KeePass database?";

            Label rp = new Label();
            rp.Dock = DockStyle.Fill;
            rp.Text = "RP ID: " + SafeDisplay(request.RpId);

            Label origin = new Label();
            origin.Dock = DockStyle.Fill;
            origin.Text = "Site origin: " + SafeDisplay(request.Origin);

            Label browser = new Label();
            browser.Dock = DockStyle.Fill;
            browser.Text = "Browser origin: " + SafeDisplay(request.ExtensionOrigin);

            Label account = new Label();
            account.Dock = DockStyle.Fill;
            account.Text = PasskeyApprovalAccountLine(request);

            TextBox details = new TextBox();
            details.Dock = DockStyle.Fill;
            details.Multiline = true;
            details.ReadOnly = true;
            details.ScrollBars = ScrollBars.Vertical;
            details.Text = PasskeyApprovalDetails(request);

            Label hint = new Label();
            hint.Dock = DockStyle.Fill;
            hint.Text = "Approve only if this request matches the site action you just started.";

            FlowLayoutPanel actions = new FlowLayoutPanel();
            actions.Dock = DockStyle.Fill;
            actions.FlowDirection = FlowDirection.RightToLeft;
            actions.WrapContents = false;

            Button approve = new Button();
            approve.Text = "Approve";
            approve.Width = 96;
            approve.DialogResult = DialogResult.OK;

            Button deny = new Button();
            deny.Text = "Deny";
            deny.Width = 96;
            deny.DialogResult = DialogResult.Cancel;

            actions.Controls.Add(approve);
            actions.Controls.Add(deny);

            layout.Controls.Add(title, 0, 0);
            layout.Controls.Add(rp, 0, 1);
            layout.Controls.Add(origin, 0, 2);
            layout.Controls.Add(browser, 0, 3);
            layout.Controls.Add(account, 0, 4);
            layout.Controls.Add(details, 0, 5);
            layout.Controls.Add(hint, 0, 6);
            layout.Controls.Add(actions, 0, 7);
            dialog.Controls.Add(layout);
            dialog.AcceptButton = approve;
            dialog.CancelButton = deny;

            return dialog;
        }

        private static string PasskeyApprovalAccountLine(PasskeyApprovalRequest request)
        {
            if (request.Operation == PasskeyPendingOperation.Create)
            {
                string label = string.IsNullOrWhiteSpace(request.UserDisplayName)
                    ? request.UserName
                    : request.UserDisplayName;
                return "Account: " + SafeDisplay(label);
            }

            int count = request.Credentials == null ? 0 : request.Credentials.Length;
            return "Matching passkeys: " + count.ToString();
        }

        private static string PasskeyApprovalDetails(PasskeyApprovalRequest request)
        {
            if (request.Operation == PasskeyPendingOperation.Create)
            {
                return "WebAuthn request ID: " + SafeDisplay(request.WebAuthnRequestId) + Environment.NewLine +
                    "User name: " + SafeDisplay(request.UserName) + Environment.NewLine +
                    "Display name: " + SafeDisplay(request.UserDisplayName);
            }

            StringWriter writer = new StringWriter();
            writer.WriteLine("WebAuthn request ID: " + SafeDisplay(request.WebAuthnRequestId));
            PasskeyCredentialSummary[] credentials = request.Credentials ?? new PasskeyCredentialSummary[0];
            for (int i = 0; i < credentials.Length; ++i)
            {
                PasskeyCredentialSummary credential = credentials[i];
                writer.WriteLine();
                writer.WriteLine("Passkey " + (i + 1).ToString() + ":");
                writer.WriteLine("Title: " + SafeDisplay(credential == null ? null : credential.Title));
                writer.WriteLine("User: " + SafeDisplay(credential == null ? null : credential.UserName));
                writer.WriteLine("Group: " + SafeDisplay(credential == null ? null : credential.Group));
            }
            return writer.ToString();
        }

        private Form CreateTrustedBrowsersDialog()
        {
            Form dialog = new Form();
            dialog.Text = "Trusted Browsers";
            dialog.Width = 780;
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
            list.Columns.Add("Name", 150);
            list.Columns.Add("Origin", 260);
            list.Columns.Add("Permissions", 150);
            list.Columns.Add("Created", 150);
            list.Columns.Add("Last Used", 150);
            list.Columns.Add("Client ID", 180);

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

        private Form CreateAboutDialog()
        {
            Form dialog = new Form();
            dialog.Text = "About " + BridgeSettings.ProductName;
            dialog.Width = 560;
            dialog.Height = 330;
            dialog.MinimizeBox = false;
            dialog.MaximizeBox = false;
            dialog.StartPosition = FormStartPosition.CenterParent;
            dialog.ShowInTaskbar = false;

            TableLayoutPanel layout = new TableLayoutPanel();
            layout.Dock = DockStyle.Fill;
            layout.ColumnCount = 1;
            layout.RowCount = 3;
            layout.Padding = new Padding(12);
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));

            Label title = new Label();
            title.Dock = DockStyle.Fill;
            title.Text = BridgeSettings.ProductName + " " + BridgeSettings.PluginVersion;
            title.Font = new System.Drawing.Font(title.Font, System.Drawing.FontStyle.Bold);

            string status = (m_server != null && m_server.IsRunning) ? "Running" : "Stopped";
            string endpoint = "http://127.0.0.1:" + GetPort() + "/bridge";
            TextBox details = new TextBox();
            details.Dock = DockStyle.Fill;
            details.Multiline = true;
            details.ReadOnly = true;
            details.ScrollBars = ScrollBars.Vertical;
            details.Text =
                "Version: " + BridgeSettings.PluginVersion + "\r\n" +
                "Bridge endpoint: " + endpoint + "\r\n" +
                "Server status: " + status + "\r\n" +
                "Update metadata: " + BridgeSettings.UpdateInfoUrl + "\r\n\r\n" +
                "Use Check for Updates to download and install the latest KeePassBrowserBridge.plgx automatically.\r\n\r\n" +
                "Install exactly one KeePassBrowserBridge plugin artifact in the KeePass Plugins directory. Duplicate DLL/PLGX artifacts can cause port conflicts.";

            FlowLayoutPanel actions = new FlowLayoutPanel();
            actions.Dock = DockStyle.Fill;
            actions.FlowDirection = FlowDirection.RightToLeft;
            actions.WrapContents = false;

            Button close = new Button();
            close.Text = "Close";
            close.Width = 96;
            close.DialogResult = DialogResult.Cancel;
            actions.Controls.Add(close);

            layout.Controls.Add(title, 0, 0);
            layout.Controls.Add(details, 0, 1);
            layout.Controls.Add(actions, 0, 2);
            dialog.Controls.Add(layout);
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
                item.SubItems.Add(FormatClientOrigin(client.ExtensionOrigin));
                item.SubItems.Add(FormatClientPermissions(client.Permissions));
                item.SubItems.Add(FormatUtcMilliseconds(client.CreatedUtcMs));
                item.SubItems.Add(FormatUtcMilliseconds(client.LastUsedUtcMs));
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

        private static string FormatClientOrigin(string origin)
        {
            return string.IsNullOrWhiteSpace(origin) ? "Unknown" : origin;
        }

        private static string FormatClientPermissions(string[] permissions)
        {
            string[] normalized = TrustedClientPermissions.Normalize(permissions);
            string result = "";
            for (int i = 0; i < normalized.Length; ++i)
            {
                if (i > 0) result += ", ";
                result += FormatPermission(normalized[i]);
            }
            return result;
        }

        private static string FormatPermission(string permission)
        {
            if (permission == TrustedClientPermissions.Read) return "Read";
            if (permission == TrustedClientPermissions.Write) return "Write";
            if (permission == TrustedClientPermissions.ManageClients) return "Manage browsers";
            if (permission == TrustedClientPermissions.PasskeyRead) return "Passkey read (disabled)";
            if (permission == TrustedClientPermissions.PasskeyWrite) return "Passkey write (disabled)";
            return permission ?? "";
        }

        private void StartAutoUpdateCheck()
        {
            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                System.Threading.Thread.Sleep(4000);
                CheckForUpdates(false);
            });
        }

        private void CheckForUpdatesAsync(bool interactive)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                CheckForUpdates(interactive);
            });
        }

        private void CheckForUpdates(bool interactive)
        {
            try
            {
                ServicePointManager.SecurityProtocol = ServicePointManager.SecurityProtocol | (SecurityProtocolType)3072;
                UpdateInfo info = UpdateChecker.CheckLatest();

                if (info == null || !info.IsUpdateAvailable)
                {
                    if (interactive)
                    {
                        ShowOnUi(delegate
                        {
                            MessageBox.Show(GetOwner(),
                                "You are using the latest version: " + UpdateChecker.GetCurrentVersion(),
                                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
                        });
                    }
                    return;
                }

                ShowOnUi(delegate { PromptForUpdate(info); });
            }
            catch (Exception ex)
            {
                if (!interactive) return;

                ShowOnUi(delegate
                {
                    MessageBox.Show(GetOwner(),
                        "Could not check for updates." + Environment.NewLine + ex.Message,
                        BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                });
            }
        }

        private void PromptForUpdate(UpdateInfo info)
        {
            string message =
                "A new KeePass Browser Bridge version is available." + Environment.NewLine +
                Environment.NewLine +
                "Current: " + UpdateChecker.GetCurrentVersion() + Environment.NewLine +
                "Latest: " + info.LatestVersion + Environment.NewLine +
                Environment.NewLine +
                "Download and install the update now?";

            DialogResult result = MessageBox.Show(GetOwner(), message, BridgeSettings.ProductName + " Update",
                MessageBoxButtons.YesNo, MessageBoxIcon.Information);

            if (result == DialogResult.Yes)
            {
                InstallUpdateAsync(info);
            }
        }

        private void InstallUpdateAsync(UpdateInfo info)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                try
                {
                    ServicePointManager.SecurityProtocol = ServicePointManager.SecurityProtocol | (SecurityProtocolType)3072;
                    string targetPath = GetPluginPackagePath();
                    string tempPath = targetPath + ".download";
                    string duplicateDllBackupPath = PrepareForPlgxAutoUpdate();

                    using (WebClient client = new WebClient())
                    {
                        client.Headers[HttpRequestHeader.UserAgent] = "KeePassBrowserBridge";
                        if (string.IsNullOrEmpty(info.ChecksumAssetUrl))
                            throw new InvalidOperationException("The selected release does not publish SHA256SUMS.txt.");

                        string checksumText = client.DownloadString(info.ChecksumAssetUrl);
                        string expectedSha256 = UpdateChecker.GetExpectedSha256(checksumText, "KeePassBrowserBridge.plgx");
                        if (string.IsNullOrEmpty(expectedSha256))
                            throw new InvalidOperationException("The release checksum file does not contain KeePassBrowserBridge.plgx.");

                        client.DownloadFile(info.AssetUrl, tempPath);
                        if (!UpdateChecker.VerifyFileSha256(tempPath, expectedSha256))
                        {
                            try { File.Delete(tempPath); }
                            catch { }
                            throw new InvalidOperationException("Downloaded KeePassBrowserBridge.plgx does not match SHA256SUMS.txt.");
                        }
                    }

                    try
                    {
                        File.Copy(tempPath, targetPath, true);
                        File.Delete(tempPath);

                        ShowOnUi(delegate
                        {
                            string message = "KeePass Browser Bridge was updated. Restart KeePass to use the new version.";
                            if (!string.IsNullOrEmpty(duplicateDllBackupPath))
                            {
                                message += Environment.NewLine + Environment.NewLine +
                                    "A duplicate DLL plugin artifact was backed up and removed:" + Environment.NewLine +
                                    duplicateDllBackupPath;
                            }

                            MessageBox.Show(GetOwner(),
                                message,
                                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
                        });
                    }
                    catch (Exception copyEx)
                    {
                        string pendingPath = targetPath + ".new";
                        File.Copy(tempPath, pendingPath, true);
                        File.Delete(tempPath);

                        ShowOnUi(delegate
                        {
                            MessageBox.Show(GetOwner(),
                                "The update was downloaded but the active plugin file could not be replaced." + Environment.NewLine +
                                "New file: " + pendingPath + Environment.NewLine +
                                "Reason: " + copyEx.Message,
                                BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        });
                    }
                }
                catch (Exception ex)
                {
                    ShowOnUi(delegate
                    {
                        MessageBox.Show(GetOwner(),
                            "Could not download the update." + Environment.NewLine + ex.Message,
                            BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    });
                }
            });
        }

        private string GetPluginPackagePath()
        {
            return Path.Combine(GetPluginsDirectory(), "KeePassBrowserBridge.plgx");
        }

        private string GetPluginDllPath()
        {
            return Path.Combine(GetPluginsDirectory(), "KeePassBrowserBridge.dll");
        }

        private string GetPluginsDirectory()
        {
            string keepassDir = Path.GetDirectoryName(Application.ExecutablePath);
            string pluginsDir = Path.Combine(keepassDir, "Plugins");
            Directory.CreateDirectory(pluginsDir);
            return pluginsDir;
        }

        private string PrepareForPlgxAutoUpdate()
        {
            string dllPath = GetPluginDllPath();
            if (!File.Exists(dllPath)) return string.Empty;

            string backupDir = Path.Combine(Path.GetTempPath(), "KeePassBrowserBridge-auto-update-backups");
            Directory.CreateDirectory(backupDir);
            string backupPath = Path.Combine(backupDir,
                "KeePassBrowserBridge-" + DateTime.UtcNow.ToString("yyyyMMdd-HHmmss") + ".dll");

            try
            {
                File.Copy(dllPath, backupPath, true);
                File.Delete(dllPath);
                return backupPath;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    "KeePassBrowserBridge.dll is still present in the KeePass Plugins directory. " +
                    "Auto-update installs KeePassBrowserBridge.plgx and cannot continue while the DLL artifact remains. " +
                    "Close KeePass and remove the DLL, or use scripts\\install-plugin.ps1 so KeePass loads exactly one plugin artifact.",
                    ex);
            }
        }

        private void ShowOnUi(MethodInvoker action)
        {
            Form owner = GetOwner();
            if (owner != null && !owner.IsDisposed)
            {
                if (owner.InvokeRequired)
                    owner.BeginInvoke(action);
                else
                    action();
            }
            else
            {
                action();
            }
        }

        private Form GetOwner()
        {
            return (m_host != null) ? m_host.MainWindow : null;
        }

        public override void Terminate()
        {
            UnsubscribeKeePassLifecycleEvents();
            ClearPendingPasskeySessions();
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
