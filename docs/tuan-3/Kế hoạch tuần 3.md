# KẾ HOẠCH TUẦN 3 – ĐỒ ÁN CLOUD COMPUTING

## Tích hợp, bảo mật, giám sát và IaC

| Thông tin | Nội dung |
| --- | --- |
| Thời gian | Tuần 3 |
| Sinh viên 1 | Trần Lê Thái – 24110331 (Ứng dụng, Beanstalk, bảo mật ứng dụng) |
| Sinh viên 2 | Nông Hoàng Anh – 24110154 (Hạ tầng IaC, dữ liệu, giám sát) |
| Mục tiêu tuần theo GVHD | Tích hợp, bảo mật, giám sát (CloudWatch), tự động hóa/IaC |
| Account chính | Learner Lab của Nông Hoàng Anh (`4328-6392-4671`), nơi đã có VPC lượt 2 |

## 1. Điểm xuất phát

Cuối tuần 2: ứng dụng chạy được trên Beanstalk trong VPC riêng, nhưng hạ tầng dựng bằng tay trên console. Việc còn tồn (mục 11 báo cáo tuần 2):

| Việc còn tồn | Nhóm |
| --- | --- |
| Template IaC cho hạ tầng | IaC |
| ALB dùng `sms-dev-alb-sg`, đóng SSH trong SG do Beanstalk tạo, thống nhất tag `Project=StudentMgmt` | Bảo mật |
| SSL từ ứng dụng tới RDS, `require_secure_transport = ON` | Bảo mật |
| `DB_PASSWORD`, `JWT_SECRET` chuyển khỏi Plain text | Bảo mật |
| CloudWatch alarm + SNS email, HTTPS | Giám sát |
| Rolling deploy và rollback trên VPC mới, thử Auto Scaling | Kiểm thử |
| `npm audit` (1 lỗi high) | Bảo mật |

## 2. Nguyên tắc tránh phụ thuộc chéo

Trong tuần 2, tài nguyên AWS nằm trong account của ai thì chỉ người đó thao tác được. Tuần 3 xử lý bằng 3 nguyên tắc:

1. **Mọi hạ tầng viết thành CloudFormation trong Git.** Template không gắn với account nào, nên ai cũng tự dựng được trong account của mình để thử. Bản chạy chính thức nằm ở account của Hoàng Anh.
2. **Xác định quy định chung trước khi viết code** (mục 3): tên export, tên tham số, tên biến môi trường. Nhờ vậy mỗi người viết phần của mình song song mà không phải chờ người kia viết xong.
3. **Chia việc theo tầng của stack.** Stack sau chỉ dùng output của stack trước, và mỗi stack có một người phụ trách:

```
network.yaml (Anh)  →  database.yaml (Anh)  →  app.yaml (Thái)  →  monitoring.yaml (Anh)
     M1                      M2                     M3                    M4
```

Ai cần tài nguyên của người kia thì chờ **mốc (M1–M4)**. Mỗi mốc có tiêu chí xong rõ ràng (mục 5).

## 3. Hợp đồng

Bản đầy đủ ở [`infra/README.md`](../../infra/README.md), mục "Quy định". Không đổi tên sau khi đã quyết định.

**Export của `network.yaml`** (stack `sms-dev-network`):

| Export | Giá trị |
| --- | --- |
| `sms-dev-VpcId` | VPC |
| `sms-dev-PublicSubnets` | `subnet-a,subnet-b` (public) |
| `sms-dev-AppSubnets` | `subnet-a,subnet-b` (app) |
| `sms-dev-DbSubnetGroup` | Tên DB subnet group |
| `sms-dev-AlbSg`, `sms-dev-AppSg`, `sms-dev-DbSg`, `sms-dev-AdminSg` | ID security group |

**Export của `database.yaml`** (stack `sms-dev-database`): `sms-dev-DbEndpoint`, `sms-dev-DbPort`, `sms-dev-DbInstanceId`. RDS mới tên `sms-dev-mysql` (không trùng `sms-dev-db` dựng tay tuần 2).

**Parameter Store** (SecureString, tạo bằng CLI trước khi deploy `database.yaml`, vì CloudFormation không tạo được SecureString):

