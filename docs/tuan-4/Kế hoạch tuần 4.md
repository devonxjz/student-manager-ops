# KẾ HOẠCH TUẦN 4 – ĐỒ ÁN CLOUD COMPUTING

## Kiểm thử tổng thể, tối ưu chi phí, dọn dẹp, báo cáo và demo

| Thông tin | Nội dung |
| --- | --- |
| Thời gian | Tuần 4 |
| Sinh viên 1 | Trần Lê Thái – 24110331 |
| Sinh viên 2 | Nông Hoàng Anh – 24110154 |
| Mục tiêu tuần theo GVHD | Kiểm thử tổng thể, tối ưu chi phí, dọn dẹp tài nguyên, viết báo cáo và demo |
| Sản phẩm cuối | Mã nguồn và template trên Git; [báo cáo tuần 4](B%C3%A1o%20c%C3%A1o%20tu%E1%BA%A7n%204.md) và sơ đồ kiến trúc; demo. Hình thức demo (trực tiếp hay video) chưa xác nhận |

## 1. Nhận xét của GVHD về tuần 3

Tuần 3 được duyệt. Hai việc GVHD yêu cầu hoàn thành trong tuần 4: **rate limit** (T2) và **HTTPS** (A6). Khi bảo vệ, cả nhóm phải giải thích được bố cục báo cáo và lý do sắp xếp các mục.

## 1a. Phân công lại

Nông Hoàng Anh làm A2, A3, A5, A6. Trần Lê Thái nhận thêm A1 (chi phí), A4 (báo cáo tuần 4), dữ liệu mẫu, và demo trên account `2751-7291-1137`, vì account của Hoàng Anh được dọn sau A2. Mục 2 và 3 bên dưới giữ phân công ban đầu; bảng này được ưu tiên.

## 1b. Đối chiếu yêu cầu đề tài

| Yêu cầu của GVHD | Hiện trạng | Việc tuần 4 |
| --- | --- | --- |
| Ứng dụng web kết nối RDS | ✔ | Kiểm thử đủ 3 vai trò trên hệ thống thật |
| Beanstalk load-balanced, t3.micro, max 3 | ✔ Đã bắn tải, lên 3 instance | Trình bày trong demo |
| `.ebextensions` | ✔ | — |
| Rolling deployment và rollback | ✔ `/health` đổi `2.0.0 → 2.1.0 → 2.0.0` | Trình bày trong demo |
| Theo dõi health, CloudWatch | ✔ Có email `ALARM` và `OK` | Trình bày trong demo |
| Tag Project/Owner | Truyền qua stack; chưa có kết quả kiểm tra thực tế | Chạy lệnh trong `infra/README.md` |
| Terminate khi không dùng | Đang chạy 2 account | Dọn sạch cuối tuần |
| Tối ưu chi phí | Chưa có | A1 |
| Minh chứng có Account ID, region, thời gian | Phần lớn có | Chụp bổ sung toàn màn hình |
| Demo | Chưa có | T3, T4 |

## 2. Phân công

### 2.1. Nông Hoàng Anh – Hạ tầng, chi phí, báo cáo

| Mã | Công việc | Giờ | Sản phẩm |
| --- | --- | --- | --- |
| A1 | Tối ưu chi phí: chi phí từng tài nguyên theo giờ, tổng thực tế 2 account từ trang Learner Lab, so sánh phương án (1 NAT và 2 NAT, Single-AZ và Multi-AZ, t3.micro và lớn hơn, `EnableNat=false` khi nghỉ) | 2 | Bảng chi phí, kết luận |
| A2 | Thử khả năng chịu lỗi: terminate 1 EC2 và xem ASG tự thay; tắt/bật `EnableNat`; dựng lại toàn bộ từ template ở một account, đo thời gian | 2 | Ảnh, số liệu |
| A3 | Sơ đồ kiến trúc cuối cùng (cập nhật route table, Parameter Store, SNS, 4 stack) | 1 | `architecture-final.png` |
| A4 | Báo cáo tuần 4 (phụ trách chính) | 3 | Báo cáo tuần 4 |
| A5 | Dọn tài nguyên account của mình, chụp kết quả | 0,5 | Ảnh `verify-aws.sh` sau dọn |
| A6 | HTTPS: stack API Gateway trước ALB (domain `*.execute-api.amazonaws.com`, không cần mua domain; Learner Lab chặn CloudFront), chuyển `COOKIE_SECURE=true`, kiểm tra đăng nhập | 1,5 | `infra/https.yaml`, ảnh trình duyệt HTTPS |
| | **Tổng** | **10 giờ** | |

