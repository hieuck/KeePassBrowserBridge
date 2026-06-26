# Browser Store Submission

Checked against official Chrome Web Store, Firefox AMO, and Microsoft Edge Add-ons publisher guidance on 2026-06-03.

Use this file as the store-listing source of truth for the Chrome, Firefox, and Edge extension packages produced by `scripts/build-release.ps1`.

## Store Assets

Generate screenshots from the actual extension UI with safe fixture data:

```powershell
.\scripts\capture-store-screenshots.ps1
```

The script writes 1280x800 PNGs to `docs/store-assets/screenshots/`:

- `01-popup-pairing.png` - short-lived pairing code workflow.
- `02-popup-account-picker.png` - matching KeePass entries in the popup picker.
- `03-inline-picker.png` - inline field picker on a login form.
- `04-save-login-prompt.png` - save-new-login prompt after form submit.
- `05-settings-trusted-browsers.png` - settings, site overrides, and trusted browsers.

The generated screenshots use `.test` fixture accounts and do not contain real credentials or database names. Do not edit generated screenshots by hand; rerun the script after UI changes.

## Listing Metadata

| Field | Value |
| --- | --- |
| Name | KeePass Browser Bridge |
| Short summary | Fill and save browser logins from KeePass through a local bridge plugin. |
| Long description | KeePass Browser Bridge connects your browser to KeePass 2.x through a local KeePass plugin. After pairing, the extension can find matching entries, fill forms, copy OTP values, save new logins, update changed passwords, and manage trusted browser access without sending credentials to a cloud service. |
| Primary category | Productivity for Chrome and Edge; Privacy & Security for Firefox AMO. |
| Language | English |
| Single purpose | Provide KeePass 2.x browser autofill, save, update, and trusted-browser management through a loopback-only local bridge. |
| Support URL | Use the GitHub issues URL for the public repository before submission. |
| Privacy policy URL | Publish `docs/privacy-policy.md` and use that public URL before submission. |

Recommended long-description bullets:

- Pair each browser profile with a short-lived code shown by KeePass.
- Fill usernames, passwords, one-time codes, and selected non-protected custom fields.
- Choose between multiple matching entries from the popup or inline picker.
- Save newly submitted logins and update changed passwords back into KeePass.
- Revoke or limit trusted browser permissions from the extension settings or KeePass.
- Keep database access inside KeePass; the extension never reads `.kdbx` files or stores the master key.
- Passkeys/WebAuthn are supported in this release via Chrome WebAuthn proxy (requires opt-in).

Avoid claims such as "official KeePass extension", "KeePassXC replacement", "number one", or references that imply endorsement by other projects.

## Permission Justifications

| Permission | Store justification |
| --- | --- |
| `activeTab` | Identify and fill the active page after the user opens the popup or chooses an inline action. |
| `tabs` | Read the active tab URL and title so the extension can ask KeePass for entries matching the current site. |
| `storage` | Store local extension settings, pairing client ID, and the per-profile bridge secret. |
| `scripting` | Run controlled fill actions in the active tab and restore fill/save prompts after navigation. |
| `clipboardWrite` | Copy selected username, password, OTP, or non-protected custom field values when the user chooses a copy action. |
| `contextMenus` | Expose field actions from browser context menus where supported. |
| `notifications` | Show optional desktop feedback after fill, save, update, or error events. |
| `webRequest` / `webRequestAuthProvider` | Handle HTTP Basic Auth challenges with KeePass entries selected for the requesting site. |
| `webRequestBlocking` on Firefox | Required by Firefox's blocking auth-provider flow for HTTP Basic Auth. |
| `http://127.0.0.1/*` | Communicate with the KeePass plugin bridge on the local loopback interface only. |
| `http://*/*` and `https://*/*` | Detect login, password-change, and OTP forms and inject fill controls on user-visited sites. |

## Privacy Statements

Use `docs/privacy-policy.md` as the publishable policy source. Keep these statements consistent in store privacy fields:

- The extension does not collect analytics, telemetry, or advertising identifiers.
- The extension does not send credentials to any remote server.
- Credentials are requested from KeePass only after the browser profile is paired and requests are authenticated.
- The browser extension stores local settings and pairing secrets in browser extension storage.
- The extension can read page URLs and form fields on visited HTTP/HTTPS pages to detect login forms, fill selected credentials, and offer save/update prompts.
- KeePass remains the only component with direct `.kdbx` database access.
- The extension never stores the KeePass master key.
- Settings export excludes pairing secrets, client IDs, pairing sessions, and lock/activity state.
- Passkey/WebAuthn credentials are managed by the KeePass plugin only. The extension never stores raw private keys.

## Reviewer Notes

Include this in certification notes where a reviewer needs setup context:

KeePass Browser Bridge requires the matching KeePass 2.x plugin from the same release. Install exactly one plugin artifact, start KeePass with a throwaway database, then load the browser extension package and pair it with the code shown by KeePass. The extension communicates only with `http://127.0.0.1:<port>/bridge`; it does not connect to a hosted credential service.

The content script runs in child frames, including about:blank/srcdoc frames, because many sites embed hosted login widgets. It uses the top-page URL for those embedded widgets so KeePass matching stays tied to the page the user is visiting.

## Store-Specific Checks

Chrome Web Store:

1. Upload `KeePassBrowserBridge-chrome-extension-<version>.zip`.
2. Confirm the manifest metadata is final before upload; manifest metadata changes require a new versioned ZIP.
3. Fill listing, privacy, and permission justification fields.
4. Upload at least one 1280x800 screenshot, preferably all five generated screenshots.
5. Attach or link to the privacy policy and support URL.

Firefox AMO:

1. Upload `KeePassBrowserBridge-firefox-extension-<version>.zip`.
2. Confirm the package is a ZIP of extension files, not a parent folder.
3. Include the privacy policy and license text in listing details.
4. Use generated screenshots with localized captions if needed.
5. If future builds add minification or generated bundles, submit source/build instructions for review.

Edge Add-ons:

1. Upload the Chromium ZIP unless Edge-specific manifest changes are introduced.
2. Complete the Partner Center privacy page, including purpose, permissions, and data-practice answers.
3. Reuse Chrome permission justifications, adjusted for Edge wording.
4. Add certification notes explaining the KeePass plugin dependency and loopback bridge.
5. Upload generated screenshots for all supported locales.

## Current Blockers

- Privacy policy URL needs to be published to a public URL (GitHub Pages or raw GitHub URL)
- Chrome Web Store developer account needs to be registered
- Firefox Add-ons developer account needs to be registered
- Store screenshots need to be generated and reviewed

## Open Items Before First Public Listing

- Publish `docs/privacy-policy.md` and use its public URL in every store listing.
- Decide final GitHub repository/support URL.
- Confirm publisher account names do not imply official KeePass, Kee, or KeePassXC ownership.
- Run `.\scripts\verify.ps1 -E2EProjects chromium,firefox`.
- Run `.\scripts\build-release.ps1` and `.\scripts\verify-release-artifacts.ps1`.
- Run `.\scripts\capture-store-screenshots.ps1` after the final UI build.
- Complete the manual smoke test in `docs/release-readiness.md` with a throwaway database and disposable browser profile, recording results in `docs/manual-smoke-evidence.md`.
