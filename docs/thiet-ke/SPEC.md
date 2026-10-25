# Thiết kế dự án Student Manager (Node.js + AWS Elastic Beanstalk)

Đề tài: Triển khai ứng dụng Node.js lên AWS Elastic Beanstalk (Nhóm DevOps & IaC)
Phiên bản thiết kế: 1.1 · 14/10/2026 (đổi giao diện sang React + shadcn/ui, chốt database RDS MySQL)

---

## 1. Tóm tắt

- **Backend:** Node.js + Express, cung cấp **REST API JSON** tại `/api/*`, theo đúng mô hình **MVC** với các lớp `routes → middleware → controller → service → model`, có **logger** riêng.
- **Frontend:** **React (Vite) + Tailwind CSS + shadcn/ui**, phong cách SaaS dashboard: nền trắng, gọn, màu nhấn cho những thứ cần chú ý (tiến độ tín chỉ, vai trò, trạng thái, nút hành động).
- **Database:** **Amazon RDS MySQL 8**, truy cập qua ORM **Sequelize**.
- **Hạ tầng:** **AWS Elastic Beanstalk** (Node.js 20 trên Amazon Linux 2023), log đẩy sang **CloudWatch Logs**.

**Cách phục vụ React (đơn giản nhất):** React được build thành file tĩnh (`client/dist`) **trước khi deploy**, rồi chính Express phục vụ thư mục đó. Như vậy chỉ có **một app Node, một môi trường EB, một domain**: không cần S3/CloudFront riêng, không lo CORS, cookie đăng nhập dùng chung được.

Phân lớp MVC trong mô hình này:

| Lớp | Ở đâu |
|---|---|
| Model | `server/src/models` (Sequelize) |
| View | React app trong `client/` (trang + component shadcn/ui), nhận JSON từ API |
| Controller | `server/src/controllers`, trả JSON |
| Service | `server/src/services`, nghiệp vụ |
| Middleware | `server/src/middlewares` (log, xác thực, phân quyền, validate, lỗi) |
| Log | `server/src/utils/logger.js` (winston → stdout → CloudWatch) |

Elastic Beanstalk tự lo EC2, Auto Scaling, Load Balancer (nếu cần), health check, rolling deploy. Cấu hình hạ tầng nằm trong code (`.ebextensions`, `.platform`), đáp ứng phần IaC.

---

## 2. Kiến trúc tổng thể trên AWS

```
                 Người dùng (trình duyệt)
                          │ HTTP(S)
                          ▼
        ┌──────────────────────────────────────┐
        │  Elastic Beanstalk Environment       │
        │  (Node.js 20 / Amazon Linux 2023)    │
        │                                      │
        │  [ALB]* ──► EC2 t3.micro (nginx ──► node server.js :8080)
        │              ├─ /api/*  → Express API (JSON)
        │              └─ /*      → React build (client/dist)
        │                                      │
        └───────────────┬──────────────────────┘
                        │ 3306 (Security Group)
                        ▼
              Amazon RDS MySQL 8 (db.t3.micro)

   S3 (bucket của EB) : lưu các phiên bản source bundle (.zip)
   CloudWatch Logs     : log app (stdout) + nginx + health
   IAM                 : aws-elasticbeanstalk-ec2-role, service-role
   (*) ALB chỉ có khi chọn môi trường "Load balanced"; mặc định "Single instance" để tiết kiệm.
```

| Dịch vụ AWS | Vai trò | Gói đề xuất |
|---|---|---|
| Elastic Beanstalk | Chạy app Node.js, quản lý version, deploy | Single instance, t3.micro (Free Tier) |
| EC2 | Máy chủ do EB tự tạo | t3.micro |
| RDS MySQL 8 | Cơ sở dữ liệu | db.t3.micro, 20 GB gp3, tạo **riêng ngoài EB** |
| S3 | EB tự tạo bucket lưu bản zip | mặc định |
| CloudWatch Logs | Log tập trung | bật stream logs, giữ 7 ngày |
| IAM | Quyền cho EC2 và EB | role mặc định của EB |
| (tuỳ chọn) ACM + ALB | HTTPS | chỉ khi có domain |

**Lưu ý quan trọng:** tạo RDS **tách khỏi** môi trường EB (không dùng "Add database" trong EB). Nếu tạo RDS bên trong EB, khi xoá/terminate môi trường thì database bị xoá theo.

---

## 3. Phân quyền

Ba vai trò, lưu ở cột `users.role`: `student`, `teacher`, `admin`.

| Chức năng | Sinh viên | Giáo viên | Quản trị |
|---|:-:|:-:|:-:|
| Đăng nhập / đăng xuất / đổi mật khẩu | ✔ | ✔ | ✔ |
| Xem tín chỉ đã đạt của **mình** (x / 150) | ✔ | | |
| Xem danh sách SV **lớp mình chủ nhiệm** | | ✔ | ✔ (mọi lớp) |
| Thêm / sửa / xoá SV **lớp mình chủ nhiệm** | | ✔ | ✔ (mọi lớp) |
| Nhập kết quả môn học (để tính tín chỉ) cho SV lớp mình | | ✔ | ✔ |
| Quản lý lớp (CRUD, gán giáo viên chủ nhiệm) | | | ✔ |
| Quản lý giáo viên (CRUD) | | | ✔ |
| Quản lý môn học (CRUD) | | | ✔ |
| Cấp quyền (đổi role, khoá/mở tài khoản) | | | ✔ |

