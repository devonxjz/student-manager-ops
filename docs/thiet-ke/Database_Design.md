# Thiết kế cơ sở dữ liệu – Student Manager (SMS)

| Mục | Giá trị |
|---|---|
| Hệ quản trị | Amazon RDS for MySQL 8.0 (`db.t3.micro`, 20 GB gp3, Single-AZ, us-east-1) |
| Database | `student_manager` |
| Charset / collation | `utf8mb4` / `utf8mb4_unicode_ci` (lưu tiếng Việt có dấu, tìm kiếm không phân biệt hoa thường) |
| Engine | InnoDB (khoá ngoại, transaction, row-level lock) |
| Múi giờ lưu trữ | UTC; ứng dụng đổi sang `Asia/Ho_Chi_Minh` khi hiển thị |
| ORM / migration | Sequelize 6 + sequelize-cli |
| Script tạo schema | [schema.sql](../../database/schema.sql) (đã chạy thử, kiểm tra ràng buộc và view) |
| Sơ đồ ERD | [erd.png](erd.png) |
| Phiên bản | 1.0 · 14/10/2026 |

---

## 1. Tổng quan mô hình

7 bảng và 1 view, chia 3 nhóm:

| Nhóm | Bảng | Mô tả |
|---|---|---|
| Định danh & phân quyền | `users` | Tài khoản đăng nhập, mật khẩu bcrypt, vai trò `student` / `teacher` / `admin` |
| Hồ sơ | `teachers`, `students`, `classes` | Hồ sơ giáo viên, sinh viên; lớp sinh hoạt và giáo viên chủ nhiệm |
| Học vụ | `courses`, `student_courses` | Môn học và số tín chỉ; kết quả môn của từng sinh viên |
| Vận hành | `audit_logs` | Nhật ký thao tác quan trọng (cấp quyền, khoá tài khoản, CRUD sinh viên, nhập điểm) |
| Báo cáo | `v_student_credit_summary` (view) | Tín chỉ đã đạt / 150 của từng sinh viên |

### 1.1 Quan hệ

```
users 1 ──── 0..1 teachers 1 ──── 0..n classes 1 ──── 0..n students 0..1 ──── 1 users
                                                              │ 1
                                                              │
                                                              n
users 1 ──── 0..n student_courses (graded_by)          student_courses n ──── 1 courses
users 1 ──── 0..n audit_logs (actor_id)
```

| Quan hệ | Bản số | Ý nghĩa |
|---|---|---|
| `users` – `teachers` | 1 : 0..1 | Mỗi tài khoản role `teacher` có đúng 1 hồ sơ giáo viên |
| `users` – `students` | 1 : 0..1 | Mỗi tài khoản role `student` có đúng 1 hồ sơ sinh viên |
| `teachers` – `classes` | 1 : 0..n | Một giáo viên chủ nhiệm nhiều lớp; một lớp có tối đa 1 GVCN |
| `classes` – `students` | 1 : 0..n | Mỗi sinh viên thuộc đúng 1 lớp |
| `students` – `courses` | n : n qua `student_courses` | Mỗi sinh viên có tối đa 1 kết quả cho mỗi môn |
| `users` – `student_courses` | 1 : 0..n | Người nhập điểm (`graded_by`) |
| `users` – `audit_logs` | 1 : 0..n | Người thực hiện thao tác (`actor_id`) |

Mô hình ở **dạng chuẩn 3 (3NF)**: không có thuộc tính lặp, mọi thuộc tính phụ thuộc vào khoá chính. Số tín chỉ chỉ lưu ở `courses`, không lưu tổng trong `students`, để không bao giờ lệch số liệu. Tổng tín chỉ được tính bằng view.

Ngoại lệ có chủ đích: `student_courses.is_passed` là **cột sinh (generated column)** tính từ `score`, MySQL tự cập nhật, dùng để đánh index cho truy vấn tín chỉ.

---

## 2. Từ điển dữ liệu

Ký hiệu: **PK** khoá chính · **FK** khoá ngoại · **UQ** duy nhất · **NN** bắt buộc (NOT NULL) · **AI** tự tăng

Các bảng (trừ `audit_logs`) đều có 2 cột hệ thống:

| Cột | Kiểu | NN | Mặc định | Mô tả |
|---|---|:-:|---|---|
| created_at | DATETIME | ✔ | `CURRENT_TIMESTAMP` | Thời điểm tạo (UTC) |
| updated_at | DATETIME | ✔ | `CURRENT_TIMESTAMP ON UPDATE` | Thời điểm sửa gần nhất (UTC) |

