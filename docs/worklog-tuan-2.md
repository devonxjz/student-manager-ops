# Worklog Tuần 2 (19/10/2026 – 25/10/2026)

**Đồ án:** Quản lý sinh viên Node.js trên AWS Elastic Beanstalk  
**Thành viên:**  
- Trần Lê Thái – 24110331 (Ứng dụng & Elastic Beanstalk)  
- Nông Hoàng Anh – 24110154 (Hạ tầng nền & Dữ liệu)  

---

## Nhật ký chi tiết

| Ngày | Người | Mã việc | Nội dung công việc | Giờ | Dẫn chứng (commit / ảnh) | AI hỗ trợ |
| :---: | :---: | :---: | :--- | :---: | :--- | :--- |
| 21/10/2026 | Thái | T1 | Tạo `package.json`, `Procfile` ở gốc dự án; viết script đóng gói `scripts/package.sh`, đóng gói thành công `dist/student-manager-v1.zip` (468KB) | 2h | Commit `...`, `dist/student-manager-v1.zip` | Hỗ trợ cấu trúc gói Beanstalk |
| 21/10/2026 | Thái | T2 | Viết cấu hình `.ebextensions/` (01-env, 02-autoscaling, 03-deployment, 04-logs), cập nhật hướng dẫn README.md | 2h | Commit `...`, thư mục `.ebextensions/` | Tham khảo namespace EB |
| | Anh | A1 | Cập nhật `database/schema.sql`, `docs/Database_Design.md` sang lưu ảnh thẻ BLOB, vẽ lại sơ đồ kiến trúc | 2h | | |
| | Anh | A2 | Kiểm tra quyền LabRole/LabInstanceProfile, giới hạn Learner Lab | 1h | | |
| | Anh | A3 | Dựng VPC 2 AZ (subnet public/app/db, route table, security groups) | 2h | Ảnh `docs/evidence/tuan-2/01-vpc.png` | |
| | Anh | A4 | Tạo RDS MySQL `db.t3.micro`, chạy schema và seed dữ liệu | 2h | Ảnh `docs/evidence/tuan-2/02-rds.png` | |
| | Thái | T3 | Tạo môi trường Elastic Beanstalk load-balanced với LabRole, LabInstanceProfile, vockey, trỏ vào VPC | 1.5h | Ảnh `docs/evidence/tuan-2/03-eb-ok.png` | |
| | Thái | T4 | Khai báo environment properties (DB_*, JWT_SECRET, COOKIE_SECURE) | 0.5h | Ảnh `docs/evidence/tuan-2/04-eb-env.png` | |
| | Chung | — | Tích hợp EB - RDS, kiểm tra kết nối và health check | 1h | | |
| | Thái | T5 | Kiểm thử chức năng trên URL EB (/health, đăng nhập 3 vai trò, CRUD) | 1.5h | Ảnh `docs/evidence/tuan-2/05-test-crud.png` | |
| | Thái | T6 | Thử nghiệm Rolling deployment v2 và rollback về v1 | 1.5h | Ảnh `docs/evidence/tuan-2/06-rolling.png`, `07-rollback.png` | |
| | Anh | A5 | Rà soát tag bằng Tag Editor, ghi nhận chi phí Billing | 1h | Ảnh `docs/evidence/tuan-2/08-tags.png`, `09-cost.png` | |
| | Anh | A6 | Viết báo cáo Tuần 2 (docs/Báo cáo tuần 2.md) | 2h | Commit `docs/Báo cáo tuần 2.md` | |
| | Thái | T7 | Ghi worklog cá nhân, rà soát đối chiếu số liệu báo cáo | 1h | Worklog, feedback rà soát | |

---

## Tổng kết số giờ

- **Trần Lê Thái:** 10 giờ (T1: 2h, T2: 2h, T3: 1.5h, T4: 0.5h, T5: 1.5h, T6: 1.5h, T7: 1h, Chung: 1h? -> điều chỉnh tổng theo thực tế ≥ 8h).
- **Nông Hoàng Anh:** 10 giờ (A1: 2h, A2: 1h, A3: 2h, A4: 2h, A5: 1h, A6: 2h, Chung: 1h? -> điều chỉnh tổng theo thực tế ≥ 8h).
