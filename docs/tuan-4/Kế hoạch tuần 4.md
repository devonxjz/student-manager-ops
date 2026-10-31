# KẾ HOẠCH TUẦN 4 – ĐỒ ÁN CLOUD COMPUTING

## Kiểm thử tổng thể, tối ưu chi phí, dọn dẹp, báo cáo và demo

| Thông tin | Nội dung |
| --- | --- |
| Thời gian | Tuần 4 |
| Sinh viên 1 | Trần Lê Thái – 24110331 |
| Sinh viên 2 | Nông Hoàng Anh – 24110154 |
| Mục tiêu tuần theo GVHD | Kiểm thử tổng thể, tối ưu chi phí, dọn dẹp tài nguyên, viết báo cáo và demo |
| Sản phẩm cuối | Mã nguồn và template trên Git; báo cáo + sơ đồ kiến trúc; video demo ≤ 10 phút; báo cáo chi phí sử dụng |

## 1. Đối chiếu yêu cầu đề tài

| Yêu cầu của GVHD | Hiện trạng | Việc tuần 4 |
| --- | --- | --- |
| Ứng dụng web kết nối RDS | ✔ | Kiểm thử đủ 3 vai trò trên hệ thống thật |
| Beanstalk load-balanced, t3.micro, max 3 | ✔ | Chứng minh scale (bắn tải) |
| `.ebextensions` | ✔ | — |
| Rolling deployment và rollback | ✔ (v3, v4 cùng mã nguồn) | Demo với 2 phiên bản khác `version` |
| Theo dõi health, CloudWatch | ✔ Có stack giám sát | Chứng minh alarm và email hoạt động |
| Tag Project/Owner | ✔ Qua `--tags` | Kiểm tra lần cuối theo từng dịch vụ |
| Terminate khi không dùng | Đang chạy 2 account | Dọn sạch cuối tuần |
| Báo cáo chi phí cuối kỳ | Chưa có | A1 |
| Minh chứng có Account ID, region, thời gian | Phần lớn có | Chụp bổ sung toàn màn hình |
| Video demo ≤ 10 phút | Chưa có | T4 |

## 2. Phân công

### 2.1. Nông Hoàng Anh – Hạ tầng, chi phí, báo cáo

| Mã | Công việc | Giờ | Sản phẩm |
| --- | --- | --- | --- |
| A1 | Tối ưu chi phí: chi phí từng tài nguyên theo giờ, tổng thực tế 2 account từ trang Learner Lab, so sánh phương án (1 NAT và 2 NAT, Single-AZ và Multi-AZ, t3.micro và lớn hơn, `EnableNat=false` khi nghỉ) | 2 | Bảng chi phí, kết luận |
| A2 | Thử khả năng chịu lỗi: terminate 1 EC2 và xem ASG tự thay; tắt/bật `EnableNat`; dựng lại toàn bộ từ template ở một account, đo thời gian | 2 | Ảnh, số liệu |
| A3 | Sơ đồ kiến trúc cuối cùng (cập nhật route table, Parameter Store, SNS, 4 stack) | 1 | `architecture-final.png` |
| A4 | Báo cáo cuối kỳ (phụ trách chính) | 3 | Báo cáo cuối kỳ |
| A5 | Dọn tài nguyên account của mình, chụp kết quả | 0,5 | Ảnh `verify-aws.sh` sau dọn |
| | **Tổng** | **8,5 giờ** | |

### 2.2. Trần Lê Thái – Ứng dụng, kiểm thử, demo

| Mã | Công việc | Giờ | Sản phẩm |
| --- | --- | --- | --- |
| T1 | Kiểm thử chức năng trên URL thật: đăng nhập 3 vai trò, thêm/sửa/xóa, nhập điểm, phân quyền chéo (sinh viên không vào được trang admin), đổi mật khẩu | 2 | Bảng test case, kết quả |
| T2 | Sửa lỗi phát hiện ở T1. Thêm rate limit cho `/api/auth/login` (tồn tại từ tuần 3) | 1,5 | Commit, test |
| T3 | Đổi `version` trong `/health`, đóng gói phiên bản mới, demo rolling và rollback thấy `version` đổi | 1 | Ảnh, phần quay video |
| T4 | Quay và dựng video demo ≤ 10 phút | 2,5 | Video |
| T5 | Rà soát báo cáo; dọn tài nguyên account của mình | 1 | Nhận xét, ảnh `verify-aws.sh` sau dọn |
| | **Tổng** | **8 giờ** | |

