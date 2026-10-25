# KẾ HOẠCH TUẦN 2 – ĐỒ ÁN CLOUD COMPUTING

## Triển khai ứng dụng Quản lý sinh viên Node.js lên AWS Elastic Beanstalk

| Thông tin | Nội dung |
| --- | --- |
| Thời gian | Tuần 2: 19/10/2026 – 25/10/2026 |
| Sinh viên 1 | Trần Lê Thái – 24110331 |
| Sinh viên 2 | Nông Hoàng Anh – 24110154 |
| Môi trường | AWS Academy Learner Lab, region `us-east-1` |
| Mục tiêu tuần theo GVHD | Triển khai các chức năng lõi trên AWS, kiểm thử từng thành phần |

## 1. Điểm xuất phát và mục tiêu

Cuối tuần 1, nhóm đã có đặc tả, thiết kế cơ sở dữ liệu và mã nguồn chạy tại máy cá nhân (Jest 120/120, Playwright 32/32), nhưng **chưa tạo tài nguyên AWS**.

Mục tiêu tuần 2:

1. Có VPC, RDS MySQL và môi trường Elastic Beanstalk load-balanced chạy thật trên Learner Lab.
2. Ứng dụng trên URL của Elastic Beanstalk đăng nhập được và thao tác được với dữ liệu trên RDS.
3. Có `.ebextensions` cho cấu hình môi trường; thử rolling deployment và rollback phiên bản.
4. Mỗi thành phần có minh chứng (Account ID, region, thời gian) và mỗi sinh viên ≥ 8 giờ trong worklog.

Ràng buộc theo đề tài: service role `LabRole`, instance profile `LabInstanceProfile`, key `vockey`; instance `t3.micro`, tối đa 3 instance; chỉ `us-east-1`; gắn tag `Project`/`Owner`; terminate môi trường khi không dùng.

### Các điểm kỹ thuật trong mã nguồn cần lưu ý khi triển khai

