# Hạ tầng bằng CloudFormation

Bốn stack, dựng theo thứ tự. Stack sau đọc giá trị của stack trước qua `!ImportValue`.

| Thứ tự | Template | Stack | Phụ trách | Nội dung |
| --- | --- | --- | --- | --- |
| 1 | `network.yaml` | `sms-dev-network` | Nông Hoàng Anh | VPC, 6 subnet 2 AZ, NAT (bật/tắt được), route, S3 endpoint, 4 SG, DB subnet group |
| 2 | `database.yaml` | `sms-dev-database` | Nông Hoàng Anh | RDS MySQL 8.4 `db.t3.micro`, parameter group bắt buộc SSL (tham số `RequireSsl`) |
| 3 | `app.yaml` | `sms-dev-app` | Trần Lê Thái | Môi trường Elastic Beanstalk `sms-dev-app`, chạy phiên bản code `VersionLabel` |
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
| `/sms/dev/db-password` | Mật khẩu master RDS: 8–41 ký tự, không chứa `/`, `"`, `@`, dấu cách |
| `/sms/dev/jwt-secret` | Chuỗi `openssl rand -hex 32` |

**Yêu cầu với `app.yaml`** (Trần Lê Thái):

- Tên môi trường Beanstalk: `sms-dev-app` (stack `sms-dev-monitoring` tìm ASG và ALB theo tên này).
- Application `student-manager` và phiên bản code tạo **ngoài stack** (bằng CLI, bước 5). Stack chỉ chọn phiên bản qua tham số `VersionLabel`, nhờ vậy đổi phiên bản = rolling deploy, trả về phiên bản cũ = rollback.
- EC2 ở `sms-dev-AppSubnets`, SG `sms-dev-AppSg`; ALB ở `sms-dev-PublicSubnets`, SG `sms-dev-AlbSg`.
- Biến môi trường: `DB_HOST` (= `sms-dev-DbEndpoint`), `DB_PORT`, `DB_NAME=student_manager`, `DB_USER=admin`, `DB_SSL=true`, `DB_PASSWORD_PARAM=/sms/dev/db-password`, `JWT_SECRET_PARAM=/sms/dev/jwt-secret`, `COOKIE_SECURE=false`. Không đưa giá trị bí mật vào template.
- Scaling trigger theo CPU, chu kỳ 5 phút.

**Tag chung** (truyền bằng `--tags` khi deploy, tự lan sang mọi tài nguyên): `Project=StudentMgmt`, `Owner=24110331-24110154`, `Environment=dev`, `ManagedBy=cloudformation`.

---

## Triển khai từ đầu

Quy ước tab CloudShell:

| Tab | Dùng cho |
| --- | --- |
| **`us-east-1`** (tab thường) | Lệnh `aws cloudformation`, `aws ssm`, `aws elasticbeanstalk`, đóng gói code |
| **`sms-dev-admin`** (CloudShell VPC environment) | Lệnh `mysql`, `npm run db:seed` (cần vào RDS trong subnet private) |

### Bước 0. Chuẩn bị (tab `us-east-1`)

Start Lab, mở CloudShell. Lấy mã nguồn mới nhất:

```bash
cd ~ && { [ -d student-manager-ops ] || git clone https://github.com/devonxjz/student-manager-ops.git; } && cd student-manager-ops && git pull && ls infra
```

Biến dùng chung (chạy lại mỗi khi mở tab mới):

```bash
export AWS_PAGER=""; TAGS="Project=StudentMgmt Owner=24110331-24110154 Environment=dev ManagedBy=cloudformation"; echo "TAGS=$TAGS"
```

### Bước 1. Mạng

```bash
aws cloudformation deploy --stack-name sms-dev-network --template-file infra/network.yaml --parameter-overrides EnableNat=true --tags $TAGS
```

Kiểm tra: 8 export `sms-dev-…` (**M1**).

```bash
aws cloudformation list-exports --query "Exports[?starts_with(Name,'sms-dev-')].[Name,Value]" --output table
```