### 2.1 `users` – Tài khoản đăng nhập

| Cột | Kiểu | Khoá | NN | Mặc định | Ràng buộc / Mô tả |
|---|---|---|:-:|---|---|
| id | INT UNSIGNED | PK, AI | ✔ | | |
| username | VARCHAR(50) | UQ | ✔ | | SV dùng MSSV, GV dùng mã GV |
| password_hash | CHAR(60) | | ✔ | | Chuỗi bcrypt cost 10, không bao giờ trả ra API |
| email | VARCHAR(100) | UQ | | NULL | Email liên hệ, dùng khi reset mật khẩu |
| role | ENUM('student','teacher','admin') | | ✔ | | Vai trò, chỉ admin được đổi |
| is_active | TINYINT(1) | | ✔ | 1 | 0 = bị khoá, không đăng nhập được |
| must_change_password | TINYINT(1) | | ✔ | 1 | 1 = đang dùng mật khẩu mặc định, bắt đổi ở lần đăng nhập đầu |
| last_login_at | DATETIME | | | NULL | Lần đăng nhập thành công gần nhất |

Index: `uq_users_username`, `uq_users_email`, `ix_users_role_active (role, is_active)` cho trang phân quyền lọc theo vai trò.

### 2.2 `teachers` – Hồ sơ giáo viên

| Cột | Kiểu | Khoá | NN | Mặc định | Ràng buộc / Mô tả |
|---|---|---|:-:|---|---|
| id | INT UNSIGNED | PK, AI | ✔ | | |
| user_id | INT UNSIGNED | FK → users.id, UQ | ✔ | | Xoá user thì xoá hồ sơ (CASCADE) |
| teacher_code | VARCHAR(20) | UQ | ✔ | | Mã giáo viên, VD `GV001` |
| full_name | VARCHAR(100) | | ✔ | | Họ tên |
| email | VARCHAR(100) | | | NULL | Email công vụ |
| phone | VARCHAR(15) | | | NULL | Số điện thoại |
| department | VARCHAR(100) | | | NULL | Bộ môn |

Index: `uq_teachers_user`, `uq_teachers_code`, `ix_teachers_name` (tìm theo tên).

### 2.3 `classes` – Lớp sinh hoạt

| Cột | Kiểu | Khoá | NN | Mặc định | Ràng buộc / Mô tả |
|---|---|---|:-:|---|---|
| id | INT UNSIGNED | PK, AI | ✔ | | |
| class_code | VARCHAR(20) | UQ | ✔ | | Mã lớp, VD `24110CL1` |
| name | VARCHAR(100) | | ✔ | | Tên lớp |
| intake_year | SMALLINT UNSIGNED | | ✔ | | Khoá tuyển sinh; CHECK 2000–2100 |
| teacher_id | INT UNSIGNED | FK → teachers.id | | NULL | GV chủ nhiệm; xoá GV thì lớp về "chưa phân công" (SET NULL) |

Index: `uq_classes_code`, `ix_classes_teacher` (giáo viên xem "lớp của tôi").

### 2.4 `students` – Hồ sơ sinh viên

| Cột | Kiểu            | Khoá | NN | Mặc định | Ràng buộc / Mô tả |
|---|-----------------|---|:-:|---|---|
| id | INT UNSIGNED    | PK, AI | ✔ | | |
| user_id | INT UNSIGNED    | FK → users.id, UQ | ✔ | | Xoá user thì xoá hồ sơ (CASCADE) |
| student_code | VARCHAR(20)     | UQ | ✔ | | MSSV, VD `24110154` |
| full_name | VARCHAR(100)    | | ✔ | | Họ tên |
| date_of_birth | DATE            | | | NULL | Ngày sinh |
| gender | ENUM('male','female','other') | | | NULL | Giới tính |
| email | VARCHAR(100)    | | | NULL | Email sinh viên |
| phone | VARCHAR(15)     | | | NULL | Số điện thoại |
| class_id | INT UNSIGNED    | FK → classes.id | ✔ | | Lớp sinh hoạt; không xoá được lớp còn sinh viên (RESTRICT) |
| avatar  | MEDIUMBLOB      | | | NULL | Ảnh thẻ lưu trực tiếp trong DB; ứng dụng giới hạn ≤ 2 MB  |
| avatar_mime   | VARCHAR(50)     | | | NULL | Loại ảnh, VD `image/jpeg`; cần để trả header `Content-Type` |
| status | ENUM('studying','suspended','graduated','dropped') | | ✔ | 'studying' | Tình trạng học tập |

