import { test, expect } from '@playwright/test';
import { loginAs, rowAction, toast } from './helpers';

test.beforeEach(async ({ page }) => { await loginAs(page, 'teacher'); });

test('tổng quan: số liệu và biểu đồ lớp chủ nhiệm', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Xin chào, Nguyễn Thị Minh Anh/ })).toBeVisible();
  await expect(page.getByText('Lớp chủ nhiệm')).toBeVisible();
  await expect(page.locator('.recharts-wrapper')).toHaveCount(3);
  await page.getByRole('main').getByRole('link', { name: 'Lớp của tôi' }).click();
  await expect(page).toHaveURL(/\/teacher\/classes$/);
});

test('lớp của tôi: chỉ thấy lớp mình chủ nhiệm, mở danh sách SV', async ({ page }) => {
  await page.getByRole('link', { name: 'Lớp của tôi' }).click();
  await expect(page.getByTestId('class-card')).toHaveCount(2);
  await expect(page.getByText('CNTT-K20B')).toHaveCount(0);
  await page.getByTestId('class-card').filter({ hasText: 'CNTT-K20A' }).getByRole('link', { name: 'Xem sinh viên' }).click();
  await expect(page).toHaveURL(/\/teacher\/classes\/1$/);
  await expect(page.getByRole('heading', { name: 'CNTT-K20A' })).toBeVisible();
});

test('không truy cập được lớp của giáo viên khác (403)', async ({ page }) => {
  await page.goto('/teacher/classes/2');
  await expect(page.getByText('Lớp này không do bạn quản lý')).toBeVisible();
});

test('sinh viên trong lớp: thêm, trùng MSSV, sửa, tìm, phân trang, xoá', async ({ page }) => {
  await page.goto('/teacher/classes/1');
  await expect(page.getByText('1–10 / 12 dòng')).toBeVisible();
  await page.getByRole('button', { name: 'Trang sau' }).click();
  await expect(page.getByText('11–12 / 12 dòng')).toBeVisible();
  await page.getByRole('button', { name: 'Trang trước' }).click();

  await page.getByRole('button', { name: 'Thêm sinh viên' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('MSSV').fill('20520199');
  await dialog.getByLabel('Họ và tên').fill('Lý Thu Hằng');
  await dialog.getByLabel('Email').fill('hang.ly@student.edu.vn');
  await dialog.getByRole('button', { name: 'Thêm sinh viên' }).click();
  await expect(toast(page, 'Đã thêm sinh viên Lý Thu Hằng')).toBeVisible();
  await expect(page.getByText('/ 13 dòng')).toBeVisible();

  // Trùng MSSV → lỗi từ API, dialog vẫn mở
  await page.getByRole('button', { name: 'Thêm sinh viên' }).click();
  await dialog.getByLabel('MSSV').fill('20520199');
  await dialog.getByLabel('Họ và tên').fill('Trùng');
  await dialog.getByRole('button', { name: 'Thêm sinh viên' }).click();
  await expect(toast(page, 'đã tồn tại')).toBeVisible();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Huỷ' }).click();

  await page.getByLabel('Tìm kiếm').fill('hang');
  await rowAction(page, '20520199', 'Sửa');
  await dialog.getByLabel('Họ và tên').fill('Lý Thu Hằng B');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(toast(page, 'Đã cập nhật sinh viên')).toBeVisible();
  await expect(page.getByRole('row', { name: /20520199/ })).toContainText('Lý Thu Hằng B');

  await rowAction(page, '20520199', 'Xoá');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá sinh viên' }).click();
  await expect(toast(page, 'Đã xoá sinh viên Lý Thu Hằng B')).toBeVisible();
});

test('nhập điểm: badge và tín chỉ cập nhật tức thì, lưu, huỷ, cảnh báo rời trang', async ({ page }) => {
  await page.goto('/teacher/classes/1');
  await rowAction(page, '20520101', 'Nhập điểm');
  await expect(page).toHaveURL(/\/teacher\/classes\/1\/students\/1\/results$/);

  const live = page.getByTestId('live-credits');
  const before = Number(await live.textContent());
  await page.getByRole('tab', { name: 'Chưa có điểm' }).click();
  const row = page.getByRole('row', { name: /Đồ án 1/ });
  const input = row.getByRole('spinbutton');
  await input.fill('8.5');
  await expect(row.getByText('Đạt', { exact: true })).toBeVisible();
  await expect(live).toHaveText(String(before + 2));
  await input.fill('3');
  await expect(row.getByText('Chưa đạt')).toBeVisible();
  await expect(live).toHaveText(String(before));
  await input.fill('12');
  await expect(row.getByText('Không hợp lệ')).toBeVisible();
  await expect(page.getByTestId('save-results')).toBeDisabled();

  // Huỷ thay đổi
  await page.getByRole('button', { name: 'Huỷ thay đổi' }).click();
  await expect(page.getByTestId('save-results')).toBeDisabled();

  // Rời trang khi chưa lưu → hộp xác nhận
  await page.getByRole('tab', { name: 'Tất cả' }).click();
  await page.getByLabel('Tìm môn học').fill('Đồ án 1');
  await page.getByRole('row', { name: /Đồ án 1/ }).getByRole('spinbutton').fill('9');
  await page.getByRole('link', { name: /Về lớp CNTT-K20A/ }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText('chưa lưu');
  await confirm.getByRole('button', { name: 'Ở lại' }).click();
  await expect(page).toHaveURL(/results$/);

  await page.getByTestId('save-results').click();
  await expect(toast(page, 'Đã lưu 1 điểm')).toBeVisible();
  await expect(live).toHaveText(String(before + 2));
  await page.getByRole('link', { name: /Về lớp CNTT-K20A/ }).click();
  await expect(page).toHaveURL(/\/teacher\/classes\/1$/);
  await expect(page.getByRole('row', { name: /20520101/ })).toContainText(`${before + 2}/150`);
});

test('đổi mật khẩu sai mật khẩu hiện tại', async ({ page }) => {
  await page.getByRole('link', { name: 'Đổi mật khẩu' }).click();
  await page.getByLabel('Mật khẩu hiện tại').fill('sai');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('matkhau123');
  await page.getByLabel('Nhập lại mật khẩu mới').fill('matkhau123');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByText('Mật khẩu hiện tại không đúng').first()).toBeVisible();
});
