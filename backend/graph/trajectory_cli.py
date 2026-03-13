#!/usr/bin/env python3
"""Trajectory Matching CLI - グラフベース軌道マッチングのテストツール"""

import asyncio
from graph.repository import GraphRepository
from graph.builder import GraphBuilder
from services.embeddings import get_embedding
from db.session import async_session_maker
import sys


async def build_graph():
    """既存のPersonデータからグラフを構築"""
    print("Building Human Knowledge Graph...")
    async with async_session_maker() as session:
        builder = GraphBuilder(session)
        await builder.build_from_people()
    print("✓ Graph built successfully")


async def search(query: str):
    """軌道マッチング検索を実行"""
    print(f"\n🔍 Query: {query}\n")
    
    embedding = await get_embedding(query)
    
    async with async_session_maker() as session:
        repo = GraphRepository(session)
        matches = await repo.find_trajectory_matches(query, embedding, limit=3)
        
        if not matches:
            print("No matches found. Try building the graph first: python -m graph.trajectory_cli build")
            return
        
        print(f"Found {len(matches)} matches:\n")
        
        for i, match in enumerate(matches, 1):
            print(f"{i}. {match.name} ({match.role})")
            print(f"   Score: {match.similarity_score:.3f}")
            print(f"   {match.reasoning}")
            print(f"   Evidence: {', '.join(match.evidence[:2])}")
            print(f"   First question: {match.first_question}")
            print()


async def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m graph.trajectory_cli build")
        print("  python -m graph.trajectory_cli search 'your query here'")
        return
    
    command = sys.argv[1]
    
    if command == "build":
        await build_graph()
    elif command == "search":
        if len(sys.argv) < 3:
            print("Error: search requires a query")
            return
        query = " ".join(sys.argv[2:])
        await search(query)
    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    asyncio.run(main())
