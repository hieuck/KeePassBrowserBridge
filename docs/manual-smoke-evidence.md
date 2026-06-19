# Manual Smoke Evidence Template

Use this template for each release candidate after automated verification passes. Keep credentials, recovery codes, cookies, session tokens, and KeePass master keys out of this document. Use aliases for accounts and attach screenshots only when they do not reveal secrets.

## Release Candidate

| Field | Value |
| --- | --- |
| Version |  |
| Commit |  |
| Artifact directory |  |
| KeePass version |  |
| KeePassBrowserBridge artifact | DLL / PLGX |
| Windows version |  |
| Tester |  |
| Date |  |

## Automated Gates

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Full verifier | `.\scripts\verify.ps1` |  |  |
| Chromium and Firefox E2E | `.\scripts\verify.ps1 -E2EProjects chromium,firefox` |  |  |
| Clean release build | `.\scripts\build-release.ps1 -RequireCleanSource` |  |  |
| Artifact verification | `.\scripts\verify-release-artifacts.ps1` |  |  |
| Store screenshots | `.\scripts\capture-store-screenshots.ps1`; `node .\scripts\verify-store-screenshots.mjs` |  |  |
| Optional signatures | `.\scripts\verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<fingerprint>"` |  |  |

## Disposable Environment

| Item | Value |
| --- | --- |
| Throwaway KeePass database path |  |
| Browser profile path or label |  |
| Browser under test | Chromium / Chrome / Edge / Firefox |
| Browser version |  |
| Fixture host or disposable account alias |  |
| Network notes |  |

## Functional Smoke Cases

| Case | Expected behavior | Browser result | Evidence |
| --- | --- | --- | --- |
| Pairing and Revocation | Fresh profile pairs with KeePass, appears in trusted browsers, then stops querying after revoke until re-paired. |  |  |
| Popup and Inline Fill | Popup fill and inline picker fill username/password on the selected login form. |  |  |
| Multiple Matches | Account picker can choose a non-first matching KeePass entry and fill that entry. |  |  |
| Focused-Field Fill | Manual username, password, OTP, and custom-field actions fill only the focused or selected field. |  |  |
| Username-First Flow | Username-first or same-page reveal login keeps selected entry and fills the later password step. |  |  |
| Embedded Login Widget | Inline picker in an embedded about:blank/srcdoc login widget matches the top-page URL and fills the selected credential. |  |  |
| Save New Login | New disposable login submission offers save, writes the entry, and persists after database save/reopen. |  |  |
| Update Existing Password | Changed password submission offers update and preserves username/URL metadata. |  |  |
| Change-Password Form | Current-password plus new-password flow updates to the new password, not the old one. |  |  |
| TOTP | Standard and split OTP inputs fill the generated one-time code. |  |  |
| HTTP Basic Auth | Disposable HTTP Basic Auth prompt receives the selected KeePass credential. |  |  |
| Site Overrides | A configured site override changes fill/save behavior only for that site. |  |  |
| Settings Import/Export | Exported settings omit secrets, and importing restores non-secret settings. |  |  |

## Security And Negative Checks

| Case | Expected behavior | Result | Evidence |
| --- | --- | --- | --- |
| Unpaired Profile | A browser profile that was never paired cannot query or mutate KeePass entries. |  |  |
| Revoked Browser | Revoked client receives denied bridge responses and no longer fills pages. |  |  |
| Protected Fields | Protected custom fields are not exposed in popup, content script, settings export, or fill results. |  |  |
| Web Origin Rejection | Ordinary web pages cannot call the loopback bridge successfully through CORS or forged origin headers. |  |  |
| Passkeys/WebAuthn Unsupported | Public build does not request WebAuthn proxy permissions and listing/release notes state passkeys/WebAuthn unsupported. |  |  |
| Lock Cleanup | KeePass/browser lock clears sensitive extension runtime state and prevents further fill until unlocked/re-paired as required. |  |  |

## Cross-Browser Summary

| Browser | Pairing | Fill | Save/Update | HTTP Auth | Notes |
| --- | --- | --- | --- | --- | --- |
| Chromium |  |  |  |  |  |
| Chrome |  |  |  |  |  |
| Edge |  |  |  |  |  |
| Firefox |  |  |  |  |  |

## Release Notes And Store Copy

| Item | Result | Evidence |
| --- | --- | --- |
| Release notes include migration guidance, checksums, signatures when used, privacy policy, residual risks, and unsupported passkeys/WebAuthn. |  |  |
| Store listing uses `docs/store-submission.md`, generated screenshots, current permission justifications, and a published `docs/privacy-policy.md` URL. |  |  |
| Publisher/account names do not imply official KeePass, Kee, KeePassXC, or browser-vendor ownership. |  |  |

## Sign-Off

| Role | Name | Date | Decision | Notes |
| --- | --- | --- | --- | --- |
| Release tester |  |  | Pass / Fail |  |
| Maintainer |  |  | Ship / Hold |  |
