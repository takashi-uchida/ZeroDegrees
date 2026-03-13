from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import Person, GraphNode, GraphEdge
from graph.schema import NodeType, EdgeType
from services.embeddings import get_embedding


class GraphBuilder:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def build_from_people(self):
        """既存のPersonデータからグラフを構築"""
        result = await self.session.execute(select(Person))
        people = result.scalars().all()
        
        for person in people:
            await self._create_person_subgraph(person)
    
    async def _create_person_subgraph(self, person: Person):
        """1人のPersonから関連ノードとエッジを生成"""
        person_node = GraphNode(
            node_type=NodeType.PERSON,
            name=person.name,
            properties={"bio": person.bio, "current_situation": person.current_situation},
            embedding=person.embedding
        )
        self.session.add(person_node)
        await self.session.flush()
        
        # スキルノード
        for skill in person.skills:
            skill_node = await self._get_or_create_node(NodeType.SKILL, skill)
            edge = GraphEdge(
                source_id=person_node.id,
                target_id=skill_node.id,
                edge_type=EdgeType.HAS_SKILL,
                weight=1.0
            )
            self.session.add(edge)
        
        # 問題ノード
        for challenge in person.past_challenges:
            problem_node = await self._get_or_create_node(NodeType.PROBLEM, challenge, challenge)
            edge = GraphEdge(
                source_id=person_node.id,
                target_id=problem_node.id,
                edge_type=EdgeType.SOLVED_PROBLEM,
                weight=1.0
            )
            self.session.add(edge)
        
        # ゴールノード
        for goal in person.goals:
            goal_node = await self._get_or_create_node(NodeType.GOAL, goal, goal)
            edge = GraphEdge(
                source_id=person_node.id,
                target_id=goal_node.id,
                edge_type=EdgeType.WORKING_ON,
                weight=1.0
            )
            self.session.add(edge)
        
        await self.session.commit()
    
    async def _get_or_create_node(self, node_type: NodeType, name: str, text_for_embedding: str = None):
        """ノードを取得または作成"""
        result = await self.session.execute(
            select(GraphNode).where(
                GraphNode.node_type == node_type,
                GraphNode.name == name
            )
        )
        node = result.scalar_one_or_none()
        
        if not node:
            embedding = await get_embedding(text_for_embedding or name) if text_for_embedding else None
            node = GraphNode(
                node_type=node_type,
                name=name,
                properties={},
                embedding=embedding
            )
            self.session.add(node)
            await self.session.flush()
        
        return node