Quy tắc kiểm tra:

1. `authenticate`: phải đăng nhập (JWT trong cookie httpOnly), nếu không trả 401 và React chuyển về trang đăng nhập.
2. `authorize('teacher','admin')`: chỉ cho các role liệt kê.
3. `checkClassOwnership`: nếu là giáo viên thì `class.teacher_id === req.user.teacherId`, nếu không trả 403. Admin bỏ qua bước này.
4. Sinh viên chỉ có API `/api/me/credits`, không bao giờ nhận `studentId` từ URL, luôn lấy từ token, nên không thể xem của người khác.

---

## 4. Cơ sở dữ liệu (RDS MySQL)

### 4.1 Sơ đồ quan hệ

```
users 1───1 teachers 1───n classes 1───n students 1───1 users
                                         │
                                         n
                                  student_courses n───1 courses
```

### 4.2 Bảng

**users** (tài khoản đăng nhập)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | INT PK AI | |
| username | VARCHAR(50) UNIQUE | SV dùng MSSV, GV dùng mã GV |
| password_hash | VARCHAR(255) | bcrypt |
| role | ENUM('student','teacher','admin') | |
| is_active | BOOLEAN default true | admin khoá được |
| created_at, updated_at | DATETIME | |

**teachers**
| Cột | Kiểu |
|---|---|
| id | INT PK AI |
| user_id | INT FK → users.id UNIQUE |
| teacher_code | VARCHAR(20) UNIQUE |
| full_name | VARCHAR(100) |
| email | VARCHAR(100) |

**classes**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | INT PK AI | |
| class_code | VARCHAR(20) UNIQUE | VD: CNTT-K20A |
| name | VARCHAR(100) | |
| teacher_id | INT FK → teachers.id NULL | giáo viên chủ nhiệm |

**students**
| Cột | Kiểu |
|---|---|
| id | INT PK AI |
| user_id | INT FK → users.id UNIQUE |
| student_code | VARCHAR(20) UNIQUE (MSSV) |
| full_name | VARCHAR(100) |
| date_of_birth | DATE |
| email | VARCHAR(100) |
| class_id | INT FK → classes.id |

**courses** (môn học)
| Cột | Kiểu |
|---|---|
| id | INT PK AI |
| course_code | VARCHAR(20) UNIQUE |
| name | VARCHAR(150) |
| credits | TINYINT (1–6) |

**student_courses** (kết quả)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | INT PK AI | |
| student_id | INT FK | |
| course_id | INT FK | |
| score | DECIMAL(4,2) | thang 10 |
| UNIQUE(student_id, course_id) | | mỗi môn tính 1 lần |

### 4.3 Cách tính tín chỉ

```sql
SELECT COALESCE(SUM(c.credits),0) AS earned
FROM student_courses sc JOIN courses c ON c.id = sc.course_id
WHERE sc.student_id = ? AND sc.score >= 5.0;
```

Trang sinh viên hiển thị: **"Đã đạt 87 / 150 tín chỉ (58%)"** + thanh tiến độ + bảng các môn đã đạt. Hằng số `TOTAL_REQUIRED_CREDITS = 150` và `PASS_SCORE = 5` đặt trong `src/config/constants.js`.

> Phương án đơn giản hơn (nếu thầy/cô không yêu cầu môn học): bỏ 2 bảng `courses`, `student_courses`, thêm cột `students.earned_credits INT` do giáo viên nhập tay. Xem câu hỏi ở mục 13.

---

## 5. Cấu trúc thư mục

Một repo, hai thư mục con: `server/` (Express, MVC) và `client/` (React). File gốc `package.json` điều phối build và chạy.