| Tên | Nội dung |
| --- | --- |
| `/sms/dev/db-password` | Mật khẩu master RDS (mới, đổi khỏi mật khẩu đã lộ tuần 2) |
| `/sms/dev/jwt-secret` | `openssl rand -hex 32` |

**Biến môi trường mới của ứng dụng:** `DB_SSL=true` (bật SSL tới RDS); `DB_PASSWORD_PARAM=/sms/dev/db-password` và `JWT_SECRET_PARAM=/sms/dev/jwt-secret` (ứng dụng tự đọc Parameter Store, vì Beanstalk không hỗ trợ namespace `environmentsecrets`, xem [A1](A1-kiem-tra-quyen.md)).

**Yêu cầu với `app.yaml`:** tên môi trường Beanstalk bắt buộc là `sms-dev-app` (stack giám sát tìm ASG và ALB theo tên này); scaling trigger theo CPU (`aws:autoscaling:trigger`, `MeasureName: CPUUtilization`) để buổi bắn tải thấy Auto Scaling.

**Tag chung mọi stack:** `Project=StudentMgmt`, `Owner=24110331-24110154`, `Environment=dev`, `ManagedBy=cloudformation`.

## 4. Phân công

### 4.1. Nông Hoàng Anh – Hạ tầng IaC, dữ liệu, giám sát

| Mã | Công việc | Cần trước | Giờ | Sản phẩm |
| --- | --- | --- | --- | --- |
| A1 | Kiểm tra quyền: tạo/xóa thử stack CloudFormation, `ssm put-parameter` SecureString, custom DB parameter group, namespace bí mật của Beanstalk, SNS + CloudWatch alarm | — | 0,5 | [Bảng kết quả](A1-kiem-tra-quyen.md) |
| A2 | `infra/network.yaml`: VPC, 6 subnet, IGW, NAT (tham số `EnableNat` để tắt khi nghỉ), route (DB không ra Internet), S3 endpoint, 4 SG, DB subnet group, export theo hợp đồng | Hợp đồng | 2,5 | **M1** |
| A3 | Tạo 2 tham số Parameter Store; `infra/database.yaml`: RDS 8.4 `db.t3.micro`, mật khẩu lấy bằng `{{resolve:ssm-secure:/sms/dev/db-password}}`, custom parameter group, tham số `RequireSsl` (1 khi ứng dụng đã bật SSL, 0 nếu chưa) | M1 (để dựng) | 2 | **M2** |
| A4 | Dựng stack chính thức trong account của mình (network → database), nạp schema + seed qua CloudShell VPC; xóa VPC/RDS dựng tay của tuần 2 | M2 | 1 | Stack chạy, VPC cũ đã xóa |
| A5 | `infra/monitoring.yaml`: SNS topic + email, 5 alarm (CPU EC2, 5xx ứng dụng, 5xx ALB, CPU RDS, dung lượng RDS), dashboard `sms-dev`. Tên ASG/ALB truyền qua tham số, tra bằng lệnh CLI theo tên môi trường | Viết: không. Dựng: M3 | 1,5 | **M4** |
| A6 | Viết báo cáo tuần 3 (phụ trách chính), dọn tài nguyên | — | 1,5 | Báo cáo, worklog |
| | **Tổng** | | **9 giờ** | |

### 4.2. Trần Lê Thái – Ứng dụng, Beanstalk, bảo mật ứng dụng

