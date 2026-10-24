-- =====================================================================
-- Student Manager (SMS) · Amazon RDS for MySQL 8.0
-- Schema v1.0 · 2026-10-14
-- Charset utf8mb4 / collation utf8mb4_unicode_ci (tiếng Việt có dấu)
-- Engine InnoDB (khoá ngoại, transaction)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS student_manager
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_manager;

SET NAMES utf8mb4;
SET time_zone = '+00:00';   -- lưu UTC, app đổi sang giờ VN khi hiển thị

-- ---------------------------------------------------------------------
-- 1. users : tài khoản đăng nhập (JWT + bcrypt), vai trò
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username              VARCHAR(50)     NOT NULL COMMENT 'SV: MSSV, GV: mã GV, admin: tự đặt',
  password_hash         CHAR(60)        NOT NULL COMMENT 'bcrypt, cost 10',
  email                 VARCHAR(100)        NULL,
  role                  ENUM('student','teacher','admin') NOT NULL,
  is_active             TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '0 = bị khoá',
  must_change_password  TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1 = đang dùng mật khẩu mặc định',
  last_login_at         DATETIME            NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tài khoản đăng nhập';

-- ---------------------------------------------------------------------
-- 2. teachers : hồ sơ giáo viên (1-1 với users)
-- ---------------------------------------------------------------------
CREATE TABLE teachers (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED  NOT NULL,
  teacher_code  VARCHAR(20)   NOT NULL COMMENT 'VD: GV001',
  full_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)      NULL,
  phone         VARCHAR(15)       NULL,
  department    VARCHAR(100)      NULL COMMENT 'Bộ môn',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teachers_user (user_id),
  UNIQUE KEY uq_teachers_code (teacher_code),
  KEY ix_teachers_name (full_name),
  CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Hồ sơ giáo viên';

