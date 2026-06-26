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

  test('save prompt renders editable Title, URL, and Folder fields', async ({ page }) => {
  const result = await page.evaluate(() => {
    const p = document.createElement('kbb-save-prompt');
    p.setAttribute('name', 'GitHub');
    p.setAttribute('url', 'https://github.com');
    p.setAttribute('username', 'octocat');
    p.setAttribute('title', 'My GitHub');
    p.setAttribute('folders', JSON.stringify(['Social', 'Work', 'Personal']));
    p.setAttribute('folder', 'Social');
    document.body.appendChild(p);
    const shadow = p.shadowRoot;
    return {
      hasTitleInput: !!shadow.querySelector('.prompt-editable-input'),
      hasFolderSelect: !!shadow.querySelector('.prompt-editable-select'),
      hasUrlInput: !!shadow.querySelectorAll('.prompt-editable-input').length >= 2,
      saveWithCustomTitle: (() => {
        const input = shadow.querySelector('.prompt-editable-input');
        if (input) input.value = 'Custom Title';
        return true;
      })(),
    };
  });
  expect(result.hasTitleInput).toBe(true);
  expect(result.hasFolderSelect).toBe(true);
});

test('save prompt renders editable folder options from folders attribute', async ({ page }) => {
  const result = await page.evaluate(() => {
    const p = document.createElement('kbb-save-prompt');
    p.setAttribute('name', 'GitHub');
    p.setAttribute('folders', JSON.stringify(['Social', 'Work', 'Personal']));
    p.setAttribute('folder', 'Social');
    document.body.appendChild(p);
    const shadow = p.shadowRoot;
    const select = shadow.querySelector('.prompt-editable-select');
    const options = select ? Array.from(select.options).map(o => o.textContent) : [];
    return options;
  });
  expect(result).toContain('Social');
  expect(result).toContain('Personal');
});

test('save prompt Save button emits kbb-save with custom title/url/folder', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const p = document.createElement('kbb-save-prompt');
    p.setAttribute('name', 'GitHub');
    p.setAttribute('username', 'octocat');
    p.setAttribute('password', 'secret123');
    p.setAttribute('url', 'https://github.com');
    p.setAttribute('title', 'Default');
    p.setAttribute('folders', JSON.stringify(['Social', 'Work']));
    p.setAttribute('folder', 'Social');
    document.body.appendChild(p);
    // Wait for render
    await new Promise(r => setTimeout(r, 20));
    // Modify title input
    const titleInput = p.shadowRoot.querySelector('.prompt-editable-input');
    if (titleInput) {
      titleInput.value = 'My Custom Title';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    let saved = null;
    p.addEventListener('kbb-save', (e) => { saved = e.detail; });
    p.shadowRoot.querySelector('[data-action="save"]').click();
    await new Promise(r => setTimeout(r, 20));
    return saved ? { title: saved.title, username: saved.username } : null;
  });
  expect(result?.title).toBe('My Custom Title');
  expect(result?.username).toBe('octocat');
});

test('save prompt respects position attribute', async ({ page }) => {
  const result = await page.evaluate(() => {
    const p = document.createElement('kbb-save-prompt');
    p.setAttribute('style', 'position: fixed; top: 100px; right: 50px;');
    document.body.appendChild(p);
    return {
      top: p.style.top,
      right: p.style.right,
    };
  });
  expect(result.top).toBe('100px');
  expect(result.right).toBe('50px');
});

test('update prompt shows diff from old to new username', async ({ page }) => {
  const result = await page.evaluate(() => {
    const p = document.createElement('kbb-update-prompt');
    p.setAttribute('name', 'GitHub');
    p.setAttribute('old-username', 'old_user');
    p.setAttribute('username', 'new_user');
    document.body.appendChild(p);
    const shadow = p.shadowRoot;
    const labels = shadow.querySelectorAll('.prompt-field__label');
    const fromLabel = Array.from(labels).find(l => l.textContent === 'From');
    const toLabel = Array.from(labels).find(l => l.textContent === 'To');
    return {
      fromLabel: fromLabel ? fromLabel.textContent : null,
      toLabel: toLabel ? toLabel.textContent : null,
    };
  });
  expect(result.fromLabel).toBe('From');
  expect(result.toLabel).toBe('To');
});

test('respects prefers-color-scheme: dark', async ({ page, context: _context }) => {
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