### Bước 2. Bí mật (một lần)

Mật khẩu RDS; dòng `Do dai` phải từ 8 trở lên:

```bash
read -s -p "Mat khau RDS moi: " P; echo; echo "Do dai: ${#P}"; aws ssm put-parameter --name /sms/dev/db-password --type SecureString --value "$P" --overwrite; unset P
```

```bash
aws ssm put-parameter --name /sms/dev/jwt-secret --type SecureString --value "$(openssl rand -hex 32)" --overwrite
```

### Bước 3. Database, chưa bắt buộc SSL (khoảng 10 phút)

Dựng với `RequireSsl=0`. SSL chỉ bật bắt buộc ở bước 7, sau khi đã chứng minh ứng dụng kết nối được bằng SSL.

```bash
aws cloudformation deploy --stack-name sms-dev-database --template-file infra/database.yaml --parameter-overrides RequireSsl=0 --tags $TAGS
```

Nếu lỗi: xem nguyên nhân, xóa stack ở trạng thái `ROLLBACK_COMPLETE` rồi dựng lại.

```bash
aws cloudformation describe-stack-events --stack-name sms-dev-database --query "StackEvents[?contains(ResourceStatus,'FAILED')].[LogicalResourceId,ResourceStatusReason]" --output table
```

```bash
aws cloudformation delete-stack --stack-name sms-dev-database; aws cloudformation wait stack-delete-complete --stack-name sms-dev-database && echo "DA XOA"
```

Kiểm tra (**M2**):

```bash
aws rds describe-db-instances --db-instance-identifier sms-dev-mysql --query "DBInstances[0].{Status:DBInstanceStatus,Engine:EngineVersion,Class:DBInstanceClass,Public:PubliclyAccessible,Encrypted:StorageEncrypted,VPC:DBSubnetGroup.VpcId}" --output table
```

### Bước 4. Nạp schema và seed

Lấy ID để tạo CloudShell VPC environment (tab `us-east-1`):

```bash
VPC=$(aws cloudformation list-exports --query "Exports[?Name=='sms-dev-VpcId'].Value" --output text); echo "VPC:     $VPC"; echo "Subnet:  $(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC Name=cidr-block,Values=10.0.11.0/24 --query 'Subnets[0].SubnetId' --output text)"; echo "AdminSG: $(aws cloudformation list-exports --query "Exports[?Name=='sms-dev-AdminSg'].Value" --output text)"
```

**Actions → Create VPC environment**: Name `sms-dev-admin`, điền đúng 3 ID trên. Trong tab **`sms-dev-admin`**:

```bash
export AWS_PAGER=""; sudo dnf install -y mariadb105; cd ~; [ -d student-manager-ops ] || git clone https://github.com/devonxjz/student-manager-ops.git; cd student-manager-ops && git pull && export DB_HOST=$(aws cloudformation list-exports --query "Exports[?Name=='sms-dev-DbEndpoint'].Value" --output text) && echo "DB_HOST=$DB_HOST"
```

```bash
mysql -h "$DB_HOST" -u admin -p --ssl < database/schema.sql && mysql -h "$DB_HOST" -u admin -p --ssl -e "USE student_manager; SHOW TABLES;"
```

```bash
cd server && npm ci --omit=dev && read -s -p "DB password: " DB_PASSWORD; echo; read -s -p "Admin password moi: " ADMIN_INITIAL_PASSWORD; echo; echo "Do dai admin: ${#ADMIN_INITIAL_PASSWORD}"; export DB_PASSWORD ADMIN_INITIAL_PASSWORD DB_USER=admin DB_NAME=student_manager DB_PORT=3306 DB_SSL=true && npm run db:seed
```

`DB_SSL=true` để seed cũng kết nối bằng SSL (dùng chính code của ứng dụng). Thấy `Đã tạo admin "admin"` là xong.

### Bước 5. Đóng gói và tải phiên bản code (tab `us-east-1`)

