import asyncio
from db.session import async_session_maker, init_db
from db.models import Person
from services.embeddings import get_embedding

SYNTHETIC_PEOPLE = [
    {
        "name": "Sarah Chen",
        "bio": "Former Google engineer who left to start an AI SaaS company. Raised $2M seed round.",
        "current_situation": "Building a team of 8, focusing on product-market fit for AI writing tools.",
        "past_challenges": [
            "Finding a technical co-founder after 6 months of searching",
            "Pivoting from B2C to B2B after initial launch failed",
            "Learning sales and marketing as an engineer"
        ],
        "skills": ["Python", "Machine Learning", "Product Management", "Fundraising"],
        "goals": ["Scale to $1M ARR", "Build a world-class engineering team"]
    },
    {
        "name": "Marcus Johnson",
        "bio": "Solo founder struggling to find a technical co-founder for fintech startup.",
        "current_situation": "Have a clear vision and some early customer interest, but can't build the product alone.",
        "past_challenges": [
            "Pitched to 20+ potential co-founders with no success",
            "Tried outsourcing development but quality was poor",
            "Feeling stuck between hiring and finding a partner"
        ],
        "skills": ["Business Development", "Finance", "Sales"],
        "goals": ["Find the right technical co-founder", "Launch MVP in 3 months"]
    },
    {
        "name": "Dr. Emily Rodriguez",
        "bio": "Robotics PhD who transitioned from academia to industry. Now leading robotics team at Tesla.",
        "current_situation": "Mentoring students who want to break into robotics engineering.",
        "past_challenges": [
            "Deciding to leave academia after 10 years",
            "Learning industry practices vs academic research",
            "Building credibility outside of publications"
        ],
        "skills": ["Robotics", "Computer Vision", "C++", "Team Leadership"],
        "goals": ["Help next generation of robotics engineers", "Publish practical robotics content"]
    },
    {
        "name": "Jake Morrison",
        "bio": "College junior studying mechanical engineering, passionate about robotics but unsure of path.",
        "current_situation": "Trying to decide between grad school, startup, or big tech company.",
        "past_challenges": [
            "No robotics internships yet despite many applications",
            "Unclear which robotics subfield to focus on",
            "Imposter syndrome in competitive program"
        ],
        "skills": ["CAD", "Python", "Arduino", "3D Printing"],
        "goals": ["Land a robotics internship", "Build a portfolio project", "Find a mentor"]
    },
    {
        "name": "Lisa Park",
        "bio": "Marketing director at SaaS company, considering transition to product management.",
        "current_situation": "Taking PM courses online, looking for opportunities to make the switch.",
        "past_challenges": [
            "Feeling pigeonholed in marketing role",
            "Lack of technical background making PM switch harder",
            "Uncertainty about taking a pay cut for career change"
        ],
        "skills": ["Marketing Strategy", "Analytics", "Customer Research", "Stakeholder Management"],
        "goals": ["Transition to PM role within 6 months", "Build technical skills"]
    },
]

SYNTHETIC_PEOPLE.extend([
    {
        "name": "David Kim",
        "bio": "Successfully transitioned from marketing to product management at Stripe.",
        "current_situation": "Now a senior PM leading a cross-functional team of 12.",
        "past_challenges": [
            "Convincing hiring managers to take a chance on career switcher",
            "Learning technical concepts quickly to work with engineers",
            "Building credibility as a new PM without traditional background"
        ],
        "skills": ["Product Strategy", "User Research", "SQL", "A/B Testing", "Roadmapping"],
        "goals": ["Mentor career switchers into PM", "Eventually become VP of Product"]
    },
    {
        "name": "Rachel Foster",
        "bio": "Indie game developer who quit corporate job to pursue creative passion.",
        "current_situation": "6 months into indie journey, released first game with modest success.",
        "past_challenges": [
            "Overcoming fear of leaving stable income",
            "Dealing with isolation of solo work",
            "Marketing and business side of indie development"
        ],
        "skills": ["Unity", "C#", "Game Design", "Pixel Art"],
        "goals": ["Build sustainable indie game business", "Release 2 games per year"]
    },
    {
        "name": "Alex Turner",
        "bio": "Software engineer at big tech, dreaming of starting own company but scared to leap.",
        "current_situation": "Golden handcuffs situation - great pay but unfulfilled. Side project getting traction.",
        "past_challenges": [
            "Risk aversion due to family responsibilities",
            "Unclear if side project is viable as full business",
            "No entrepreneurial network or mentors"
        ],
        "skills": ["Full-stack Development", "System Design", "React", "Node.js"],
        "goals": ["Validate business idea", "Find co-founder or advisor", "Make the leap in 2026"]
    },
    {
        "name": "Priya Sharma",
        "bio": "Climate tech founder, building carbon tracking SaaS for enterprises.",
        "current_situation": "Pre-seed stage, technical co-founder recently joined, now fundraising.",
        "past_challenges": [
            "Finding co-founder who cared about climate as much as business",
            "Breaking into enterprise sales with no network",
            "Balancing mission-driven work with commercial viability"
        ],
        "skills": ["Sustainability", "Enterprise Sales", "Fundraising", "Public Speaking"],
        "goals": ["Close $1M seed round", "Sign 5 enterprise customers"]
    },
    {
        "name": "Tom Bradley",
        "bio": "Former teacher who learned to code and became a software engineer at 35.",
        "current_situation": "Now helping others make career transitions through mentorship and content.",
        "past_challenges": [
            "Learning to code while working full-time with family",
            "Overcoming age bias in tech interviews",
            "Imposter syndrome as self-taught developer"
        ],
        "skills": ["JavaScript", "Python", "Teaching", "Career Coaching"],
        "goals": ["Help 100 career switchers break into tech", "Build online course"]
    }
])

async def seed_database():
    print("Initializing database...")
    await init_db()
    
    print(f"Seeding {len(SYNTHETIC_PEOPLE)} people...")
    
    async with async_session_maker() as session:
        for person_data in SYNTHETIC_PEOPLE:
            # Create embedding from bio + current situation + past challenges
            text_for_embedding = f"{person_data['bio']} {person_data['current_situation']} {' '.join(person_data['past_challenges'])}"
            embedding = await get_embedding(text_for_embedding)
            
            person = Person(
                name=person_data["name"],
                bio=person_data["bio"],
                current_situation=person_data["current_situation"],
                past_challenges=person_data["past_challenges"],
                skills=person_data["skills"],
                goals=person_data["goals"],
                embedding=embedding
            )
            session.add(person)
            print(f"  Added: {person_data['name']}")
        
        await session.commit()
    
    print("✅ Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
