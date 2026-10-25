# Student Manager — Frontend (React + Vite + Tailwind + shadcn/ui)

Giao diện theo `docs/thiet-ke/SPEC.md` mục 7: landing page giới thiệu dự án, trang đăng nhập có hoạt ảnh chuyển cảnh, và 3 dashboard theo vai trò (sidebar trái, nội dung dạng bảng/biểu đồ).

## Chạy

```bash
cd client
npm install

npm run dev:mock   # KHÔNG cần backend: API giả lập chạy trong trình duyệt (localStorage)
npm run dev        # dùng backend thật: Vite proxy /api → http://localhost:8080
npm run build      # sinh client/dist cho Express phục vụ khi deploy EB
npm run test:e2e   # 32 test Playwright bấm thử mọi nút (tự bật dev:mock ở cổng 5199)
```

Tài khoản demo ở chế độ mock (có nút bấm nhanh ở trang đăng nhập):

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Quản trị | `admin` | `admin123` |
| Giáo viên (chủ nhiệm CNTT-K20A, KTPM-K21A) | `gv001` | `gv001` |
| Sinh viên (CNTT-K20A) | `20520101` | `20520101` |

Menu người dùng có mục **Khôi phục dữ liệu demo** để quay lại dữ liệu ban đầu.

`npm run test:e2e` dùng Google Chrome cài trên máy (`channel: 'chrome'`). Máy không có Chrome thì chạy `npx playwright install chromium` rồi bỏ dòng `channel` trong `playwright.config.js`.

## Màn hình

| Route | Vai trò | Nội dung |
|---|---|---|
| `/` | công khai | Landing: hero + mockup dashboard động, công nghệ, tính năng, xem trước theo vai trò, sơ đồ kiến trúc AWS, hỏi đáp, CTA |
| `/login` | công khai | Form (zod) + màn chào mừng rồi chuyển tới dashboard theo vai trò |
| `/me/credits` | sinh viên | Vòng tiến độ x/150 (biểu đồ duy nhất), thẻ số liệu, bảng môn đạt / chưa đạt |
| `/me/profile` | sinh viên | Hồ sơ, lớp, GV chủ nhiệm |
| `/teacher` | giáo viên | Thẻ số liệu, phân bố tín chỉ, donut tiến độ, TB tín chỉ theo lớp, SV cần chú ý |
| `/teacher/classes` | GV, admin | Lưới thẻ lớp |
| `/teacher/classes/:classId` | GV, admin | Biểu đồ lớp + DataTable SV (thêm/sửa/xoá, nhập điểm) |
| `/teacher/classes/:classId/students/:id/results` | GV, admin | Nhập điểm, badge Đạt/Chưa đạt và tín chỉ cập nhật tức thì, cảnh báo rời trang khi chưa lưu |
| `/admin` | admin | 7 biểu đồ: phân bố tín chỉ, tiến độ, theo lớp (đổi Sĩ số/TB TC), mốc tín chỉ, môn tỉ lệ đạt thấp, vai trò, trạng thái tài khoản; bảng lớp chưa có GVCN |
| `/admin/classes`, `/teachers`, `/students`, `/courses` | admin | DataTable (tìm kiếm, sắp xếp, phân trang, lọc) + Dialog form + AlertDialog xoá |
| `/admin/users` | admin | Select đổi vai trò, Switch khoá/mở, đặt lại mật khẩu |
| `/password` | mọi vai trò | Đổi mật khẩu kèm thước độ mạnh |

Khác với mẫu `App.jsx` trong SPEC: `/` là landing page, còn trang "chuyển theo vai trò" nằm ở `/app`.

Mỗi biểu đồ đều có nút **xem dạng bảng**. Bảng màu categorical đã chạy qua bộ kiểm tra mù màu; màu trạng thái (xanh/vàng/đỏ) luôn đi kèm icon và nhãn chữ.

## Hợp đồng API frontend đang dùng

Nguồn sự thật cho dạng dữ liệu là `src/mocks/server.js`, bám theo SPEC mục 9 và **bổ sung** những phần sau để vẽ biểu đồ:

- `GET /api/auth/me`, `POST /api/auth/login` → `{ id, username, role, isActive, mustChangePassword, profile: { fullName, email, studentCode?, dateOfBirth?, class?, homeroomTeacher?, teacherCode? } }`
- `GET /api/me/credits` → thêm `failedCourses: [{ code, name, credits, score }]`
- `GET /api/teacher/classes` → mỗi lớp có `studentCount`, `avgCredits`, `atRisk`, `teacher: { id, fullName }`
- **mới** `GET /api/teacher/classes/:classId` → một lớp (cùng dạng như trên)
- **mới** `GET /api/teacher/stats` → `{ classCount, studentCount, avgCredits, bands: { good, warning, danger }, distribution: [{ range, count }], byClass: [{ classId, classCode, avgCredits, studentCount }], atRiskStudents: [...] }`
- `GET /api/teacher/classes/:classId/students` → mỗi SV có `earnedCredits`, `class: { classCode }`
- `GET .../results` → `{ student, total, courses: [{ courseId, courseCode, name, credits, score }] }`; `PUT` nhận `{ results: [{ courseId, score | null }] }`
- `GET /api/admin/stats` → `{ counts: { classes, teachers, students, courses }, avgCredits, bands, creditDistribution, studentsPerClass: [{ classCode, count, avgCredits }], roles: [{ role, count }], accounts: { active, locked, mustChangePassword }, coursePassRate: [{ courseCode, name, passRate }], classesWithoutTeacher }`
- `GET /api/admin/teachers` → thêm `classes: [{ id, classCode }]`, `isActive`; `GET /api/admin/courses` → thêm `enrolled`; `GET /api/admin/users` → thêm `fullName`, `mustChangePassword`

### Lệch so với `server/` hiện tại (cần thống nhất khi ghép)

Frontend đã tự chấp nhận cả hai dạng cho: `login`/`me` bọc trong `{ user }` với profile phẳng, và trang nhập điểm trả `results` thay vì `courses`. Còn lại cần backend bổ sung, hoặc báo để sửa frontend theo:

1. `GET /api/admin/stats` hiện chỉ trả số đếm → dashboard admin cần các trường biểu đồ ở trên.
2. Chưa có `GET /api/teacher/stats` và `GET /api/teacher/classes/:classId`.
3. `PUT .../results` bắt buộc `semester` (YYYY-1/2/3) và xoá điểm bằng `remove: true` → frontend hiện gửi `score: null` và không có ô học kỳ.
4. `/auth/me` chưa có `studentCode`, `dateOfBirth`, `class`, `homeroomTeacher` (trang Thông tin cá nhân của SV).
5. Danh sách SV cần `earnedCredits`; danh sách lớp cần `studentCount`, `avgCredits`, `atRisk`.

## Cấu trúc

```
src/
├── App.jsx, main.jsx           # route (data router để dùng useBlocker)
├── lib/api.js                  # fetch wrapper; 401 → sự kiện auth:unauthorized
├── context/AuthContext.jsx
├── mocks/                      # API giả lập + dữ liệu mẫu cố định (seed)
├── components/
│   ├── ui/                     # component shadcn/ui
│   ├── layout/AppShell.jsx     # sidebar + topbar + chuyển trang
│   ├── charts/                 # ChartCard, ColumnChart, HBarChart, DonutChart, CreditRing
│   ├── landing/                # HeroMockup, RolePreview, ArchitectureFlow
│   └── DataTable, StatCard, ConfirmDialog, StudentFormDialog, ...
└── pages/ (student | teacher | admin)
e2e/                            # Playwright: landing, auth, admin, teacher, student, mobile
```
