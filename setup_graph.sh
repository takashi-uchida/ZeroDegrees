#!/bin/bash

echo "🚀 Setting up HumanGraph..."

cd backend

echo "📦 Installing dependencies..."
pip install -q sqlalchemy asyncpg pgvector openai pydantic

echo "🗄️  Initializing database..."
python -c "from db.session import init_db; import asyncio; asyncio.run(init_db())"

echo "🌱 Seeding sample data..."
python -c "from db.seed import seed_database; import asyncio; asyncio.run(seed_database())"

echo "🔨 Building Human Graph..."
python -m graph.cli build

echo "✅ Setup complete!"
echo ""
echo "Try it out:"
echo "  python -m graph.cli query 'I need a technical co-founder'"
echo ""
echo "Enable graph mode in .env:"
echo "  USE_GRAPH_MATCHING=true"
