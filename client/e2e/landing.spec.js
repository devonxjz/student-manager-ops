import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('hero, điều hướng anchor, tab vai trò, FAQ và CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Quản lý sinh viên');

    // Nav anchor
    await page.getByRole('navigation', { name: 'Điều hướng trang' }).getByRole('link', { name: 'Kiến trúc' }).click();
    await expect(page).toHaveURL(/#architecture$/);
    await expect(page.getByText('RDS MySQL 8')).toBeVisible();

    // Tab vai trò
    await page.getByRole('navigation', { name: 'Điều hướng trang' }).getByRole('link', { name: 'Phân quyền' }).click();
    await expect(page.getByText('Giao diện giáo viên')).toBeVisible();
    await page.getByRole('button', { name: /Sinh viên Biết ngay/ }).click();
    await expect(page.getByText('Giao diện sinh viên')).toBeVisible();
    await page.getByRole('button', { name: /Quản trị Toàn cảnh/ }).click();
    await expect(page.getByText('Giao diện quản trị')).toBeVisible();
    await expect(page.getByText('CRUD lớp, giáo viên, sinh viên, môn học')).toBeVisible();

    // FAQ
    const q = page.getByRole('button', { name: 'Giáo viên có xem được lớp khác không?' });
    await q.scrollIntoViewIfNeeded();
    await expect(q).toHaveAttribute('aria-expanded', 'false');
    await q.click();
    await expect(q).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('checkClassOwnership')).toBeVisible();

    // CTA → login
    await page.getByRole('link', { name: 'Đăng nhập hệ thống' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('nút "Đăng nhập" trên navbar và trang 404', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/khong-ton-tai');
    await expect(page.getByText('Không tìm thấy trang')).toBeVisible();
    await page.getByRole('link', { name: 'Về trang chủ' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
