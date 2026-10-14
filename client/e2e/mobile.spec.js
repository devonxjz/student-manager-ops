import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile: menu ngăn kéo điều hướng và tự đóng', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.getByRole('button', { name: 'Mở menu' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('link', { name: 'Môn học' }).click();
  await expect(page).toHaveURL(/\/admin\/courses$/);
  await expect(sheet).toBeHidden();
});

test('mobile: landing có menu thu gọn', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('navigation', { name: 'Menu di động' }).getByRole('link', { name: 'Tính năng' }).click();
  await expect(page).toHaveURL(/#features$/);
});