```
student-manager/
├── package.json               # script gốc: build client, start server
├── Procfile                   # web: node server/server.js
├── .ebextensions/
│   ├── 01-env.config          # NODE_ENV, healthcheck
│   ├── 02-logs.config         # bật stream log CloudWatch
│   └── 03-migrate.config      # chạy migrate + seed khi deploy (leader_only)
├── .platform/nginx/conf.d/proxy.conf
├── .ebignore                  # loại node_modules, .env, client/src... GIỮ client/dist
├── .env.example
│
├── server/
│   ├── app.js                 # tạo Express app, gắn middleware, /api, phục vụ client/dist
│   ├── server.js              # listen PORT (EB truyền PORT=8080)
│   ├── .sequelizerc
│   ├── migrations/
│   ├── seeders/               # admin đầu tiên + dữ liệu mẫu
│   └── src/
│       ├── config/
│       │   ├── index.js           # đọc process.env
│       │   ├── database.js        # cấu hình Sequelize (app + sequelize-cli)
│       │   └── constants.js       # ROLES, TOTAL_REQUIRED_CREDITS=150, PASS_SCORE=5
│       ├── models/                # M
│       │   ├── index.js           # nạp model + khai báo quan hệ
│       │   ├── user.model.js
│       │   ├── teacher.model.js
│       │   ├── class.model.js
│       │   ├── student.model.js
│       │   ├── course.model.js
│       │   └── studentCourse.model.js
│       ├── services/              # nghiệp vụ, KHÔNG biết req/res
│       │   ├── auth.service.js
│       │   ├── student.service.js
│       │   ├── teacher.service.js
│       │   ├── class.service.js
│       │   ├── course.service.js
│       │   ├── credit.service.js
│       │   ├── dashboard.service.js
│       │   └── user.service.js    # cấp quyền
│       ├── controllers/           # C: nhận req, gọi service, trả JSON
│       │   ├── auth.controller.js
│       │   ├── me.controller.js
│       │   ├── student.controller.js
│       │   ├── teacher.controller.js
│       │   ├── class.controller.js
│       │   ├── course.controller.js
│       │   └── user.controller.js
│       ├── middlewares/
│       │   ├── requestLogger.js   # morgan → winston, gắn requestId
│       │   ├── authenticate.js    # đọc JWT cookie → req.user
│       │   ├── authorize.js       # kiểm tra role
│       │   ├── classOwnership.js  # GV chỉ được thao tác lớp mình
│       │   ├── validate.js        # express-validator
│       │   ├── notFound.js
│       │   └── errorHandler.js    # bắt lỗi tập trung, log, trả JSON lỗi
│       ├── routes/
│       │   ├── index.js           # gom tất cả dưới /api
│       │   ├── auth.routes.js     # /api/auth
│       │   ├── me.routes.js       # /api/me (sinh viên)
│       │   ├── teacher.routes.js  # /api/teacher
│       │   ├── admin.routes.js    # /api/admin
│       │   └── health.routes.js   # /health
│       ├── validators/
│       └── utils/
│           ├── logger.js          # winston
│           ├── AppError.js
│           └── asyncHandler.js
│
└── client/                    # V: React + Vite + Tailwind + shadcn/ui
    ├── index.html
    ├── vite.config.js         # proxy /api → localhost:8080 khi dev
    ├── tailwind.config.js
    ├── components.json        # cấu hình shadcn/ui
    └── src/
        ├── main.jsx
        ├── App.jsx            # khai báo route
        ├── index.css          # biến màu theme
        ├── lib/
        │   ├── api.js         # fetch wrapper (credentials: 'include')
        │   └── utils.js       # cn() của shadcn
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── ui/            # component shadcn sinh ra (button, card, table...)
        │   ├── layout/AppShell.jsx   # sidebar + topbar
        │   ├── ProtectedRoute.jsx
        │   ├── RoleBadge.jsx
        │   ├── StatCard.jsx
        │   ├── DataTable.jsx
        │   └── ConfirmDialog.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── ChangePasswordPage.jsx
            ├── student/MyCreditsPage.jsx
            ├── teacher/MyClassesPage.jsx
            ├── teacher/ClassStudentsPage.jsx
            ├── teacher/StudentResultsPage.jsx
            ├── admin/DashboardPage.jsx
            ├── admin/ClassesPage.jsx
            ├── admin/TeachersPage.jsx
            ├── admin/StudentsPage.jsx
            ├── admin/CoursesPage.jsx
            └── admin/UsersPage.jsx      # cấp quyền
```

Luồng một request API:

```
Request /api/... → helmet/compression → requestLogger → cookieParser/json parser
        → router → authenticate → authorize → classOwnership → validate
        → controller → service → model (Sequelize) → RDS
        ← controller trả JSON  → React render
lỗi ở bất kỳ đâu → next(err) → errorHandler (log + JSON { error })
Request khác /api → trả client/dist/index.html (React Router lo phần còn lại)
```

---

## 6. Thư viện

`package.json` (gốc, dùng cho cả server; EB chạy `npm install` ở thư mục gốc)

```json
{
  "name": "student-manager",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": "20.x" },
  "scripts": {
    "start": "node server/server.js",
    "dev:server": "nodemon server/server.js",
    "dev:client": "npm --prefix client run dev",
    "build": "npm --prefix client ci && npm --prefix client run build",
    "db:migrate": "cd server && sequelize-cli db:migrate",
    "db:seed": "cd server && sequelize-cli db:seed:all"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "mysql2": "^3.10.0",
    "sequelize": "^6.37.3",
    "sequelize-cli": "^6.6.2",
    "winston": "^3.13.0"
  },
  "devDependencies": { "nodemon": "^3.1.0" }
}
```

`client/package.json` (chỉ dùng lúc build, không lên server)

| Gói | Dùng để |
|---|---|
| react, react-dom, react-router-dom | SPA và điều hướng |
| vite, @vitejs/plugin-react | dev server + build |
| tailwindcss, postcss, autoprefixer | style |
| shadcn/ui (sinh code qua `npx shadcn@latest add ...`) | component đẹp, sẵn |
| lucide-react | icon |
| sonner | thông báo (toast) |
| react-hook-form, zod, @hookform/resolvers | form + validate |

Đăng nhập dùng **JWT trong cookie httpOnly** (không dùng session lưu RAM) nên app stateless, scale nhiều instance trên EB vẫn chạy đúng. Vì React và API cùng domain, cookie tự gửi kèm, không cần CORS.

---

## 7. Thiết kế giao diện (React + shadcn/ui)

