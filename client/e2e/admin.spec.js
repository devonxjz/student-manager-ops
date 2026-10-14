import { test, expect } from '@playwright/test';
import { loginAs, loginWith, pickOption, rowAction, toast, logout } from './helpers';

test.beforeEach(async ({ page }) => { await loginAs(page, 'admin'); });

test('dashboard: thẻ số liệu, biểu đồ, xem dạng bảng, đổi chỉ số theo lớp', async ({ page }) => {
  for (const label of ['Lớp học', 'Giáo viên', 'Sinh viên', 'Môn học']) {
    await expect(page.getByRole('main').getByText(label, { exact: true }).first()).toBeVisible();
  }
  // 7 biểu đồ (3 cột/area + 3 donut + 1 thanh ngang)
  await expect(page.locator('.recharts-wrapper')).toHaveCount(7);

  const card = page.locator('div.rounded-xl', { has: page.getByText('Phân bố tín chỉ sinh viên') }).first();
  await card.getByRole('button', { name: 'Xem dạng bảng' }).click();
  await expect(card.getByRole('columnheader', { name: 'Khoảng tín chỉ' })).toBeVisible();
  await card.getByRole('button', { name: 'Xem biểu đồ' }).click();
  await expect(card.locator('.recharts-wrapper')).toBeVisible();

  await page.getByRole('tab', { name: 'TB tín chỉ' }).click();
  await expect(page.getByText('Trung bình tín chỉ mỗi sinh viên, tô màu theo ngưỡng')).toBeVisible();

  // Gán GVCN từ dashboard mở form sửa lớp
  await page.getByRole('link', { name: 'Gán GVCN' }).click();
  await expect(page).toHaveURL(/\/admin\/classes$/);
  await expect(page.getByRole('dialog')).toContainText('Sửa lớp');
  await expect(page.getByLabel('Mã lớp')).toHaveValue('CNTT-K23A');
});

