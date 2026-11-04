# Worklog Tuần 4

**Đồ án:** Quản lý sinh viên Node.js trên AWS Elastic Beanstalk  
**Thành viên:**  
- Trần Lê Thái – 24110331 (Ứng dụng, kiểm thử, demo; sau phân công lại: thêm chi phí A1)  
- Nông Hoàng Anh – 24110154 (Hạ tầng: chịu lỗi, sơ đồ, dọn tài nguyên, HTTPS; báo cáo A4)  

Số giờ ước lượng lại sau khi làm, theo khối lượng từng việc.

---

## Nhật ký theo việc

| Mã | Người | Nội dung công việc | Giờ | Dẫn chứng | AI hỗ trợ |
| :---: | :---: | :--- | :---: | :--- | :--- |
| A1 | Thái | So sánh phương án chi phí (NAT, RDS, loại EC2, tạm nghỉ, S3 endpoint, scale) | 1h | Báo cáo tuần 4, mục 3 | |
| A2 | Anh | Terminate EC2, tắt/bật NAT, xóa và dựng lại stack ứng dụng, đo thời gian | 2h | `evidence/a2-01`, `a2-02` | Claude soạn lệnh CLI, cách đo |
| A3 | Anh | Chốt nội dung sơ đồ kiến trúc cuối, đối chiếu với hệ thống thật | 1,5h | `architecture-final.png`, `.drawio` | Claude vẽ bằng script theo đặc tả |
| A4 | Anh | Báo cáo tuần 4 | 2h | `Báo cáo tuần 4.md` | Claude hỗ trợ viết, rà soát |
| A5 | Anh | Dọn tài nguyên account `4328-6392-4671`, kiểm tra tag | 1,5h | `evidence/a5-01`, `tag-01` | Claude soạn lệnh xóa, kiểm tra |
| A6 | Anh | Thử CloudFront (bị chặn), thử API Gateway và ACM, dựng `sms-dev-https`, bật `CookieSecure` | 3h | Commit [`f774585`](https://github.com/devonxjz/student-manager-ops/commit/f774585), [`fd16e0b`](https://github.com/devonxjz/student-manager-ops/commit/fd16e0b); `evidence/kk-01`, `a6-01` → `a6-03` | Claude viết `https.yaml`, lệnh thử |
| T1 | Thái | Kiểm thử chức năng trên URL thật | 1,5h | Báo cáo tuần 4, mục 2.1 | |
| T2 | Thái | Rate limit đăng nhập, sửa `trust proxy`, tham số `TrustProxy`, sửa lỗi thiếu thư viện khi deploy | 2,5h | Commit [`42e6971`](https://github.com/devonxjz/student-manager-ops/commit/42e6971), [`acc8832`](https://github.com/devonxjz/student-manager-ops/commit/acc8832), [`2c44215`](https://github.com/devonxjz/student-manager-ops/commit/2c44215) | Claude hỗ trợ viết code và test |
| T3, T4 | Thái | Seed dữ liệu demo, chuẩn bị và quay video demo | 2h | Commit [`2fb2582`](https://github.com/devonxjz/student-manager-ops/commit/2fb2582); `docs/video/video_demo.mp4` | Claude viết `seed-demo.js` |
| T5 | Thái | Rà soát báo cáo; giữ account `2751-7291-1137` cho buổi báo cáo cuối | 1h | | |

---

## Tổng kết số giờ

- **Trần Lê Thái:** **8 giờ** (A1 1h + T1 1,5h + T2 2,5h + T3, T4 2h + T5 1h).
- **Nông Hoàng Anh:** **10 giờ** (A2 2h + A3 1,5h + A4 2h + A5 1,5h + A6 3h).
