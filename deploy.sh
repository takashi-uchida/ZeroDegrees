#!/bin/bash
set -e

echo "🚀 ZeroDegrees AWS Deployment Script"
echo ""

# 1. フロントエンドのビルド
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. CDKのビルド
echo "🔨 Building CDK..."
cd cdk
npm install
npm run build

# 3. CDK Bootstrap（初回のみ必要）
echo "🎯 Checking CDK bootstrap..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
  echo "⚠️  CDK not bootstrapped. Running bootstrap..."
  cdk bootstrap
else
  echo "✅ CDK already bootstrapped"
fi

# 4. デプロイ
echo "🚢 Deploying to AWS..."
cdk deploy --require-approval never

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update API keys in Secrets Manager"
echo "2. Initialize database (see cdk/README.md)"
echo "3. Update FRONTEND_URL in backend environment variables"
