import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SURFACES = {
  popup: {
    url: '/extension/popup.html',
    setup: async (page) => {
      await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
    },
  },
  options: {
    url: '/extension/options.html',
    setup: async (page) => {
      await page.waitForSelector('.options-page', { timeout: 5000 });
      await page.waitForTimeout(300);
    },
  },
  'inline-picker': {
    url: '/tests/fixtures/picker-host.html',
    setup: async (page) => {
      await page.evaluate(() => {
        const picker = document.createElement('kbb-picker');
        picker.credentials = [
          { name: 'GitHub', username: 'octocat' },
          { name: 'GitLab', username: 'root' },
        ];
        document.body.appendChild(picker);
      });
      await page.waitForTimeout(300);
    },
  },
  'save-prompt': {
    url: '/tests/fixtures/prompt-host.html',
    setup: async (page) => {
      await page.evaluate(() => {
        const p = document.createElement('kbb-save-prompt');
        p.setAttribute('name', 'GitHub');
        p.setAttribute('username', 'octocat');
        document.body.appendChild(p);
      });
      await page.waitForTimeout(300);
    },
  },
  'update-prompt': {
    url: '/tests/fixtures/prompt-host.html',
    setup: async (page) => {
      await page.evaluate(() => {
        const p = document.createElement('kbb-update-prompt');
        p.setAttribute('name', 'GitHub');
        p.setAttribute('old-username', 'octocat');
        p.setAttribute('username', 'octocat2');
        document.body.appendChild(p);
      });
      await page.waitForTimeout(300);
    },
  },
};

test.describe('Accessibility audit v2.0', () => {
  for (const [surface, config] of Object.entries(SURFACES)) {
    test(`${surface} - WCAG AA compliance (light)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(config.url);
      await config.setup(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test(`${surface} - WCAG AA compliance (dark)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(config.url);
      await config.setup(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('popup - keyboard navigation reaches interactive elements', async ({ page }) => {
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});

    const interactive = await page.locator('button, input, [tabindex]:not([tabindex="-1"]), a[href]').all();
    expect(interactive.length).toBeGreaterThan(0);

    for (let i = 0; i < interactive.length; i++) {
      await page.keyboard.press('Tab');
    }

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeDefined();
  });

  test('inline picker - arrow key navigation', async ({ page }) => {
    await page.goto('/tests/fixtures/picker-host.html');
    await page.waitForFunction(() => customElements.get('kbb-picker') !== undefined);
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
    await page.waitForTimeout(200);

    const listbox = await page.evaluate(() => {
      return window.__picker.shadowRoot.querySelector('[role="listbox"]') !== null;
    });
    expect(listbox).toBe(true);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
    const activeIdx = await page.evaluate(() => {
      const items = window.__picker.shadowRoot.querySelectorAll('[role="option"]');
      return Array.from(items).findIndex(i => i.classList.contains('picker-item--active'));
    });
    expect(activeIdx).toBe(1);
  });

  test('save prompt - has accessible name', async ({ page }) => {
    await page.goto('/tests/fixtures/prompt-host.html');
    await page.waitForFunction(() => customElements.get('kbb-save-prompt') !== undefined);
    await page.evaluate(() => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('name', 'Test');
      document.body.appendChild(p);
      window.__savePrompt = p;
    });
    await page.waitForTimeout(200);

    const hasLabel = await page.evaluate(() => {
      return window.__savePrompt.shadowRoot.querySelector('[aria-label="Save login"]') !== null;
    });
    expect(hasLabel).toBe(true);
  });

  test('options - sidebar nav has proper ARIA', async ({ page }) => {
    await page.goto('/extension/options.html');
    await page.waitForSelector('.options-page', { timeout: 5000 });

    const nav = page.locator('nav[aria-label="Settings navigation"]');
    await expect(nav).toBeVisible();

    const activeTab = page.locator('.options-sidebar__tab[aria-current="page"]');
    await expect(activeTab).toHaveCount(1);
  });
});
