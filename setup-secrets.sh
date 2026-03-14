#!/bin/bash
set -e

STACK_NAME="ZeroDegreesStack"

echo "🔑 Setting up API Keys in Secrets Manager"
echo ""

# APIキーシークレットのARNを取得
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`APIKeysSecretArn`].OutputValue' \
  --output text)

if [ -z "$SECRET_ARN" ]; then
  echo "❌ Error: Could not find APIKeysSecretArn output"
  exit 1
fi

echo "Found secret: $SECRET_ARN"
echo ""

# APIキーの入力
read -p "Enter OpenAI API Key: " OPENAI_KEY
read -p "Enter Anthropic API Key: " ANTHROPIC_KEY

# シークレットを更新
aws secretsmanager update-secret \
  --secret-id "$SECRET_ARN" \
  --secret-string "{\"OPENAI_API_KEY\":\"$OPENAI_KEY\",\"ANTHROPIC_API_KEY\":\"$ANTHROPIC_KEY\"}"

echo ""
echo "✅ API keys updated successfully!"
echo ""
echo "🔄 Restart ECS tasks to apply changes:"
echo "aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment"
