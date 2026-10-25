# Kết quả kiểm thử – Tuần 1

Đây là lần chạy lại kiểm thử sau tuần 1, trên đúng mã nguồn của commit dùng làm dẫn chứng tuần 1. Trước khi chạy, lệnh `git diff 23620d2 --stat -- server client database` không trả về thay đổi nào, tức là mã trong `server/`, `client/`, `database/` trùng với commit đó.

| Thông tin | Giá trị |
| --- | --- |
| Thời điểm chạy | 17/10/2026, 16:50–16:52 (UTC+7) |
| Commit được kiểm thử | [`23620d2`](https://github.com/devonxjz/student-manager-ops/commit/23620d252666851881d7ceaabb456931086e42a4) |
| Máy chạy | Windows 11 Home, Node.js v24.16.0, npm 11.13.0 |
| Cài thư viện | `npm ci` trong `server/` và `client/` |

## Jest (backend)

- **Lệnh:** `cd server && npm test` (Jest + Supertest, SQLite trong bộ nhớ, không cần MySQL).
- **Kết quả:** 6/6 test suite đạt, **120/120 test đạt**, 0 không đạt, thời gian 9,7 giây.
- **Nhật ký đầy đủ:** [jest-2026-10-17.txt](jest-2026-10-17.txt).

Nhật ký có 20 cảnh báo `console.warn` của Sequelize: SQLite không hỗ trợ kiểu số `UNSIGNED`, nên dùng kiểu số thường thay thế. Đây là khác biệt giữa SQLite dùng khi test và MySQL dùng khi chạy thật, không phải lỗi test.

## Playwright (giao diện, end-to-end)

- **Lệnh:** `cd client && npm run test:e2e` (Playwright 1.64.0, Chrome cài trên máy, chạy trên API giả `vite --mode mock`).
- **Kết quả:** **32/32 test đạt**, 0 không đạt, thời gian 1,1 phút.
- **Nhật ký đầy đủ:** [playwright-2026-10-17.txt](playwright-2026-10-17.txt).

## Lỗi còn tồn tại

Không có test nào không đạt.

Giới hạn của lần chạy này:
- Backend được test trên SQLite, chưa test trên MySQL/RDS thật.
- Playwright chạy trên API giả, chưa nối backend thật.
- Chưa có kiểm thử nào trên AWS.
