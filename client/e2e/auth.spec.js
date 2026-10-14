import { test, expect } from '@playwright/test';
import { loginAs, loginWith } from './helpers';

test.describe('Đăng nhập & phân quyền route', () => {
  test('validate form rỗng và báo sai mật khẩu', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByText('Nhập tên đăng nhập')).toBeVisible();
    await expect(page.getByText('Nhập mật khẩu', { exact: true })).toBeVisible();

    await loginWith(page, 'admin', 'sai-mat-khau');
    await expect(page.getByRole('alert')).toHaveText('Sai tên đăng nhập hoặc mật khẩu');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('ẩn/hiện mật khẩu', async ({ page }) => {
    await page.goto('/login');
    const pw = page.getByLabel('Mật khẩu', { exact: true });
    await expect(pw).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
    await expect(pw).toHaveAttribute('type', 'text');
  });

  test('nhập tay tài khoản admin → màn chào mừng → /admin', async ({ page }) => {
    await loginWith(page, 'admin', 'admin123');
    await expect(page.getByTestId('welcome-overlay')).toContainText('Quản trị hệ thống');
    await page.waitForURL('**/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  for (const role of ['admin', 'teacher', 'student']) {
    test(`đăng nhập demo ${role} vào đúng dashboard`, async ({ page }) => {
      await loginAs(page, role);
      await expect(page.getByTestId('user-menu')).toBeVisible();
    });
  }

  test('chưa đăng nhập vào route bảo vệ → /login, sau đăng nhập quay lại trang cũ', async ({ page }) => {
    await page.goto('/admin/courses');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByTestId('demo-admin').click();
    await page.waitForURL('**/admin/courses');
    await expect(page.getByRole('heading', { name: 'Môn học' })).toBeVisible();
  });

  test('sai vai trò bị chuyển về trang của mình', async ({ page }) => {
    await loginAs(page, 'student');
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/me\/credits$/);
    await page.goto('/teacher/classes');
    await expect(page).toHaveURL(/\/me\/credits$/);
  });

  test('giáo viên không vào được trang admin', async ({ page }) => {
    await loginAs(page, 'teacher');
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/teacher$/);
  });

  test('đã đăng nhập: landing hiện "Vào dashboard", /login tự chuyển hướng', async ({ page }) => {
    await loginAs(page, 'teacher');
    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Vào dashboard' }).click();
    await expect(page).toHaveURL(/\/teacher$/);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/teacher$/);
  });

  test('đăng xuất từ menu người dùng', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.getByTestId('user-menu').click();
    await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
  });
});