### 7.1 Phong cách

- **Theme trắng**: nền `#FFFFFF`, vùng phụ xám rất nhạt `slate-50`, viền `slate-200`, chữ chính `slate-900`, chữ phụ `slate-500`. Bo góc `rounded-xl`, bóng đổ nhẹ `shadow-sm`. Font **Inter**.
- **Bố cục SaaS**: sidebar trái cố định (logo, menu theo vai trò), topbar (tiêu đề trang, avatar + menu đăng xuất), nội dung trong các `Card`.
- **Màu chỉ dùng cho những thứ cần chú ý:**

| Ý nghĩa | Màu | Dùng ở đâu |
|---|---|---|
| Hành động chính, link, menu đang chọn | Indigo `#4F46E5` | nút "Thêm", sidebar active, vòng tiến độ |
| Thành công, đạt | Emerald `#10B981` | toast thành công, badge "Đạt", tín chỉ ≥ 75% |
| Cảnh báo | Amber `#F59E0B` | tín chỉ 40–75%, tài khoản chưa đổi mật khẩu |
| Nguy hiểm, xoá | Rose `#E11D48` | nút xoá, badge "Bị khoá", tín chỉ < 40% |
| Vai trò | Sinh viên: sky · Giáo viên: violet · Quản trị: indigo đậm | `RoleBadge` |

Khai báo trong `client/src/index.css` theo chuẩn biến của shadcn:

```css
@tailwind base; @tailwind components; @tailwind utilities;
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --muted: 210 40% 98%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --primary: 243 75% 59%;          /* indigo-600 */
    --primary-foreground: 0 0% 100%;
    --destructive: 347 77% 50%;      /* rose-600 */
    --success: 160 84% 39%;          /* emerald-500 */
    --warning: 38 92% 50%;           /* amber-500 */
    --radius: 0.75rem;
  }
  body { @apply bg-background text-foreground antialiased; font-family: Inter, system-ui, sans-serif; }
}
```

### 7.2 Component shadcn/ui cần thêm

```bash
cd client
npx shadcn@latest init
npx shadcn@latest add button card input label table badge dialog alert-dialog \
  dropdown-menu select progress avatar separator form tabs skeleton sonner
```

### 7.3 Các màn hình

| Màn hình | Vai trò | Nội dung chính |
|---|---|---|
| Đăng nhập | tất cả | Card giữa màn hình, logo, 2 ô nhập, nút indigo full-width |
| **Tín chỉ của tôi** | sinh viên | Vòng tròn tiến độ lớn "87 / 150", màu theo ngưỡng; 3 StatCard (đã đạt, còn thiếu, số môn đạt); bảng môn đã đạt (mã, tên, số tín, điểm, badge "Đạt") |
| Lớp của tôi | giáo viên | Lưới Card mỗi lớp: mã lớp, sĩ số, nút "Xem sinh viên" |
| Sinh viên trong lớp | giáo viên, admin | DataTable có ô tìm kiếm; nút "Thêm sinh viên" mở Dialog form; mỗi dòng có menu Sửa / Nhập điểm / Xoá (AlertDialog xác nhận màu rose); cột tín chỉ có Progress nhỏ |
| Nhập điểm | giáo viên, admin | Bảng môn học + ô điểm, badge Đạt/Chưa đạt tự cập nhật |
| Dashboard | admin | 4 StatCard (Lớp, Giáo viên, Sinh viên, Môn học) có icon màu; bảng "Lớp chưa có GVCN" |
| Lớp / Giáo viên / Sinh viên / Môn học | admin | cùng mẫu DataTable + Dialog form |
| **Phân quyền** | admin | Bảng người dùng: RoleBadge, Select đổi vai trò, Switch khoá/mở, nút reset mật khẩu |

Sau mỗi thao tác thêm/sửa/xoá: hiện toast (sonner) xanh khi thành công, đỏ khi lỗi.

### 7.4 Code mẫu frontend

`client/src/lib/api.js`
```js
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json();
  if (res.status === 401) window.location.href = '/login';
  if (!res.ok) throw new Error(data?.error || 'Có lỗi xảy ra');
  return data;
}
```

`client/src/components/ProtectedRoute.jsx`
```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();          // lấy từ GET /api/auth/me
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

`client/src/App.jsx`
```jsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<AppShell />}>
      <Route index element={<HomeRedirect />} />          {/* chuyển theo role */}
      <Route path="password" element={<ChangePasswordPage />} />
      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route path="me/credits" element={<MyCreditsPage />} />
      </Route>
      <Route element={<ProtectedRoute roles={['teacher', 'admin']} />}>
        <Route path="teacher/classes" element={<MyClassesPage />} />
        <Route path="teacher/classes/:classId" element={<ClassStudentsPage />} />
        <Route path="teacher/classes/:classId/students/:id/results" element={<StudentResultsPage />} />
      </Route>
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="admin" element={<DashboardPage />} />
        <Route path="admin/classes" element={<ClassesPage />} />
        <Route path="admin/teachers" element={<TeachersPage />} />
        <Route path="admin/students" element={<StudentsPage />} />
        <Route path="admin/courses" element={<CoursesPage />} />
        <Route path="admin/users" element={<UsersPage />} />
      </Route>
    </Route>
  </Route>
