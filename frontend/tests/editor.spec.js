import { expect, test } from '@playwright/test';

test('drags, resizes and rotates canvas layers and saves a background color', async ({ page }) => {
  await page.goto('/editor/new?storage=local');
  await page.getByRole('button', { name: 'Rectangle', exact: true }).click();
  const art = page.locator('.studio-canvas canvas').first();
  const drag = async (x, y, dx, dy) => {
    await art.scrollIntoViewIfNeeded();
    const box = await art.boundingBox();
    const scale = box.width / 1080;
    const startX = box.x + x * scale;
    const startY = box.y + y * scale;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dx, startY + dy, { steps: 6 });
    await page.mouse.up();
  };
  await drag(540, 620, 24, 18);
  const x = page.getByRole('spinbutton', { name: 'X position' });
  const y = page.getByRole('spinbutton', { name: 'Y position' });
  await expect(x).not.toHaveValue('430');
  await drag(Number(await x.inputValue()) + 220, Number(await y.inputValue()) + 220, 24, 17);
  const width = page.getByRole('spinbutton', { name: 'Width' });
  await expect(width).not.toHaveValue('220');
  const scale = (await art.boundingBox()).width / 1080;
  await drag(Number(await x.inputValue()) + Number(await width.inputValue()) / 2, Number(await y.inputValue()) - 50 / scale, 27, 9);
  await expect(page.getByRole('spinbutton', { name: 'Rotation' })).not.toHaveValue('0');
  await page.getByRole('button', { name: 'Background', exact: true }).click();
  await page.getByLabel('Background color').fill('#ddebf0');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Save status' })).toHaveText('Local draft · Saved');
  await page.reload();
  await page.getByRole('button', { name: 'Background', exact: true }).click();
  await expect(page.getByLabel('Background color')).toHaveValue('#ddebf0');
});

test('customizes a template, autosaves edits and photos, and reopens the draft', async ({ page }) => {
  await page.goto('/templates?feeling=love');
  await page.getByRole('link', { name: 'Customize Template' }).click();
  await expect(page).toHaveURL(/\/editor\/local\//);
  await expect(page.getByLabel('Design name')).toHaveValue('Eternal Love');
  await page.getByLabel('Design name').fill('My love letter');
  await page.getByRole('button', { name: 'The little things', exact: true }).click();
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('ආදරයෙන් — with love');
  await page.getByRole('combobox', { name: 'Font', exact: true }).selectOption('Noto Sans Sinhala');
  await page.getByLabel('Font size').fill('82');
  await page.getByLabel('Font size').press('Tab');
  await page.getByLabel('Rotation').fill('12');
  await page.getByLabel('Rotation').press('Tab');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByLabel('Rotation')).toHaveValue('0');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByLabel('Rotation')).toHaveValue('12');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext('2d');
    context.fillStyle = '#7a4861';
    context.fillRect(0, 0, 24, 24);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Upload Photo').setInputFiles({
    name: 'photo.png', mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await expect(page.getByRole('button', { name: 'Photo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.getByRole('button', { name: 'Mobile', exact: true }).click();
  await expect(page.getByRole('dialog').locator('canvas').first()).toBeVisible();
  await page.getByRole('button', { name: 'Close preview' }).click();
  await expect(page.getByRole('status', { name: 'Save status' })).toHaveText('Local draft · Saved');
  await page.reload();
  await expect(page.getByLabel('Design name')).toHaveValue('My love letter');
  await expect(page.getByRole('button', { name: 'Photo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ආදරයෙන් — with love', exact: true }).click();
  await expect(page.getByLabel('Font size')).toHaveValue('82');
  await expect(page.getByLabel('Rotation')).toHaveValue('12');
  await expect(page.getByRole('combobox', { name: 'Font', exact: true })).toHaveValue('Noto Sans Sinhala');
});

test('creates a blank design, edits its layers, duplicates and deletes from drafts', async ({ page }) => {
  await page.goto('/create');
  await page.getByRole('link', { name: 'Start From Scratch' }).click();
  await expect(page.getByText('Added elements will appear here.')).toBeVisible();
  await page.getByLabel('Design name').fill('Fresh design');
  await page.getByRole('button', { name: 'Add Text' }).click();
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('A new note');
  await page.getByRole('button', { name: 'Heart', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicate layer' }).click();
  await expect(page.getByRole('button', { name: 'Hide Heart', exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'Send backward' }).click();
  await page.getByRole('button', { name: 'Delete layer' }).click();
  await expect(page.getByRole('button', { name: 'Hide Heart', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Animation', exact: true }).click();
  await page.getByRole('combobox', { name: 'Background effect' }).selectOption('stars');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Save status' })).toHaveText('Local draft · Saved');
  await page.getByRole('button', { name: 'My Drafts', exact: true }).click();
  const row = page.locator('.draft-row').filter({ has: page.getByRole('heading', { name: 'Fresh design', exact: true }) });
  await row.getByRole('button', { name: 'Duplicate' }).click();
  const copy = page.locator('.draft-row').filter({ hasText: 'Fresh design (copy)' });
  await expect(copy).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await copy.getByRole('button', { name: 'Delete' }).click();
  await expect(copy).toHaveCount(0);
  await row.getByRole('link', { name: 'Preview' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Play Animation' }).click();
  await page.getByRole('button', { name: 'Skip animation' }).click();
  await expect(page.getByRole('region', { name: 'Opened message' }).locator('canvas').first()).toBeVisible();
});
