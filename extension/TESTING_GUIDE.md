# Extension Testing Guide

## Quick Test (Manual)

### 1. Load Extension into Chrome

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select `c:\Users\Admin\OneDrive\Downloads\Program Files\KeePass\Plugins\KeePassBrowserBridge\extension`
6. Extension should appear with icon

### 2. Test Popup UI

1. Click extension icon in toolbar
2. Check popup opens correctly
3. Verify:
   - [ ] Dark/Light mode toggle visible
   - [ ] Status badge shows "Checking"
   - [ ] Endpoint input field visible
   - [ ] Check/Pair buttons visible
   - [ ] Auto-fill checkboxes visible

### 3. Test Settings Page

1. Click extension icon → Settings (gear icon)
2. Or right-click extension → Options
3. Verify:
   - [ ] Settings page loads
   - [ ] General settings visible
   - [ ] Auto-fill settings visible
   - [ ] URL matching options visible
   - [ ] Security settings visible

### 4. Test Pairing Flow

1. Make sure KeePass is running with plugin enabled
2. Click extension icon → "Pair" button
3. Verify:
   - [ ] Pairing panel opens
   - [ ] Timer starts (5 minutes)
   - [ ] Code input field appears
4. In KeePass:
   - Go to Tools → KeePass Browser Bridge → Pair New Browser
   - Copy the 6-digit code
5. Paste code into extension
6. Click "Confirm"
7. Verify:
   - [ ] Pairing succeeds
   - [ ] Status shows "Paired"
   - [ ] Client ID stored

### 5. Test Find Logins

Use a local fixture or disposable test account. Do not use personal production credentials for release smoke testing.

1. Open a website or fixture with a login form, such as `tests/fixtures/login-page.html`
2. Click extension icon → "Find Logins" button
3. Verify:
   - [ ] Current URL displayed
   - [ ] Matching entries shown
   - [ ] Entries include username, password, TOTP
   - [ ] Custom fields shown if present

### 6. Test Fill Login

1. Click on a login entry in popup
2. Verify:
   - [ ] Username filled
   - [ ] Password filled
   - [ ] TOTP filled if present
   - [ ] Custom fields filled if present
   - [ ] On pages with multiple login forms, the focused form is filled

### 7. Test Context Menu

1. Right-click on a username field
2. Verify:
   - [ ] "KeePass Browser Bridge" menu appears
   - [ ] "Fill Username" option visible
   - [ ] "Fill Password" option visible
   - [ ] "Generate Password" option visible

### 8. Test Dark Mode

1. Click theme toggle (moon/sun icon)
2. Verify:
   - [ ] Theme changes
   - [ ] Setting persists after reload

### 9. Test Keyboard Shortcuts

1. Click extension icon
2. Press `Enter` → Should pair/fill first
3. Press `Escape` → Should close panels
4. Press `Ctrl+F` → Should focus query logins
5. Press `Ctrl+P` → Should begin pairing

---

## Automated Test (Playwright)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm run test:e2e
```

### Test Cases

#### Test 1: Extension Loads
```javascript
test('should load popup HTML', async ({ page }) => {
  await page.goto('extension/popup.html');
  await expect(page).toHaveTitle('KeePass Browser Bridge');
});
```

#### Test 2: Pairing Flow
```javascript
test('should complete pairing', async ({ page }) => {
  // Navigate to popup
  // Click Pair button
  // Enter pairing code
  // Verify success
});
```

#### Test 3: Find Logins
```javascript
test('should query logins for URL', async ({ page }) => {
  // Navigate to popup
  // Click Find Logins
  // Verify entries returned
});
```

#### Test 4: Fill Login
```javascript
test('should fill login credentials', async ({ page }) => {
  // Navigate to login page
  // Click extension icon
  // Select login entry
  // Verify fields filled
});
```

---

## Comparison with Kee/KeePassXC-Browser

### UI Comparison

| Element | Kee | KeePassXC-Browser | KBB |
|---------|-----|-------------------|-----|
| Popup header | ✅ | ✅ | ✅ |
| Dark mode toggle | ✅ | ✅ | ✅ |
| Status badge | ✅ | ✅ | ✅ |
| Settings button | ✅ | ✅ | ✅ |
| Find Logins button | ✅ | ✅ | ✅ |
| Pair button | ✅ | ✅ | ✅ |
| Auto-fill checkboxes | ✅ | ✅ | ✅ |
| Context menu | ✅ | ✅ | ✅ |

### Feature Comparison

| Feature | Kee | KeePassXC-Browser | KBB | Status |
|---------|-----|-------------------|-----|--------|
| Pairing | ✅ | ✅ | ✅ | ✅ |
| Find Logins | ✅ | ✅ | ✅ | ✅ |
| Fill Login | ✅ | ✅ | ✅ | ✅ |
| TOTP | ✅ | ✅ | ✅ | ✅ |
| Custom Fields | ✅ | ✅ | ✅ | ✅ |
| HTTP Auth | ✅ | ✅ | ✅ | ✅ |
| Inline Fill | ✅ | ✅ | ✅ | Inline picker, search, keyboard, custom-field actions |
| Save new logins | ✅ | ✅ | ✅ | Page prompt and popup create |
| Update changed passwords | ✅ | ✅ | ✅ | Page prompt and popup edit |
| Site overrides | ✅ | ✅ | ✅ | Auto-fill and auto-submit overrides |
| Trusted browser management | ✅ | ✅ | ✅ | List and revoke |
| Passkeys/WebAuthn | ❌ | ✅ | ❌ | Unsupported in 0.9.0; backend prototype and non-packaged proxy experiment remain gated by `docs/passkeys-webauthn-design.md` |

---

## Real-Site Validation

Use `docs/real-site-validation.md` as the source of truth for site-inspired
coverage. It maps Dropbox-style username-first login, ChatGPT/OpenAI additional
URLs, Google OTP, viotp/DataTables search, fill.dev-style profile/payment forms,
phone-number login identifiers, multi-form pages, Shadow DOM, save prompts,
change-password updates, and update prompts to deterministic fixtures and
automated tests.

---

## Next Steps

1. **Release Candidate Verification**: Run `.\scripts\verify.ps1 -E2EProjects chromium,firefox` before tagging a release candidate.
2. **Manual Smoke Evidence**: Follow `docs/release-readiness.md` and record results in `docs/manual-smoke-evidence.md` with a throwaway KeePass database and disposable browser profile.
3. **Browser-Store Preparation**: Follow `docs/store-submission.md` before public Chrome Web Store, Firefox AMO, or Edge Add-ons submission.
4. **Real Website Testing**: Convert every new real-site issue into a local fixture and E2E test before merging the fix.