</Routes>
```

`client/src/pages/student/MyCreditsPage.jsx` (rút gọn)
```jsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

const tone = (p) => (p >= 75 ? 'text-emerald-600' : p >= 40 ? 'text-amber-500' : 'text-rose-600');

export default function MyCreditsPage() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/me/credits').then(setD); }, []);
  if (!d) return null;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Tiến độ tín chỉ</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className={`text-4xl font-bold ${tone(d.percent)}`}>
            {d.earned} <span className="text-lg text-muted-foreground">/ {d.total} tín chỉ</span>
          </p>
          <Progress value={d.percent} />
          <p className="text-sm text-muted-foreground">Còn thiếu {d.total - d.earned} tín chỉ</p>
        </CardContent>
      </Card>
      {/* bảng môn đã đạt với <Badge className="bg-emerald-50 text-emerald-700">Đạt</Badge> */}
    </div>
  );
}
```

`client/vite.config.js`
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { proxy: { '/api': 'http://localhost:8080' } },
});
```

---

## 8. Code mẫu backend từng lớp

### 8.1 Logger (`server/src/utils/logger.js`)

Ghi ra **stdout** dạng JSON. Trên Amazon Linux 2023, EB gom stdout của app vào `/var/log/web.stdout.log` và đẩy lên CloudWatch nhóm `/aws/elasticbeanstalk/<env>/var/log/web.stdout.log`.

```js
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'student-manager' },
  transports: [new transports.Console()],
});

module.exports = logger;
```

### 8.2 Middleware

`requestLogger.js`
```js
const morgan = require('morgan');
const crypto = require('crypto');
const logger = require('../utils/logger');

morgan.token('id', (req) => req.id);
morgan.token('user', (req) => (req.user ? `${req.user.role}:${req.user.id}` : '-'));

module.exports = [
  (req, res, next) => { req.id = crypto.randomUUID(); next(); },
  morgan(':id :method :url :status :response-time ms user=:user', {
    stream: { write: (msg) => logger.info(msg.trim(), { type: 'http' }) },
    skip: (req) => req.path === '/health' || !req.path.startsWith('/api'),
  }),
];
```

`authenticate.js`
```js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next(new AppError('Chưa đăng nhập', 401));
  try {
    req.user = jwt.verify(token, jwtSecret); // { id, role, teacherId?, studentId? }
    next();
  } catch {
    res.clearCookie('token');
    next(new AppError('Phiên đăng nhập hết hạn', 401));
  }
};
```

`authorize.js`
```js
const AppError = require('../utils/AppError');
module.exports = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError('Bạn không có quyền truy cập', 403));
```

`classOwnership.js`
```js
const { Class } = require('../models');
const AppError = require('../utils/AppError');

module.exports = async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const cls = await Class.findByPk(req.params.classId);
  if (!cls) return next(new AppError('Không tìm thấy lớp', 404));
  if (cls.teacherId !== req.user.teacherId) return next(new AppError('Lớp này không do bạn quản lý', 403));
  req.class = cls;
  next();
};
```

`errorHandler.js`
```js
const logger = require('../utils/logger');
module.exports = (err, req, res, next) => {
  const status = err.statusCode || 500;
  logger[status >= 500 ? 'error' : 'warn'](err.message, {
    requestId: req.id, status, stack: status >= 500 ? err.stack : undefined,
  });
  res.status(status).json({ error: status >= 500 ? 'Lỗi hệ thống' : err.message, details: err.details });
};
```

### 8.3 Model (`server/src/models/student.model.js`)

```js
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    studentCode: { type: DataTypes.STRING(20), unique: true, allowNull: false, field: 'student_code' },
    fullName: { type: DataTypes.STRING(100), allowNull: false, field: 'full_name' },
    dateOfBirth: { type: DataTypes.DATEONLY, field: 'date_of_birth' },
    email: DataTypes.STRING(100),
  }, { tableName: 'students', underscored: true });

  Student.associate = (m) => {
    Student.belongsTo(m.User, { foreignKey: 'userId' });
    Student.belongsTo(m.Class, { foreignKey: 'classId' });
    Student.hasMany(m.StudentCourse, { foreignKey: 'studentId' });
  };
  return Student;
};
```

### 8.4 Service (`server/src/services/student.service.js`)

```js
const bcrypt = require('bcryptjs');
const { sequelize, Student, User } = require('../models');
const AppError = require('../utils/AppError');

exports.listByClass = (classId) => Student.findAll({ where: { classId }, order: [['studentCode', 'ASC']] });

// Thêm SV = tạo tài khoản (username = MSSV, mật khẩu mặc định = MSSV) + hồ sơ, trong 1 transaction
exports.create = async (classId, data) => sequelize.transaction(async (t) => {
  const user = await User.create({
    username: data.studentCode,
    passwordHash: await bcrypt.hash(data.studentCode, 10),
    role: 'student',
  }, { transaction: t });
  return Student.create({ ...data, classId, userId: user.id }, { transaction: t });
});

exports.update = async (classId, id, data) => {
  const st = await Student.findOne({ where: { id, classId } }); // chặn sửa SV lớp khác
  if (!st) throw new AppError('Không tìm thấy sinh viên trong lớp này', 404);
  return st.update(data);
};

exports.remove = async (classId, id) => sequelize.transaction(async (t) => {
  const st = await Student.findOne({ where: { id, classId }, transaction: t });
  if (!st) throw new AppError('Không tìm thấy sinh viên trong lớp này', 404);
  await st.destroy({ transaction: t });
  await User.destroy({ where: { id: st.userId }, transaction: t });
});
```