Index: `uq_students_user`, `uq_students_code`, `ix_students_class` (danh sách SV theo lớp), `ix_students_name`.

### 2.5 `courses` – Môn học

| Cột | Kiểu | Khoá | NN | Mặc định | Ràng buộc / Mô tả |
|---|---|---|:-:|---|---|
| id | INT UNSIGNED | PK, AI | ✔ | | |
| course_code | VARCHAR(20) | UQ | ✔ | | Mã môn, VD `CLCO332779` |
| name | VARCHAR(150) | | ✔ | | Tên môn |
| credits | TINYINT UNSIGNED | | ✔ | | Số tín chỉ; CHECK 1–10 |
| is_active | TINYINT(1) | | ✔ | 1 | 0 = ngừng mở; môn đã có điểm thì chỉ ẩn, không xoá |

Index: `uq_courses_code`.

### 2.6 `student_courses` – Kết quả môn học

| Cột | Kiểu | Khoá | NN | Mặc định | Ràng buộc / Mô tả |
|---|---|---|:-:|---|---|
| id | INT UNSIGNED | PK, AI | ✔ | | |
| student_id | INT UNSIGNED | FK → students.id | ✔ | | Xoá SV thì xoá kết quả (CASCADE) |
| course_id | INT UNSIGNED | FK → courses.id | ✔ | | Không xoá được môn đã có điểm (RESTRICT) |
| semester | VARCHAR(10) | | ✔ | | Học kỳ, định dạng `YYYY-n` (n = 1, 2, 3 hè); CHECK regex |
| score | DECIMAL(4,2) | | | NULL | Điểm thang 10; CHECK 0–10; NULL = chưa có điểm |
| is_passed | TINYINT(1) | | | *generated* | `score >= 5.00`, MySQL tự tính (STORED) |
| graded_by | INT UNSIGNED | FK → users.id | | NULL | Người nhập điểm (GV hoặc admin) |
| graded_at | DATETIME | | | NULL | Thời điểm nhập điểm |

Ràng buộc: `UNIQUE (student_id, course_id)`, mỗi môn chỉ tính 1 lần; học lại thì cập nhật dòng cũ.
Index: `ix_sc_student_passed (student_id, is_passed)` phục vụ trực tiếp truy vấn tín chỉ; `ix_sc_course`; `ix_sc_graded_by`.

### 2.7 `audit_logs` – Nhật ký thao tác

| Cột | Kiểu | Khoá | NN | Mặc định | Ràng buộc / Mô tả |
|---|---|---|:-:|---|---|
| id | BIGINT UNSIGNED | PK, AI | ✔ | | |
| actor_id | INT UNSIGNED | FK → users.id | | NULL | Người thực hiện; giữ log khi user bị xoá (SET NULL) |
| action | VARCHAR(50) | | ✔ | | Mã hành động (bảng 3.3) |
| entity_type | VARCHAR(30) | | ✔ | | Bảng bị tác động |
| entity_id | INT UNSIGNED | | | NULL | id bản ghi bị tác động |
| old_value | JSON | | | NULL | Giá trị trước khi đổi (không chứa mật khẩu) |
| new_value | JSON | | | NULL | Giá trị sau khi đổi |
| request_id | CHAR(36) | | | NULL | Trùng `requestId` trong log CloudWatch để truy vết |
| ip_address | VARCHAR(45) | | | NULL | IPv4/IPv6 của client (lấy từ `X-Forwarded-For`) |
| created_at | DATETIME | | ✔ | `CURRENT_TIMESTAMP` | Chỉ ghi thêm, không sửa, không xoá |

Index: `ix_audit_entity (entity_type, entity_id)`, `ix_audit_actor_time (actor_id, created_at)`, `ix_audit_time`.

### 2.8 View `v_student_credit_summary`

| Cột | Mô tả |
|---|---|
| student_id, student_code, full_name, class_id | Thông tin sinh viên |
| earned_credits | Tổng tín chỉ các môn `is_passed = 1` |
| required_credits | 150 |
| percent_complete | earned / 150 × 100, làm tròn 1 chữ số |
| passed_courses | Số môn đã đạt |

Dùng cho trang "Tín chỉ của tôi" (lọc theo `student_id` lấy từ JWT) và cột tiến độ trong danh sách sinh viên của giáo viên (lọc theo `class_id`).

---

## 3. Quy tắc nghiệp vụ ở tầng dữ liệu