### 2.2. Trần Lê Thái – Ứng dụng, kiểm thử, demo

| Mã | Công việc | Giờ | Sản phẩm |
| --- | --- | --- | --- |
| T1 | Kiểm thử chức năng trên URL thật: đăng nhập 3 vai trò, thêm/sửa/xóa, nhập điểm, phân quyền chéo (sinh viên không vào được trang admin), đổi mật khẩu | 2 | Bảng test case, kết quả |
| T2 | Sửa lỗi phát hiện ở T1. Thêm rate limit cho `/api/auth/login`, có test; kiểm tra `trust proxy` đúng số proxy (API Gateway, ALB, nginx) để không gộp mọi người dùng thành một IP | 1,5 | Commit, test |
| T3 | Chuẩn bị demo: phiên bản khác `version` cho phần rolling, tập theo kịch bản | 1 | Kịch bản, phiên bản demo |
| T4 | Thực hiện demo (nếu nộp video thì quay và dựng) | 2,5 | Demo |
| T5 | Rà soát báo cáo; dọn tài nguyên account của mình | 1 | Nhận xét, ảnh `verify-aws.sh` sau dọn |
| | **Tổng** | **8 giờ** | |

## 3. Thứ tự thực hiện

| Giai đoạn | Nông Hoàng Anh | Trần Lê Thái | Mốc kết thúc |
| --- | --- | --- | --- |
| **1. Hoàn tất tuần 3** | Kiểm tra tag thực tế | Xác nhận giờ T6a | Hết ⏳ trong báo cáo tuần 3 |
| **2. Hoàn thiện và kiểm thử** | A6 HTTPS, A2 chịu lỗi | T2 rate limit, rồi T1 trên bản mới | Có HTTPS, rate limit, bảng test |
| **3. Demo** | A3 sơ đồ; hỗ trợ demo | T3, T4 | Demo xong |
| **4. Dọn dẹp** | A5 | T5 | Hai account sạch tài nguyên |
| **5. Chi phí và báo cáo** | A1, A4 | T5 rà soát | Báo cáo tuần 4 xong |

**Lưu ý về bắn tải:** `scripts/load-test.sh` gọi API đăng nhập từ một IP. Sau khi có rate limit, request sẽ bị trả 429 trước khi chạy bcrypt, nên kết quả không so sánh được với tuần 3. Nếu cần bắn tải lại khi demo, dùng phiên bản chưa bật rate limit và nói rõ; hoặc trình bày lại kết quả tuần 3.

**Chỉ dọn khi đã demo và chụp đủ ảnh, vì dựng lại tốn khoảng 30 phút và thêm chi phí.** Khi không làm việc, dùng phần **Tạm nghỉ** trong `infra/README.md`.

Demo chạy trên account của Thái; account đó cần bản code mới, `sms-dev-https` và `CookieSecure=true` (bước 11 `infra/README.md`).

## 4. Kịch bản demo

Thời lượng dưới đây là đề xuất; điều chỉnh theo yêu cầu của GVHD.

| Thời lượng | Nội dung | Thể hiện |
| --- | --- | --- |
| 0:00–0:45 | Giới thiệu đề tài, thành viên, mục tiêu | Slide |
| 0:45–2:00 | Kiến trúc: 3 tầng, 4 stack CloudFormation | Sơ đồ |
| 2:00–3:30 | Ứng dụng chạy thật: đăng nhập 3 vai trò, thao tác dữ liệu | Trình duyệt, URL ALB |
| 3:30–4:30 | Hạ tầng: stack, export, VPC, EC2 không IP public, RDS không public | Console, `scripts/verify-aws.sh` |
| 4:30–5:30 | Bảo mật: Parameter Store, SSL bắt buộc (`--skip-ssl` bị từ chối), SG theo chuỗi | CloudShell |
| 5:30–7:00 | Rolling deploy phiên bản mới, `/health` đổi `version`, rollback | Beanstalk Events |
| 7:00–8:30 | Bắn tải: ASG thêm instance, alarm, email, dashboard | CloudWatch (chuẩn bị trước) |
| 8:30–9:30 | Chi phí và dọn dẹp | Bảng chi phí, lệnh xóa stack |
| 9:30–10:00 | Kết luận, phần AI hỗ trợ | Slide |

Lưu ý: không để lộ mật khẩu; phần chờ lâu (dựng stack, scale) chuẩn bị trước.

## 5. Báo cáo

Khung ở [Báo cáo tuần 4.md](B%C3%A1o%20c%C3%A1o%20tu%E1%BA%A7n%204.md), nhật ký ở [worklog-tuan-4.md](worklog-tuan-4.md).
