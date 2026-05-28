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

On login pages, the extension injects small `K` buttons near detected username, password, and OTP fields. Clicking a field button queries KeePass for the current page URL and fills that specific field when exactly one login matches. When multiple logins match, the page shows an inline picker so the user can choose the account without opening the popup. Multi-step login pages with an email-only first step are supported; the username button can fill the username/email first and the password button can fill the password after the site reveals the password field.

KeePass entries can match by the primary `URL` field or additional URL fields named like `URL (2)`, `URL (3)`, etc. This supports services where the login page and app page use different hosts, such as `auth.openai.com` and `chatgpt.com`.

If the matched KeePass entry contains a TOTP secret in a common custom field such as `otp`, `TOTP Seed`, or `TOTP Secret`, the bridge returns the current one-time password and the extension fills detected OTP/code fields such as `autocomplete="one-time-code"`.

When no matching login exists and the page contains entered credentials, clicking `K` or submitting the form shows a Save prompt. Confirming it creates a new KeePass entry through the local bridge.

When a matching login exists but the submitted password differs from KeePass, the page shows an Update prompt. Confirming it updates the existing KeePass entry instead of creating a duplicate. Pending save/update prompts survive a same-tab form reload for a short time so normal login redirects can still trigger the prompt.

The popup result list includes an Edit action for each matched entry. Editing can update title, username, URL, and password directly through the local bridge.

The popup also includes a Trusted Browsers view. Users can review paired browser clients and revoke any client, including the current browser, without opening KeePass options.

If the popup cannot reach KeePass after a plugin restart, check that KeePass browser integration is enabled and that no duplicate KeePassBrowserBridge plugin artifact exists under KeePass' `Plugins` directory.