Phiên bản phải build từ code **đã có SSL và đọc Parameter Store** (từ commit `1e7508c` trở đi). Đặt tên phiên bản mới, không trùng phiên bản cũ (`v1`, `v2` đã dùng ở tuần 2):

```bash
VERSION=v3; cd ~/student-manager-ops && git pull && npm --prefix client ci && bash scripts/package.sh $VERSION
```

Tải lên application `student-manager` (lệnh đầu tạo application nếu chưa có; báo lỗi "already exists" là bình thường):

```bash
aws elasticbeanstalk create-application --application-name student-manager 2>/dev/null; BUCKET=$(aws elasticbeanstalk create-storage-location --query S3Bucket --output text); aws s3 cp dist/student-manager-$VERSION.zip s3://$BUCKET/student-manager-$VERSION.zip && aws elasticbeanstalk create-application-version --application-name student-manager --version-label $VERSION --description "commit $(git rev-parse --short HEAD)" --source-bundle S3Bucket=$BUCKET,S3Key=student-manager-$VERSION.zip --query "ApplicationVersion.[VersionLabel,Status]" --output table
```

### Bước 6. Ứng dụng (khoảng 10 phút)

```bash
aws cloudformation deploy --stack-name sms-dev-app --template-file infra/app.yaml --parameter-overrides VersionLabel=$VERSION --tags $TAGS
```

Kiểm tra (**M3**):

```bash
URL=$(aws cloudformation describe-stacks --stack-name sms-dev-app --query "Stacks[0].Outputs[?OutputKey=='ApplicationUrl'].OutputValue" --output text); echo $URL; curl -s $URL/health; echo; aws elasticbeanstalk describe-environments --environment-names sms-dev-app --query "Environments[0].[Health,VersionLabel]" --output text
```

Cần thấy `{"status":"ok",...}`, `Green` và đúng `VersionLabel`.

Ứng dụng đọc được bí mật từ Parameter Store (log đẩy lên CloudWatch):

```bash
aws logs filter-log-events --log-group-name /aws/elasticbeanstalk/sms-dev-app/var/log/web.stdout.log --filter-pattern '"Parameter Store"' --query "events[].message" --output text
```

- Có dòng `Đã tải bí mật từ SSM Parameter Store thành công` → LabRole đọc được SSM.
- Có dòng `Không đọc được …` → LabRole thiếu quyền; dùng phương án dự phòng trong kế hoạch tuần 3.

Kiểm tra truy vấn DB thật (`/health` không chạm DB): đăng nhập trên web bằng `admin`, hoặc:

```bash
read -s -p "Admin password: " AP; echo; curl -s -X POST $URL/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"$AP\"}" | head -c 200; echo; unset AP
```

Trả về thông tin người dùng (không phải lỗi 500) → ứng dụng kết nối RDS **bằng SSL** thành công.

### Bước 7. Bật bắt buộc SSL: `RequireSsl` từ 0 lên 1

Chỉ làm khi bước 6 đã đạt (ứng dụng chạy với `DB_SSL=true`).

```bash
aws cloudformation deploy --stack-name sms-dev-database --template-file infra/database.yaml --parameter-overrides RequireSsl=1 --tags $TAGS
```

`require_secure_transport` là tham số động: áp dụng ngay, **không khởi động lại RDS**, không phải tạo lại DB. Kiểm tra:

```bash
PG=$(aws rds describe-db-instances --db-instance-identifier sms-dev-mysql --query "DBInstances[0].DBParameterGroups[0].DBParameterGroupName" --output text); aws rds describe-db-parameters --db-parameter-group-name $PG --query "Parameters[?ParameterName=='require_secure_transport'].[ParameterName,ParameterValue]" --output table
```

Chứng minh RDS từ chối kết nối không mã hóa (tab `sms-dev-admin`):

```bash
mysql -h "$DB_HOST" -u admin -p --skip-ssl -e "SELECT 1"
```

