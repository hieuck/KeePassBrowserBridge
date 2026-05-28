# KeePass Browser Bridge Extension

This is the Chrome MV3 companion extension for the KeePassBrowserBridge plugin.

## Developer install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select this `extension` folder.
5. Open KeePass and enable the KeePassBrowserBridge plugin.
6. Open the extension popup, click Pair, then enter the pairing code shown by KeePass.
7. Optional: enable Auto-fill. The extension only fills automatically when exactly one KeePass entry matches the loaded page URL.

The default bridge endpoint is `http://127.0.0.1:19455/bridge`.

On login pages, the extension injects a small `K` button near detected username/password fields. Clicking it queries KeePass for the current page URL and fills immediately when exactly one login matches. When multiple logins match, the page shows an inline picker so the user can choose the account without opening the popup. Multi-step login pages with an email-only first step are supported; the button can fill the username/email first and the password after the site reveals the password field.

When no matching login exists and the page contains entered credentials, clicking `K` or submitting the form shows a Save prompt. Confirming it creates a new KeePass entry through the local bridge.

When a matching login exists but the submitted password differs from KeePass, the page shows an Update prompt. Confirming it updates the existing KeePass entry instead of creating a duplicate. Pending save/update prompts survive a same-tab form reload for a short time so normal login redirects can still trigger the prompt.
