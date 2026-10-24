# Worklog Tuần 2 (19/10/2026 – 25/10/2026)

**Đồ án:** Quản lý sinh viên Node.js trên AWS Elastic Beanstalk  
**Thành viên:**  
- Trần Lê Thái – 24110331 (Ứng dụng & Elastic Beanstalk)  
- Nông Hoàng Anh – 24110154 (Hạ tầng nền & Dữ liệu)  

---

## Nhật ký chi tiết

| Ngày | Người | Mã việc | Nội dung công việc | Giờ | Dẫn chứng (commit / ảnh) | AI hỗ trợ |
| :---: | :---: | :---: | :--- | :---: | :--- | :--- |
| 21/10/2026 | Thái | T1 | Đóng gói ứng dụng: thêm `package.json`, `Procfile` ở gốc; viết script `scripts/package.sh`, tạo gói `dist/student-manager-v1.zip` (468KB) | 2h | Commit [`75a0e7a`](https://github.com/devonxjz/student-manager-ops/commit/75a0e7a), `dist/student-manager-v1.zip` | Hỗ trợ cấu trúc gói Beanstalk |
| 21/10/2026 | Thái | T2 | Viết cấu hình `.ebextensions/` (01-env, 02-autoscaling, 03-deployment, 04-logs), cập nhật hướng dẫn triển khai trong `README.md` | 2h | Commit [`75a0e7a`](https://github.com/devonxjz/student-manager-ops/commit/75a0e7a), thư mục `.ebextensions/` | Tra cứu namespace EB |
| 22/10/2026 | Anh | A1 | Cập nhật `database/schema.sql`, `docs/Database_Design.md` từ `avatar_key` sang lưu ảnh thẻ `MEDIUMBLOB` và `avatar_mime` | 2h | Commit [`9d7d3c3`](https://github.com/devonxjz/student-manager-ops/commit/9d7d3c3), [`9429b0b`](https://github.com/devonxjz/student-manager-ops/commit/9429b0b) | Hỗ trợ cú pháp SQL & Sequelize |
| 22/10/2026 | Anh | A2 | Kiểm tra quyền thực tế `LabRole`/`LabInstanceProfile`, các giới hạn dịch vụ trên AWS Academy Learner Lab | 1h | Ghi nhận cấu hình IAM Role & Instance Profile | |
| 23/10/2026 | Anh | A3 | Thiết lập VPC, cấu hình các Security Group 3 tầng (`alb-sg`, `app-sg`, `sm-db-sg` mở port 3306) | 2h | Ảnh `docs/evidence/tuan-2/01-security-groups.png` | |
| 23/10/2026 | Anh | A4 | Tạo Amazon RDS MySQL (`db.t3.micro`, Single-AZ), nạp schema và chạy script seed tài khoản admin ban đầu | 2h | Ảnh `docs/evidence/tuan-2/02-rds-available.png` | |
| 24/10/2026 | Chung | — | Tích hợp Elastic Beanstalk với RDS MySQL, thông mạng qua Security Group, kiểm tra kết nối | 1h | Log kết nối DB qua script `seed.js` | |
| 24/10/2026 | Thái | T3 | Tạo môi trường Beanstalk Load-balanced (`Student-manager-env`), chọn `LabRole`, `LabInstanceProfile`, `vockey`, instance `t3.micro` | 1.5h | Ảnh `docs/evidence/tuan-2/03-eb-ok.png` (Health: Ok) | |
| 24/10/2026 | Thái | T4 | Cấu hình Environment properties (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `PORT: 8080`) | 0.5h | Ảnh `docs/evidence/tuan-2/04-eb-env.png` | |
| 24/10/2026 | Thái | T5 | Kiểm thử chức năng trên URL Beanstalk: kiểm tra `/health`, đăng nhập Admin, thực hiện thêm lớp học và sinh viên vào RDS | 1.5h | Ảnh `docs/evidence/tuan-2/05-test-crud.png` | |
| 24/10/2026 | Thái | T6 | Tạo phiên bản v2 (`student-manager-v2.zip`), triển khai Rolling deployment batch 1, sau đó rollback về v1 | 1.5h | Ảnh `docs/evidence/tuan-2/06-rolling.png`, `07-rollback.png` | |
| 25/10/2026 | Anh | A5 | Rà soát tag `Project`/`Owner` bằng Tag Editor, ghi nhận chi phí thực tế trên Billing Dashboard | 1h | Ảnh `docs/evidence/tuan-2/08-tags.png`, `09-cost.png` | |
| 25/10/2026 | Anh | A6 | Soạn thảo báo cáo Tuần 2 theo mẫu chuẩn đồ án môn học | 2h | `docs/Báo cáo tuần 2.md` | Hỗ trợ cấu trúc báo cáo |
| 25/10/2026 | Thái | T7 | Ghi worklog cá nhân, rà soát đối chiếu số liệu, commit và link minh chứng trước khi nộp | 1h | Bảng worklog cá nhân, biên bản rà soát | |

---

## Tổng kết số giờ thực tế

- **Trần Lê Thái:** **10,0 giờ** (T1: 2h + T2: 2h + T3: 1.5h + T4: 0.5h + T5: 1.5h + T6: 1.5h + T7: 1h; Chung: 1h) — *Đạt yêu cầu ≥ 8h*.
- **Nông Hoàng Anh:** **10,0 giờ** (A1: 2h + A2: 1h + A3: 2h + A4: 2h + A5: 1h + A6: 2h; Chung: 1h) — *Đạt yêu cầu ≥ 8h*.
