import asyncio

from sqlalchemy import delete

from db.models import Person
from db.session import async_session_maker, init_db
from services.embeddings import get_embedding

FOUNDER_PROFILES = [
    {
        "name": "Sarah Chen",
        "bio": "Former Google engineer who became the non-technical face of an AI writing SaaS and raised a $2M seed round.",
        "current_situation": "Running an 8-person startup after finally finding the right technical co-founder through founder communities.",
        "past_challenges": [
            "Spent 6 months failing to find a technical co-founder",
            "Learned to explain the product vision without sounding vague",
            "Recovered after an early B2C launch failed"
        ],
        "skills": ["Fundraising", "Product Strategy", "Founder Hiring", "Go-to-Market"],
        "goals": ["Help more solo founders find aligned technical partners", "Scale to $1M ARR"]
    },
    {
        "name": "Marcus Johnson",
        "bio": "Solo founder trying to launch a fintech workflow product without a technical partner.",
        "current_situation": "Has early customer interest but is still searching for a technical co-founder after multiple dead-end conversations.",
        "past_challenges": [
            "Pitched to 20+ potential co-founders with no close",
            "Tried outsourcing and got poor product quality",
            "Feels stuck between hiring and true partnership"
        ],
        "skills": ["Sales", "Business Development", "Customer Discovery"],
        "goals": ["Find the right technical co-founder", "Launch an MVP in 3 months"]
    },
    {
        "name": "Priya Sharma",
        "bio": "Climate-tech founder who found a mission-aligned technical co-founder before fundraising.",
        "current_situation": "Closing enterprise pilots while mentoring other non-technical founders on co-founder search.",
        "past_challenges": [
            "Could not find an engineer who cared about the mission",
            "Had no enterprise network at the start",
            "Had to learn how to screen for founder-fit, not just coding skill"
        ],
        "skills": ["Enterprise Sales", "Fundraising", "Founder Matching", "Pitching"],
        "goals": ["Close a $1M seed round", "Mentor climate founders looking for technical partners"]
    },
    {
        "name": "Daniel Lee",
        "bio": "Former product manager who found his CTO through an open-source AI community and launched an AI ops startup.",
        "current_situation": "Sharing a repeatable founder-CTO interview process with first-time founders.",
        "past_challenges": [
            "Had a strong idea but weak technical credibility",
            "Made the mistake of screening only for speed instead of founder chemistry",
            "Needed a repeatable way to evaluate technical depth"
        ],
        "skills": ["Product Management", "Founder Recruiting", "Community Building"],
        "goals": ["Publish a co-founder playbook", "Invest in operator-led AI startups"]
    },
    {
        "name": "Nina Patel",
        "bio": "B2B SaaS founder who survived a bad first co-founder match and rebuilt with a better technical partner.",
        "current_situation": "Now coaching founders on how to spot misaligned incentives before committing.",
        "past_challenges": [
            "Chose a co-founder too quickly out of urgency",
            "Had a painful equity reset after the first partnership failed",
            "Needed to rebuild trust in the search process"
        ],
        "skills": ["Founder Coaching", "Hiring", "Ops", "Customer Research"],
        "goals": ["Help founders avoid co-founder mismatch", "Scale her startup responsibly"]
    },
    {
        "name": "Aisha Bello",
        "bio": "Former growth lead building an AI onboarding tool and actively searching for a technical co-founder.",
        "current_situation": "Talking to design partners and engineers every week but has not found the right long-term partner yet.",
        "past_challenges": [
            "Strong distribution instincts but no in-house technical leadership",
            "Struggled to tell engineers why this problem matters",
            "Feels pressure to move fast before the market window closes"
        ],
        "skills": ["Growth", "User Research", "B2B SaaS Marketing"],
        "goals": ["Find an aligned technical co-founder", "Validate the wedge before building"]
    },
    {
        "name": "Miguel Santos",
        "bio": "Senior full-stack engineer exploring whether to join a non-technical founder as a technical co-founder.",
        "current_situation": "Evaluating startup ideas and founder quality while working at a dev tools company.",
        "past_challenges": [
            "Joined one startup too late and learned the importance of alignment",
            "Wants business clarity before committing to equity risk",
            "Does not want to be treated like a hired contractor"
        ],
        "skills": ["Full-stack Engineering", "Architecture", "Technical Leadership"],
        "goals": ["Find a strong founder match", "Join a startup with clear customer pull"]
    },
    {
        "name": "Sofia Alvarez",
        "bio": "Startup CTO who has joined two companies as a technical co-founder and now advises founders on partner fit.",
        "current_situation": "Mentoring engineers who want to become stronger founder-level partners.",
        "past_challenges": [
            "Saw founders confuse task delegation with co-founder partnership",
            "Had to learn how to test trust before accepting equity",
            "Worked through founder conflict in a high-pressure seed round"
        ],
        "skills": ["CTO Leadership", "System Design", "Founder Alignment", "Mentorship"],
        "goals": ["Help more engineers become great co-founders", "Back stronger founder pairs early"]
    },
    {
        "name": "Kevin Park",
        "bio": "Former YC founder who now advises early-stage teams on founder matching and startup readiness.",
        "current_situation": "Runs office hours for founders struggling to find their first technical partner.",
        "past_challenges": [
            "Learned that co-founder fit matters more than a perfect resume",
            "Saw multiple teams fail because they rushed the first hire into founder status",
            "Built a network after starting with almost none"
        ],
        "skills": ["Founder Coaching", "Fundraising", "Network Building"],
        "goals": ["Turn founder matching into a repeatable process", "Support more global founders"]
    },
    {
        "name": "Chloe Wang",
        "bio": "Healthcare AI founder who is still searching for a technical co-founder while validating customer demand.",
        "current_situation": "Interviewing clinicians and ML engineers in parallel to avoid building the wrong thing.",
        "past_challenges": [
            "Hard to attract technical talent into regulated spaces",
            "Had promising conversations collapse over timeline mismatch",
            "Wants to balance urgency with careful partner choice"
        ],
        "skills": ["Healthcare Operations", "Customer Discovery", "Regulatory Strategy"],
        "goals": ["Find a technical co-founder with AI and healthcare interest", "Launch a narrow pilot"]
    },
    {
        "name": "Omar Haddad",
        "bio": "Technical co-founder who joined a non-technical founder after meeting at a hackathon and validating the idea together.",
        "current_situation": "Building AI workflow tools and sharing how he evaluates founders before joining.",
        "past_challenges": [
            "Had to distinguish strong storytellers from strong operators",
            "Wanted proof of customer pain before leaving his job",
            "Needed a safer way to test founder chemistry"
        ],
        "skills": ["ML Engineering", "Product Engineering", "Founder Vetting"],
        "goals": ["Help founders de-risk technical partnership conversations", "Grow an AI workflow company"]
    },
    {
        "name": "Laura Kim",
        "bio": "Angel investor and former operator focused on founder-market fit and early team composition.",
        "current_situation": "Advises founders on when to hire, when to partner, and how to pitch technical talent.",
        "past_challenges": [
            "Watched many promising founders waste months on the wrong search strategy",
            "Saw technical candidates reject vague founder stories",
            "Helped teams recover after poor early hiring choices"
        ],
        "skills": ["Early-stage Investing", "Storytelling", "Founder Strategy"],
        "goals": ["Improve founder readiness before fundraising", "Support healthier founder teams"]
    },
    {
        "name": "Ben Carter",
        "bio": "Bootstrapped AI founder who found a technical partner after tightening customer proof and outreach quality.",
        "current_situation": "Runs a profitable niche SaaS and speaks openly about the lonely pre-co-founder phase.",
        "past_challenges": [
            "Spent months pitching an idea instead of a validated problem",
            "Had to rebuild confidence after repeated founder rejection",
            "Learned that founder outreach needed stronger specifics"
        ],
        "skills": ["Bootstrapping", "Customer Validation", "Founder Messaging"],
        "goals": ["Teach practical founder outreach", "Stay capital efficient while growing"]
    },
    {
        "name": "Elena Rossi",
        "bio": "Community builder running a global AI founder circle where non-technical founders meet technical operators.",
        "current_situation": "Facilitating introductions and founder dinners across multiple cities.",
        "past_challenges": [
            "Saw good founders stay isolated because they lacked a trusted room",
            "Needed to create safer ways for people to test alignment",
            "Built a repeatable intro process that reduced awkward cold outreach"
        ],
        "skills": ["Community Building", "Facilitation", "Founder Introductions"],
        "goals": ["Expand her founder community", "Create better onramps for first-time founders"]
    },
    {
        "name": "Jason Wu",
        "bio": "Staff engineer at an AI infra company exploring startup ideas and open to founder conversations.",
        "current_situation": "Evaluating whether to become a technical co-founder if the market pull and partnership are strong.",
        "past_challenges": [
            "Does not want to join a startup with fuzzy distribution",
            "Needs trust and execution evidence before committing",
            "Wants to avoid being treated as hired help with founder risk"
        ],
        "skills": ["AI Infrastructure", "Distributed Systems", "Engineering Leadership"],
        "goals": ["Find a serious founder relationship", "Work on a product with real customer urgency"]
    },
    {
        "name": "Maya Tanaka",
        "bio": "Japanese founder who found her US-based technical co-founder through a warm intro and shared project sprint.",
        "current_situation": "Helping global founders bridge geography and communication gaps during co-founder search.",
        "past_challenges": [
            "Struggled to earn trust across geography and language differences",
            "Needed a way to test collaboration before committing",
            "Had no strong Silicon Valley network when she started"
        ],
        "skills": ["Cross-border Startup Building", "Partnership Building", "Founder Communication"],
        "goals": ["Make global founder matching easier", "Support more cross-border startups"]
    },
    {
        "name": "Arjun Mehta",
        "bio": "Fractional CTO who helps first-time founders sharpen technical scope before they search for a partner.",
        "current_situation": "Advising multiple AI founders on how to make their opportunities legible to strong engineers.",
        "past_challenges": [
            "Saw founders scare off engineers with unrealistic roadmaps",
            "Had to teach teams how to define an MVP that attracts talent",
            "Balanced execution help without becoming a pseudo-co-founder"
        ],
        "skills": ["Fractional CTO", "MVP Scoping", "Technical Hiring"],
        "goals": ["Help founders become stronger partner candidates", "Turn technical ambiguity into action"]
    },
    {
        "name": "Rachel Stein",
        "bio": "Operator turned founder who built an AI support startup after finding a technical co-founder through customer interviews.",
        "current_situation": "Coaching founders on how to use customer proof as the center of co-founder outreach.",
        "past_challenges": [
            "Had many engineer conversations with no momentum",
            "Unlocked traction only after bringing concrete customer evidence",
            "Needed to move from vision pitch to evidence-based narrative"
        ],
        "skills": ["Operations", "Customer Discovery", "Founder Storytelling"],
        "goals": ["Help founders use traction more effectively", "Scale an AI support platform"]
    },
    {
        "name": "Noah Greene",
        "bio": "Startup lawyer specializing in founder agreements, equity, and early partnership risk.",
        "current_situation": "Advises first-time founders before they lock in a technical co-founder arrangement.",
        "past_challenges": [
            "Watched founders commit to equity splits before testing fit",
            "Helps teams turn verbal excitement into durable agreements",
            "Knows how fast trust breaks when expectations stay vague"
        ],
        "skills": ["Startup Law", "Founder Agreements", "Risk Management"],
        "goals": ["Prevent avoidable founder breakups", "Make early founder relationships healthier"]
    },
    {
        "name": "Isabella Romero",
        "bio": "AI startup recruiter who has placed founding engineers and seen what makes strong founder pairings work.",
        "current_situation": "Advises solo founders on how to pitch technical opportunities credibly.",
        "past_challenges": [
            "Saw non-technical founders oversell vision and undersell traction",
            "Understands why strong engineers say no to founder outreach",
            "Built a pattern library for founder-engineer fit"
        ],
        "skills": ["Recruiting", "Technical Talent", "Founder Positioning"],
        "goals": ["Help founders communicate opportunities better", "Support higher-signal founder matching"]
    },
]

async def seed_database():
    print("Initializing database...")
    await init_db()

    print(f"Refreshing founder dataset with {len(FOUNDER_PROFILES)} profiles...")

    async with async_session_maker() as session:
        await session.execute(delete(Person))

        for person_data in FOUNDER_PROFILES:
            profile_text = " ".join(
                [
                    person_data["bio"],
                    person_data["current_situation"],
                    " ".join(person_data["past_challenges"]),
                    " ".join(person_data["goals"]),
                ]
            )
            embedding = await get_embedding(profile_text)

            person = Person(
                name=person_data["name"],
                bio=person_data["bio"],
                current_situation=person_data["current_situation"],
                past_challenges=person_data["past_challenges"],
                skills=person_data["skills"],
                goals=person_data["goals"],
                embedding=embedding,
            )
            session.add(person)
            print(f"  Added: {person_data['name']}")

        await session.commit()

    print("Seed complete.")

if __name__ == "__main__":
    asyncio.run(seed_database())