### 3.1 Toàn vẹn tham chiếu

| Khoá ngoại | ON DELETE | Lý do |
|---|---|---|
| teachers.user_id → users | CASCADE | Hồ sơ không tồn tại khi không có tài khoản |
| students.user_id → users | CASCADE | như trên |
| classes.teacher_id → teachers | SET NULL | Xoá GV không làm mất lớp, lớp chờ phân công lại |
| students.class_id → classes | RESTRICT | Phải chuyển hết SV sang lớp khác trước khi xoá lớp |
| student_courses.student_id → students | CASCADE | Xoá SV thì xoá luôn kết quả |
| student_courses.course_id → courses | RESTRICT | Không mất điểm vì lỡ xoá môn; dùng `is_active = 0` |
| student_courses.graded_by → users | SET NULL | Giữ điểm khi tài khoản người nhập bị xoá |
| audit_logs.actor_id → users | SET NULL | Giữ nhật ký vĩnh viễn |

Mọi khoá ngoại đều `ON UPDATE CASCADE`.

### 3.2 Ràng buộc phải kiểm tra ở tầng Service (DB không tự đảm bảo)

| Quy tắc | Nơi kiểm tra |
|---|---|
| `users.role = 'teacher'` thì phải có đúng 1 dòng `teachers`; `'student'` thì có đúng 1 dòng `students`; `'admin'` thì không có hồ sơ | `user.service.changeRole` trong 1 transaction |
| Luôn còn ít nhất 1 admin đang hoạt động; admin không tự hạ quyền / tự khoá mình | `user.service` |
| Giáo viên chỉ thao tác SV có `class_id` thuộc lớp mình chủ nhiệm | middleware `classOwnership` + điều kiện `WHERE class_id = ?` trong service |
| Sinh viên chỉ đọc dữ liệu của `student_id` trong JWT | `me.controller` |
| Tạo SV/GV = tạo `users` + hồ sơ trong cùng transaction; mật khẩu ban đầu = mã SV/GV, `must_change_password = 1` | `student.service.create`, `teacher.service.create` |
| Ghi `audit_logs` trong cùng transaction với thao tác | service tương ứng |

### 3.3 Mã hành động trong `audit_logs`

| action | Khi nào |
|---|---|
| USER_LOGIN_FAILED | Đăng nhập sai (để phát hiện dò mật khẩu) |
| USER_ROLE_CHANGED | Admin cấp / đổi quyền |
| USER_LOCKED, USER_UNLOCKED | Khoá / mở tài khoản |
| USER_PASSWORD_RESET | Admin đặt lại mật khẩu |
| STUDENT_CREATED, STUDENT_UPDATED, STUDENT_DELETED | CRUD sinh viên |
| TEACHER_CREATED, TEACHER_UPDATED, TEACHER_DELETED | CRUD giáo viên |
| CLASS_CREATED, CLASS_UPDATED, CLASS_DELETED, CLASS_TEACHER_ASSIGNED | Quản lý lớp |
| COURSE_CREATED, COURSE_UPDATED | Quản lý môn |
| SCORE_UPDATED | Nhập / sửa điểm |

---

## 4. Truy vấn chính và index phục vụ

| Màn hình | Truy vấn | Index dùng |
|---|---|---|
| Đăng nhập | `SELECT … FROM users WHERE username = ?` | `uq_users_username` |
| Tín chỉ của tôi | `SELECT … FROM v_student_credit_summary WHERE student_id = ?` + danh sách môn `WHERE student_id = ? AND is_passed = 1` | `ix_sc_student_passed` |
| Lớp của tôi (GV) | `SELECT … FROM classes WHERE teacher_id = ?` | `ix_classes_teacher` |
| Sinh viên trong lớp | `SELECT … FROM students WHERE class_id = ? ORDER BY student_code` | `ix_students_class` |
| Tìm sinh viên (admin) | `WHERE student_code = ?` hoặc `full_name LIKE 'Nguyễn%'` | `uq_students_code`, `ix_students_name` |
| Phân quyền (admin) | `SELECT … FROM users WHERE role = ? AND is_active = ?` | `ix_users_role_active` |
| Lịch sử thao tác | `WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC` | `ix_audit_entity` |

Truy vấn tính tín chỉ cho 1 sinh viên:

```sql
SELECT COALESCE(SUM(c.credits), 0) AS earned
FROM student_courses sc
JOIN courses c ON c.id = sc.course_id
WHERE sc.student_id = ? AND sc.is_passed = 1;
```

---

## 5. Ước lượng dung lượng