`credit.service.js`
```js
const { StudentCourse, Course } = require('../models');
const { TOTAL_REQUIRED_CREDITS, PASS_SCORE } = require('../config/constants');
const { Op } = require('sequelize');

exports.getSummary = async (studentId) => {
  const passed = await StudentCourse.findAll({
    where: { studentId, score: { [Op.gte]: PASS_SCORE } },
    include: [Course],
  });
  const earned = passed.reduce((s, r) => s + r.Course.credits, 0);
  return {
    earned, total: TOTAL_REQUIRED_CREDITS,
    percent: Math.min(100, Math.round((earned / TOTAL_REQUIRED_CREDITS) * 100)),
    courses: passed.map((r) => ({ code: r.Course.courseCode, name: r.Course.name, credits: r.Course.credits, score: r.score })),
  };
};
```

### 8.5 Controller (`server/src/controllers/student.controller.js`)

```js
const studentService = require('../services/student.service');

exports.list = async (req, res) => {
  res.json(await studentService.listByClass(req.params.classId));
};

exports.create = async (req, res) => {
  res.status(201).json(await studentService.create(req.params.classId, req.body));
};

exports.update = async (req, res) => {
  res.json(await studentService.update(req.params.classId, req.params.id, req.body));
};

exports.remove = async (req, res) => {
  await studentService.remove(req.params.classId, req.params.id);
  res.status(204).end();
};
```

`me.controller.js`: sinh viên luôn lấy `studentId` từ token, không từ URL.
```js
const creditService = require('../services/credit.service');
exports.credits = async (req, res) => res.json(await creditService.getSummary(req.user.studentId));
```

### 8.6 Route (`server/src/routes/teacher.routes.js`)

```js
const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const classOwnership = require('../middlewares/classOwnership');
const validate = require('../middlewares/validate');
const { studentRules } = require('../validators/student.validator');
const ctrl = require('../controllers/student.controller');
const ah = require('../utils/asyncHandler');

router.use(authenticate, authorize('teacher', 'admin'));

router.get('/classes/:classId/students', ah(classOwnership), ah(ctrl.list));
router.post('/classes/:classId/students', ah(classOwnership), studentRules, validate, ah(ctrl.create));
router.put('/classes/:classId/students/:id', ah(classOwnership), studentRules, validate, ah(ctrl.update));
router.delete('/classes/:classId/students/:id', ah(classOwnership), ah(ctrl.remove));

module.exports = router;
```

### 8.7 `server/app.js` và `server/server.js`

```js
// server/app.js
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const requestLogger = require('./src/middlewares/requestLogger');
const notFound = require('./src/middlewares/notFound');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());

app.use(require('./src/routes/health.routes'));   // GET /health
app.use('/api', require('./src/routes'));          // toàn bộ API
app.use('/api', notFound);                         // API sai đường dẫn → 404 JSON

// Phục vụ React đã build
const dist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(dist, { maxAge: '7d', index: false }));
app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));

app.use(errorHandler);
module.exports = app;
```

```js
// server/server.js
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const PORT = process.env.PORT || 8080;

sequelize.authenticate()
  .then(() => app.listen(PORT, () => logger.info(`Server chạy cổng ${PORT}`)))
  .catch((e) => { logger.error('Không kết nối được DB', { error: e.message }); process.exit(1); });
```

---

## 9. Danh sách API

Tất cả trả JSON, lỗi có dạng `{ "error": "..." }`.

| Method | URL | Quyền | Mô tả |
|---|---|---|---|
| GET | /health | public | `200 OK` cho EB health check |
| POST | /api/auth/login | public | đăng nhập, set cookie `token` |
| POST | /api/auth/logout | đã đăng nhập | xoá cookie |
| GET | /api/auth/me | đã đăng nhập | thông tin user hiện tại (React dùng để biết role) |
| PUT | /api/auth/password | đã đăng nhập | đổi mật khẩu |
| GET | /api/me/credits | student | **tín chỉ đã đạt / 150** + danh sách môn đạt |
| GET | /api/teacher/classes | teacher | các lớp mình chủ nhiệm |
| GET, POST | /api/teacher/classes/:classId/students | teacher, admin | danh sách / thêm SV |
| PUT, DELETE | /api/teacher/classes/:classId/students/:id | teacher, admin | sửa / xoá SV |
| GET, PUT | /api/teacher/classes/:classId/students/:id/results | teacher, admin | xem / nhập điểm môn |
| GET | /api/admin/stats | admin | số liệu dashboard |
| CRUD | /api/admin/classes | admin | quản lý lớp, gán GVCN |
| CRUD | /api/admin/teachers | admin | quản lý giáo viên (tạo kèm tài khoản) |
| CRUD | /api/admin/students | admin | quản lý mọi SV, chuyển lớp |
| CRUD | /api/admin/courses | admin | quản lý môn học + số tín chỉ |
| GET | /api/admin/users | admin | danh sách tài khoản |
| PATCH | /api/admin/users/:id/role | admin | **cấp quyền**: đổi vai trò |
| PATCH | /api/admin/users/:id/status | admin | khoá / mở tài khoản |
| POST | /api/admin/users/:id/reset-password | admin | đặt lại mật khẩu |