| Mã | Công việc | Cần trước | Giờ | Sản phẩm |
| --- | --- | --- | --- | --- |
| T1 | SSL tới RDS: khi `DB_SSL=true`, thêm `dialectOptions.ssl` vào `server/src/config/database.js` (mysql2 có sẵn chứng chỉ RDS). Đọc bí mật: khi có `DB_PASSWORD_PARAM`/`JWT_SECRET_PARAM`, `server.js` lấy giá trị từ Parameter Store bằng `@aws-sdk/client-ssm` **trước khi** nạp cấu hình; không đọc được thì log lỗi và dùng `DB_PASSWORD`/`JWT_SECRET`. Viết test, `npm test` đạt | — | 1,5 | Commit code + test |
| T2 | `npm audit`: xác định gói lỗi high, nâng phiên bản an toàn, chạy lại test | — | 0,5 | Commit |
| T3 | `.ebextensions`: đóng SSH (`SSHSourceRestriction`), sửa tag `Project=StudentMgmt` | — | 0,5 | Commit |
| T4 | `infra/app.yaml`: Elastic Beanstalk environment bằng CloudFormation. Đọc export của M1, M2 qua `Fn::ImportValue`; ALB dùng `sms-dev-AlbSg`; LabRole/LabInstanceProfile; biến môi trường chỉ chứa tên tham số (`DB_PASSWORD_PARAM`, `JWT_SECRET_PARAM`), không chứa giá trị bí mật | Hợp đồng (viết), M1 + M2 (chạy thử) | 2,5 | **M3** |
| T5 | Thử toàn bộ stack trong **account của mình** (network → database → app) để kiểm tra template chạy được ở account bất kỳ; **xác nhận log ứng dụng ghi đọc được bí mật từ Parameter Store** (A1 chưa kiểm chứng được quyền SSM của LabRole); xóa stack ngay sau khi thử | M2, T4 | 1 | Ảnh stack CREATE_COMPLETE, Health Ok, log |
| T6 | Trên môi trường chính thức: rolling deploy v2 → rollback v1; bắn tải bằng `hey`/`ab` vào URL ALB để Auto Scaling thêm instance và alarm gửi email | M3, M4 | 1,5 | Ảnh Events, ASG, email cảnh báo |
| T7 | Rà soát báo cáo, đối chiếu số liệu | — | 0,5 | Nhận xét |
| | **Tổng** | | **8 giờ** | |

**Phần làm chung (buổi tích hợp, ~1 giờ mỗi người):** deploy `app.yaml` và `monitoring.yaml` trong account chính. Hoàng Anh thao tác, Thái hướng dẫn qua chia sẻ màn hình. Mỗi người ghi giờ của mình vào worklog.

## 5. Thứ tự thực hiện và mốc

| Giai đoạn | Nông Hoàng Anh | Trần Lê Thái | Mốc kết thúc giai đoạn |
| --- | --- | --- | --- |
| **1. Chuẩn bị** | A1 kiểm tra quyền. Chốt hợp đồng với Thái | Chốt hợp đồng | Hợp đồng trong `infra/README.md` |
| **2. Viết song song** | A2 `network.yaml`, dựng thử. Viết `database.yaml`, `monitoring.yaml` | T1 (SSL + đọc Parameter Store), T2, T3. Viết T4 theo `infra/README.md` | **M1**: `sms-dev-network` CREATE_COMPLETE, 8 export đúng tên |
| **3. Dữ liệu và thử ứng dụng** | A3: tạo 2 tham số SSM, dựng `sms-dev-database` (`RequireSsl` theo tiến độ T1). A4: nạp schema/seed, xóa VPC/RDS dựng tay tuần 2 | Hoàn thành T4. T5: dựng 3 stack trong account của mình đến khi Health Ok và log đọc được bí mật, xóa stack | **M2**: `sms-dev-database` CREATE_COMPLETE, kết nối được bằng TLS. `app.yaml` chạy được ở account bất kỳ |
| **4. Tích hợp** | **Buổi tích hợp**: deploy `app.yaml` rồi `monitoring.yaml` ở account chính, xác nhận email SNS | **Buổi tích hợp** | **M3**: `sms-dev-app` Health Ok. **M4**: alarm + SNS đã xác nhận email |
| **5. Kiểm thử và báo cáo** | Theo dõi alarm, chụp email cảnh báo. A6 báo cáo; xóa stack hoặc tắt NAT (`EnableNat=false`) | T6: rolling v2 → rollback, bắn tải. T7 rà soát | Có email cảnh báo, ASG lên 2–3 instance; báo cáo nộp; tài nguyên đã dọn |

Giai đoạn sau chỉ bắt đầu khi mốc của giai đoạn trước đạt.

**Ai chờ ai:**