test('lớp học: validate, thêm, tìm, sửa gán GVCN, xoá (và chặn xoá lớp còn SV)', async ({ page }) => {
  await page.goto('/admin/classes');
  await page.getByRole('button', { name: 'Thêm lớp' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Thêm lớp' }).click();
  await expect(dialog.getByText('Nhập mã lớp')).toBeVisible();

  await dialog.getByLabel('Mã lớp').fill('CNTT-K24A');
  await dialog.getByLabel('Tên lớp').fill('Công nghệ thông tin K24 - A');
  await pickOption(page, dialog.getByLabel('Giáo viên chủ nhiệm'), /GV002/);
  await dialog.getByRole('button', { name: 'Thêm lớp' }).click();
  await expect(toast(page, 'Đã thêm lớp CNTT-K24A')).toBeVisible();
  await expect(dialog).toBeHidden();

  await page.getByLabel('Tìm kiếm').fill('K24');
  await expect(page.getByRole('row', { name: /CNTT-K24A/ })).toContainText('Trần Quốc Bảo');

  // Trùng mã lớp
  await page.getByRole('button', { name: 'Thêm lớp' }).click();
  await dialog.getByLabel('Mã lớp').fill('CNTT-K24A');
  await dialog.getByLabel('Tên lớp').fill('Trùng');
  await dialog.getByRole('button', { name: 'Thêm lớp' }).click();
  await expect(toast(page, 'đã tồn tại')).toBeVisible();
  await dialog.getByRole('button', { name: 'Huỷ' }).click();

  await rowAction(page, 'CNTT-K24A', 'Sửa / gán GVCN');
  await dialog.getByLabel('Tên lớp').fill('CNTT K24 - A (sửa)');
  await pickOption(page, dialog.getByLabel('Giáo viên chủ nhiệm'), /Chưa phân công/);
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(toast(page, 'Đã cập nhật lớp')).toBeVisible();
  await expect(page.getByRole('row', { name: /CNTT-K24A/ })).toContainText('Chưa phân công');

  await rowAction(page, 'CNTT-K24A', 'Xoá');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá lớp' }).click();
  await expect(toast(page, 'Đã xoá lớp CNTT-K24A')).toBeVisible();

  await page.getByLabel('Tìm kiếm').fill('CNTT-K20A');
  await rowAction(page, 'CNTT-K20A', 'Xoá');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá lớp' }).click();
  await expect(toast(page, 'Lớp còn sinh viên')).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Huỷ' }).click();

  // Xem sinh viên của lớp
  await rowAction(page, 'CNTT-K20A', 'Xem sinh viên');
  await expect(page).toHaveURL(/\/teacher\/classes\/1$/);
});

test('giáo viên: thêm (kèm tài khoản), sửa, xoá; tài khoản mới đăng nhập được', async ({ page }) => {
  await page.goto('/admin/teachers');
  await page.getByRole('button', { name: 'Thêm giáo viên' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã giáo viên').fill('GV007');
  await dialog.getByLabel('Họ và tên').fill('Mai Thanh Tùng');
  await dialog.getByLabel('Email').fill('email-sai');
  await dialog.getByRole('button', { name: 'Thêm giáo viên' }).click();
  await expect(dialog.getByText('Email không hợp lệ')).toBeVisible();
  await dialog.getByLabel('Email').fill('tung.mai@school.edu.vn');
  await dialog.getByRole('button', { name: 'Thêm giáo viên' }).click();
  await expect(toast(page, 'Đã thêm giáo viên Mai Thanh Tùng')).toBeVisible();

  await page.getByLabel('Tìm kiếm').fill('GV007');
  await expect(page.getByRole('row', { name: /GV007/ })).toContainText('Chưa chủ nhiệm');

  await rowAction(page, 'GV007', 'Sửa');
  await dialog.getByLabel('Họ và tên').fill('Mai Thanh Tùng (ThS)');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(toast(page, 'Đã cập nhật giáo viên')).toBeVisible();
  await expect(page.getByRole('row', { name: /GV007/ })).toContainText('(ThS)');

  // tài khoản mới: gv007 / gv007
  await logout(page);
  await loginWith(page, 'gv007', 'gv007');
  await page.waitForURL('**/teacher');
  await expect(page.getByText('Bạn chưa được phân công chủ nhiệm lớp nào')).toBeVisible();
  await expect(page.getByText('Bạn đang dùng mật khẩu mặc định')).toBeVisible();
});

test('giáo viên: xoá', async ({ page }) => {
  await page.goto('/admin/teachers');
  await rowAction(page, 'GV006', 'Xoá');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá giáo viên' }).click();
  await expect(toast(page, 'Đã xoá giáo viên')).toBeVisible();
  await expect(page.getByRole('row', { name: /GV006/ })).toHaveCount(0);
});

test('sinh viên: thêm, lọc theo lớp/tiến độ, chuyển lớp, xoá', async ({ page }) => {
  await page.goto('/admin/students');
  await page.getByRole('button', { name: 'Thêm sinh viên' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Thêm sinh viên' }).click();
  await expect(dialog.locator('p.text-rose-600', { hasText: 'Chọn lớp' })).toBeVisible();
  await dialog.getByLabel('MSSV').fill('24520999');
  await dialog.getByLabel('Họ và tên').fill('Trịnh Minh Khôi');
  await dialog.getByLabel('Ngày sinh').fill('2006-05-20');
  await pickOption(page, dialog.getByLabel('Lớp', { exact: true }), /CNTT-K23A/);
  await dialog.getByRole('button', { name: 'Thêm sinh viên' }).click();
  await expect(toast(page, 'Đã thêm sinh viên Trịnh Minh Khôi')).toBeVisible();

  await pickOption(page, page.getByLabel('Lọc theo lớp'), 'CNTT-K23A');
  await expect(page.getByText('/ 10 dòng')).toBeVisible();
  await expect(page.getByRole('row', { name: /24520999/ })).toBeVisible();
  await pickOption(page, page.getByLabel('Lọc theo tiến độ'), 'Đúng tiến độ');
  await expect(page.getByText('Không tìm thấy kết quả').or(page.getByText('Không có sinh viên'))).toBeVisible();
  await pickOption(page, page.getByLabel('Lọc theo tiến độ'), 'Mọi tiến độ');
  await pickOption(page, page.getByLabel('Lọc theo lớp'), 'Tất cả lớp');

  await page.getByLabel('Tìm kiếm').fill('24520999');
  await rowAction(page, '24520999', 'Sửa / chuyển lớp');
  await pickOption(page, dialog.getByLabel('Lớp', { exact: true }), /KHMT-K22A/);
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(toast(page, 'Đã cập nhật và chuyển lớp')).toBeVisible();
  await expect(page.getByRole('row', { name: /24520999/ })).toContainText('KHMT-K22A');

  await rowAction(page, '24520999', 'Xoá');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá sinh viên' }).click();
  await expect(toast(page, 'Đã xoá sinh viên Trịnh Minh Khôi')).toBeVisible();
  await expect(page.getByText('Không tìm thấy kết quả')).toBeVisible();
});

test('môn học: validate tín chỉ, thêm, sắp xếp, sửa, xoá', async ({ page }) => {
  await page.goto('/admin/courses');
  await page.getByRole('button', { name: 'Thêm môn học' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã môn').fill('SE110');
  await dialog.getByLabel('Tên môn học').fill('Lập trình Node.js');
  await dialog.getByLabel('Số tín chỉ').fill('11');
  await dialog.getByRole('button', { name: 'Thêm môn học' }).click();
  await expect(dialog.getByText('Tối đa 10')).toBeVisible();
  await dialog.getByLabel('Số tín chỉ').fill('3');
  await dialog.getByRole('button', { name: 'Thêm môn học' }).click();
  await expect(toast(page, 'Đã thêm môn SE110')).toBeVisible();

  // sắp xếp theo tín chỉ giảm dần → khoá luận (10 TC) lên đầu
  await page.getByRole('button', { name: 'Tín chỉ' }).click();
  await page.getByRole('button', { name: 'Tín chỉ' }).click();
  await expect(page.getByRole('row').nth(1)).toContainText('PR004');

  await page.getByLabel('Tìm kiếm').fill('SE110');
  await rowAction(page, 'SE110', 'Sửa');
  await dialog.getByLabel('Số tín chỉ').fill('4');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(toast(page, 'Đã cập nhật môn học')).toBeVisible();
  await expect(page.getByRole('row', { name: /SE110/ })).toContainText('4');

  await rowAction(page, 'SE110', 'Xoá');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá môn học' }).click();
  await expect(toast(page, 'Đã xoá môn SE110')).toBeVisible();
});

test('phân quyền: đổi vai trò, khoá/mở, đặt lại mật khẩu, không tự sửa mình', async ({ page }) => {
  await page.goto('/admin/users');
  await expect(page.getByLabel('Đổi vai trò admin')).toBeDisabled();
  await expect(page.getByLabel('Khoá admin')).toBeDisabled();

  await page.getByLabel('Tìm kiếm').fill('gv005');
  await pickOption(page, page.getByLabel('Đổi vai trò gv005'), 'Quản trị');
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText('@gv005');
  await confirm.getByRole('button', { name: 'Đổi vai trò' }).click();
  await expect(toast(page, 'Đã đổi gv005 thành Quản trị')).toBeVisible();
  await expect(page.getByRole('row', { name: /gv005/ }).getByText('Quản trị').first()).toBeVisible();

  await page.getByLabel('Tìm kiếm').fill('gv004');
  await page.getByLabel('Khoá gv004').click();
  await expect(toast(page, 'Đã khoá gv004')).toBeVisible();
  await expect(page.getByRole('row', { name: /gv004/ })).toContainText('Bị khoá');

  await page.getByRole('button', { name: 'Đặt lại mật khẩu gv004' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đặt lại' }).click();
  await expect(toast(page, 'Đã đặt lại mật khẩu')).toBeVisible();
  await expect(page.getByRole('row', { name: /gv004/ })).toContainText('Chưa đổi MK');

  // Tab lọc vai trò
  await page.getByLabel('Tìm kiếm').fill('');
  await page.getByRole('tab', { name: 'Quản trị' }).click();
  await expect(page.getByText('1–2 / 2 dòng')).toBeVisible();

  // Tài khoản bị khoá không đăng nhập được
  await logout(page);
  await loginWith(page, 'gv004', 'gv004');
  await expect(page.getByRole('alert')).toContainText('bị khoá');
});

test('khôi phục dữ liệu demo từ menu người dùng', async ({ page }) => {
  await page.goto('/admin/courses');
  await rowAction(page, 'IT001', 'Xoá');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá môn học' }).click();
  await expect(toast(page, 'Đã xoá môn IT001')).toBeVisible();
  await page.getByTestId('user-menu').click();
  await page.getByRole('menuitem', { name: 'Khôi phục dữ liệu demo' }).click();
  await expect(page.getByRole('row', { name: /IT001/ })).toBeVisible();
});