**Cấp quyền**: khi admin đổi role của một user, `user.service.changeRole` tạo/xoá bản ghi hồ sơ tương ứng (VD: nâng thành `teacher` thì tạo dòng `teachers`). Không cho admin tự hạ quyền chính mình, và luôn phải còn ít nhất 1 admin.

---

## 10. Biến môi trường

| Biến | Ví dụ | Đặt ở đâu |
|---|---|---|
| NODE_ENV | production | `.ebextensions/01-env.config` |
| PORT | 8080 | EB tự đặt |
| DB_HOST | sm-db.xxxx.ap-southeast-1.rds.amazonaws.com | EB Console → Configuration → Environment properties |
| DB_PORT | 3306 | như trên |
| DB_NAME | student_manager | như trên |
| DB_USER | admin_app | như trên |
| DB_PASSWORD | ****** | như trên (hoặc `eb setenv`) |
| JWT_SECRET | chuỗi ngẫu nhiên 32+ ký tự | như trên |
| ADMIN_INITIAL_PASSWORD | ****** | dùng cho seeder tạo admin đầu tiên |
| LOG_LEVEL | info | `.ebextensions` |

Không commit `.env`, không đặt mật khẩu trong `.ebextensions`.

---

## 11. File cấu hình hạ tầng (IaC)

`Procfile`
```
web: node server/server.js
```

`.ebextensions/01-env.config`
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    LOG_LEVEL: info
  aws:elasticbeanstalk:environment:proxy:
    ProxyServer: nginx
  aws:elasticbeanstalk:application:
    Application Healthcheck URL: /health
```

`.ebextensions/02-logs.config`
```yaml
option_settings:
  aws:elasticbeanstalk:cloudwatch:logs:
    StreamLogs: true
    DeleteOnTerminate: false
    RetentionInDays: 7
  aws:elasticbeanstalk:cloudwatch:logs:health:
    HealthStreamingEnabled: true
```

`.ebextensions/03-migrate.config`
```yaml
container_commands:
  01_migrate:
    command: "cd server && npx sequelize-cli db:migrate --env production"
    leader_only: true
  02_seed:
    command: "cd server && npx sequelize-cli db:seed:all --env production || true"
    leader_only: true
```

`container_commands` chạy sau khi `npm install` xong và trước khi app khởi động, `leader_only` đảm bảo chỉ 1 instance chạy migrate. Seeder phải viết kiểu "chỉ thêm nếu chưa có" để chạy lại nhiều lần không lỗi.

`.platform/nginx/conf.d/proxy.conf`
```
client_max_body_size 5M;
proxy_read_timeout 60s;
```

`.ebignore` (EB CLI dùng file này thay `.gitignore` khi đóng gói; điểm mấu chốt là **giữ lại `client/dist`** dù nó không được commit)
```
node_modules/
client/node_modules/
client/src/
client/public/
.env
logs/
*.log
.git/
```

`.gitignore`
```
node_modules/
client/node_modules/
client/dist/
.env
```

`server/src/config/database.js` cần đọc biến môi trường cho cả app và sequelize-cli (dùng `.sequelizerc` trỏ `config` tới file JS này):
```js
require('dotenv').config();
const common = {
  username: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306), dialect: 'mysql',
  logging: false, timezone: '+07:00',
  pool: { max: 5, min: 0, idle: 10000 },
};
module.exports = { development: common, production: common };
```

> Mở rộng phần IaC (điểm cộng cho nhóm DevOps & IaC): viết thêm 1 template **CloudFormation** hoặc **Terraform** tạo VPC Security Group + RDS + EB Application/Environment, và 1 workflow **GitHub Actions** tự deploy khi push lên `main` (mục 13). Phần này độc lập, làm sau khi app đã chạy.

---

## 12. Các bước deploy (làm theo thứ tự)

Giả định region `ap-southeast-1` (Singapore). Cài sẵn: Node.js 20, AWS CLI v2, EB CLI (`pip install awsebcli`), đã `aws configure` với IAM user có quyền EB/RDS/EC2/S3/IAM.

**Bước 1. Chạy local** (2 terminal)
```bash
cp .env.example .env            # trỏ tới MySQL local (docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8)
npm install && npm --prefix client install
npm run db:migrate && npm run db:seed
npm run dev:server              # API ở http://localhost:8080
npm run dev:client              # React ở http://localhost:5173 (Vite proxy /api sang 8080)
```
Đăng nhập `admin` / `<ADMIN_INITIAL_PASSWORD>`.

**Bước 2. Tạo Security Group cho DB**
- EC2 → Security Groups → tạo `sm-db-sg` trong VPC mặc định. Tạm thời chưa thêm inbound.

**Bước 3. Tạo RDS MySQL**
- RDS → Create database → Standard create → MySQL 8.0 → Free tier.
- DB identifier `sm-db`, master user `admin`, đặt mật khẩu.
- Instance `db.t3.micro`, 20 GB gp3, **Public access: No**, VPC mặc định, security group `sm-db-sg`.
- Initial database name: `student_manager`.
- Chờ trạng thái *Available*, ghi lại **Endpoint**.

**Bước 4. Khởi tạo EB trong thư mục dự án**
```bash
eb init -p "node.js-20" student-manager --region ap-southeast-1
```

**Bước 5. Build React rồi tạo môi trường**
```bash
npm run build                   # sinh client/dist
eb create sm-prod --single --instance_type t3.micro \
  --envvars NODE_ENV=production,DB_HOST=<endpoint>,DB_PORT=3306,DB_NAME=student_manager,DB_USER=admin,DB_PASSWORD=<pw>,JWT_SECRET=<secret>,ADMIN_INITIAL_PASSWORD=<pw>
