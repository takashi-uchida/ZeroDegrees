"""
API Test with real people in database
"""
import asyncio
import asyncpg
import httpx
from uuid import uuid4

async def test():
    # Setup database
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='takashiuchida',
        database='zerodegrees'
    )
    
    # Create test people
    alice_id = uuid4()
    bob_id = uuid4()
    
    print("Setting up test users...")
    await conn.execute('''
        INSERT INTO people (id, name, bio, current_situation, past_challenges, skills, goals, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
    ''', alice_id, 'Alice', 'Entrepreneur', 'Building startup', ['funding'], ['python', 'business'], ['scale'], '[' + ','.join(['0']*1536) + ']')
    
    await conn.execute('''
        INSERT INTO people (id, name, bio, current_situation, past_challenges, skills, goals, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
    ''', bob_id, 'Bob', 'Developer', 'Learning', ['career'], ['coding'], ['growth'], '[' + ','.join(['0']*1536) + ']')
    
    await conn.close()
    print(f"✓ Created Alice ({alice_id}) and Bob ({bob_id})\n")
    
    # Test API
    async with httpx.AsyncClient(timeout=10.0) as client:
        base_url = "http://127.0.0.1:8000"
        
        # Test 1: Add help
        print("1. POST /api/relationships/help")
        help_response = await client.post(
            f"{base_url}/api/relationships/help",
            json={
                "helper_id": str(alice_id),
                "helped_id": str(bob_id),
                "description": "起業の相談に乗った",
                "impact_score": 2.0
            }
        )
        print(f"   Status: {help_response.status_code}")
        help_data = help_response.json()
        print(f"   Response: {help_data}")
        help_id = help_data["id"]
        
        # Test 2: Send thanks
        print("\n2. POST /api/relationships/thanks")
        thanks_response = await client.post(
            f"{base_url}/api/relationships/thanks",
            json={
                "from_person_id": str(bob_id),
                "to_person_id": str(alice_id),
                "help_history_id": help_id,
                "amount": 5,
                "message": "アドバイスのおかげで成功しました"
            }
        )
        print(f"   Status: {thanks_response.status_code}")
        print(f"   Response: {thanks_response.json()}")
        
        # Test 3: Get trust score
        print("\n3. GET /api/relationships/{alice}/{bob}/trust")
        trust_response = await client.get(
            f"{base_url}/api/relationships/{alice_id}/{bob_id}/trust"
        )
        print(f"   Status: {trust_response.status_code}")
        trust_data = trust_response.json()
        print(f"   Trust Score: {trust_data['trust_score']}")
        
        # Test 4: Get history
        print("\n4. GET /api/relationships/{alice}/{bob}/history")
        history_response = await client.get(
            f"{base_url}/api/relationships/{alice_id}/{bob_id}/history"
        )
        print(f"   Status: {history_response.status_code}")
        history_data = history_response.json()
        print(f"   History: {len(history_data)} records")
        
        # Verify
        expected = 0.45
        actual = trust_data['trust_score']
        print(f"\n✓ Verification:")
        print(f"  Expected: {expected}")
        print(f"  Actual: {actual}")
        print(f"  Match: {'✓' if abs(actual - expected) < 0.001 else '✗'}")
        
        print("\n✅ All API tests passed!")

if __name__ == "__main__":
    asyncio.run(test())
