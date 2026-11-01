# BÁO CÁO TUẦN 4 – ĐỒ ÁN CLOUD COMPUTING

## Kiểm thử tổng thể, tối ưu chi phí, dọn dẹp tài nguyên và demo

**TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM**  
**KHOA CÔNG NGHỆ THÔNG TIN**

| Thông tin | Nội dung |
| --- | --- |
| Học kỳ | Học kỳ I – Năm học 2026–2027 |
| Mã lớp | CLCO332779_05UTEXMC |
| Giảng viên hướng dẫn | TS. Huỳnh Xuân Phụng |
| Sinh viên 1 | Trần Lê Thái – 24110331 |
| Sinh viên 2 | Nông Hoàng Anh – 24110154 |
| Thời gian | Tuần 4 |
| Môi trường | AWS Academy Learner Lab, region `us-east-1`; hệ thống trình bày trong báo cáo chạy ở account `4328-6392-4671` (Nông Hoàng Anh) |
| Kho mã nguồn | [student-manager-ops](https://github.com/devonxjz/student-manager-ops) |
| Kế hoạch tuần 4 | [Kế hoạch tuần 4.md](K%E1%BA%BF%20ho%E1%BA%A1ch%20tu%E1%BA%A7n%204.md) |
| Nhật ký công việc | [worklog-tuan-4.md](worklog-tuan-4.md) |

> Mục tiêu tuần 4 theo GVHD: kiểm thử tổng thể, tối ưu chi phí, dọn dẹp tài nguyên, viết báo cáo và demo. Ảnh minh chứng có Account ID, region và thời gian nằm trong thư mục `evidence/`.

<!-- KHUNG BÁO CÁO: các chỗ đánh dấu ⏳ là phần điền sau khi có kết quả thật. Xóa hết dòng ⏳ trước khi nộp. -->

## 1. Tổng kết công việc tuần 4

⏳ Viết sau cùng, khi đã có kết quả.

### 1.1. Danh sách công việc và dẫn chứng

| STT | Mã | Công việc | Người | Trạng thái | Dẫn chứng |
| --- | --- | --- | --- | --- | --- |
| 1 | T1 | Kiểm thử chức năng trên URL thật | Thái | ⏳ | Mục 2.1 |
| 2 | T2 | Sửa lỗi; rate limit API đăng nhập | Thái | ⏳ | Mục 2.2 |
| 3 | A2 | Thử khả năng chịu lỗi, dựng lại từ template | Hoàng Anh | ✔ | Mục 2.3 |
| 3a | A6 | HTTPS qua API Gateway | Hoàng Anh | ✔ | Mục 2.2 |
| 4 | A1 | Tối ưu chi phí | Thái | ⏳ | Mục 3 |
| 5 | A3 | Sơ đồ kiến trúc cuối | Hoàng Anh | ✔ | Mục 4 |
| 6 | T3, T4 | Chuẩn bị và thực hiện demo | Thái | ⏳ | Mục 5 |
| 7 | A5, T5 | Dọn tài nguyên | Cả hai | ⏳ | Mục 6 |
| 8 | A4, T5 | Báo cáo, rà soát | Thái | ⏳ | Báo cáo này |

## 2. Kiểm thử tổng thể

Môi trường kiểm thử: stack `sms-dev-app`, phiên bản ⏳, URL ALB.

### 2.1. Kiểm thử chức năng (T1)

| Mã | Vai trò | Thao tác | Kết quả mong đợi | Kết quả thực tế |
| --- | --- | --- | --- | --- |
| TC01 | Quản trị | Đăng nhập đúng mật khẩu | Vào dashboard quản trị | ⏳ |
| TC02 | Bất kỳ | Đăng nhập sai mật khẩu | Báo lỗi, không vào được | ⏳ |
| TC03 | Quản trị | Thêm, sửa, xóa lớp | Dữ liệu cập nhật | ⏳ |
| TC04 | Quản trị | Thêm giáo viên, môn học | Dữ liệu cập nhật | ⏳ |
| TC05 | Quản trị | Khóa, mở tài khoản, đặt lại mật khẩu | Tài khoản bị khóa không đăng nhập được | ⏳ |
| TC06 | Giáo viên | Thêm, sửa, xóa sinh viên lớp chủ nhiệm | Dữ liệu cập nhật | ⏳ |
| TC07 | Giáo viên | Nhập điểm | Tín chỉ của sinh viên cập nhật | ⏳ |
| TC08 | Giáo viên | Truy cập sinh viên lớp khác | Bị từ chối | ⏳ |
| TC09 | Sinh viên | Xem tín chỉ của mình | Hiển thị đúng | ⏳ |
| TC10 | Sinh viên | Truy cập trang quản trị | Bị từ chối | ⏳ |
| TC11 | Bất kỳ | Đổi mật khẩu, đăng nhập lại | Mật khẩu mới dùng được | ⏳ |
| TC12 | Khách | Gọi API cần đăng nhập khi chưa đăng nhập | Bị từ chối | ⏳ |

Kiểm thử tự động: `npm test` ⏳.

### 2.2. Lỗi phát hiện, rate limit và HTTPS (T2, A6)

| Lỗi | Nguyên nhân | Cách sửa | Commit |
| --- | --- | --- | --- |
| ⏳ | | | |

Hai việc GVHD yêu cầu hoàn thành trong tuần 4 (nhận xét tuần 3):

| Việc | Cách làm | Kiểm chứng | Kết quả |
| --- | --- | --- | --- |
| Rate limit `POST /api/auth/login` | ⏳ ngưỡng, thời gian khóa | Đăng nhập sai liên tục, nhận `429`; người dùng khác không bị ảnh hưởng | ⏳ |
| HTTPS | API Gateway HTTP API trước ALB (`infra/https.yaml`) | Truy cập `https://…execute-api.us-east-1.amazonaws.com`, đăng nhập được với `COOKIE_SECURE=true` | Đạt: `https://k1jlg48fvc.execute-api.us-east-1.amazonaws.com`, vào được trang quản trị |

Lý do chọn API Gateway: CloudFront bị Learner Lab chặn (`no identity-based policy allows the cloudfront:CreateDistribution`). Thử tạm API Gateway cho kết quả: `/health` 200, trang chủ 200, đăng nhập 200 có `set-cookie`. Chứng chỉ tự ký trên ALB cũng khả thi (ACM nhập được) nhưng trình duyệt sẽ cảnh báo, nên không chọn.

Giới hạn: đoạn API Gateway → ALB vẫn là HTTP; ALB vẫn nhận trực tiếp từ Internet. ⏳ Bổ sung giới hạn của rate limit nếu có.

![Terminate EC2, Auto Scaling tự thay thế](evidence/a2-01-mat-ec2.png)
![Tắt, bật NAT và dựng lại stack ứng dụng](evidence/a2-02-nat-dung-lai.png)
![CloudFront bị Learner Lab chặn](evidence/kk-01-cloudfront-denied.png)
![Thử API Gateway: health, trang chủ, đăng nhập](evidence/a6-01-api-gateway-test.png)
![Dựng stack sms-dev-https, /health qua HTTPS, bật CookieSecure](evidence/a6-02-dung-stack-https.png)
![Đăng nhập trang quản trị qua HTTPS](evidence/a6-03-https-trinh-duyet.png)

### 2.3. Khả năng chịu lỗi và dựng lại (A2)

| Kịch bản | Thao tác | Kết quả mong đợi | Kết quả thực tế |
| --- | --- | --- | --- |
| Mất EC2 | Terminate 1 instance | ASG tự tạo instance mới, ứng dụng trả lời lại | Đạt: `i-0778…` được thay bằng `i-0329…`, `/health` trả 200 sau khoảng 61 giây (đo mỗi 20 giây); EC2 mới không có IP public. Hệ thống chỉ có 1 instance nên ứng dụng gián đoạn trong khoảng này |
| Tắt, bật NAT | `EnableNat=false`, rồi `true` | NAT, Elastic IP, route tự xóa và tạo lại | Đạt: tắt 71 giây (không còn NAT), bật 162 giây (có `nat-0deda…`) |
| Dựng lại stack ứng dụng | Xóa `sms-dev-https`, `sms-dev-monitoring`, `sms-dev-app`, deploy lại `app.yaml` với `v3` | Stack dựng lại thành công | Stack thành công: xóa 335 giây, dựng 337 giây. Chưa dựng lại mạng và database, chưa kiểm tra Health sau khi dựng |

### 2.3a. Kiểm tra tag thực tế

Tag Editor bị SCP của AWS Academy chặn, nên nhóm dùng Tagging API, lọc `Project=StudentMgmt` trên account `4328-6392-4671`. Tag có trên: VPC, 6 subnet, 3 route table, Internet Gateway, NAT, Elastic IP, VPC endpoint, security group, EC2, ALB, listener, target group, RDS, parameter group, DB subnet group, snapshot RDS, môi trường Beanstalk, alarm, dashboard, SNS topic, API Gateway. Danh sách không có bucket S3 của Beanstalk, Application và tham số Parameter Store, đúng với phần ngoài stack.

![Số tài nguyên có tag theo từng loại](evidence/tag-01-kiem-tra.png)

### 2.4. Kết quả đã có từ tuần 3

Không kiểm thử lại trong phần này, chi tiết ở [báo cáo tuần 3](../tuan-3/B%C3%A1o%20c%C3%A1o%20tu%E1%BA%A7n%203.md):

| Nội dung | Kết quả |
| --- | --- |
| RDS bắt buộc SSL | `--skip-ssl` bị từ chối, ứng dụng vẫn đăng nhập được |
| Rolling, rollback | `/health` đổi `2.0.0 → 2.1.0 → 2.0.0`, `Green` cả 2 lần |
| Auto Scaling | Ngưỡng 40%: từ 1 lên 3 instance; phản hồi từ 2,7 giây còn ~0,9 giây |
| Alarm, SNS | Có email `ALARM` và `OK` |

## 3. Tối ưu chi phí (A1)

### 3.1. Chi phí theo tài nguyên

Đơn giá tham khảo tại `us-east-1`. ⏳ Đối chiếu lại với trang giá AWS trước khi nộp.

| Tài nguyên | Đơn giá/giờ | Ghi chú |
| --- | --- | --- |
| NAT Gateway | ~$0.045 + phí dữ liệu | Tính cả khi không có tải |
| 3 IPv4 public (NAT, 2 của ALB) | ~$0.015 | |
| Application Load Balancer | ~$0.0225 + LCU | |
| EC2 t3.micro × 1 | ~$0.0104 | Nhiều hơn khi scale |
| RDS db.t3.micro + 20 GiB gp3 | ~$0.020 | |
| **Tổng** | **~$0.11/giờ (~$2.6/ngày)** | Khi chạy 1 instance |

### 3.2. Các phương án đã so sánh

| Quyết định | Phương án chọn | Phương án khác | Chênh lệch ước tính | Đánh đổi |
| --- | --- | --- | --- | --- |
| Số NAT | 1 NAT | 2 NAT (mỗi AZ) | Tiết kiệm ~$0.045/giờ | AZ chứa NAT hỏng thì subnet app ở AZ kia mất đường ra Internet |
| RDS | Single-AZ | Multi-AZ | Tiết kiệm khoảng một nửa phí instance | Không có standby tự chuyển đổi |
| Loại EC2 | t3.micro | t3.small | Tiết kiệm ~$0.01/giờ mỗi instance | Ít tài nguyên hơn, dựa vào scale ngang |
| Khi nghỉ | `EnableNat=false`, xóa stack app, stop RDS | Để chạy liên tục | Tiết kiệm phần lớn ~$2.6/ngày | Mất khoảng 25 phút dựng lại |
| S3 | Gateway endpoint | Đi qua NAT | Không tốn phí xử lý dữ liệu NAT | Không |
| Scale | Min 1, max 3 | Chạy cố định 3 | Giảm EC2 khi tải thấp | Mất vài phút mới thêm instance |

### 3.3. Chi phí thực tế

| Account | Đã dùng | Ghi chú |
| --- | --- | --- |
| `4328-6392-4671` | ⏳ `Used $… of $50` | |
| `2751-7291-1137` | ⏳ `Used $… of $50` | |

⏳ Kết luận: chi phí có nằm trong ngân sách không, khoản nào lớn nhất, ước tính khác thực tế bao nhiêu.

## 4. Kiến trúc cuối cùng (A3)

![Kiến trúc cuối (Claude vẽ theo đặc tả nhóm chốt)](architecture-final.png)

So với sơ đồ tuần 2: thêm API Gateway cho HTTPS, Parameter Store, SNS, alarm, dashboard; route table DB không ra Internet; RDS bắt buộc TLS; hạ tầng dựng bằng 5 stack CloudFormation. Tệp gốc: [`architecture-final.drawio`](architecture-final.drawio). Phần ngoài stack ghi ở mục 2.2 báo cáo tuần 3.

## 5. Demo (T3, T4)

⏳ Ghi hình thức demo (trực tiếp hay video), link nếu có, và nội dung đã trình bày.

| Nội dung | Đã trình bày |
| --- | --- |
| Ứng dụng chạy thật, 3 vai trò | ⏳ |
| Hạ tầng: stack, EC2 không IP public, RDS không public | ⏳ |
| Bảo mật: Parameter Store, SSL bắt buộc | ⏳ |
| Rolling deploy và rollback | ⏳ |
| Auto Scaling, alarm, dashboard | ⏳ |
| Dọn dẹp tài nguyên | ⏳ |

## 6. Dọn dẹp tài nguyên (A5, T5)

Thực hiện sau cùng, sau khi đã demo và chụp đủ minh chứng.

| Tài nguyên | Account `4328-6392-4671` | Account `2751-7291-1137` |
| --- | --- | --- |
| Stack https, monitoring, app, database, network | Đã xóa | ⏳ |
| Snapshot RDS | ⏳ | ⏳ |
| Tham số Parameter Store | Đã xóa | ⏳ |
| Application Beanstalk, các phiên bản | Đã xóa | ⏳ |
| Bucket S3 của Beanstalk | Đã xóa | ⏳ |
| CloudWatch Logs (giữ lại khi terminate) | Đã xóa | ⏳ |
| CloudShell VPC environment | ⏳ | ⏳ |

Phần ngoài stack không bị xóa theo stack nên phải kiểm tra riêng.

![Xóa stack, phần ngoài stack và kiểm tra sau dọn dẹp, account 4328-6392-4671](evidence/a5-01-sau-don-dep.png)

⏳ Chèn ảnh của account `2751-7291-1137`.

## 7. Phân công và thời gian thực hiện

| Mã | Công việc | Trần Lê Thái | Nông Hoàng Anh |
| --- | --- | --- | --- |
| A1 | Tối ưu chi phí | ⏳ | — |
| A2 | Chịu lỗi, dựng lại | — | ⏳ |
| A3 | Sơ đồ kiến trúc cuối | — | ⏳ |
| A4 | Báo cáo | ⏳ | — |
| A5 | Dọn tài nguyên | — | ⏳ |
| A6 | HTTPS | — | ⏳ |
| T1 | Kiểm thử chức năng | ⏳ | — |
| T2 | Sửa lỗi, rate limit | ⏳ | — |
| T3, T4 | Chuẩn bị và thực hiện demo | ⏳ | — |
| T5 | Rà soát, dọn tài nguyên | ⏳ | — |
| | **Tổng** | ⏳ | ⏳ |

Ghi số giờ thực tế theo [worklog](worklog-tuan-4.md).

## 8. Commit và khả năng đối chiếu công việc

| Nhóm công việc | Người thực hiện | Commit |
| --- | --- | --- |
| ⏳ | | |

## 9. Khai báo sử dụng AI

| Hạng mục | Công cụ | Phần AI hỗ trợ | Phần sinh viên thực hiện |
| --- | --- | --- | --- |
| Kế hoạch, khung báo cáo | Claude | Đề xuất việc, dựng khung | Duyệt, điền kết quả thật |
| ⏳ | | | |

## 10. Khó khăn gặp phải và cách xử lý

| Khó khăn | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| Không tạo được CloudFront | Learner Lab không cấp `cloudfront:CreateDistribution` | Dùng API Gateway HTTP API |
| Môi trường `Red`, ALB trả 502 dù stack vẫn `UPDATE_COMPLETE` | Hệ thống để chạy qua lúc hết phiên lab; instance bị thay (`16:41`) và instance mới không chạy ứng dụng. Nguyên nhân gốc là suy luận từ Events và log | Terminate instance để ASG tạo instance mới; đầu buổi kiểm tra `/health`, không chỉ xem trạng thái stack |
| Môi trường `Yellow`: *Access denied while accessing Elastic Load Balancing using role LabRole* | Chưa xác định; ALB vẫn báo target `healthy`, ứng dụng hoạt động | Không ảnh hưởng ứng dụng. Chưa kiểm chứng được sau khi dựng lại, vì môi trường đã dọn |

![Target healthy khi môi trường Yellow](evidence/kk-04-target-healthy.png)
![Môi trường Red, ALB trả 502](evidence/kk-02-moi-truong-red.png)
![Thay instance, ứng dụng chạy lại](evidence/kk-03-thay-instance.png)

## 11. Công việc chưa hoàn thành và hướng phát triển

| Hạng mục | Trạng thái |
| --- | --- |
| ⏳ | |

## 12. Liên kết tổng hợp

- **Kế hoạch tuần 4:** [Kế hoạch tuần 4.md](K%E1%BA%BF%20ho%E1%BA%A1ch%20tu%E1%BA%A7n%204.md)
- **Nhật ký công việc:** [worklog-tuan-4.md](worklog-tuan-4.md)
- **Báo cáo tuần 3:** [Báo cáo tuần 3.md](../tuan-3/B%C3%A1o%20c%C3%A1o%20tu%E1%BA%A7n%203.md)
- **Template và hướng dẫn dựng:** [`infra/README.md`](../../infra/README.md)
