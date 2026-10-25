# BÁO CÁO TUẦN 2 – ĐỒ ÁN CLOUD COMPUTING

## Triển khai ứng dụng Quản lý sinh viên Node.js lên AWS Elastic Beanstalk

**TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM**  
**KHOA CÔNG NGHỆ THÔNG TIN**

| Thông tin | Nội dung |
| --- | --- |
| Học kỳ | Học kỳ I – Năm học 2026–2027 |
| Mã lớp | CLCO332779_05UTEXMC |
| Giảng viên hướng dẫn | TS. Huỳnh Xuân Phụng |
| Sinh viên 1 | Trần Lê Thái – 24110331 |
| Sinh viên 2 | Nông Hoàng Anh – 24110154 |
| Thời gian | Tuần 2: 19/10/2026 – 25/10/2026 |
| Môi trường | AWS Academy Learner Lab, region `us-east-1` |
| Kho mã nguồn | [student-manager-ops](https://github.com/devonxjz/student-manager-ops) |
| Kế hoạch tuần 2 | [Kế hoạch tuần 2.md](K%E1%BA%BF%20ho%E1%BA%A1ch%20tu%E1%BA%A7n%202.md) |
| Nhật ký công việc | [worklog-tuan-2.md](worklog-tuan-2.md) |

## 1. Tổng kết công việc tuần 2

Trong tuần 2, nhóm tập trung vào việc đưa ứng dụng quản lý sinh viên lên môi trường AWS Elastic Beanstalk và kiểm tra khả năng hoạt động thực tế. Quá trình triển khai được chia thành hai lượt. Lượt 2 dùng lại gói ứng dụng và `.ebextensions` của lượt 1. Hai lượt chạy trên hai account vì Learner Lab gắn với tài khoản từng sinh viên và không cho chia sẻ quyền truy cập (không tạo được IAM user). Kiến trúc chính thức của nhóm từ tuần 2 là **lượt 2**.

| Lượt | Người thực hiện | Account Learner Lab | Mạng | Kết quả |
| --- | --- | --- | --- | --- |
| 1 | Trần Lê Thái | `2751-7291-1137` | Default VPC | Beanstalk + RDS chạy được; thử rolling deployment v1 → v2 và rollback về v1 |
| 2 | Nông Hoàng Anh | `4328-6392-4671` | **VPC riêng 3 tầng** | Dựng VPC, RDS MySQL 8.4 trong subnet private, triển khai lại cùng ứng dụng; Health = Ok |

### 1.1. Danh sách công việc và dẫn chứng

| STT | Mã | Công việc | Kết quả | Dẫn chứng |
| --- | --- | --- | --- | --- |
| 1 | A1 | Chuyển ảnh thẻ sang BLOB, vẽ lại sơ đồ theo Elastic Beanstalk | `avatar MEDIUMBLOB`, `avatar_mime VARCHAR(50)`; sơ đồ mới | Commit [`9d7d3c3`](https://github.com/devonxjz/student-manager-ops/commit/9d7d3c3), [`9429b0b`](https://github.com/devonxjz/student-manager-ops/commit/9429b0b); [sơ đồ](architecture-tuan-2.png) |
| 2 | A2 | Kiểm tra quyền LabRole/LabInstanceProfile và giới hạn Learner Lab | 7/7 mục đạt | Mục 2.2 |
| 3 | T1 | Đóng gói ứng dụng cho Elastic Beanstalk | `Procfile`, `package.json` gốc, `scripts/package.sh`; gói zip ~470 KB | Commit [`75a0e7a`](https://github.com/devonxjz/student-manager-ops/commit/75a0e7a) |
| 4 | T2 | Viết `.ebextensions` | 4 tệp: biến môi trường và health check, autoscaling, rolling, log CloudWatch | Commit [`75a0e7a`](https://github.com/devonxjz/student-manager-ops/commit/75a0e7a) |
| 5 | T3–T5 | Môi trường Beanstalk lượt 1, kiểm thử chức năng | Health Ok, đăng nhập và thao tác dữ liệu chạy được | Mục 2.5 |
| 6 | T6 | Rolling deployment v1 → v2, rollback | `/health` trả `version: 2.0.0` sau deploy, quay về v1 sau rollback | Commit [`f6e0588`](https://github.com/devonxjz/student-manager-ops/commit/f6e0588); mục 2.5 |
| 7 | A3 | Dựng VPC riêng và security group | VPC 10.0.0.0/16, 6 subnet 2 AZ, 1 NAT, S3 endpoint, 4 SG | Mục 2.3 |
| 8 | A4 | Tạo RDS, nạp schema, seed | `sms-dev-db` MySQL 8.4.11 trong subnet DB, schema và tài khoản admin | Mục 2.4 |
| 9 | A3–A4 | Triển khai lại Beanstalk vào VPC riêng | `sms-dev-app` Health Ok, EC2 không IP public | Mục 2.6 |
| 10 | A5 | Rà soát tag và chi phí | Tag gắn khi tạo; Tag Editor bị SCP chặn; ước tính chi phí | Mục 5, 9 |
| 11 | A6, T7 | Viết và rà soát báo cáo tuần 2 | Báo cáo này | Lịch sử commit thư mục `docs/tuan-2` |

## 2. Nội dung công việc đã thực hiện

### 2.1. Cập nhật cơ sở dữ liệu và sơ đồ kiến trúc (A1)
- Ban đầu hệ thống quản lý ảnh sinh viên bằng `avatar_key VARCHAR(255)`, thay `avatar_key VARCHAR(255)` (key ảnh trên S3) bằng `avatar MEDIUMBLOB` và `avatar_mime VARCHAR(50)`. Dùng `MEDIUMBLOB` vì 1 ảnh thẻ thường nặng 100kb-2mb, `BLOB` chỉ có 64kb nên không đủ. Do avatar lưu ảnh dưới dạng byte nhị phân, Thêm `avatar_mime` dùng để lưu lại định dạng của file đó giúp nhận diện chính xác luồng dữ liệu trả về (là JPEG, PNG,...)
- Các file cần chỉnh sửa lại trong giai đoạn này bao gồm: `database/schema.sql`, `docs/thiet-ke/Database_Design.md`, `server/src/models/student.model.js`
- `npm test` đạt 120/120. Commit đầu gõ nhầm tên cột `avatar_mine` trong `schema.sql`; test không phát hiện vì test tạo bảng từ model Sequelize, không chạy `schema.sql`. Đã sửa ở commit `9429b0b` và xác nhận bằng `DESCRIBE students` trên RDS thật (mục 2.4).
- Sơ đồ kiến trúc vẽ lại theo Elastic Beanstalk (mục 4).

**Dẫn chứng:** [Commit 9d7d3c3](https://github.com/devonxjz/student-manager-ops/commit/9d7d3c3) · [Commit 9429b0b](https://github.com/devonxjz/student-manager-ops/commit/9429b0b) · ảnh `a4-08-schema.png` ở mục 2.4.

### 2.2. Kiểm tra quyền và giới hạn Learner Lab (A2)

Chạy trên CloudShell, account `4328-6392-4671`, region `us-east-1`.

| Kiểm tra | Lệnh | Kết quả | Đạt |
| --- | --- | --- | --- |
| Danh tính | `sts get-caller-identity` | Role `voclabs` (assumed-role), không phải IAM user | ✔ |
| LabRole | `iam get-role` | `arn:aws:iam::432863924671:role/LabRole` | ✔ |
| Beanstalk được dùng LabRole | Trust policy của LabRole | Có `elasticbeanstalk.amazonaws.com`, `ec2.amazonaws.com`, `autoscaling`, `elasticloadbalancing` | ✔ |
| Instance profile | `iam get-instance-profile` | `LabInstanceProfile` chứa `LabRole` | ✔ |
| Key pair | `ec2 describe-key-pairs` | `vockey` (rsa) | ✔ |
| Giới hạn loại instance | `ec2 run-instances --dry-run` | `t3.micro` được phép; `t3.xlarge` bị chặn (explicit deny, policy `voclabs2`) | ✔ |
| Nền tảng | `elasticbeanstalk list-available-solution-stacks`, `rds describe-orderable-db-instance-options` | Node.js 22, 24 trên Amazon Linux 2023; `db.t3.micro` hỗ trợ MySQL 8.4.5 – 8.4.11 | ✔ |

Kết luận: quyền Learner Lab đủ cho kế hoạch tuần 2, không cần tạo IAM role. Chọn **MySQL 8.4** (thay đổi so với phiên bản 5.7 sử dụng trước đó bị tính phí Extended Support) và **Node.js 24** (phù hợp phiên bản đã chạy test tuần 1).

![Danh tính, LabRole và các policy gắn vào LabRole](evidence/luot-2/a2-01-identity-labrole.png)
![Trust policy của LabRole có elasticbeanstalk.amazonaws.com](evidence/luot-2/a2-02-trust-policy.png)
![LabInstanceProfile, vockey, dry-run t3.micro và t3.xlarge, nền tảng Node.js](evidence/luot-2/a2-03-profile-vockey-dryrun.png)
![db.t3.micro hỗ trợ MySQL 8.4](evidence/luot-2/a2-04-mysql84.png)

### 2.3. Dựng VPC riêng và security group (A3)

Tạo bằng trình "VPC and more", sau đó chỉnh tay.

| Subnet | us-east-1a | us-east-1b | Ra Internet |
| --- | --- | --- | --- |
| Public (`sms-dev-public-a/b`) | 10.0.1.0/24 | 10.0.2.0/24 | Internet Gateway |
| App (`sms-dev-app-a/b`) | 10.0.11.0/24 | 10.0.12.0/24 | NAT Gateway |
| DB (`sms-dev-db-a/b`) | 10.0.21.0/24 | 10.0.22.0/24 | **Không** |

- VPC `sms-dev-vpc` (`vpc-053736ad602a49096`), bật DNS hostnames và DNS resolution.
- **1 NAT Gateway (zonal) ở public-a** để tiết kiệm chi phí. Đánh đổi: nếu AZ 1a hỏng thì subnet app ở 1b mất đường ra Internet.
- **S3 Gateway endpoint** (miễn phí) gắn vào route table private, để EC2 tải gói ứng dụng từ S3 không qua NAT.
- **Gỡ route `0.0.0.0/0 → NAT` khỏi 2 route table DB**: RDS không cần ra Internet.

Kiểm tra bằng `aws ec2 describe-route-tables`:

| Route table | Routes |
| --- | --- |
| private1 (app-a), private2 (app-b) | local, `nat-05d2b6f5632cf81fe`, `vpce-02727666ff55a0374` |
| private3 (db-a), private4 (db-b) | local, `vpce-02727666ff55a0374` |
| public | local, `igw-0d305dca52d0e2aa8` |

Security group (đều thuộc `sms-dev-vpc`, không có rule SSH):

| SG | Inbound |
| --- | --- |
| `sms-dev-alb-sg` | HTTP 80 từ `0.0.0.0/0` |
| `sms-dev-app-sg` | HTTP 80 từ `sms-dev-alb-sg` |
| `sms-dev-admin-sg` | Không có (dùng cho CloudShell quản trị) |
| `sms-dev-db-sg` | MySQL 3306 từ `sms-dev-app-sg` và `sms-dev-admin-sg` |

![Preview của trình tạo VPC: 6 subnet, 5 route table](evidence/luot-2/a3-01-vpc-preview.png)
![Kết nối mạng: Internet Gateway và S3 endpoint](evidence/luot-2/a3-02-network-connections.png)
![6 subnet sau khi đổi tên, đúng CIDR](evidence/luot-2/a3-03-subnets.png)
![Route table của db-b chỉ còn local và S3 endpoint](evidence/luot-2/a3-04-route-db-b.png)
![Resource map của sms-dev-vpc: IGW, NAT, S3 endpoint](evidence/luot-2/a3-05-resource-map.png)
![Danh sách security group trong sms-dev-vpc](evidence/luot-2/a3-06-security-groups.png)

### 2.4. Tạo RDS, nạp schema và seed (A4)

| Thuộc tính | Giá trị |
| --- | --- |
| Định danh | `sms-dev-db` |
| Engine | MySQL Community **8.4.11** |
| Instance | `db.t3.micro` (Burstable), Single-AZ, us-east-1a |
| Lưu trữ | gp3 20 GiB, tắt storage autoscaling |
| Mạng | `sms-dev-vpc`, DB subnet group `sms-dev-dbsubnet` (db-a, db-b), **Public access: No**, SG `sms-dev-db-sg` |
| Khác | Mã hóa KMS `aws/rds`, backup 1 ngày, Database Insights Standard, tắt Enhanced Monitoring (cần tạo IAM role, Learner Lab chặn) |

RDS nằm trong subnet private nên CloudShell thông thường (chạy ngoài VPC) không kết nối được. Nhóm tạo **CloudShell VPC environment** `sms-dev-admin` trong `sms-dev-app-a`, mang SG `sms-dev-admin-sg`, rồi:

1. Kết nối bằng TLS: `SELECT VERSION()` → `8.4.11`; `Ssl_cipher` → `TLS_AES_256_GCM_SHA384`; `require_secure_transport` → `OFF`.
2. Nạp `database/schema.sql`, kiểm tra `SHOW TABLES` và `DESCRIBE students` (có `avatar mediumblob`, `avatar_mime varchar(50)`).
3. `npm run db:seed` → `Đã tạo admin "admin"`. Mật khẩu nhập bằng `read -s`, không hiện trên màn hình.

`git clone` và `dnf install` chạy được từ subnet app, xác nhận NAT hoạt động đúng.

![DB subnet group sms-dev-dbsubnet trong sms-dev-vpc](evidence/luot-2/a4-01-db-subnet-group.png)
![Cấu hình RDS: db.t3.micro, gp3 20 GiB, sms-dev-vpc](evidence/luot-2/a4-02-rds-instance-storage-network.png)
![Cấu hình RDS: chỉ sms-dev-db-sg, us-east-1a, tắt Enhanced Monitoring](evidence/luot-2/a4-03-rds-sg-monitoring.png)
![Cấu hình RDS: mã hóa, backup 1 ngày, tắt deletion protection](evidence/luot-2/a4-04-rds-backup-encryption.png)
![RDS sms-dev-db ở trạng thái Available](evidence/luot-2/a4-05-rds-available.png)
![Tạo CloudShell VPC environment trong subnet app-a](evidence/luot-2/a4-06-cloudshell-vpc.png)
![Kết nối RDS bằng TLS: 8.4.11, require_secure_transport OFF, Ssl_cipher](evidence/luot-2/a4-07-tls.png)
![SHOW TABLES và DESCRIBE students trên RDS](evidence/luot-2/a4-08-schema.png)
![Seed tài khoản admin](evidence/luot-2/a4-09-seed.png)

### 2.5. Lượt 1: Elastic Beanstalk trên default VPC (T1–T6)

- **Đóng gói (T1):** `scripts/package.sh` build React rồi nén `Procfile`, `package.json`, `.ebextensions/`, `server/`, `client/dist` thành `dist/student-manager-<version>.zip`, loại `node_modules`, `.env`, test.
- **`.ebextensions` (T2):**

| Tệp | Nội dung |
| --- | --- |
| `01-env.config` | `NODE_ENV=production`, `PORT=8080`, proxy nginx, health check `/health` |
| `02-autoscaling.config` | `t3.micro`, key `vockey`, min 1 / max 3, load balanced, tag Project/Owner cho ASG |
| `03-deployment.config` | Rolling, batch cố định 1; rolling update theo Health, tối thiểu 1 instance phục vụ |
| `04-logs.config` | Stream log lên CloudWatch, giữ 7 ngày, bật health streaming |

- **Môi trường (T3–T5):** `Student-manager-env`, Node.js 22, load balanced, LabRole/LabInstanceProfile/vockey; Health Ok lúc 21:54 ngày 24/10; đăng nhập admin và thêm lớp học thành công.
- **Rolling và rollback (T6):** deploy `v2` (`/health` trả thêm `version: 2.0.0`) lúc 22:17, rollback về `v1` lúc 22:22, môi trường về Ok lúc 22:23.

![Lượt 1: môi trường chạy v1, Health Ok](evidence/luot-1/deploy_v1.png)
![Lượt 1: ứng dụng chạy trên Elastic Beanstalk](evidence/luot-1/dashboard.png)
![Lượt 1: đăng nhập admin, thêm lớp học](evidence/luot-1/demo.png)
![Lượt 1: hai phiên bản ứng dụng v1 và v2](evidence/luot-1/event_v12.png)
![Lượt 1: deploy v2 thành công](evidence/luot-1/deploy_v2.png)
![Lượt 1: /health trả version 2.0.0](evidence/luot-1/minhchung_v2_health.png)
![Lượt 1: rollback về v1](evidence/luot-1/rollback_v2_to_v1.png)

### 2.6. Lượt 2: Elastic Beanstalk trong VPC riêng

| Thuộc tính | Giá trị |
| --- | --- |
| Application / Environment | `student-manager` / `sms-dev-app` (`e-vvkngp3qz2`) |
| Nền tảng | Node.js 24 trên 64bit Amazon Linux 2023 / 6.11.12 |
| Phiên bản | `v1` (build từ commit `f6e0588`, tải lên bằng CLI) |
| Quyền | Service role `LabRole`, instance profile `LabInstanceProfile`, key `vockey` |
| Scaling | Load balanced, min 1 / max 3, chỉ `t3.micro`, tắt IMDSv1 |
| Mạng | EC2 ở app-a/app-b, không IP public, SG `sms-dev-app-sg`; ALB Public ở public-a/public-b |
| Triển khai | Rolling, batch 30% (làm tròn thành 1 instance khi có 1–3 instance); rolling update cấu hình theo Health; tắt managed updates |
| Log | CloudWatch Logs, giữ 7 ngày, giữ log khi terminate |

Biến môi trường (giá trị bí mật không đưa vào báo cáo):

| Biến | Giá trị |
| --- | --- |
| `DB_HOST` | Endpoint của `sms-dev-db` |
| `DB_PORT` / `DB_NAME` / `DB_USER` | `3306` / `student_manager` / `admin` |
| `DB_PASSWORD` | *(ẩn)* |
| `JWT_SECRET` | *(ẩn; chuỗi ngẫu nhiên 64 ký tự hex tạo bằng `openssl rand -hex 32`)* |
| `COOKIE_SECURE` | `false` (tuần 2 chạy HTTP) |
| `NODE_ENV`, `PORT` | Lấy từ `.ebextensions` |

Kết quả ngày 25/10/2026:

- Events: `Successfully launched environment: sms-dev-app` lúc 11:28:33; `Pending to Ok` lúc 11:28:53 (khởi tạo mất 3 phút).
- `describe-instances`: `i-0ef9b65f219d8c495`, `t3.micro`, subnet app-a, IP `10.0.11.41`, **Public IP: None**.
- `describe-load-balancers`: ALB `internet-facing` ở `subnet-041e2402274118fd9`, `subnet-0b1bf1a48a93e8ad7` (public-a, public-b).
- Ứng dụng tại `sms-dev-app.us-east-1.elasticbeanstalk.com`: `/health` trả `status: ok`, đăng nhập admin được.

Events có cảnh báo *"used the default Node.js version for your platform version instead of the Node.js version included in your package.json"* vì `package.json` khai báo khoảng `"node": ">=20"`. Không ảnh hưởng hoạt động.

![Review cấu hình môi trường trước khi tạo](evidence/luot-2/eb-01-review.png)
![Service role LabRole, instance profile LabInstanceProfile, key vockey](evidence/luot-2/eb-02-service-access.png)
![Tag của môi trường](evidence/luot-2/eb-03-tags.png)
![Events tạo môi trường](evidence/luot-2/eb-04-events.png)
![Môi trường sms-dev-app Health Ok, chạy v1](evidence/luot-2/eb-05-health-ok.png)
![EC2 ở subnet app-a, không có IP public](evidence/luot-2/eb-06-ec2-private.png)
![ALB internet-facing ở 2 subnet public](evidence/luot-2/eb-07-alb.png)

## 3. Kiểm thử từng thành phần

| Thành phần | Cách kiểm tra | Kết quả |
| --- | --- | --- |
| Mã nguồn sau đổi schema | `npm test` | 120/120 đạt |
| VPC, route table | `describe-subnets`, `describe-route-tables` | 6 subnet đúng CIDR/AZ; app qua NAT, DB không ra Internet |
| NAT Gateway | `git clone`, `dnf install` từ subnet app | Chạy được |
| RDS + security group | Kết nối MySQL từ `sms-dev-admin` | Kết nối được, TLS 1.3 |
| Schema | `SHOW TABLES`, `DESCRIBE students` | Đủ bảng, cột BLOB đúng |
| Beanstalk | Events, Health | Health Ok |
| Cô lập mạng EC2 | `describe-instances` | Không có IP public |
| ALB | `describe-load-balancers` | internet-facing, 2 subnet public |
| Ứng dụng | `/health`, đăng nhập | Chạy được |
| Rolling deploy + rollback | Lượt 1: deploy v2 rồi rollback v1 | `/health` đổi theo phiên bản |

Trong tuần 2, rolling deploy/rollback và Auto Scaling khi tải cao chưa được kiểm thử trên môi trường VPC mới.

## 4. Kiến trúc đã triển khai

![Kiến trúc tuần 2 (Claude vẽ theo đặc tả nhóm chốt)](architecture-tuan-2.png)

Luồng xử lý yêu cầu:

Khi người dùng truy cập ứng dụng, yêu cầu HTTP đi qua Internet Gateway đến Application Load Balancer (ALB) được đặt trong public subnet. ALB tiếp nhận yêu cầu tại cổng 80 và chuyển tiếp đến EC2 nằm trong private subnet tầng ứng dụng. Nginx trên EC2 sẽ nhận yêu cầu tại cổng 80 và chuyển đến ứng dụng Node.js Express chạy ở cổng 8080. Khi cần truy xuất hoặc cập nhật dữ liệu sinh viên, ứng dụng kết nối đến RDS MySQL thông qua cổng 3306. RDS được đặt trong private subnet tầng cơ sở dữ liệu, không cho phép truy cập trực tiếp từ Internet. Các kết nối giữa các tầng được kiểm soát bằng Security Group.

Luồng triển khai ứng dụng:

Nhóm đóng gói ứng dụng thành tệp ZIP và tải lên AWS Elastic Beanstalk để triển khai. Elastic Beanstalk lưu phiên bản ứng dụng vào Amazon S3, sau đó sử dụng gói này để triển khai lên các EC2 thuộc Auto Scaling Group. Nhóm cấu hình rolling deployment để cập nhật ứng dụng theo từng đợt, hạn chế gián đoạn dịch vụ trong quá trình triển khai. Khi cần quay về phiên bản trước, nhóm thực hiện rollback bằng cách triển khai lại phiên bản cũ đã được lưu trên S3. Các thông tin về trạng thái môi trường và log ứng dụng được Elastic Beanstalk gửi đến Amazon CloudWatch để theo dõi.
- Tệp gốc để chỉnh sửa: [`architecture-tuan-2.drawio`](architecture-tuan-2.drawio).

### 4.1. Chênh lệch so với thiết kế

| Thiết kế | Thực tế | Xử lý |
| --- | --- | --- |
| ALB dùng `sms-dev-alb-sg` | Giao diện mới không cho chọn SG cho ALB; Beanstalk tự tạo `AWSEBLoadBalancerSecurityGroup` cho ALB và `AWSEBSecurityGroup` cho EC2 với rule tương đương. `sms-dev-alb-sg` chưa được gắn | Tuần 3: đặt `aws:elbv2:loadbalancer` → `SecurityGroups`, `ManagedSecurityGroup` trong `.ebextensions` |
| Không mở SSH | Beanstalk có thể tự thêm SSH 22 vào `AWSEBSecurityGroup` khi khai báo key pair; chưa xác nhận | Tuần 3: kiểm tra, đóng bằng `SSHSourceRestriction`. EC2 không có IP public nên hiện không truy cập được từ Internet |
| Bí mật trong Parameter Store | Environment properties dạng Plain text | Tuần 3 |
| Lượt 1 dùng default VPC | Lượt 2 chuyển sang VPC riêng | Đã xử lý |

## 5. Quy ước và rà soát tag (A5)

| Tag | Giá trị |
| --- | --- |
| Project | `StudentMgmt` |
| Owner | `24110331-24110154` |
| Environment | `dev` |
| ManagedBy | `console` |

- Tag gắn **ngay khi tạo** cho VPC và tài nguyên do trình VPC tạo (subnet, route table, IGW, NAT, Elastic IP, endpoint), RDS, security group, môi trường Beanstalk. Beanstalk lan tag sang EC2, Auto Scaling group và ALB (ảnh `eb-03-tags.png`).
- **Không rà soát tổng hợp được bằng Tag Editor**: Tag Editor nay chạy trên Resource Explorer, và `resource-explorer:ListResourceTypes` bị chặn bởi **Service Control Policy** của AWS Academy (explicit deny ở cấp tổ chức). Nhóm kiểm tra tag theo từng tài nguyên khi tạo.
- Có thể còn thiếu tag ở bucket S3 do Beanstalk tạo, DB subnet group, main route table và tag `Name` của 3 security group. Bổ sung ở tuần 3.
- Lượt 1 dùng `Project: student-manager` trong `.ebextensions/02-autoscaling.config`, chưa khớp quy ước `StudentMgmt`. Sửa ở tuần 3.

![Tag Editor bị chặn bởi Service Control Policy](evidence/luot-2/kk-05-tag-editor-scp.png)

## 6. Phân công và thời gian thực hiện

| Mã | Công việc | Trần Lê Thái | Nông Hoàng Anh |
| --- | --- | --- | --- |
| T1 | Đóng gói ứng dụng | 1,5 giờ | — |
| T2 | `.ebextensions`, hướng dẫn triển khai | 1,5 giờ | — |
| T3–T4 | Môi trường Beanstalk lượt 1, biến môi trường | 1,5 giờ | — |
| T5 | Kiểm thử chức năng lượt 1 | 1,5 giờ | — |
| T6 | Rolling deploy v2 và rollback | 1,5 giờ | — |
| A1 | BLOB, sơ đồ kiến trúc | — | 1,5 giờ |
| A2 | Kiểm tra quyền Learner Lab | — | 1 giờ |
| A3 | VPC và security group | — | 1,5 giờ |
| A4 | RDS, schema, seed | — | 1,5 giờ |
| — | Triển khai lại Beanstalk vào VPC riêng, dọn tài nguyên | — | 1,5 giờ |
| A5 | Rà soát tag, ước tính chi phí | — | 0,5 giờ |
| A6, T7 | Viết / rà soát báo cáo | 1 giờ | 1,5 giờ |
| | **Tổng** | **8,5 giờ** | **9 giờ** |

Chi tiết theo ngày: [worklog-tuan-2.md](worklog-tuan-2.md).

## 7. Commit và khả năng đối chiếu công việc

| Nhóm công việc | Người thực hiện | Commit |
| --- | --- | --- |
| BLOB (A1) | Nông Hoàng Anh | [`9d7d3c3`](https://github.com/devonxjz/student-manager-ops/commit/9d7d3c3), [`9429b0b`](https://github.com/devonxjz/student-manager-ops/commit/9429b0b) |
| Đóng gói, `.ebextensions` (T1, T2) | Trần Lê Thái | [`75a0e7a`](https://github.com/devonxjz/student-manager-ops/commit/75a0e7a) |
| Health version, minh chứng lượt 1 (T6) | Trần Lê Thái | [`f6e0588`](https://github.com/devonxjz/student-manager-ops/commit/f6e0588) |
| Kế hoạch, sơ đồ, báo cáo, minh chứng lượt 2 | Nông Hoàng Anh | [Lịch sử `docs/tuan-2`](https://github.com/devonxjz/student-manager-ops/commits/main/docs/tuan-2) |

Từ tuần 2, mỗi thành viên commit bằng tài khoản GitHub của mình (`devonxjz`, `anhh76612-ops`). Hạ tầng AWS lượt 2 làm trên console nên chưa có mã nguồn; tuần 3 chuyển sang CloudFormation để đối chiếu được.

Thư mục `docs/` được sắp xếp lại theo tuần trong tuần 2: `docs/thiet-ke/` (SPEC, thiết kế CSDL), `docs/tuan-1/`, `docs/tuan-2/`. Link trong báo cáo tuần 1 đã cập nhật theo đường dẫn mới.

## 8. Khai báo sử dụng AI

**Nhóm có sử dụng AI trong tuần 2** (Claude). Mọi tài nguyên AWS do sinh viên tạo và chạy thật trên Learner Lab.

| Hạng mục                     | Công cụ | Phần AI hỗ trợ                                   | Phần sinh viên thực hiện |
|------------------------------| --- |--------------------------------------------------| --- |
| Kế hoạch và phân công        | Claude | Đề xuất chia việc, thứ tự phụ thuộc              | Duyệt, điều chỉnh |
| BLOB (A1)                    | Claude | Giải thích BLOB/MEDIUMBLOB, chỉ ra 3 tệp cần sửa | Tự sửa, chạy test, phát hiện và sửa lỗi gõ tên cột |
| Sơ đồ kiến trúc              | Claude | Vẽ sơ đồ theo đặc tả của nhóm                    | Chốt thành phần, luồng, kiểm tra theo checklist |
| Báo cáo, sắp xếp `docs/`     | Claude | Gợi ý cấu trúc báo cáo và kiểm tra chính tả      | Tự xây dựng cấu trúc, tổng hợp nội dung và hình ảnh minh chứng, trực tiếp viết báo cáo, kiểm tra số liệu, liên kết và hoàn thiện nội dung |

## 9. Công việc chưa hoàn thành

| Hạng mục | Trạng thái cuối tuần 2 |
| --- | --- |
| BLOB, sơ đồ kiến trúc | Đã hoàn thành |
| VPC, RDS, Beanstalk trong VPC riêng | Đã hoàn thành |
| Rolling deploy và rollback trên VPC mới | Chưa làm (đã làm ở lượt 1) |
| ALB dùng SG của nhóm, đóng SSH trong SG do Beanstalk tạo | Chưa làm |
| Rà soát tag tổng hợp | Chưa có (Tag Editor bị chặn) |
| SSL từ ứng dụng tới RDS, `require_secure_transport = ON` | Chưa làm |
| Bí mật trong Parameter Store / Secrets Manager | Chưa làm |
| Template IaC cho hạ tầng | Chưa làm |
| Cảnh báo CloudWatch/SNS, HTTPS | Chưa làm |

## 10. Kế hoạch tuần 3

1. Viết CloudFormation cho VPC, NAT, SG, DB subnet group (dựng lại hạ tầng lượt 2 bằng mã).
2. Gắn `sms-dev-alb-sg` cho ALB qua `.ebextensions`, đóng SSH, thống nhất tag `Project=StudentMgmt`.
3. Bật SSL từ ứng dụng tới RDS, chuyển `require_secure_transport = ON`.
4. Chuyển `DB_PASSWORD`, `JWT_SECRET` sang Parameter Store; đổi mật khẩu master RDS.
5. CloudWatch alarm (CPU, 5xx) + SNS email; xem xét HTTPS (CloudFront).
6. Demo rolling deploy v2 và rollback trên VPC mới; thử tải để Auto Scaling thêm instance.
7. Xử lý `npm audit` (1 lỗi mức high).

## 11. Liên kết tổng hợp

- **Kho mã nguồn:** [student-manager-ops](https://github.com/devonxjz/student-manager-ops)
- **Kế hoạch tuần 2:** [Kế hoạch tuần 2.md](K%E1%BA%BF%20ho%E1%BA%A1ch%20tu%E1%BA%A7n%202.md)
- **Nhật ký công việc:** [worklog-tuan-2.md](worklog-tuan-2.md)
- **Sơ đồ kiến trúc:** [architecture-tuan-2.png](architecture-tuan-2.png) · [architecture-tuan-2.drawio](architecture-tuan-2.drawio)
- **Minh chứng:** [evidence/luot-1](evidence/luot-1/) (Trần Lê Thái) · [evidence/luot-2](evidence/luot-2/) (Nông Hoàng Anh)
- **Thiết kế:** [SPEC.md](../thiet-ke/SPEC.md) · [Database_Design.md](../thiet-ke/Database_Design.md)
- **`.ebextensions`:** [thư mục](https://github.com/devonxjz/student-manager-ops/tree/main/.ebextensions)