-- ---------------------------------------------------------------------
-- 3. classes : lớp sinh hoạt, mỗi lớp 1 giáo viên chủ nhiệm
-- ---------------------------------------------------------------------
CREATE TABLE classes (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  class_code    VARCHAR(20)       NOT NULL COMMENT 'VD: 24110CL1',
  name          VARCHAR(100)      NOT NULL,
  intake_year   SMALLINT UNSIGNED NOT NULL COMMENT 'Khoá, VD: 2024',
  teacher_id    INT UNSIGNED          NULL COMMENT 'GV chủ nhiệm; NULL = chưa phân công',
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_classes_code (class_code),
  KEY ix_classes_teacher (teacher_id),
  CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_classes_year CHECK (intake_year BETWEEN 2000 AND 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lớp sinh hoạt';

-- ---------------------------------------------------------------------
-- 4. students : hồ sơ sinh viên (1-1 với users, n-1 với classes)
-- ---------------------------------------------------------------------
CREATE TABLE students (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED  NOT NULL,
  student_code  VARCHAR(20)   NOT NULL COMMENT 'MSSV',
  full_name     VARCHAR(100)  NOT NULL,
  date_of_birth DATE              NULL,
  gender        ENUM('male','female','other') NULL,
  email         VARCHAR(100)      NULL,
  phone         VARCHAR(15)       NULL,
  class_id      INT UNSIGNED  NOT NULL,
  avatar        MEDIUMBLOB        NULL COMMENT 'Ảnh thẻ (byte), tối đa 2 MB do ứng dụng giới hạn',
  avatar_mine   VARCHAR(50)       NULL COMMENT 'VD image/jpeg, image/png',
  status        ENUM('studying','suspended','graduated','dropped') NOT NULL DEFAULT 'studying',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_user (user_id),
  UNIQUE KEY uq_students_code (student_code),
  KEY ix_students_class (class_id),
  KEY ix_students_name (full_name),
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Hồ sơ sinh viên';

-- ---------------------------------------------------------------------
-- 5. courses : danh mục môn học và số tín chỉ
-- ---------------------------------------------------------------------
CREATE TABLE courses (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  course_code   VARCHAR(20)       NOT NULL COMMENT 'VD: CLCO332779',
  name          VARCHAR(150)      NOT NULL,
  credits       TINYINT UNSIGNED  NOT NULL,
  is_active     TINYINT(1)        NOT NULL DEFAULT 1 COMMENT '0 = ngừng mở, giữ lại để không mất lịch sử điểm',
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_code (course_code),
  CONSTRAINT ck_courses_credits CHECK (credits BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Môn học';

-- ---------------------------------------------------------------------
-- 6. student_courses : kết quả môn học của sinh viên (bảng nối n-n)
--    Một sinh viên có tối đa 1 dòng cho mỗi môn (học lại thì cập nhật điểm)
-- ---------------------------------------------------------------------
CREATE TABLE student_courses (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id    INT UNSIGNED  NOT NULL,
  course_id     INT UNSIGNED  NOT NULL,
  semester      VARCHAR(10)   NOT NULL COMMENT 'Học kỳ đạt/học gần nhất, VD 2026-1',
  score         DECIMAL(4,2)      NULL COMMENT 'Thang 10; NULL = chưa có điểm',
  is_passed     TINYINT(1) AS (score IS NOT NULL AND score >= 5.00) STORED COMMENT 'Cột sinh tự động',
  graded_by     INT UNSIGNED      NULL COMMENT 'users.id của người nhập điểm',
  graded_at     DATETIME          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sc_student_course (student_id, course_id),
  KEY ix_sc_student_passed (student_id, is_passed),
  KEY ix_sc_course (course_id),
  KEY ix_sc_graded_by (graded_by),
  CONSTRAINT fk_sc_student FOREIGN KEY (student_id) REFERENCES students (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sc_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_sc_graded_by FOREIGN KEY (graded_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_sc_score CHECK (score IS NULL OR (score >= 0 AND score <= 10)),
  CONSTRAINT ck_sc_semester CHECK (semester REGEXP '^[0-9]{4}-[1-3]$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Kết quả môn học';

-- ---------------------------------------------------------------------
-- 7. audit_logs : nhật ký thao tác quan trọng (cấp quyền, khoá TK, CRUD SV, nhập điểm)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id      INT UNSIGNED        NULL COMMENT 'users.id người thực hiện',
  action        VARCHAR(50)     NOT NULL COMMENT 'VD: USER_ROLE_CHANGED, STUDENT_CREATED',
  entity_type   VARCHAR(30)     NOT NULL COMMENT 'users, students, classes, ...',
  entity_id     INT UNSIGNED        NULL,
  old_value     JSON                NULL,
  new_value     JSON                NULL,
  request_id    CHAR(36)            NULL COMMENT 'Trùng requestId trong log CloudWatch',
  ip_address    VARCHAR(45)         NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_audit_entity (entity_type, entity_id),
  KEY ix_audit_actor_time (actor_id, created_at),
  KEY ix_audit_time (created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nhật ký thao tác';

-- ---------------------------------------------------------------------
-- 8. View: tổng tín chỉ đã đạt của từng sinh viên (trên 150)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_student_credit_summary AS
SELECT s.id                                   AS student_id,
       s.student_code,
       s.full_name,
       s.class_id,
       COALESCE(SUM(CASE WHEN sc.is_passed = 1 THEN c.credits END), 0) AS earned_credits,
       150                                    AS required_credits,
       ROUND(COALESCE(SUM(CASE WHEN sc.is_passed = 1 THEN c.credits END), 0) / 150 * 100, 1) AS percent_complete,
       COUNT(CASE WHEN sc.is_passed = 1 THEN 1 END) AS passed_courses
FROM students s
LEFT JOIN student_courses sc ON sc.student_id = s.id
LEFT JOIN courses c          ON c.id = sc.course_id
GROUP BY s.id, s.student_code, s.full_name, s.class_id;

-- ---------------------------------------------------------------------
-- 9. Tài khoản DB cho ứng dụng (least privilege, không dùng master user)
-- ---------------------------------------------------------------------
-- CREATE USER 'sms_app'@'%' IDENTIFIED BY '<lấy từ Parameter Store>';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON student_manager.* TO 'sms_app'@'%';
-- GRANT SELECT, INSERT ON student_manager.audit_logs TO 'sms_app'@'%';
-- (migrate chạy bằng tài khoản 'sms_migrator' có thêm CREATE, ALTER, INDEX, REFERENCES, CREATE VIEW)
