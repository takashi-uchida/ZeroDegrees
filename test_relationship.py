"""
Relationship Layer Test Script
Usage: python test_relationship.py
"""
import asyncio
import httpx
from uuid import uuid4

BASE_URL = "http://localhost:8000"

async def test_relationship_layer():
    async with httpx.AsyncClient() as client:
        # Create test person IDs
        alice_id = str(uuid4())
        bob_id = str(uuid4())
        
        print(f"Alice ID: {alice_id}")
        print(f"Bob ID: {bob_id}")
        
        # 1. Add help record
        print("\n1. Adding help record...")
        help_response = await client.post(
            f"{BASE_URL}/api/relationships/help",
            json={
                "helper_id": alice_id,
                "helped_id": bob_id,
                "description": "起業の相談に乗った",
                "impact_score": 2.0
            }
        )
        print(f"Response: {help_response.json()}")
        help_id = help_response.json()["id"]
        
        # 2. Send thanks token
        print("\n2. Sending thanks token...")
        thanks_response = await client.post(
            f"{BASE_URL}/api/relationships/thanks",
            json={
                "from_person_id": bob_id,
                "to_person_id": alice_id,
                "help_history_id": help_id,
                "amount": 5,
                "message": "アドバイスのおかげで成功しました"
            }
        )
        print(f"Response: {thanks_response.json()}")
        
        # 3. Get trust score
        print("\n3. Getting trust score...")
        trust_response = await client.get(
            f"{BASE_URL}/api/relationships/{alice_id}/{bob_id}/trust"
        )
        print(f"Trust Score: {trust_response.json()}")
        
        # 4. Get help history
        print("\n4. Getting help history...")
        history_response = await client.get(
            f"{BASE_URL}/api/relationships/{alice_id}/{bob_id}/history"
        )
        print(f"History: {history_response.json()}")

if __name__ == "__main__":
    asyncio.run(test_relationship_layer())
