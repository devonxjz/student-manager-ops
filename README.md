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

Thiết kế chi tiết: [`docs/thiet-ke/SPEC.md`](docs/thiet-ke/SPEC.md). Schema DB: [`database/schema.sql`](database/schema.sql).

## Cấu trúc

```
client/     React app (có API giả để chạy không cần backend)
server/     Express API, test Jest
database/   schema.sql (MySQL 8)
docs/       thiet-ke/ (SPEC, thiết kế CSDL), tuan-N/ (báo cáo từng tuần)
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

## Triển khai AWS Elastic Beanstalk

### 1. Cấu hình tự động (`.ebextensions/` & `Procfile`)
- **Khởi động:** `Procfile` cấu hình chạy `web: node server/server.js`.
- **Cấu hình hạ tầng (`.ebextensions/`):**
  - `01-env.config`: `NODE_ENV=production`, `PORT=8080`, proxy Nginx, health check path `/health`.
  - `02-autoscaling.config`: Instance `t3.micro`, Auto Scaling min 1 / max 3, key pair `vockey`, Load-balanced, tag `Project: student-manager`, `Owner: 24110331-24110154`.
  - `03-deployment.config`: Rolling deployment batch size 1 (zero downtime update).
  - `04-logs.config`: CloudWatch Logs streaming và Health streaming lưu trữ 7 ngày.

### 2. Đóng gói ứng dụng (Script tự động)
Chạy script đóng gói tự động tại thư mục gốc:
```bash
# Tạo gói triển khai phiên bản v1 (sinh ra dist/student-manager-v1.zip)
bash scripts/package.sh v1

# Tạo phiên bản tiếp theo khi thử nghiệm rolling update (v2)
bash scripts/package.sh v2
```
Script sẽ tự động:
1. Build frontend React (`npm --prefix client run build` ra `client/dist`).
2. Nén các thành phần cần thiết (`Procfile`, `package.json`, `.ebextensions/`, `server/`, `client/dist/`).
3. Tự động loại trừ `node_modules/`, file `.env`, file test để gói triển khai gọn nhẹ (~500 KB).

### 3. Các bước triển khai trên AWS Beanstalk Console
1. Truy cập AWS Management Console tại region `us-east-1`.
2. Mở dịch vụ **Elastic Beanstalk** -> **Create application**: `student-manager`.
3. Tạo Environment:
   - **Environment tier:** Web server environment.
   - **Platform:** Managed platform -> Node.js (Node.js 20 on Amazon Linux 2023).
   - **Application code:** Chọn **Upload your code** và tải lên file `dist/student-manager-v1.zip`.
   - **Service access:** Chọn Service role `LabRole`, EC2 instance profile `LabInstanceProfile`.
   - **Networking:** Chọn VPC và Subnet đã chuẩn bị.
   - **Capacity:** Environment type **Load balanced** (Min 1, Max 3, `t3.micro`, Key pair `vockey`).
   - **Environment properties:**
     - `DB_HOST`: Endpoint của Amazon RDS MySQL.
     - `DB_PORT`: `3306`
     - `DB_NAME`: `student_manager`
     - `DB_USER`: Tên tài khoản master RDS.
     - `DB_PASSWORD`: Mật khẩu kết nối RDS.
     - `JWT_SECRET`: Chuỗi khóa ký JWT bí mật (bắt buộc khi production).
     - `COOKIE_SECURE`: `false` (khi chạy HTTP) hoặc `true` (nếu có HTTPS).

## Tác giả

Trần Lê Thái (24110331) · Nông Hoàng Anh (24110154) — GVHD: TS. Huỳnh Xuân Phụng.
