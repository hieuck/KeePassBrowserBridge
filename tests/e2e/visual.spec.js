import { test, expect } from '@playwright/test';

test.describe('KeePassBrowserBridge Visual Debug', () => {
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
    await page.addScriptTag({ path: 'extension/contentScript.js' });
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
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/__screenshots__/fb-picker-with-entries.png', fullPage: false });
    console.log('SAVED fb-picker-with-entries.png');

    const layout = await page.evaluate(() => {
      const p = document.querySelector('.kbb-inline-picker');
      if (!p) return null;
      // find secondary row (div with "Fill username" or similar)
      const items = p.querySelectorAll('[data-kbb-action="form"], [data-kbb-action="username"]');
      const formItem = items[0];
      if (!formItem) return { error: 'no form item' };
      const secondaryRow = formItem.parentElement.querySelector('div');
      if (!secondaryRow) return { error: 'no secondary row' };
      return {
        secondaryRowStyle: {
          display: secondaryRow.style.display,
          flexWrap: secondaryRow.style.flexWrap,
          width: secondaryRow.style.width,
          flex: secondaryRow.style.flex,
          gap: secondaryRow.style.gap
        },
        secondaryRowComputed: {
          display: window.getComputedStyle(secondaryRow).display,
          width: secondaryRow.getBoundingClientRect().width,
          flex: window.getComputedStyle(secondaryRow).flex,
          childWidths: Array.from(secondaryRow.children).map(c => c.getBoundingClientRect().width),
          childStyles: Array.from(secondaryRow.children).map(c => ({
            text: c.textContent.trim().slice(0, 30),
            flex: c.style.flex,
            minWidth: c.style.minWidth,
            computedFlex: window.getComputedStyle(c).flex,
            computedMinWidth: window.getComputedStyle(c).minWidth
          }))
        }
      };
    });
    console.log('Secondary row:', JSON.stringify(layout, null, 2));
  });

  test('visual: edit form when editing Facebook-style entry', async ({ page }) => {
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
