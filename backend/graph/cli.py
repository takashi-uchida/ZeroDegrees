"""
HumanGraph CLI - グラフ構築とクエリのためのコマンドラインツール
"""
import asyncio
import sys
from db.session import async_session_maker, init_db
from graph.builder import GraphBuilder
from graph.trajectory import TrajectoryMatcher
from services.embeddings import get_embedding


async def build_graph():
    """既存のPersonデータからグラフを構築"""
    print("🔨 Building Human Graph...")
    await init_db()
    
    async with async_session_maker() as session:
        builder = GraphBuilder(session)
        await builder.build_from_people()
    
    print("✅ Graph built successfully")


async def query_trajectory(query: str):
    """軌道マッチングのテスト"""
    print(f"🔍 Searching trajectory for: {query}")
    await init_db()
    
    embedding = await get_embedding(query)
    
    async with async_session_maker() as session:
        matcher = TrajectoryMatcher(session)
        results = await matcher.find_future_selves(embedding, limit=3)
        
        print("\n📊 Results:")
        for i, result in enumerate(results, 1):
            person = result["person"]
            props = person.properties or {}
            print(f"\n{i}. {person.name}")
            print(f"   Distance: {result['distance']:.3f}")
            print(f"   Trajectory Score: {result['trajectory_score']:.3f}")
            print(f"   Final Score: {result['final_score']:.3f}")
            bio = props.get('bio', '')
            if bio:
                print(f"   Bio: {bio[:100]}...")


async def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m graph.cli build              # Build graph from existing data")
        print("  python -m graph.cli query <text>       # Query trajectory matching")
        return
    
    command = sys.argv[1]
    
    if command == "build":
        await build_graph()
    elif command == "query":
        if len(sys.argv) < 3:
            print("Error: query requires a search text")
            return
        query_text = " ".join(sys.argv[2:])
        await query_trajectory(query_text)
    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    asyncio.run(main())
