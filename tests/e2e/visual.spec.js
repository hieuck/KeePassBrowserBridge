import { test, expect } from '@playwright/test';

test.describe('KeePassBrowserBridge Visual Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const addModules = () => {
        const addModule = (src) => {
          const script = document.createElement('script');
          script.type = 'module';
          script.src = src;
          document.head.appendChild(script);
        };
        addModule('/extension/src/components/Picker.web.js');
        addModule('/extension/src/components/Prompt.web.js');
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addModules);
      } else {
        addModules();
      }
    });
  });

  test('visual: inline picker with multiple entries and custom fields', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  url: 'https://www.facebook.com/login',
                  entries: [
                    {
                      Uuid: 'fb-1', EntryId: 'fb-1', Title: 'Facebook',
                      UserName: 'hieuck@example.com', Password: 'P@ssw0rd!2024',
                      Url: 'https://www.facebook.com',
                      CustomFields: [
                        { Name: 'URL Messenger', Value: 'https://m.me/login', IsProtected: false },
                        { Name: '*something', Value: 'special-token-abc123', IsProtected: false },
                        { Name: 'Recovery Email', Value: 'recovery@example.com', IsProtected: false },
                        { Name: 'Backup Code', Value: '12345-67890', IsProtected: false }
                      ]
                    },
                    {
                      Uuid: 'gh-1', EntryId: 'gh-1', Title: 'GitHub',
                      UserName: 'octocat', Password: 'hunter2hunter2', Url: 'https://github.com'
                    }
                  ]
                }
              };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.waitForTimeout(2000);

    const buttons = page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]');
    const btnCount = await buttons.count();
    console.log(`Found ${btnCount} username inline buttons`);
    if (btnCount > 0) {
      await buttons.nth(0).click();
    } else {
      await page.evaluate(() => {
        const b = document.querySelector('.kbb-inline-button[aria-label="Fill username from KeePass"]');
        if (b) b.click();
      });
    }
    await expect(page.locator('kbb-picker')).toHaveCount(1);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/__screenshots__/fb-picker-with-entries.png', fullPage: false });
    console.log('SAVED fb-picker-with-entries.png');

    const layout = await page.evaluate(() => {
      const picker = document.querySelector('kbb-picker');
      if (!picker || !picker.shadowRoot) return { error: 'no picker' };
      const items = picker.shadowRoot.querySelectorAll('[role="option"]');
      const formItem = items[0];
      if (!formItem) return { error: 'no option' };
      const rect = formItem.getBoundingClientRect();
      return {
        itemCount: items.length,
        itemNames: Array.from(items).map((item) => {
          const nameNode = item.querySelector('.picker-name');
          return nameNode ? nameNode.textContent.trim() : '';
        }),
        firstItemStyle: {
          display: window.getComputedStyle(formItem).display,
          width: rect.width,
          flex: window.getComputedStyle(formItem).flex,
          padding: window.getComputedStyle(formItem).padding
        }
      };
    });
    console.log('Picker layout:', JSON.stringify(layout, null, 2));
  });

  test.skip('visual: edit form when editing Facebook-style entry (v1 feature, popup demo mode no longer exists in v2)', async ({ page }) => {
    await page.goto('/popup.html?demo=1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const items = page.locator('.credential-item');
    const itemCount = await items.count();
    console.log(`Found ${itemCount} credential items in demo popup`);
    await page.screenshot({ path: 'tests/__screenshots__/popup-demo-loaded.png', fullPage: true });
    console.log('SAVED popup-demo-loaded.png');
    if (itemCount > 0) {
      for (let i = 0; i < itemCount; i++) {
        const text = await items.nth(i).textContent();
        if (text && text.includes('Facebook')) {
          await items.nth(i).click();
          await page.waitForTimeout(500);
          const editBtn = items.nth(i).locator('.btn-edit');
          if (await editBtn.count() > 0) {
            await editBtn.first().click();
            await page.waitForTimeout(800);
            await page.screenshot({ path: 'tests/__screenshots__/popup-edit-form.png', fullPage: true });
            console.log('SAVED popup-edit-form.png');
            const addCustomBtn = page.locator('[data-action="add-custom-field"], button:has-text("Add field")');
            if (await addCustomBtn.count() > 0) {
              await addCustomBtn.first().click();
              await page.waitForTimeout(500);
              await page.screenshot({ path: 'tests/__screenshots__/popup-edit-with-custom.png', fullPage: true });
              console.log('SAVED popup-edit-with-custom.png');
            }
          } else {
            console.log('No .btn-edit found in Facebook item');
          }
          break;
        }
      }
    }
  });
});
