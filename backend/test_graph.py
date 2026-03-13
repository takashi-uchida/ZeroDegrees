#!/usr/bin/env python3
"""Human Graph と Trajectory Matching の動作確認スクリプト"""
import asyncio
from db.session import async_session_maker, init_db
from sqlalchemy import select, func
from db.models import Person, GraphNode, GraphEdge
from graph.trajectory import TrajectoryMatcher
from services.embeddings import get_embedding


async def test_graph_structure():
    """グラフ構造の確認"""
    print("=" * 60)
    print("1. グラフ構造の確認")
    print("=" * 60)
    
    await init_db()
    async with async_session_maker() as session:
        people_count = (await session.execute(select(func.count(Person.id)))).scalar()
        nodes_count = (await session.execute(select(func.count(GraphNode.id)))).scalar()
        edges_count = (await session.execute(select(func.count(GraphEdge.id)))).scalar()
        
        print(f"✅ People: {people_count}")
        print(f"✅ Graph Nodes: {nodes_count}")
        print(f"✅ Graph Edges: {edges_count}")
        
        # ノードタイプ別の集計
        result = await session.execute(
            select(GraphNode.node_type, func.count(GraphNode.id))
            .group_by(GraphNode.node_type)
        )
        print("\nノードタイプ別:")
        for node_type, count in result:
            print(f"  - {node_type}: {count}")
        
        # エッジタイプ別の集計
        result = await session.execute(
            select(GraphEdge.edge_type, func.count(GraphEdge.id))
            .group_by(GraphEdge.edge_type)
        )
        print("\nエッジタイプ別:")
        for edge_type, count in result:
            print(f"  - {edge_type}: {count}")


async def test_trajectory_matching():
    """Trajectory Matching のテスト"""
    print("\n" + "=" * 60)
    print("2. Trajectory Matching のテスト")
    print("=" * 60)
    
    test_queries = [
        "I want to learn machine learning and build AI products",
        "Looking for co-founder to start a SaaS company",
        "Need help with fundraising and investor connections"
    ]
    
    await init_db()
    
    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        embedding = await get_embedding(query)
        
        async with async_session_maker() as session:
            matcher = TrajectoryMatcher(session)
            results = await matcher.find_future_selves(embedding, limit=2)
            
            for i, result in enumerate(results, 1):
                person = result["person"]
                print(f"\n  {i}. {person.name}")
                print(f"     Distance: {result['distance']:.3f}")
                print(f"     Trajectory Score: {result['trajectory_score']:.3f}")
                print(f"     Final Score: {result['final_score']:.3f}")


async def test_path_finding():
    """パス探索のテスト"""
    print("\n" + "=" * 60)
    print("3. パス探索のテスト")
    print("=" * 60)
    
    await init_db()
    async with async_session_maker() as session:
        # スキルノードを介した接続を探す
        result = await session.execute(
            select(GraphNode).where(GraphNode.node_type == 'person').limit(5)
        )
        people = result.scalars().all()
        
        if len(people) >= 2:
            person1, person2 = people[0], people[1]
            print(f"\n🔍 Finding path: {person1.name} → {person2.name}")
            
            matcher = TrajectoryMatcher(session)
            path = await matcher.find_path(str(person1.id), str(person2.id), max_depth=3)
            
            if path:
                print(f"✅ Path found ({len(path)} nodes):")
                for node in path:
                    print(f"   → {node['name']} ({node['type']})")
            else:
                print("❌ No direct path found (max depth: 3)")


async def test_person_details():
    """個人の詳細情報とグラフ接続の確認"""
    print("\n" + "=" * 60)
    print("4. 個人の詳細情報とグラフ接続")
    print("=" * 60)
    
    await init_db()
    async with async_session_maker() as session:
        result = await session.execute(
            select(GraphNode).where(GraphNode.node_type == 'person').limit(1)
        )
        person = result.scalar_one()
        
        print(f"\n👤 {person.name}")
        props = person.properties or {}
        if 'bio' in props:
            print(f"   Bio: {props['bio'][:100]}...")
        
        # この人のスキル
        result = await session.execute(
            select(GraphNode).join(
                GraphEdge, GraphEdge.target_id == GraphNode.id
            ).where(
                GraphEdge.source_id == person.id,
                GraphEdge.edge_type == 'has_skill'
            )
        )
        skills = result.scalars().all()
        print(f"\n   Skills ({len(skills)}):")
        for skill in skills[:5]:
            print(f"     - {skill.name}")
        
        # この人のゴール
        result = await session.execute(
            select(GraphNode).join(
                GraphEdge, GraphEdge.target_id == GraphNode.id
            ).where(
                GraphEdge.source_id == person.id,
                GraphEdge.edge_type == 'working_on'
            )
        )
        goals = result.scalars().all()
        print(f"\n   Goals ({len(goals)}):")
        for goal in goals[:3]:
            print(f"     - {goal.name}")


async def main():
    print("\n🚀 Human Graph & Trajectory Matching 動作確認\n")
    
    try:
        await test_graph_structure()
        await test_trajectory_matching()
        await test_path_finding()
        await test_person_details()
        
        print("\n" + "=" * 60)
        print("✅ すべてのテストが完了しました")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