Mong đợi lỗi *Connections using insecure transport are prohibited*. Chạy lại lệnh đăng nhập ở bước 6: vẫn phải thành công.

Nếu ứng dụng lỗi sau khi bật, trả về ngay:

```bash
aws cloudformation deploy --stack-name sms-dev-database --template-file infra/database.yaml --parameter-overrides RequireSsl=0 --tags $TAGS
```

### Bước 8. Giám sát

```bash
ENV=sms-dev-app; ASG=$(aws elasticbeanstalk describe-environment-resources --environment-name $ENV --query "EnvironmentResources.AutoScalingGroups[0].Name" --output text); LB=$(aws elasticbeanstalk describe-environment-resources --environment-name $ENV --query "EnvironmentResources.LoadBalancers[0].Name" --output text); ALB=${LB#*:loadbalancer/}; echo "ASG=$ASG"; echo "ALB=$ALB"
```

`ALB` phải có dạng `app/awseb-.../...`. Rồi:

```bash
aws cloudformation deploy --stack-name sms-dev-monitoring --template-file infra/monitoring.yaml --parameter-overrides AlertEmail=EMAIL_CUA_BAN AsgName=$ASG AlbFullName=$ALB --tags $TAGS
```

Mở hộp thư, bấm **Confirm subscription** trong thư của AWS Notifications (**M4**).

### Bước 9. Rolling deploy và rollback

Đóng gói và tải phiên bản mới như bước 5 với `VERSION=v4`, rồi đổi phiên bản trong stack:

```bash
aws cloudformation deploy --stack-name sms-dev-app --template-file infra/app.yaml --parameter-overrides VersionLabel=v4 --tags $TAGS
```

Beanstalk cập nhật từng instance (Rolling, batch 1). Rollback = deploy lại phiên bản cũ:

```bash
aws cloudformation deploy --stack-name sms-dev-app --template-file infra/app.yaml --parameter-overrides VersionLabel=v3 --tags $TAGS
```

---

## Thử ở account khác (T5)

Làm đúng bước 0 → 6 trong account đó; bước 5 tự tạo application `student-manager` nếu chưa có. Thử xong xóa cả 3 stack (mục dưới) để không tốn phí.

## Tạm nghỉ và dọn dẹp

Khi nghỉ ngắn: xóa stack ứng dụng (giữ application và các phiên bản), tắt NAT, dừng RDS:

```bash
aws cloudformation delete-stack --stack-name sms-dev-monitoring; aws cloudformation wait stack-delete-complete --stack-name sms-dev-monitoring; aws cloudformation delete-stack --stack-name sms-dev-app; aws cloudformation wait stack-delete-complete --stack-name sms-dev-app && echo "Da xoa app"
```

```bash
aws cloudformation deploy --stack-name sms-dev-network --template-file infra/network.yaml --parameter-overrides EnableNat=false; aws rds stop-db-instance --db-instance-identifier sms-dev-mysql --query "DBInstance.DBInstanceStatus" --output text
```

Không tắt NAT khi stack ứng dụng còn chạy: EC2 cần NAT để đọc Parameter Store và cài gói. RDS tự bật lại sau 7 ngày dừng.

Làm tiếp: `aws rds start-db-instance --db-instance-identifier sms-dev-mysql`, deploy lại mạng với `EnableNat=true`, rồi bước 6.

Xóa toàn bộ, **ngược thứ tự dựng** (stack đang được stack khác import thì không xóa được):

```bash
for s in sms-dev-monitoring sms-dev-app sms-dev-database sms-dev-network; do aws cloudformation delete-stack --stack-name $s; aws cloudformation wait stack-delete-complete --stack-name $s && echo "Da xoa $s"; done
```

Xóa stack database là xóa luôn dữ liệu (dữ liệu thử, nạp lại bằng `schema.sql` + seed). Hai tham số Parameter Store và application `student-manager` không thuộc stack nào, xóa riêng nếu cần.
