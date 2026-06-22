import { test, expect } from '@playwright/test';

test.describe('kbb-picker Web Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/picker-host.html');
    await page.waitForFunction(() => customElements.get('kbb-picker') !== undefined);
  });

  test('registers as kbb-picker custom element', async ({ page }) => {
    const defined = await page.evaluate(() => customElements.get('kbb-picker') !== undefined);
    expect(defined).toBe(true);
  });

  test('renders a listbox with credentials', async ({ page }) => {
    const result = await page.evaluate(() => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [
        { name: 'GitHub', username: 'octocat', url: 'https://github.com' },
        { name: 'GitLab', username: 'root', url: 'https://gitlab.com' },
      ];
      document.body.appendChild(picker);
      const listbox = picker.shadowRoot.querySelector('[role="listbox"]');
      const items = picker.shadowRoot.querySelectorAll('[role="option"]');
      return { listboxExists: !!listbox, itemCount: items.length };
    });
    expect(result.listboxExists).toBe(true);
    expect(result.itemCount).toBe(2);
  });

  test('filters credentials by search input', async ({ page }) => {
    const result = await page.evaluate(() => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [
        { name: 'GitHub', username: 'octocat' },
        { name: 'GitLab', username: 'root' },
      ];
      document.body.appendChild(picker);
      const input = picker.shadowRoot.querySelector('.picker-search-input');
      input.value = 'hub';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const items = picker.shadowRoot.querySelectorAll('[role="option"]');
      return { itemCount: items.length, firstName: items[0]?.querySelector('.picker-name')?.textContent };
    });
    expect(result.itemCount).toBe(1);
    expect(result.firstName).toBe('GitHub');
  });

  test('keyboard ArrowDown moves active item', async ({ page }) => {
    await page.evaluate(() => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [
        { name: 'A' },
        { name: 'B' },
        { name: 'C' },
      ];
      document.body.appendChild(picker);
      window.__picker = picker;
    });
    await page.keyboard.press('ArrowDown');
    const active = await page.evaluate(() => {
      const items = window.__picker.shadowRoot.querySelectorAll('[role="option"]');
      return Array.from(items).findIndex(i => i.classList.contains('picker-item--active'));
    });
    expect(active).toBe(1);
  });

  test('keyboard Enter emits kbb-fill event with credential', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [{ name: 'Test', username: 'user', password: 'pass' }];
      document.body.appendChild(picker);
      let filledCred = null;
      picker.addEventListener('kbb-fill', (e) => { filledCred = e.detail.credential; });
      await new Promise(r => setTimeout(r, 10));
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 10));
      return filledCred;
    });
    expect(result?.name).toBe('Test');
  });

  test('keyboard Escape emits kbb-close event', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [{ name: 'A' }];
      document.body.appendChild(picker);
      let closed = false;
      picker.addEventListener('kbb-close', () => { closed = true; });
      await new Promise(r => setTimeout(r, 10));
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 10));
      return closed;
    });
    expect(result).toBe(true);
  });

  test('uses Shadow DOM for style isolation', async ({ page }) => {
    const result = await page.evaluate(() => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [{ name: 'A' }];
      document.body.appendChild(picker);
      return {
        hasShadowRoot: !!picker.shadowRoot,
        hasListbox: !!picker.shadowRoot.querySelector('[role="listbox"]'),
      };
    });
    expect(result.hasShadowRoot).toBe(true);
    expect(result.hasListbox).toBe(true);
  });

  test('respects prefers-color-scheme: dark', async ({ page, context }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const bgColor = await page.evaluate(() => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [{ name: 'A' }];
      document.body.appendChild(picker);
      return getComputedStyle(picker).backgroundColor;
    });
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });
});