| Việc | Cần | Của ai |
| --- | --- | --- |
| T1, T2, T3, viết T4 | Hợp đồng | Cả hai |
| A3 (dựng database) | M1 | Anh |
| Chọn `RequireSsl` khi dựng database | T1 (ứng dụng bật SSL) | Thái |
| T5 (chạy thử `app.yaml`) | `network.yaml` + `database.yaml` trên Git | Anh |
| Buổi tích hợp | Stack chính thức (A4) + `app.yaml` đã chạy ở T5 | Cả hai |
| Dựng `monitoring.yaml` | Môi trường `sms-dev-app` đang chạy (tra tên ASG/ALB) | Thái |
| T6 (bắn tải, nhận email) | M4 | Anh |

Thái **không cần đăng nhập** account của Anh: bắn tải chỉ cần URL của ALB; thử template thì dùng account của mình.

## 6. Kế hoạch dự phòng

| Rủi ro | Phát hiện ở | Phương án |
| --- | --- | --- |
| ~~Learner Lab chặn `ssm put-parameter`~~ | A1 | Không xảy ra: `put-parameter` chạy được |
| Beanstalk không có namespace `environmentsecrets` | **Đã xảy ra** ở A1 | Ứng dụng tự đọc Parameter Store (T1) |
| LabRole không có `ssm:GetParameter` / `kms:Decrypt` (A1 không đọc được policy) | T5 | Ứng dụng dùng `DB_PASSWORD`/`JWT_SECRET` truyền qua tham số `NoEcho` của CloudFormation; ghi rõ trong báo cáo |
| ~~Không tạo được custom DB parameter group~~ | A1 | Không xảy ra: tạo được |
| T1 (SSL trong ứng dụng) chưa xong khi dựng database | A3 | Dựng với `RequireSsl=0`; khi T1 xong, deploy lại `database.yaml` với `RequireSsl=1` (không phải tạo lại DB) |
| Trùng tên với tài nguyên dựng tay tuần 2 (`sms-dev-db`, `sms-dev-dbsubnet`) | Khi viết template | Đã tránh: RDS mới tên `sms-dev-mysql`, DB subnet group để CloudFormation tự đặt tên |
| M1 trễ | Giai đoạn 2 | Thái tiếp tục T1–T4; giai đoạn 3 bắt đầu khi M1 đạt |
| `app.yaml` lỗi ở account chính | Buổi tích hợp | Hoàng Anh tạo môi trường bằng console từ phiên bản `v1` như tuần 2, ghi lỗi vào báo cáo |
| Chi phí 2 account cùng chạy | Cả tuần | Stack thử trong account của Thái xóa ngay sau T5; NAT tắt khi nghỉ |
| RDS dựng tay tuần 2 tự bật lại sau 7 ngày dừng | A4 | Xóa ở A4 |

## 7. Tiến độ và thay đổi so với kế hoạch ban đầu

### 7.1. Tiến độ

| Mã | Trạng thái | Ghi chú |
| --- | --- | --- |
| A1 | ✔ Xong | 4/6 đạt; Beanstalk không có `environmentsecrets`, không đọc được policy LabRole ([A1](A1-kiem-tra-quyen.md)) |
| A2 | Đã viết `infra/network.yaml`, qua kiểm tra cú pháp; **chưa dựng** | Lần đầu lỗi thụt lề khối `Outputs` (2 lần), đã sửa |
| A3 | Đã viết `infra/database.yaml`; **chưa tạo tham số SSM, chưa dựng** | |
| A5 | Đã viết `infra/monitoring.yaml`; **chưa dựng** (cần môi trường `sms-dev-app`) | |
| — | Đã viết `infra/README.md`: hợp đồng, lệnh dựng, tắt NAT, xóa stack | |
| A4, A6 | Chưa bắt đầu | |
| T1 | ✔ Xong | Bật SSL RDS (`dialectOptions.ssl`), tải bí mật SSM bằng `@aws-sdk/client-ssm`, 126/126 unit test pass |
| T2 | ✔ Xong | `npm audit fix` nâng `body-parser` lên 1.20.9, vá hết 2 lỗ hổng High |
| T3 | ✔ Xong | Đóng SSH (`SSHSourceRestriction`), đổi tag `Project=StudentMgmt` trong `.ebextensions` |
| T4 | ✔ Xong | Đã viết `infra/app.yaml` (CloudFormation cho Beanstalk `sms-dev-app`) |
| T5–T7 | Chờ môi trường AWS | Sẵn sàng thử nghiệm trên account cá nhân và buổi tích hợp |

