# Worklog Tuần 3

**Đồ án:** Quản lý sinh viên Node.js trên AWS Elastic Beanstalk  
**Thành viên:**  
- Trần Lê Thái – 24110331 (Ứng dụng, Beanstalk, bảo mật ứng dụng)  
- Nông Hoàng Anh – 24110154 (Hạ tầng IaC, dữ liệu, giám sát)  

Ảnh minh chứng: `evidence/`. Template: `infra/`.

---

## Nhật ký theo việc

| Mã | Người | Nội dung công việc | Giờ | Dẫn chứng | AI hỗ trợ |
| :---: | :---: | :--- | :---: | :--- | :--- |
| A1 | Anh | Kiểm tra quyền: CloudFormation, Parameter Store, DB parameter group, namespace bí mật của Beanstalk, policy LabRole, SNS + CloudWatch alarm | 0,5h | [A1-kiem-tra-quyen.md](A1-kiem-tra-quyen.md); `evidence/a1-01` → `a1-03` | Claude soạn lệnh kiểm tra |
| A2 | Anh | Viết `infra/network.yaml` theo từng khối, sửa lỗi thụt lề, dựng stack `sms-dev-network`, kiểm tra 8 export | 2,5h | Commit [`ec0ed38`](https://github.com/devonxjz/student-manager-ops/commit/ec0ed38), [`4e09b87`](https://github.com/devonxjz/student-manager-ops/commit/4e09b87); `evidence/a2-01` | Claude hướng dẫn từng khối |
| A3 | Anh | Tạo 2 tham số `SecureString`, dựng stack `sms-dev-database` (lần 1 lỗi mật khẩu ngắn, xóa và dựng lại), kiểm tra cấu hình RDS và parameter group | 2h | Commit [`0e304b7`](https://github.com/devonxjz/student-manager-ops/commit/0e304b7); `evidence/a3-01`, `kk-02` | Claude viết `database.yaml` |
| A4 | Anh | Tạo CloudShell VPC trong VPC mới, kết nối RDS bằng TLS, nạp schema, seed; xóa RDS, DB subnet group, VPC dựng tay tuần 2 | 1h | `evidence/a4-01`, `a4-04` | Claude hướng dẫn |
| A5 | Anh | Viết `infra/monitoring.yaml`, hỗ trợ dựng stack giám sát | 1,5h | `evidence/a5-01`, `a5-02` | Claude viết `monitoring.yaml` |
| A6 | Anh | Báo cáo tuần 3, dọn tài nguyên | 1,5h | `Báo cáo tuần 3.md` | Claude dựng khung báo cáo |
| T1 | Thái | SSL tới RDS; đọc bí mật từ Parameter Store; test 126/126 | 1,5h | Commit [`1e7508c`](https://github.com/devonxjz/student-manager-ops/commit/1e7508c) | |
| T2 | Thái | `npm audit`, nâng `body-parser` | 0,5h | Commit [`1e7508c`](https://github.com/devonxjz/student-manager-ops/commit/1e7508c) | |
| T3 | Thái | `.ebextensions`: đóng SSH, sửa tag | 0,5h | Commit [`1e7508c`](https://github.com/devonxjz/student-manager-ops/commit/1e7508c) | |
| T4 | Thái | `infra/app.yaml` | 2,5h | Commit [`1e7508c`](https://github.com/devonxjz/student-manager-ops/commit/1e7508c), [`d218348`](https://github.com/devonxjz/student-manager-ops/commit/d218348) | Claude sửa application, `VersionLabel`, SG ALB, chu kỳ scale |
| T5 | Thái | Dựng 4 stack ở account của Thái, bật `RequireSsl=1` | 1h | `evidence/t5-01`, `t5-02`, `t1-01` | |
| T6a | Thái | Rolling v3 → v4, rollback v3 trên account `2751-7291-1137` | 1,5h | `evidence/t6-01` → `t6-04` | |
| T6b | Anh | Bắn tải 2 lần, hạ ngưỡng CPU xuống 40%, rolling và rollback trên account `4328-6392-4671` | 1,5h | `evidence/t6-05` → `t6-09`, `rb-01` | Claude viết script, phân tích kết quả |
| T7 | Thái | Rà soát báo cáo | 0,5h | | |

---

## Tổng kết số giờ

- **Trần Lê Thái:** **8 giờ** (T1 1,5h + T2 0,5h + T3 0,5h + T4 2,5h + T5 1h + T6a 1,5h + T7 0,5h).
- **Nông Hoàng Anh:** **10,5 giờ** (A1 0,5h + A2 2,5h + A3 2h + A4 1h + A5 1,5h + A6 1,5h + T6b 1,5h).
