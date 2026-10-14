# Student Manager

Ứng dụng quản lý sinh viên theo dõi **tín chỉ tích luỹ (x / 150)**, phân quyền 3 vai trò (sinh viên, giáo viên, quản trị).
Đồ án môn Cloud Computing (UTE) — triển khai Node.js lên AWS Elastic Beanstalk, cơ sở dữ liệu Amazon RDS MySQL.

| Tầng | Công nghệ |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js 20 + Express, kiến trúc `routes → middleware → controller → service → model` |
| Xác thực | JWT trong cookie httpOnly + bcrypt |
| Database | MySQL 8 (Amazon RDS) qua Sequelize |
| Hạ tầng | AWS Elastic Beanstalk, CloudWatch Logs |

Thiết kế chi tiết: [`docs/SPEC.md`](docs/SPEC.md). Schema DB: [`database/schema.sql`](database/schema.sql).

## Cấu trúc

```
client/     React app (có API giả để chạy không cần backend)
server/     Express API, test Jest
database/   schema.sql (MySQL 8)
docs/       SPEC.md, báo cáo
```

## Phân quyền

| Chức năng | Sinh viên | Giáo viên | Quản trị |
|---|:-:|:-:|:-:|
| Đăng ký / đăng nhập / đổi mật khẩu | ✔ | ✔ | ✔ |
| Xem tín chỉ của mình | ✔ | | |
| Xem, thêm, sửa, xoá SV **lớp mình chủ nhiệm**, nhập điểm | | ✔ | ✔ (mọi lớp) |
| Quản lý lớp, giáo viên, sinh viên, môn học | | | ✔ |
| Cấp quyền (đổi vai trò, khoá/mở, reset mật khẩu) | | | ✔ |

Thêm / sửa / xoá viết **một lần** trong `server/src/services/crud.service.js`; các resource chỉ khai báo cấu hình,
khác biệt theo vai trò truyền vào qua `scope` (VD giáo viên: `{ classId }`).

## Chạy thử nhanh (không cần backend, không cần DB)

```bash
cd client
npm install
npm run dev:mock        # http://localhost:5173
```

Tài khoản demo (mật khẩu trùng tên đăng nhập, trừ admin): `admin` / `admin123`, `gv001`, `20520101`.

## Chạy đầy đủ (backend + MySQL)

Yêu cầu: Node.js 20+, MySQL 8.

```bash
# 1. Database
mysql -u root -p < database/schema.sql

# 2. Backend
cd server
cp .env.example .env          # điền DB_*, JWT_SECRET, ADMIN_INITIAL_PASSWORD
npm install
npm run db:seed               # tạo tài khoản admin đầu tiên
npm run dev                   # API ở http://localhost:8080

# 3. Frontend (terminal khác)
cd client
npm install
npm run dev                   # http://localhost:5173, Vite proxy /api sang :8080
```

Khi triển khai: `npm --prefix client run build` tạo `client/dist`, Express tự phục vụ thư mục này cùng với `/api`.

## Kiểm thử

```bash
cd server && npm test         # 120 test Jest + Supertest (SQLite trong bộ nhớ, không cần MySQL)
cd client && npm run test:e2e # 32 test Playwright chạy trên API giả
```

Backend được viết theo TDD: test viết trước, code sau.

## API chính

Tất cả trả JSON, lỗi có dạng `{ "error": "...", "details": [...] }`.

| Method | URL | Quyền |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | công khai |
| GET, PUT | `/api/auth/me`, `/api/auth/password` | đã đăng nhập |
| GET | `/api/me/credits` | sinh viên |
| GET | `/api/teacher/classes`, `/api/teacher/stats` | giáo viên, admin |
| CRUD | `/api/teacher/classes/:classId/students` | giáo viên (lớp mình), admin |
| GET, PUT | `/api/teacher/classes/:classId/students/:id/results` | giáo viên (lớp mình), admin |
| CRUD | `/api/admin/{classes,teachers,students,courses}` | admin |
| GET, PATCH, POST | `/api/admin/users`, `/:id/role`, `/:id/status`, `/:id/reset-password` | admin |
| GET | `/api/admin/stats`, `/health` | admin / công khai |

## Biến môi trường (`server/.env`)

| Biến | Ý nghĩa |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | kết nối MySQL / RDS |
| `JWT_SECRET` | khoá ký JWT (bắt buộc khi production, giống nhau trên mọi instance) |
| `ADMIN_INITIAL_PASSWORD` | mật khẩu admin đầu tiên cho `npm run db:seed` |
| `COOKIE_SECURE` | `true` khi chạy HTTPS |

Không commit `.env`.

## Triển khai AWS

Xem [`docs/SPEC.md`](docs/SPEC.md) (mục 11–12). Phần `.ebextensions`, môi trường load-balanced và minh hoạ rolling deployment / rollback **chưa làm**.

## Tác giả

Trần Lê Thái (24110331) · Nông Hoàng Anh (24110154) — GVHD: TS. Huỳnh Xuân Phụng.