### 7.2. Thay đổi

| Thay đổi | Lý do |
| --- | --- |
| Bí mật: ứng dụng tự đọc Parameter Store (T1 thêm việc), thay cho namespace `environmentsecrets` | A1 bài 4: namespace không tồn tại |
| Thêm export `sms-dev-DbInstanceId` | Alarm và dashboard RDS cần định danh DB |
| RDS mới tên `sms-dev-mysql`; DB subnet group không đặt tên cố định | Tránh trùng tên với tài nguyên dựng tay tuần 2 còn trong account |
| Thêm tham số `RequireSsl` vào `database.yaml` | Bật bắt buộc SSL chỉ khi ứng dụng đã hỗ trợ (phụ thuộc T1 của Thái) |
| `monitoring.yaml` nhận tên ASG/ALB qua tham số thay vì đọc output của `app.yaml` | CloudFormation không trả tên ASG/ALB của môi trường Beanstalk; nhờ vậy viết được trước, không chờ M3 |
| Yêu cầu `app.yaml`: tên môi trường `sms-dev-app`, scaling trigger theo CPU | Stack giám sát tra tài nguyên theo tên môi trường; bắn tải cần scale theo CPU |
| `database.yaml`, `monitoring.yaml`, `infra/README.md` do Claude viết theo yêu cầu của Hoàng Anh; `network.yaml` do Hoàng Anh viết theo hướng dẫn từng khối | Ghi vào mục Khai báo AI của báo cáo; Hoàng Anh phải giải thích được từng phần khi vấn đáp |
| `app.yaml`: bỏ tài nguyên Application, thêm tham số `VersionLabel` | Application `student-manager` đã có trong account (dựng lại sẽ lỗi trùng); thiếu phiên bản thì Beanstalk chạy ứng dụng mẫu của AWS. Phiên bản tải bằng CLI, đổi `VersionLabel` để rolling deploy và rollback |
| `app.yaml`: ALB thêm `ManagedSecurityGroup`; scaling trigger chu kỳ 5 phút | Để Beanstalk không tạo SG riêng cho ALB; EC2 gửi số liệu CPU 5 phút/lần nên chu kỳ 1 phút không kích hoạt được scale |
| `package.json` gốc thêm `@aws-sdk/client-ssm` | Beanstalk cài gói theo `package.json` gốc; thiếu gói này thì ứng dụng không khởi động được trên AWS |
| `infra/README.md` viết lại thành quy trình 10 bước, `RequireSsl=0` khi dựng, chỉ chuyển `1` sau khi ứng dụng kết nối SSL thành công | Tách lỗi ứng dụng khỏi lỗi SSL; bật bắt buộc SSL không cần khởi động lại RDS |

## 8. Kế hoạch viết báo cáo tuần 3

- **Viết chính:** Nông Hoàng Anh. **Rà soát:** Trần Lê Thái. Mỗi người commit phần của mình bằng tài khoản riêng.
- **Thư mục:** `docs/tuan-3/` (báo cáo, worklog, `evidence/`); template ở `infra/`.
- **Khung:** giữ khung tuần 2. Thêm mục "IaC" (sơ đồ stack, export, cách dựng lại bằng 3 lệnh) và mục "Bảo mật" (trước/sau: SG, SSH, SSL, bí mật).
- **Minh chứng:** chụp ngay khi làm, toàn màn hình (Account ID, region, giờ). Không chụp màn hình có mật khẩu; với cấu hình chứa bí mật thì ghi bảng.
- **Worklog:** liệt kê theo mã việc, mỗi dòng ghi người làm, số giờ, dẫn chứng. Dựng khung báo cáo sau buổi tích hợp; Thái rà soát trước khi nộp.
