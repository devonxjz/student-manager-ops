import { expect } from '@playwright/test';

export const HOME = { admin: '/admin', teacher: '/teacher', student: '/me/credits' };

/** Đăng nhập qua nút tài khoản demo, chờ màn chào mừng rồi vào dashboard. */
export async function loginAs(page, role) {
  await page.goto('/login');
  await page.getByTestId(`demo-${role}`).click();
  await expect(page.getByTestId('welcome-overlay')).toBeVisible();
  await page.waitForURL(`**${HOME[role]}`);
}

export async function loginWith(page, username, password) {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

export const toast = (page, text) => page.locator('[data-sonner-toast]', { hasText: text });

/** Mở menu "..." ở dòng chứa text rồi chọn mục. */
export async function rowAction(page, rowText, item) {
  await page.getByRole('row', { name: new RegExp(rowText) }).getByRole('button', { name: 'Thao tác' }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

export async function pickOption(page, trigger, option) {
  await trigger.click();
  await page.getByRole('option', { name: option }).click();
}

/** Đăng xuất từ menu người dùng và chờ về /login. */
export async function logout(page) {
  await page.getByTestId('user-menu').click();
  await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
  await page.waitForURL('**/login');
}
