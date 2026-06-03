# Store Screenshots

Generated browser-store screenshots are written here by:

```powershell
.\scripts\capture-store-screenshots.ps1
```

Expected generated files:

- `01-popup-pairing.png`
- `02-popup-account-picker.png`
- `03-inline-picker.png`
- `04-save-login-prompt.png`
- `05-settings-trusted-browsers.png`

These PNGs use fixture data from the repository, including the current version from `extension/manifest.json`, and should be regenerated after UI changes.

Validate the generated assets without opening a browser:

```powershell
node .\scripts\verify-store-screenshots.mjs
```

The verifier checks that all expected PNGs exist and are 1280x800.
Use `--dir <path>` to verify a freshly captured temporary output directory.