| Điểm | Vị trí | Ảnh hưởng |
| --- | --- | --- |
| Cổng mặc định 8080 | `server/src/config/index.js` | Khớp với proxy nginx của nền tảng Node.js trên Elastic Beanstalk |
| Bắt buộc `JWT_SECRET` khi `NODE_ENV=production` | `server/src/config/index.js` | Phải khai báo trong environment properties, không để giá trị mặc định |
| Kết nối DB qua `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `server/src/config/database.js` | Lấy endpoint RDS điền vào environment properties |
| Endpoint `GET /health` | `server/app.js` | Dùng làm health check path cho ALB và Elastic Beanstalk |
| Express phục vụ `../client/dist` | `server/app.js` | Gói triển khai phải chứa `client/dist` và có `package.json`/`Procfile` ở gốc gói |

## 2. Phân công công việc

Nguyên tắc chia việc: mỗi người giữ một mảng, tiếp nối vai trò của tuần 1.

- **Trần Lê Thái:** ứng dụng và Elastic Beanstalk (tiếp nối phần backend tuần 1).
- **Nông Hoàng Anh:** hạ tầng nền và dữ liệu (tiếp nối phần thiết kế cơ sở dữ liệu tuần 1), viết chính báo cáo.

### 2.1. Trần Lê Thái – Ứng dụng và Elastic Beanstalk

| Mã | Công việc | Giờ dự kiến | Sản phẩm / minh chứng |
| --- | --- | --- | --- |
| T1 | Đóng gói ứng dụng cho Elastic Beanstalk: build client, thêm `package.json`/`Procfile` ở gốc gói, script tạo file zip, viết hướng dẫn triển khai trong README | 2 giờ | Script đóng gói, file zip, commit |
| T2 | Viết `.ebextensions`: instance `t3.micro`, Auto Scaling min 1 / max 3, health check `/health`, rolling deployment (batch 1), `NODE_ENV=production`, tag `Project`/`Owner` | 2 giờ | `.ebextensions/*.config`, commit |
| T3 | Tạo môi trường Elastic Beanstalk load-balanced với `LabRole`, `LabInstanceProfile`, `vockey`, dùng VPC/subnet do A3 tạo | 1,5 giờ | Ảnh console môi trường, Health = Ok |
| T4 | Khai báo environment properties (`DB_*`, `JWT_SECRET`, `COOKIE_SECURE`); không commit giá trị bí mật | 0,5 giờ | Ảnh cấu hình (che mật khẩu) |
| T5 | Kiểm thử chức năng trên URL Elastic Beanstalk: `/health`, đăng nhập 3 vai trò, thêm/xem/sửa/xóa sinh viên | 1,5 giờ | Ảnh và nhật ký kiểm thử |
| T6 | Triển khai phiên bản v2 bằng rolling deployment, sau đó rollback về v1 | 1,5 giờ | Ảnh Events và Application versions |
| T7 | Ghi worklog, rà soát báo cáo tuần 2 | 1 giờ | Worklog, nhận xét rà soát |
| | **Tổng** | **10 giờ** | |

### 2.2. Nông Hoàng Anh – Hạ tầng nền và dữ liệu

| Mã | Công việc | Giờ dự kiến | Sản phẩm / minh chứng |
| --- | --- | --- | --- |
| A1 | Cập nhật `database/schema.sql` và `docs/thiet-ke/Database_Design.md` từ `avatar_key` sang lưu ảnh thẻ dạng BLOB; vẽ lại sơ đồ kiến trúc theo Elastic Beanstalk | 2 giờ | Commit, sơ đồ mới |
| A2 | Kiểm tra quyền thực tế của `LabRole`/`LabInstanceProfile` và giới hạn Learner Lab (region, loại instance, RDS) | 1 giờ | Bảng ghi nhận, ảnh minh chứng |
| A3 | Dựng VPC 2 AZ: subnet public/app/db, route table, security group (ALB → App → RDS), gắn tag | 2 giờ | Ảnh Resource map, ảnh rule security group |
| A4 | Tạo RDS MySQL (`db.t3.micro`, Single-AZ, private, DB subnet group); chạy `schema.sql` và seed dữ liệu | 2 giờ | Ảnh RDS, kết quả chạy schema/seed |
| A5 | Rà soát tag bằng Tag Editor (gồm tài nguyên do Elastic Beanstalk tạo); ghi chi phí từ Billing/Cost Explorer | 1 giờ | Ảnh Tag Editor, ảnh chi phí |
| A6 | Viết báo cáo tuần 2 (phụ trách chính), tổng hợp minh chứng | 2 giờ | `docs/tuan-2/Báo cáo tuần 2.md` |
| | **Tổng** | **10 giờ** | |

### 2.3. Công việc làm chung

- Nối Elastic Beanstalk với RDS và xử lý lỗi tích hợp (security group, biến môi trường, health check).
- Cuối mỗi buổi: terminate môi trường Elastic Beanstalk hoặc giảm về 0 instance, xóa NAT Gateway, dừng hoặc snapshot rồi xóa RDS. Ghi lại vào worklog.
- Giờ làm chung ghi riêng cho từng người trong worklog, cộng vào tổng giờ.

### 2.4. Thứ tự thực hiện

```
A1, A2, T1, T2 (song song, đầu tuần)
        ↓
A3 VPC + security group
        ↓
A4 RDS + schema/seed
        ↓
T3 tạo môi trường EB → T4 biến môi trường
        ↓
T5 kiểm thử chức năng → T6 rolling deployment + rollback
        ↓
A5 Tag Editor + chi phí → A6 báo cáo, T7 rà soát
```

### 2.5. Quyết định cần ghi rõ trong báo cáo

**NAT Gateway:** tính phí theo giờ. Phương án mặc định: instance ứng dụng nằm trong subnet app private, dùng 1 NAT Gateway và **xóa NAT cuối mỗi buổi**. Nếu ngân sách lab không đủ, đặt instance ở subnet public (security group chỉ nhận từ ALB, không mở SSH) và ghi đây là hạn chế so với thiết kế.

**Chuyển sang tuần 3:** template IaC (CloudFormation), cảnh báo CloudWatch/SNS, CloudFront/HTTPS. Tuần 2 chỉ cần cấu hình bằng console + `.ebextensions`.

## 3. Kế hoạch viết báo cáo tuần 2

### 3.1. Vai trò

- **Viết chính:** Nông Hoàng Anh.
- **Rà soát, đối chiếu số liệu và link:** Trần Lê Thái.
- Mỗi người commit phần việc của mình bằng tài khoản GitHub riêng để giảng viên đối chiếu.

### 3.2. Cấu trúc báo cáo (giữ khung tuần 1)

| Mục | Nội dung | Nguồn số liệu |
| --- | --- | --- |
| 1. Tổng kết | Bảng công việc đã làm + dẫn chứng | Worklog, commit |
| 2. Nội dung thực hiện | Lần lượt VPC, RDS, Elastic Beanstalk, `.ebextensions`, rolling deployment/rollback | Ảnh `docs/tuan-2/evidence/` |
| 3. Kiểm thử từng thành phần | Bảng: thành phần – cách kiểm tra – kết quả – minh chứng | Nhật ký T5, T6 |
| 4. Kiến trúc đã triển khai | Sơ đồ mới theo Elastic Beanstalk, chênh lệch so với thiết kế tuần 1 | A1, A3 |
| 5. Tag | Bảng tag thực tế, ảnh Tag Editor | A5 |
| 6. Phân công và thời gian | Bảng giờ từng người như tuần 1 | Worklog |
| 7. Commit đối chiếu | Link commit theo từng nhóm việc và người phụ trách | GitHub |
| 8. Khai báo AI | Bảng hạng mục – công cụ – phần AI hỗ trợ – phần sinh viên làm | Cột "AI" trong worklog |
| 9. Chi phí và dọn dẹp | Chi phí ghi nhận, tài nguyên đã terminate/xóa | A5, worklog |
| 10. Chưa hoàn thành | Hạng mục chưa xong và lý do | — |
| 11. Kế hoạch tuần 3 | Tích hợp, bảo mật, CloudWatch, IaC | — |

### 3.3. Thu thập minh chứng ngay khi làm

- Chụp ngay khi thao tác, không chụp bù sau.
- Mỗi ảnh thấy được **Account ID**, **region `us-east-1`** và **thời gian** (đồng hồ hệ thống).
- Lưu tại `docs/tuan-2/evidence/`, đặt tên `NN-thanh-phan.png` (ví dụ `03-rds-available.png`).
- Kèm output CLI khi có: `aws sts get-caller-identity`, `aws elasticbeanstalk describe-environments`.
- Che mật khẩu DB và `JWT_SECRET` trước khi commit ảnh.

### 3.4. Lịch viết

| Ngày | Việc |
| --- | --- |
| 21/10 – 23/10 | Thực hiện công việc, ghi worklog và minh chứng mỗi ngày |
| 24/10 | Nông Hoàng Anh dựng khung báo cáo, điền bảng và ảnh |
| 25/10 | Trần Lê Thái rà soát, đối chiếu link và số liệu; chốt và nộp |

### 3.5. Checklist trước khi nộp

- [ ] Mọi link dẫn chứng mở được và trỏ đúng commit/tệp.
- [ ] Số giờ trong báo cáo khớp worklog, mỗi người ≥ 8 giờ.
- [ ] Ảnh có Account ID, region, thời gian.
- [ ] Không lộ mật khẩu, secret trong ảnh hoặc commit.
- [ ] Ghi rõ phần có AI hỗ trợ.
- [ ] Ghi rõ tài nguyên đã terminate/xóa sau mỗi buổi.

## 4. Mẫu worklog tuần 2

Tệp: `docs/tuan-2/worklog-tuan-2.md`

| Ngày | Người | Mã việc | Nội dung | Giờ | Dẫn chứng (commit/ảnh) | AI hỗ trợ |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |
| | | | | | | |
| | | | | | | |