```
Lần tạo đầu có thể báo lỗi migrate vì EC2 chưa được phép vào RDS, làm tiếp bước 6 rồi deploy lại.

**Bước 6. Mở kết nối EC2 → RDS**
- EC2 → Security Groups → tìm SG mà EB tạo cho instance (tên chứa `sm-prod`, ghi chú "AWSEBSecurityGroup").
- Sửa `sm-db-sg`: Inbound rule **MySQL/Aurora 3306**, Source = SG của EB ở trên.

**Bước 7. Deploy**
```bash
npm run build                   # luôn build React trước mỗi lần deploy
eb deploy
eb status        # Health: Green
eb open          # mở trình duyệt
```

**Bước 8. Kiểm tra log**
```bash
eb logs                 # tải log gần nhất
```
Hoặc CloudWatch → Log groups → `/aws/elasticbeanstalk/sm-prod/var/log/web.stdout.log`.

**Bước 9. Đăng nhập admin, đổi mật khẩu**, tạo môn học, giáo viên, lớp, rồi để giáo viên thêm sinh viên.

**Cập nhật về sau:** sửa code → `npm run build` → `eb deploy`. Quay lại bản cũ: EB Console → Application versions → Deploy bản trước.

**Dọn dẹp để tránh tốn phí:** `eb terminate sm-prod`, xoá RDS `sm-db` (có thể chụp snapshot trước).

---

## 13. CI/CD (tuỳ chọn) với GitHub Actions

`.github/workflows/deploy.yml`
```yaml
name: Deploy to Elastic Beanstalk
on:
  push: { branches: [main] }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm test --if-present
      - run: npm run build          # build React vào client/dist
      - run: zip -r app.zip . -x "node_modules/*" "client/node_modules/*" "client/src/*" ".git/*" ".env"
      - uses: einaregilsson/beanstalk-deploy@v22
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: student-manager
          environment_name: sm-prod
          region: ap-southeast-1
          version_label: ${{ github.sha }}
          deployment_package: app.zip
```

---

## 14. Bảo mật và vận hành tối thiểu

- Mật khẩu băm bcrypt (cost 10). Cookie JWT: `httpOnly`, `sameSite=lax`, `secure` khi có HTTPS, hết hạn 8 giờ.
- `helmet` cho header bảo mật; `express-validator` cho mọi API nhận dữ liệu, `zod` validate form phía React; Sequelize tham số hoá truy vấn nên tránh SQL injection.
- RDS không public, chỉ nhận kết nối từ SG của EB.
- Log không ghi mật khẩu, token. Mỗi log HTTP có `requestId`, `user`, `status`, thời gian xử lý.
- Health check `/health` không cần đăng nhập, không truy vấn nặng.

---

## 15. Kế hoạch làm (gợi ý)

| Giai đoạn | Việc |
|---|---|
| 1 | Khởi tạo `server/` (logger, error handler, `/health`) và `client/` (Vite + Tailwind + shadcn init, AppShell, theme) |
| 2 | Model + migration + seeder admin, API đăng nhập, trang Login + ProtectedRoute |
| 3 | Admin: API + trang môn học, giáo viên, lớp, phân quyền |
| 4 | Giáo viên: API + trang CRUD sinh viên lớp mình, nhập điểm |
| 5 | Sinh viên: API + trang tín chỉ x/150 |
| 6 | Deploy EB + RDS, bật CloudWatch, chụp màn hình làm báo cáo |
| 7 | (tuỳ chọn) GitHub Actions, CloudFormation/Terraform |

---

## 16. Giả định đang dùng (có thể đổi)

1. Database: **Amazon RDS MySQL 8** (đã chốt).
2. Giao diện: **React + Vite + shadcn/ui**, theme trắng, build tĩnh và do Express phục vụ trên cùng môi trường EB (đã chốt).
3. Tín chỉ tính từ **môn học có điểm ≥ 5**, giáo viên nhập điểm.
4. Mỗi lớp có **1 giáo viên chủ nhiệm**; một giáo viên có thể chủ nhiệm nhiều lớp.
5. Thêm sinh viên sẽ tự tạo tài khoản: username = MSSV, mật khẩu ban đầu = MSSV.
6. Môi trường EB **single instance**, dùng URL mặc định của EB (HTTP), region Singapore.
