# Real-Site Validation Matrix

This document maps real website behaviors to local fixtures and automated tests.
Use it when adding autofill features or fixing site-specific regressions.

## Validation Rule

Every real-site issue should have a deterministic local fixture before the fix is
merged. Manual testing on the real site is useful, but the regression guard must
live in `tests/fixtures/` and `tests/e2e/form-detection.spec.js` or a lower-level
extension test.

## Covered Journeys

| Real-site behavior | Local fixture | Automated coverage |
| --- | --- | --- |
| Standard username/password login | `login-page.html` | `fills username and password on a standard login form` |
| Username-first login across navigation, like Dropbox-style email then password | `multi-step-username.html`, `multi-step-password.html` | `remembers selected login across username-first multi-step flow` |
| Username-first login on one page, where password appears after Continue | `same-page-username-first.html` | `fills password after same-page username-first step reveals password field` |
| Login label says "Email address" and should still be treated as a login step | `username-first-email-address.html` | `treats username-first email address step as a login field` |
| Additional KeePass URL fields, like `auth.openai.com` entry matching `chatgpt.com` | bridge tests in `tests/Program.cs` | `CredentialQueryMatchesAdditionalUrlField` and `CredentialMutationAcceptsPageUrlFromAdditionalUrlField` |
| Google-style Vietnamese authenticator prompt | `google-totp-vi-page.html` | `adds OTP inline button to Google-style Vietnamese authenticator input`, `fills OTP on Google-style Vietnamese authenticator input` |
| Split OTP inputs | `split-otp-page.html` | `fills split OTP inputs across sibling labels` |
| ARIA-described OTP field | `aria-otp-page.html` | `detects OTP input described by ARIA references` |
| Ordinary phone/search input near verification copy must not be treated as OTP | `verification-copy-phone-page.html` | `does not treat ordinary phone input as OTP because nearby copy mentions verification code` |
| viotp/DataTables search box must not be username | `dashboard-search-page.html` plus unit mock | `does not add KeePass inline button to dashboard search input`, `datatable search input should not score as username` |
| Newsletter/contact email fields must not be username-first login | `non-login-email-page.html`, `non-login-contact-page.html` | `does not add KeePass inline button to newsletter email signup`, `does not treat contact support email fields as username-first login` |
| fill.dev-style profile/payment/settings fields must not be login or OTP | `non-login-profile-payment-page.html` | `does not treat profile, payment, or numeric settings forms as login fields` |
| Page contains search plus login; popup fill should ignore non-login focus and fall back to login form | `search-and-login-page.html` | `falls back to page login form when popup fill focus is outside login fields` |
| Page contains two login forms; inline fill should use the clicked form | `two-login-forms.html` | `fills the login form that owns the clicked inline button` |
| Page contains two login forms; popup create should collect the focused form | `two-login-forms.html` | `collects page credential from the focused login form for popup create` |
| Page contains two login forms; popup full-entry fill should use the focused form | `two-login-forms.html` | `fills focused login form for popup full-entry fill` |
| Popup full-entry fill with auto-submit should submit the same focused form | `two-login-forms.html` | `auto-submits the focused login form after popup full-entry fill` |
| Open Shadow DOM login form | `shadow-login-page.html` | `fills username and password inside open Shadow DOM login forms` |
| Delayed Shadow DOM login form | `delayed-shadow-login-page.html` | `adds inline buttons when an open Shadow DOM login form renders later` |
| Save new login after submit | `login-page.html`, `login-submit-redirect.html` | save-prompt and restored-save-prompt tests |
| Update changed password after submit | `login-page.html`, `multi-step-password.html` | update-prompt tests |

## Manual Smoke Checklist

Run this checklist before tagging a release candidate. Keep real credentials in a
throwaway KeePass database.

1. Pair a fresh browser profile with KeePass.
2. Verify popup query and fill on a simple local login fixture.
3. Verify inline picker on a page with multiple matching entries.
4. Verify username-first flow on a real site or a staging page with equivalent structure.
5. Verify a TOTP prompt with a disposable account.
6. Verify a page that has non-login forms near login forms, such as search, contact, or checkout fields.
7. Verify save-new and update-password prompts using throwaway entries.
8. Revoke the browser in KeePass and confirm the extension stops querying/filling until re-paired.

## Adding A New Site Regression

1. Capture the minimum relevant DOM shape, labels, autocomplete attributes, and button text.
2. Add a fixture under `tests/fixtures/` with no third-party scripts or external assets.
3. Add one failing E2E or unit test named after the behavior, not the implementation.
4. Fix the detector/fill behavior.
5. Run `npx playwright test tests/e2e/form-detection.spec.js --project=chromium`.
6. Run `.\scripts\verify.ps1` and `.\scripts\build-release.ps1` before committing.
