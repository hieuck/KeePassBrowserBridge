# MVP Release Checklist

KeePassBrowserBridge has two user-facing artifacts:

- `KeePassBrowserBridge.dll` for KeePass 2.x.
- `KeePassBrowserBridge.plgx` for KeePass 2.x source-based loading.
- A zipped Chrome extension folder built from `extension/`.

## Local verification

Run the full local verification gate:

```powershell
.\scripts\verify.ps1
```

This checks Chrome extension JavaScript syntax, runs the C# tests, and compiles the KeePass plugin sources against the local KeePass executable.

## Manual smoke test

1. Copy the plugin artifact into the KeePass `Plugins` folder and restart KeePass.
2. Open a KeePass database with at least one entry whose URL host matches a login page.
3. In Chrome, open `chrome://extensions`, enable Developer mode, and load the `extension` folder unpacked.
4. Open the extension popup and click Pair.
5. Enter the pairing code shown in KeePass.
6. Visit the login page, click Find Logins, then Fill.
7. Enable Auto-fill in the popup, reload the login page, and confirm the extension fills automatically when exactly one entry matches.
8. Confirm inline `K` buttons appear near username, password, and OTP inputs where present.
9. Click each field-specific `K` button and verify it fills only that field.
10. With multiple matching entries, click a field-specific `K` button, pick one account from the inline picker, and verify only that field is filled from the selected account.
11. Enter a new username and password that do not match an existing entry, click `K`, confirm the Save prompt, and verify a new KeePass entry is created.
12. Enter an existing username with a changed password, submit the form, confirm the Update prompt, and verify the existing KeePass entry password is updated without creating a duplicate.
13. Add a TOTP secret to a matching KeePass entry in a custom field such as `TOTP Seed`, visit a page with an OTP field, and verify Fill enters username, password, and the current one-time password.

For a stable fill test page, serve the fixture over local HTTP:

```powershell
python -m http.server 18080 --directory tests\fixtures
```

Then open `http://127.0.0.1:18080/login-page.html` in Chrome and create a KeePass entry with a matching URL host. The extension should fill the `username` and `password` fields after selecting the matched entry. For OTP testing, add a temporary text input with `autocomplete="one-time-code"` or test on a real site that exposes an OTP/code field.

## GitHub release assets

Attach these files to the release:

- `KeePassBrowserBridge.dll`
- `KeePassBrowserBridge.plgx`
- `KeePassBrowserBridge-chrome-extension-<version>.zip`

Create both assets with:

```powershell
.\scripts\build-release.ps1
```

The DLL artifact is the primary end-user install path because KeePass loads it directly. Install it as `KeePassBrowserBridge.dll`; do not include version numbers or hyphens in the plugin DLL file name, because KeePass derives the plugin class name from the file name.

The PLGX artifact is created with KeePass' own `--plgx-create` command. Do not create the `.plgx` by manually renaming a ZIP file; KeePass validates and compiles the PLGX format when loading plugins.

The GitHub workflow `.github/workflows/release.yml` downloads KeePass, builds the plugin DLL, creates the PLGX artifact, packages the Chrome extension, and uploads both individual artifacts and a combined release bundle.

Keep the release notes short and include:

- Supported KeePass version range.
- Installation steps for the plugin and extension.
- Known MVP limitation: manual smoke testing is required on target websites because login forms vary by site.
