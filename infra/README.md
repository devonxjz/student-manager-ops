# Hạ tầng bằng CloudFormation

Bốn stack, dựng theo thứ tự. Stack sau đọc giá trị của stack trước qua `!ImportValue`.

| Thứ tự | Template | Stack | Phụ trách | Nội dung |
| --- | --- | --- | --- | --- |
| 1 | `network.yaml` | `sms-dev-network` | Nông Hoàng Anh | VPC, 6 subnet 2 AZ, NAT (bật/tắt được), route, S3 endpoint, 4 SG, DB subnet group |
| 2 | `database.yaml` | `sms-dev-database` | Nông Hoàng Anh | RDS MySQL 8.4 `db.t3.micro`, parameter group bắt buộc SSL |
| 3 | `app.yaml` | `sms-dev-app` | Trần Lê Thái | Môi trường Elastic Beanstalk `sms-dev-app` |
| 4 | `monitoring.yaml` | `sms-dev-monitoring` | Nông Hoàng Anh | SNS email, 5 alarm, dashboard `sms-dev` |

## Quy định

**Export của `sms-dev-network`**

| Export | Giá trị |
| --- | --- |
| `sms-dev-VpcId` | ID VPC |
| `sms-dev-PublicSubnets` | `subnet-a,subnet-b` (public, cho ALB) |
| `sms-dev-AppSubnets` | `subnet-a,subnet-b` (app, cho EC2) |
| `sms-dev-DbSubnetGroup` | Tên DB subnet group |
| `sms-dev-AlbSg`, `sms-dev-AppSg`, `sms-dev-DbSg`, `sms-dev-AdminSg` | ID security group |

**Export của `sms-dev-database`**: `sms-dev-DbEndpoint`, `sms-dev-DbPort`, `sms-dev-DbInstanceId`.

**Parameter Store** (SecureString, tạo bằng CLI vì CloudFormation không tạo được SecureString):

| Tên | Nội dung |
| --- | --- |
| `/sms/dev/db-password` | Mật khẩu master RDS |
| `/sms/dev/jwt-secret` | Chuỗi `openssl rand -hex 32` |

**Yêu cầu với `app.yaml`** (Trần Lê Thái):

- Tên môi trường Beanstalk: `sms-dev-app` (stack `sms-dev-monitoring` tìm ASG và ALB theo tên này).
- EC2 ở `sms-dev-AppSubnets`, SG `sms-dev-AppSg`; ALB ở `sms-dev-PublicSubnets`, SG `sms-dev-AlbSg`.
- Biến môi trường: `DB_HOST` (= `sms-dev-DbEndpoint`), `DB_PORT`, `DB_NAME=student_manager`, `DB_USER=admin`, `DB_SSL=true`, `DB_PASSWORD_PARAM=/sms/dev/db-password`, `JWT_SECRET_PARAM=/sms/dev/jwt-secret`, `COOKIE_SECURE=false`. Không đưa giá trị bí mật vào template.
- Scaling trigger theo CPU (`aws:autoscaling:trigger`, `MeasureName: CPUUtilization`) để buổi bắn tải thấy được Auto Scaling.

**Tag chung** (truyền bằng `--tags` khi deploy, tự lan sang mọi tài nguyên): `Project=StudentMgmt`, `Owner=24110331-24110154`, `Environment=dev`, `ManagedBy=cloudformation`.

## Triển khai

Chạy trong CloudShell, tại thư mục gốc repo. Đặt biến tag một lần:

```bash
export AWS_PAGER=""; TAGS="Project=StudentMgmt Owner=24110331-24110154 Environment=dev ManagedBy=cloudformation"
```

**1. Mạng**

```bash
aws cloudformation deploy --stack-name sms-dev-network --template-file infra/network.yaml --parameter-overrides EnableNat=true --tags $TAGS
```

**2. Bí mật** (một lần; `read -s` để mật khẩu không hiện trên màn hình)

```bash
read -s -p "Mat khau RDS moi: " P; echo; aws ssm put-parameter --name /sms/dev/db-password --type SecureString --value "$P" --overwrite; unset P
```

```bash
aws ssm put-parameter --name /sms/dev/jwt-secret --type SecureString --value "$(openssl rand -hex 32)" --overwrite
```

**3. Database** (khoảng 10 phút). `RequireSsl=1` chỉ dùng khi ứng dụng đã có `DB_SSL`; nếu chưa, dùng `RequireSsl=0`.

```bash
aws cloudformation deploy --stack-name sms-dev-database --template-file infra/database.yaml --parameter-overrides RequireSsl=1 --tags $TAGS
```

Nạp schema và seed: tạo CloudShell VPC environment trong `sms-dev-app-a` với SG `sms-dev-AdminSg`, rồi làm như tuần 2 (host lấy từ export `sms-dev-DbEndpoint`, kết nối bằng `--ssl`).

**4. Ứng dụng** (khoảng 5-10 phút)

```bash
aws cloudformation deploy --stack-name sms-dev-app --template-file infra/app.yaml --tags $TAGS
```

**5. Giám sát** (sau khi `sms-dev-app` Health Ok)

```bash
ENV=sms-dev-app; ASG=$(aws elasticbeanstalk describe-environment-resources --environment-name $ENV --query "EnvironmentResources.AutoScalingGroups[0].Name" --output text); LB=$(aws elasticbeanstalk describe-environment-resources --environment-name $ENV --query "EnvironmentResources.LoadBalancers[0].Name" --output text); ALB=${LB#*:loadbalancer/}; echo "ASG=$ASG"; echo "ALB=$ALB"
```

`ALB` phải có dạng `app/awseb-.../...`. Rồi:

```bash
aws cloudformation deploy --stack-name sms-dev-monitoring --template-file infra/monitoring.yaml --parameter-overrides AlertEmail=EMAIL_CUA_BAN AsgName=$ASG AlbFullName=$ALB --tags $TAGS
```

Mở hộp thư, bấm **Confirm subscription** trong thư của AWS Notifications thì mới nhận được cảnh báo.

## Kiểm tra

```bash
aws cloudformation list-exports --query "Exports[?starts_with(Name,'sms-dev-')].[Name,Value]" --output table
```

## Tạm nghỉ và dọn dẹp

Tắt NAT khi nghỉ (tự xóa NAT, Elastic IP và route ra Internet của subnet app):

```bash
aws cloudformation deploy --stack-name sms-dev-network --template-file infra/network.yaml --parameter-overrides EnableNat=false
```

Xóa toàn bộ, **ngược thứ tự dựng** (stack đang được stack khác import thì không xóa được):

```bash
for s in sms-dev-monitoring sms-dev-app sms-dev-database sms-dev-network; do aws cloudformation delete-stack --stack-name $s; aws cloudformation wait stack-delete-complete --stack-name $s && echo "Da xoa $s"; done
```

Xóa stack database là xóa luôn dữ liệu (dữ liệu thử, nạp lại bằng `schema.sql` + seed).
