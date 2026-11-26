import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { expect, test } from '@playwright/test';

test('publishes a protected anonymous letter and opens the snapshot as a recipient', async ({ page, browser, baseURL }) => {
  test.skip(process.env.FEELCRAFT_TEST_MYSQL !== '1', 'Requires the running database-backed development stack');
  const { createDatabase, checkDatabase } = await import('../../backend/src/config/database.js');
  const env = parseEnv(await readFile(new URL('../../backend/.env', import.meta.url), 'utf8'));
  const db = createDatabase({ ...env, ...process.env, DB_DISABLED: 'false' });
  const email = randomUUID() + '@feelcraft.test';
  let recipientContext;
  let token;
  try {
    await checkDatabase(db);
    await page.goto('/register');
    const form = page.locator('main form');
    const password = randomUUID();
    await form.getByLabel('Name').fill('Private Publisher');
    await form.getByLabel('Email').fill(email);
    await form.getByLabel('Password', { exact: true }).fill(password);
    await form.getByLabel('Confirm password', { exact: true }).fill(password);
    await form.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/templates?feeling=love');
    await page.getByRole('link', { name: 'Customize Template' }).click();
    await page.getByRole('button', { name: 'The little things', exact: true }).click();
    await page.getByRole('textbox', { name: 'Text', exact: true }).fill('An original published note');
    const png = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 18;
      const context = canvas.getContext('2d');
      context.fillStyle = '#a35674';
      context.fillRect(0, 0, 28, 18);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await page.getByLabel('Upload Photo').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await expect(page.getByRole('button', { name: 'Photo', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Save status' })).toHaveText(/Account draft .* Saved/);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const publish = page.getByRole('dialog', { name: 'Publish your message' });
    await publish.getByLabel('Message title').fill('A letter for tomorrow');
    await publish.getByLabel('Recipient name (optional)').fill('Ava');
    await publish.getByRole('combobox', { name: 'Sender identity' }).selectOption('anonymous');
    await publish.getByRole('combobox', { name: 'Optional music' }).selectOption('ambient');
    await publish.getByLabel('Password (optional)').fill('a test code');
    await publish.getByRole('button', { name: 'Preview Experience' }).click();
    await expect(page.getByRole('heading', { name: 'A letter for tomorrow' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to publishing' }).click();
    await publish.getByRole('button', { name: 'Publish Message' }).click();
    const share = page.getByRole('dialog', { name: 'Share your message' });
    const url = await share.getByLabel('Message URL').inputValue();
    token = new URL(url).pathname.split('/').at(-1);
    expect(new URL(url).origin).toBe(baseURL);
    await expect(share.getByRole('link', { name: 'Share via WhatsApp' })).toHaveAttribute('href', 'https://wa.me/?text=' + encodeURIComponent(url));
    await expect(share.getByRole('link', { name: 'Open Published Message' })).toHaveAttribute('href', url);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await share.getByRole('button', { name: 'Copy Link' }).click();
    await expect(share.getByRole('status')).toHaveText('Link copied.');
    const download = page.waitForEvent('download');
    await share.getByRole('button', { name: 'Download QR Code' }).click();
    expect((await download).suggestedFilename()).toBe('feelcraft-message-qr.png');
    await page.getByRole('button', { name: 'Close Share your message' }).click();

    await page.getByRole('button', { name: 'An original published note', exact: true }).click();
    await page.getByRole('textbox', { name: 'Text', exact: true }).fill('An unpublished draft edit');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Save status' })).toHaveText(/Account draft .* Saved/);

    recipientContext = await browser.newContext({ viewport: page.viewportSize() });
    const recipient = await recipientContext.newPage();
    await recipient.goto(url);
    await expect(recipient.getByRole('navigation')).toHaveCount(0);
    await expect(recipient.getByRole('heading', { name: 'A letter under lock' })).toBeVisible();
    await recipient.getByLabel('Message password').fill('wrong code');
    await recipient.getByRole('button', { name: 'Unlock Message' }).click();
    await expect(recipient.getByRole('alert')).toHaveText('That password is incorrect.');
    await recipient.getByLabel('Message password').fill('a test code');
    await recipient.getByRole('button', { name: 'Unlock Message' }).click();
    await recipient.getByRole('button', { name: 'Open Message' }).click();
    await expect(recipient.getByRole('button', { name: 'Opening…' })).toBeVisible();
    const opened = recipient.getByRole('region', { name: 'Opened message' });
    await expect(opened.getByText('An original published note')).toBeAttached();
    await expect(opened.getByText('An unpublished draft edit')).toHaveCount(0);
    await expect(opened.getByText('Private Publisher')).toHaveCount(0);
    const canvas = opened.locator('canvas').first();
    await expect(canvas).toBeVisible();
    // The uploaded swatch covers the center of the design. Verify the recipient canvas paints it.
    await expect.poll(() => canvas.evaluate(node => {
      const [red, green, blue] = node.getContext('2d').getImageData(
        Math.floor(node.width * .5), Math.floor(node.height * .49), 1, 1,
      ).data;
      return Math.abs(red - 163) + Math.abs(green - 86) + Math.abs(blue - 116);
    })).toBeLessThan(24);
    expect(await recipient.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(recipient.viewportSize().width);
    await recipient.getByRole('button', { name: 'Play music' }).click();
    await recipient.getByRole('button', { name: 'Mute music' }).click();
    await recipient.getByRole('button', { name: 'Replay animation' }).click();
    await recipient.getByRole('button', { name: 'Skip animation' }).click();
    await expect(opened).toBeVisible();
    await recipient.getByRole('button', { name: 'Report message' }).click();
    const report = recipient.getByRole('dialog', { name: 'Report this message' });
    await report.getByRole('combobox', { name: 'Reason' }).selectOption('other');
    await report.getByRole('button', { name: 'Send Report' }).click();
    await expect(recipient.getByRole('heading', { name: 'Report received' })).toBeVisible();

    await page.goto('/dashboard?tab=published');
    await expect(page.getByText(/Published .* 1 open/)).toBeVisible();
    await db.execute('UPDATE publications SET expires_at = UTC_TIMESTAMP(3) - INTERVAL 1 SECOND WHERE share_token = ?', [token]);
    await recipient.reload();
    await expect(recipient.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
    await page.getByRole('button', { name: 'Revoke', exact: true }).click();
    await page.getByRole('dialog', { name: 'Revoke link' }).getByRole('button', { name: 'Revoke link', exact: true }).click();
    await expect(page.getByText('Link revoked.')).toBeVisible();
    await recipient.reload();
    await expect(recipient.getByRole('heading', { name: 'This link was revoked' })).toBeVisible();
  } finally {
    try {
      if (token) await db.execute(`DELETE r FROM publication_reports r JOIN publications p ON p.id = r.publication_id
        JOIN users u ON u.id = p.owner_id WHERE p.share_token = ? AND u.email = ?`, [token, email]);
      await db.execute('DELETE FROM users WHERE email = ?', [email]);
    }
    finally { await db.end(); await recipientContext?.close(); }
  }
});
