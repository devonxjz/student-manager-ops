#!/usr/bin/env bash
set -uo pipefail

# In trạng thái toàn bộ hệ thống trên account hiện tại để chụp minh chứng.
# Chỉ đọc, không tạo hay sửa tài nguyên, không in giá trị bí mật.
# Cách dùng (CloudShell tab us-east-1): bash scripts/verify-aws.sh

export AWS_PAGER=""
DB_ID=sms-dev-mysql
ENV_NAME=sms-dev-app

section() { echo; echo "=== $1 ==="; }

section "Account, region, thoi gian"
aws sts get-caller-identity --query Account --output text
echo "${AWS_REGION:-us-east-1}"
date -u '+%Y-%m-%d %H:%M UTC'

section "Stack"
aws cloudformation describe-stacks --query "Stacks[?starts_with(StackName,'sms-dev-')].[StackName,StackStatus]" --output table

section "Export"
aws cloudformation list-exports --query "Exports[?starts_with(Name,'sms-dev-')].[Name,Value]" --output table

section "Route table cua VPC"
VPC=$(aws cloudformation list-exports --query "Exports[?Name=='sms-dev-VpcId'].Value" --output text)
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC" --query "RouteTables[].[Tags[?Key=='Name']|[0].Value,join(',',Routes[].[GatewayId||NatGatewayId][])]" --output table

section "RDS"
aws rds describe-db-instances --db-instance-identifier "$DB_ID" --query "DBInstances[0].{Status:DBInstanceStatus,Engine:EngineVersion,Class:DBInstanceClass,Public:PubliclyAccessible,Encrypted:StorageEncrypted,Storage:StorageType}" --output table
PG=$(aws rds describe-db-instances --db-instance-identifier "$DB_ID" --query "DBInstances[0].DBParameterGroups[0].DBParameterGroupName" --output text)
aws rds describe-db-parameters --db-parameter-group-name "$PG" --query "Parameters[?ParameterName=='require_secure_transport'].[ParameterName,ParameterValue]" --output table

section "Beanstalk"
aws elasticbeanstalk describe-environments --environment-names "$ENV_NAME" --query "Environments[0].{Health:Health,Status:Status,Version:VersionLabel,Platform:SolutionStackName}" --output table
aws elasticbeanstalk describe-application-versions --application-name student-manager --query "ApplicationVersions[].[VersionLabel,Description]" --output table

section "EC2 cua moi truong (Public IP phai la None)"
aws ec2 describe-instances --filters "Name=tag:elasticbeanstalk:environment-name,Values=$ENV_NAME" "Name=instance-state-name,Values=running" --query "Reservations[].Instances[].[InstanceId,InstanceType,PrivateIpAddress,PublicIpAddress]" --output table

section "Ung dung doc bi mat tu Parameter Store"
aws logs filter-log-events --log-group-name "/aws/elasticbeanstalk/$ENV_NAME/var/log/web.stdout.log" --filter-pattern '"Parameter Store"' --query "events[-1].message" --output text

section "Alarm"
aws cloudwatch describe-alarms --alarm-name-prefix sms-dev --query "MetricAlarms[].[AlarmName,StateValue]" --output table

section "SNS (PendingConfirmation = chua bam Confirm trong email)"
TOPIC=$(aws sns list-topics --query "Topics[?ends_with(TopicArn,':sms-dev-alerts')].TopicArn" --output text)
aws sns list-subscriptions-by-topic --topic-arn "$TOPIC" --query "Subscriptions[].[Protocol,SubscriptionArn]" --output table
