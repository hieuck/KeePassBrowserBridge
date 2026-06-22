import { test, expect } from '@playwright/test';

test.describe('kbb-save-prompt and kbb-update-prompt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/prompt-host.html');
    await page.waitForFunction(() =>
      customElements.get('kbb-save-prompt') !== undefined &&
      customElements.get('kbb-update-prompt') !== undefined
    );
  });

  test('both custom elements are registered', async ({ page }) => {
    const result = await page.evaluate(() => ({
      save: customElements.get('kbb-save-prompt') !== undefined,
      update: customElements.get('kbb-update-prompt') !== undefined,
    }));
    expect(result.save).toBe(true);
    expect(result.update).toBe(true);
  });

  test('save prompt renders with credentials', async ({ page }) => {
    const result = await page.evaluate(() => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('name', 'GitHub');
      p.setAttribute('username', 'octocat');
      p.setAttribute('password', 'secret123');
      p.setAttribute('url', 'https://github.com');
      document.body.appendChild(p);
      const shadow = p.shadowRoot;
      return {
        hasHeader: !!shadow.querySelector('.prompt-header'),
        hasSaveButton: !!shadow.querySelector('[data-action="save"]'),
        hasNeverButton: !!shadow.querySelector('[data-action="never"]'),
        hasCloseButton: !!shadow.querySelector('.prompt-header__close'),
      };
    });
    expect(result.hasHeader).toBe(true);
    expect(result.hasSaveButton).toBe(true);
    expect(result.hasNeverButton).toBe(true);
    expect(result.hasCloseButton).toBe(true);
  });

  test('save prompt Save button emits kbb-save with detail', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('name', 'GitHub');
      p.setAttribute('username', 'octocat');
      p.setAttribute('password', 'secret123');
      document.body.appendChild(p);
      let saved = null;
      p.addEventListener('kbb-save', (e) => { saved = e.detail; });
      await new Promise(r => setTimeout(r, 20));
      p.shadowRoot.querySelector('[data-action="save"]').click();
      await new Promise(r => setTimeout(r, 20));
      return saved;
    });
    expect(result?.name).toBe('GitHub');
    expect(result?.username).toBe('octocat');
    expect(result?.password).toBe('secret123');
  });

  test('save prompt Never button emits kbb-never', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('url', 'https://example.com');
      document.body.appendChild(p);
      let never = null;
      p.addEventListener('kbb-never', (e) => { never = e.detail; });
      await new Promise(r => setTimeout(r, 20));
      p.shadowRoot.querySelector('[data-action="never"]').click();
      await new Promise(r => setTimeout(r, 20));
      return never;
    });
    expect(result?.url).toBe('https://example.com');
  });

  test('save prompt close button emits kbb-dismiss and removes element', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('name', 'X');
      document.body.appendChild(p);
      let dismissed = false;
      p.addEventListener('kbb-dismiss', () => { dismissed = true; });
      await new Promise(r => setTimeout(r, 20));
      p.shadowRoot.querySelector('.prompt-header__close').click();
      await new Promise(r => setTimeout(r, 20));
      return { dismissed, stillInDom: document.body.contains(p) };
    });
    expect(result.dismissed).toBe(true);
    expect(result.stillInDom).toBe(false);
  });

  test('update prompt renders with old/new username diff', async ({ page }) => {
    const result = await page.evaluate(() => {
      const p = document.createElement('kbb-update-prompt');
      p.setAttribute('name', 'GitHub');
      p.setAttribute('old-username', 'octocat');
      p.setAttribute('username', 'octocat2');
      p.setAttribute('password', 'newpass');
      document.body.appendChild(p);
      const shadow = p.shadowRoot;
      const fields = shadow.querySelectorAll('.prompt-field__value');
      const labels = shadow.querySelectorAll('.prompt-field__label');
      const fromIndex = Array.from(labels).findIndex((l) => l.textContent === 'From');
      const toIndex = Array.from(labels).findIndex((l) => l.textContent === 'To');
      return {
        hasUpdateButton: !!shadow.querySelector('[data-action="update"]'),
        hasSkipButton: !!shadow.querySelector('[data-action="skip"]'),
        fieldCount: fields.length,
        fromValue: fromIndex >= 0 ? fields[fromIndex]?.textContent : null,
        toValue: toIndex >= 0 ? fields[toIndex]?.textContent : null,
      };
    });
    expect(result.hasUpdateButton).toBe(true);
    expect(result.hasSkipButton).toBe(true);
    expect(result.fieldCount).toBeGreaterThanOrEqual(2);
    expect(result.fromValue).toBe('octocat');
    expect(result.toValue).toBe('octocat2');
  });

  test('update prompt Update button emits kbb-update with new credentials', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const p = document.createElement('kbb-update-prompt');
      p.setAttribute('name', 'GitHub');
      p.setAttribute('old-username', 'old');
      p.setAttribute('username', 'new');
      p.setAttribute('password', 'newpass');
      document.body.appendChild(p);
      let updated = null;
      p.addEventListener('kbb-update', (e) => { updated = e.detail; });
      await new Promise(r => setTimeout(r, 20));
      p.shadowRoot.querySelector('[data-action="update"]').click();
      await new Promise(r => setTimeout(r, 20));
      return updated;
    });
    expect(result?.username).toBe('new');
    expect(result?.password).toBe('newpass');
  });

  test('update prompt Skip button emits kbb-skip and removes element', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const p = document.createElement('kbb-update-prompt');
      p.setAttribute('name', 'X');
      document.body.appendChild(p);
      let skipped = false;
      p.addEventListener('kbb-skip', () => { skipped = true; });
      await new Promise(r => setTimeout(r, 20));
      p.shadowRoot.querySelector('[data-action="skip"]').click();
      await new Promise(r => setTimeout(r, 20));
      return { skipped, stillInDom: document.body.contains(p) };
    });
    expect(result.skipped).toBe(true);
    expect(result.stillInDom).toBe(false);
  });

  test('uses Shadow DOM for style isolation', async ({ page }) => {
    const result = await page.evaluate(() => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('name', 'X');
      document.body.appendChild(p);
      return {
        saveShadow: !!p.shadowRoot,
      };
    });
    expect(result.saveShadow).toBe(true);
  });

  test('respects prefers-color-scheme: dark', async ({ page, context }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const bgColor = await page.evaluate(() => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('name', 'X');
      document.body.appendChild(p);
      return getComputedStyle(p).backgroundColor;
    });
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });
});
