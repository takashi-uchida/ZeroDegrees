"""
Simple Relationship Layer Test - Creates test people first
"""
import asyncio
import asyncpg
from uuid import uuid4

async def test():
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='takashiuchida',
        database='zerodegrees'
    )
    
    try:
        # Create test people
        alice_id = uuid4()
        bob_id = uuid4()
        
        print(f"Creating test users...")
        print(f"  Alice: {alice_id}")
        print(f"  Bob: {bob_id}")
        
        # Insert people (minimal data)
        await conn.execute('''
            INSERT INTO people (id, name, bio, current_situation, past_challenges, skills, goals, embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
        ''', alice_id, 'Alice', 'Test user', 'Testing', ['test'], ['python'], ['test'], '[' + ','.join(['0']*1536) + ']')
        
        await conn.execute('''
            INSERT INTO people (id, name, bio, current_situation, past_challenges, skills, goals, embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
        ''', bob_id, 'Bob', 'Test user', 'Testing', ['test'], ['python'], ['test'], '[' + ','.join(['0']*1536) + ']')
        
        print("✓ Test users created\n")
        
        # Test 1: Create relationship
        print("1. Creating relationship...")
        rel_id = uuid4()
        await conn.execute('''
            INSERT INTO relationships (id, person_a_id, person_b_id, trust_score)
            VALUES ($1, $2, $3, 0.0)
        ''', rel_id, alice_id, bob_id)
        print(f"✓ Relationship created: {rel_id}\n")
        
        # Test 2: Add help
        print("2. Adding help record...")
        help_id = uuid4()
        await conn.execute('''
            INSERT INTO help_history (id, relationship_id, helper_id, helped_id, description, impact_score)
            VALUES ($1, $2, $3, $4, $5, 2.0)
        ''', help_id, rel_id, alice_id, bob_id, '起業の相談に乗った')
        
        await conn.execute('''
            UPDATE relationships SET trust_score = trust_score + $1 WHERE id = $2
        ''', 2.0 * 0.1, rel_id)
        print(f"✓ Help record created: {help_id}\n")
        
        # Test 3: Send thanks
        print("3. Sending thanks token...")
        token_id = uuid4()
        await conn.execute('''
            INSERT INTO thanks_tokens (id, help_history_id, from_person_id, to_person_id, amount, message)
            VALUES ($1, $2, $3, $4, 5, $5)
        ''', token_id, help_id, bob_id, alice_id, 'アドバイスのおかげで成功しました')
        
        await conn.execute('''
            UPDATE relationships SET trust_score = trust_score + $1 WHERE id = $2
        ''', 5 * 0.05, rel_id)
        print(f"✓ Thanks token created: {token_id}\n")
        
        # Test 4: Get trust score
        print("4. Getting trust score...")
        trust_score = await conn.fetchval('''
            SELECT trust_score FROM relationships WHERE id = $1
        ''', rel_id)
        print(f"✓ Trust Score: {trust_score}\n")
        
        # Test 5: Get help history
        print("5. Getting help history...")
        history = await conn.fetch('''
            SELECT * FROM help_history WHERE relationship_id = $1
        ''', rel_id)
        print(f"✓ Help History: {len(history)} records\n")
        
        # Verify calculation
        expected = (2.0 * 0.1) + (5 * 0.05)
        print(f"Verification:")
        print(f"  Expected: {expected}")
        print(f"  Actual: {trust_score}")
        print(f"  Match: {'✓' if abs(trust_score - expected) < 0.001 else '✗'}")
        
        print("\n✅ All database operations successful!")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test())
