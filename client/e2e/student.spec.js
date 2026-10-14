import { test, expect } from '@playwright/test';
import { loginAs, loginWith, toast, logout } from './helpers';

test.beforeEach(async ({ page }) => { await loginAs(page, 'student'); });

test('tín chỉ của tôi: vòng tiến độ, thẻ số liệu, bảng môn đạt', async ({ page }) => {
  await expect(page.getByTestId('credit-summary')).toContainText(/Đã đạt \d+ \/ 150 tín chỉ/);
  await expect(page.getByRole('img', { name: /Đã đạt \d+ trên 150 tín chỉ/ })).toBeVisible();
  await expect(page.getByText('Còn thiếu')).toBeVisible();
  await expect(page.getByRole('row', { name: /IT001/ })).toContainText('Đạt');
  // Sinh viên chỉ có một biểu đồ (tín chỉ), không có menu quản lý
  await expect(page.getByRole('link', { name: 'Lớp học' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Lớp của tôi' })).toHaveCount(0);
});

test('thông tin cá nhân hiển thị MSSV, lớp, GVCN', async ({ page }) => {
  await page.getByRole('link', { name: 'Thông tin cá nhân' }).click();
  await expect(page.getByRole('main')).toContainText('20520101');
  await expect(page.getByRole('main')).toContainText('CNTT-K20A');
  await expect(page.getByRole('main')).toContainText('Nguyễn Thị Minh Anh');
  await page.getByRole('main').getByRole('link', { name: 'Đổi mật khẩu' }).click();
  await expect(page).toHaveURL(/\/password$/);
});

test('đổi mật khẩu: validate, thành công, đăng nhập lại bằng mật khẩu mới', async ({ page }) => {
  await page.goto('/password');
  await page.getByLabel('Mật khẩu hiện tại').fill('20520101');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('123');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('456');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByText('Tối thiểu 6 ký tự')).toBeVisible();
  await expect(page.getByText('Mật khẩu nhập lại không khớp')).toBeVisible();

  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('svmoi2026');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('svmoi2026');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(toast(page, 'Đã đổi mật khẩu')).toBeVisible();

  // banner "mật khẩu mặc định" biến mất ở trang khác
  await page.getByRole('link', { name: 'Tín chỉ của tôi' }).click();
  await expect(page.getByText('Bạn đang dùng mật khẩu mặc định')).toHaveCount(0);

  await logout(page);
  await loginWith(page, '20520101', '20520101');
  await expect(page.getByRole('alert')).toBeVisible();
  await loginWith(page, '20520101', 'svmoi2026');
  await page.waitForURL('**/me/credits');
});
