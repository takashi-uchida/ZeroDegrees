#!/bin/bash
set -e

STACK_NAME="ZeroDegreesStack"

echo "🗄️  Initializing Database"
echo ""

# クラスター名とサービス名を取得
CLUSTER_ARN=$(aws ecs list-clusters --query "clusterArns[?contains(@, '$STACK_NAME')]" --output text)
SERVICE_ARN=$(aws ecs list-services --cluster "$CLUSTER_ARN" --query "serviceArns[0]" --output text)

if [ -z "$CLUSTER_ARN" ] || [ -z "$SERVICE_ARN" ]; then
  echo "❌ Error: Could not find ECS cluster or service"
  exit 1
fi

# タスクIDを取得
TASK_ARN=$(aws ecs list-tasks --cluster "$CLUSTER_ARN" --service-name "$SERVICE_ARN" --query "taskArns[0]" --output text)

if [ -z "$TASK_ARN" ]; then
  echo "❌ Error: No running tasks found"
  exit 1
fi

echo "Found task: $TASK_ARN"
echo ""
echo "Running database seed..."

# ECS Execでコマンド実行
aws ecs execute-command \
  --cluster "$CLUSTER_ARN" \
  --task "$TASK_ARN" \
  --container web \
  --interactive \
  --command "python -m db.seed"

echo ""
echo "✅ Database initialized successfully!"