## 3. Thứ tự thực hiện

| Giai đoạn | Nông Hoàng Anh | Trần Lê Thái | Mốc kết thúc |
| --- | --- | --- | --- |
| **1. Hoàn tất tuần 3** | Xác nhận xóa VPC cũ | `--skip-ssl`, `scripts/load-test.sh`, Confirm SNS | Hết ⏳ trong báo cáo tuần 3 |
| **2. Kiểm thử** | A2 chịu lỗi | T1, T2 | Hệ thống ổn định, có bảng test |
| **3. Demo** | A3 sơ đồ; hỗ trợ quay | T3, T4 | Video xong |
| **4. Chi phí và báo cáo** | A1, A4 | T5 rà soát | Báo cáo cuối kỳ xong |
| **5. Dọn dẹp** | A5 | T5 | Hai account sạch tài nguyên |

**Dọn dẹp luôn làm sau cùng:** quay xong video và chụp đủ ảnh mới xóa, vì dựng lại tốn khoảng 30 phút và thêm chi phí. Khi không làm việc, dùng phần **Tạm nghỉ** trong `infra/README.md`.

Chỉ cần 1 account chạy để demo (account của Thái). Account của Hoàng Anh nên tạm nghỉ, chỉ dựng lại khi làm A2.

## 4. Kịch bản video demo (≤ 10 phút)

| Thời lượng | Nội dung | Thể hiện |
| --- | --- | --- |
| 0:00–0:45 | Giới thiệu đề tài, thành viên, mục tiêu | Slide |
| 0:45–2:00 | Kiến trúc: 3 tầng, 4 stack CloudFormation | Sơ đồ |
| 2:00–3:30 | Ứng dụng chạy thật: đăng nhập 3 vai trò, thao tác dữ liệu | Trình duyệt, URL ALB |
| 3:30–4:30 | Hạ tầng: stack, export, VPC, EC2 không IP public, RDS không public | Console, `scripts/verify-aws.sh` |
| 4:30–5:30 | Bảo mật: Parameter Store, SSL bắt buộc (`--skip-ssl` bị từ chối), SG theo chuỗi | CloudShell |
| 5:30–7:00 | Rolling deploy phiên bản mới, `/health` đổi `version`, rollback | Beanstalk Events |
| 7:00–8:30 | Bắn tải: ASG thêm instance, alarm, email, dashboard | CloudWatch (quay trước, tua nhanh) |
| 8:30–9:30 | Chi phí và dọn dẹp | Bảng chi phí, lệnh xóa stack |
| 9:30–10:00 | Kết luận, phần AI hỗ trợ | Slide |

Lưu ý khi quay: không để lộ mật khẩu; phần chờ lâu (dựng stack, scale) quay trước rồi tua nhanh.

## 5. Khung báo cáo cuối kỳ

1. Giới thiệu đề tài và yêu cầu
2. Thiết kế: ứng dụng, cơ sở dữ liệu, kiến trúc AWS
3. Triển khai: mạng, RDS, Beanstalk, `.ebextensions`, IaC
4. Bảo mật
5. Giám sát
6. Rolling deployment, rollback, Auto Scaling
7. Kiểm thử tổng thể
8. Chi phí và tối ưu
9. Dọn dẹp tài nguyên
10. Phân công, thời gian (4 tuần)
11. Khai báo sử dụng AI
12. Khó khăn, bài học, hướng phát triển
13. Phụ lục: link Git, video, minh chứng

Nội dung lấy lại từ báo cáo tuần 1–3 trong `docs/tuan-*`.
