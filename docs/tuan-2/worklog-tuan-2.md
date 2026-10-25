# Worklog Tuần 2 (19/10/2026 – 25/10/2026)

**Đồ án:** Quản lý sinh viên Node.js trên AWS Elastic Beanstalk  
**Thành viên:**  
- Trần Lê Thái – 24110331 (Ứng dụng & Elastic Beanstalk)  
- Nông Hoàng Anh – 24110154 (Hạ tầng nền & Dữ liệu)  

Ảnh minh chứng: `evidence/luot-1/` (account của Thái, default VPC), `evidence/luot-2/` (account của Hoàng Anh, VPC riêng).

---

## Nhật ký chi tiết

| Ngày | Người | Mã việc | Nội dung công việc | Giờ | Dẫn chứng (commit / ảnh) | AI hỗ trợ |
| :---: | :---: | :---: | :--- | :---: | :--- | :--- |
| 21/10/2026 | Thái | T1 | Đóng gói ứng dụng: `package.json`, `Procfile` ở gốc; script `scripts/package.sh` tạo `dist/student-manager-v1.zip` | 1,5h | Commit [`75a0e7a`](https://github.com/devonxjz/student-manager-ops/commit/75a0e7a) | Hỗ trợ cấu trúc gói Beanstalk |
| 21/10/2026 | Thái | T2 | Viết `.ebextensions/` (01-env, 02-autoscaling, 03-deployment, 04-logs), hướng dẫn triển khai trong `README.md` | 1,5h | Commit [`75a0e7a`](https://github.com/devonxjz/student-manager-ops/commit/75a0e7a) | Tra cứu namespace Beanstalk |
| 24/10/2026 | Anh | A1 | Chuyển ảnh thẻ sang `MEDIUMBLOB` + `avatar_mime` (schema, tài liệu thiết kế, model); chạy test 120/120; chốt đặc tả sơ đồ kiến trúc mới | 1,5h | Commit [`9d7d3c3`](https://github.com/devonxjz/student-manager-ops/commit/9d7d3c3), [`9429b0b`](https://github.com/devonxjz/student-manager-ops/commit/9429b0b); `architecture-tuan-2.png` | Giải thích BLOB; Claude vẽ sơ đồ theo đặc tả |
| 24/10/2026 | Thái | T3–T4 | Lượt 1: tạo môi trường `Student-manager-env` (default VPC), LabRole/LabInstanceProfile/vockey, t3.micro; khai báo biến môi trường | 1,5h | `luot-1/taoungdung.png`, `luot-1/deploy_v1.png` | |
| 24/10/2026 | Thái | T5 | Lượt 1: kiểm thử `/health`, đăng nhập admin, thêm lớp học | 1,5h | `luot-1/dashboard.png`, `luot-1/demo.png` | |
| 24/10/2026 | Thái | T6 | Lượt 1: deploy v2 (Rolling, batch 1), kiểm tra `/health` trả `version: 2.0.0`, rollback về v1 | 1,5h | Commit [`f6e0588`](https://github.com/devonxjz/student-manager-ops/commit/f6e0588); `luot-1/event_v12.png`, `deploy_v2.png`, `minhchung_v2_health.png`, `rollback_v2_to_v1.png` | |
| 24/10/2026 | Anh | A2 | Kiểm tra LabRole, trust policy, LabInstanceProfile, vockey, dry-run loại instance, nền tảng Node.js, MySQL 8.4 | 1h | `luot-2/a2-01` → `a2-04` | Hướng dẫn lệnh CLI |
| 25/10/2026 | Anh | A3 | Dựng `sms-dev-vpc` (6 subnet 2 AZ, 1 NAT, S3 endpoint), gỡ NAT khỏi route DB, tạo 4 security group | 1,5h | `luot-2/a3-01` → `a3-06` | Hướng dẫn từng bước |
| 25/10/2026 | Anh | A4 | Tạo DB subnet group, RDS `sms-dev-db` MySQL 8.4.11; CloudShell VPC; kết nối TLS, nạp schema, seed admin | 1,5h | `luot-2/a4-01` → `a4-09` | Hướng dẫn từng bước |
| 25/10/2026 | Anh | — | Lượt 2: đóng gói v1, tải lên bằng CLI, tạo `sms-dev-app` trong VPC riêng, kiểm tra Health/EC2/ALB; dọn tài nguyên cuối buổi | 1,5h | `luot-2/eb-01` → `eb-07`, `don-01`, `don-02` | Hướng dẫn từng bước |
| 25/10/2026 | Anh | A5 | Rà soát tag (Tag Editor bị SCP chặn), ước tính chi phí | 0,5h | `luot-2/kk-05-tag-editor-scp.png` | |
| 25/10/2026 | Anh | A6 | Viết báo cáo tuần 2, sắp xếp lại thư mục `docs/` theo tuần | 1,5h | `docs/tuan-2/Báo cáo tuần 2.md` | Claude soạn bản nháp từ dữ kiện nhóm |
| 25/10/2026 | Thái | T7 | Rà soát báo cáo, đối chiếu số liệu và link | 1h | | |

---

## Tổng kết số giờ

- **Trần Lê Thái:** **8,5 giờ** (T1 1,5h + T2 1,5h + T3–T4 1,5h + T5 1,5h + T6 1,5h + T7 1h).
- **Nông Hoàng Anh:** **9 giờ** (A1 1,5h + A2 1h + A3 1,5h + A4 1,5h + triển khai lượt 2 1,5h + A5 0,5h + A6 1,5h).
