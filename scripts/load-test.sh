#!/usr/bin/env bash
set -euo pipefail

# Bắn tải vào endpoint đăng nhập để thử Auto Scaling và alarm CPU.
# Đăng nhập sai vẫn chạy bcrypt nên tốn CPU, không ghi dữ liệu vào DB.
# Alarm và scaling xét CPU trung bình 5 phút, nên cần chạy ít nhất 12 phút.
# Cách dùng (CloudShell tab us-east-1): bash scripts/load-test.sh [số giây] [số kết nối]

export AWS_PAGER=""
DURATION="${1:-900}"
CONNECTIONS="${2:-30}"
ENV_NAME=sms-dev-app

URL=$(aws cloudformation describe-stacks --stack-name sms-dev-app --query "Stacks[0].Outputs[?OutputKey=='ApplicationUrl'].OutputValue" --output text)
ASG=$(aws elasticbeanstalk describe-environment-resources --environment-name "$ENV_NAME" --query "EnvironmentResources.AutoScalingGroups[0].Name" --output text)

status() {
  COUNT=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$ASG" --query "AutoScalingGroups[0].length(Instances)" --output text)
  ALARM=$(aws cloudwatch describe-alarms --alarm-names sms-dev-app-cpu-high --query "MetricAlarms[0].StateValue" --output text)
  echo "$(date -u '+%H:%M:%S') | instance: $COUNT | alarm CPU: $ALARM"
}

# Dashboard cần group metrics của ASG để vẽ số instance (mặc định AWS không bật)
aws autoscaling enable-metrics-collection --auto-scaling-group-name "$ASG" --granularity 1Minute

echo "URL=$URL"
echo "Ban tai $DURATION giay, $CONNECTIONS ket noi"
status

npx --yes autocannon -c "$CONNECTIONS" -d "$DURATION" -m POST \
  -H "Content-Type: application/json" \
  -b '{"username":"loadtest","password":"sai-mat-khau"}' \
  "$URL/api/auth/login" > /tmp/autocannon.log 2>&1 &
PID=$!

while kill -0 "$PID" 2>/dev/null; do
  sleep 60
  status
done

tail -n 25 /tmp/autocannon.log
status