Giả định 1 khoa: 2.000 sinh viên, 80 giáo viên, 60 lớp, 300 môn, mỗi SV ~50 môn.

| Bảng | Số dòng | Kích thước ước tính (gồm index) |
|---|---|---|
| users | ~2.100 | < 1 MB |
| students | 2.000 | < 1 MB |
| teachers, classes, courses | < 500 | < 1 MB |
| student_courses | ~100.000 | ~15 MB |
| audit_logs | ~200.000 / năm | ~80 MB / năm |

Tổng dưới 200 MB sau vài năm, `db.t3.micro` với 20 GB là dư. Có thể xoá `audit_logs` cũ hơn 1 năm bằng job định kỳ.

---

## 6. Bảo mật, sao lưu, vận hành

| Hạng mục | Thiết kế |
|---|---|
| Mạng | RDS trong DB subnet private (2 AZ), không public; `db-sg` chỉ nhận 3306 từ `app-sg` |
| Tài khoản DB | Master user `admin` chỉ dùng khi quản trị. App dùng `sms_app` (SELECT/INSERT/UPDATE/DELETE). Migrate dùng `sms_migrator` (thêm CREATE/ALTER/INDEX/REFERENCES/CREATE VIEW) |
| Bí mật | Mật khẩu DB lưu trong SSM Parameter Store (SecureString) `/sms/dev/db/password` |
| Mật khẩu người dùng | bcrypt cost 10, không lưu bản rõ, không ghi vào log hay `audit_logs` |
| Mã hoá | Bật Storage encryption (KMS mặc định) khi tạo RDS; kết nối TLS (`ssl: { rejectUnauthorized: true }` với CA bundle của RDS) |
| Sao lưu | Automated backup giữ 7 ngày, cửa sổ backup 18:00–19:00 UTC (01:00–02:00 giờ VN); chụp snapshot thủ công trước mỗi lần migrate lớn và trước khi xoá môi trường |
| Khôi phục | Point-in-time restore trong 7 ngày |
| Giám sát | CloudWatch alarm `CPUUtilization > 70%`, `FreeStorageSpace < 2 GB`, `DatabaseConnections > 50` gửi SNS |
| Thay đổi schema | Chỉ qua migration của sequelize-cli, chạy tự động `leader_only` khi `eb deploy`; không sửa tay trên production |
| Tham số RDS | Parameter group riêng `sms-dev-mysql8`: `time_zone = UTC`, `character_set_server = utf8mb4`, `collation_server = utf8mb4_unicode_ci`, `max_connections = 60` |

---

## 7. Dữ liệu khởi tạo (seed)

| Bảng | Dữ liệu |
|---|---|
| users | 1 admin: `username = admin`, mật khẩu lấy từ `/sms/dev/admin/initial-password`, `must_change_password = 1` |
| courses | Danh mục môn của chương trình CNTT (mã, tên, số tín chỉ), tổng tín chỉ chương trình = 150 |
| classes, teachers, students | (tuỳ chọn, môi trường dev) 2 lớp, 2 GV, 20 SV mẫu, điểm ngẫu nhiên để demo |

Seeder viết kiểu "chỉ thêm nếu chưa có" (`INSERT … ON DUPLICATE KEY UPDATE id = id`) để chạy lại nhiều lần không lỗi.

---

## 8. Ánh xạ sang Sequelize

| Bảng | Model | Quan hệ khai báo |
|---|---|---|
| users | `User` | `hasOne(Teacher)`, `hasOne(Student)` |
| teachers | `Teacher` | `belongsTo(User)`, `hasMany(Class)` |
| classes | `Class` | `belongsTo(Teacher)`, `hasMany(Student)` |
| students | `Student` | `belongsTo(User)`, `belongsTo(Class)`, `hasMany(StudentCourse)` |
| courses | `Course` | `hasMany(StudentCourse)` |
| student_courses | `StudentCourse` | `belongsTo(Student)`, `belongsTo(Course)`, `belongsTo(User, { as: 'grader', foreignKey: 'graded_by' })` |
| audit_logs | `AuditLog` | `belongsTo(User, { as: 'actor', foreignKey: 'actor_id' })` |

Cấu hình chung: `underscored: true`, `timestamps: true` (tên cột `created_at`, `updated_at`). `AuditLog` đặt `updatedAt: false`. Cột `is_passed` khai báo trong model nhưng loại khỏi insert/update (dùng `attributes` hoặc khai báo `VIRTUAL` khi ghi), vì MySQL tự tính.
