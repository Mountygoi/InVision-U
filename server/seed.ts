import pool from './db.js';
import { DEFAULT_WEIGHTS } from './types.js';
import { calculateCompositeScore } from './ai/compositeScorer.js';
import { calculateAchievementScore } from './ai/achievementScorer.js';

const SEED_CANDIDATES = [
  {
    name: 'Aisha Kanatova',
    email: 'aisha.k@mail.kz',
    phone: '+7 701 123 4567',
    university: 'Korkyt Ata University',
    city: 'Qyzylorda',
    region: 'Qyzylorda',
    is_rural: true,
    gpa: 3.7,
    year_of_study: 2,
    achievements: [
      { type: 'volunteering', title: 'Community Education Program', description: 'Organized free English classes for 50+ children in rural Qyzylorda for 2 years', year: 2024 },
      { type: 'olympiad', title: 'National Biology Olympiad', description: 'Bronze medal at national level', year: 2023, level: 'national' },
      { type: 'project', title: 'Clean Water Initiative', description: 'Led a student project to install water filters in 3 rural schools', year: 2024 }
    ],
    skills: ['Biology', 'Leadership', 'Community Organizing', 'English', 'Public Speaking'],
    essay_text: `Growing up in Qyzylorda, I watched my grandmother walk two kilometers every morning to fetch clean water. This was not a story from the past — this was 2019. That moment when I realized my reality was not everyone's reality changed everything for me.

I started small. At 15, I began teaching English to neighborhood children under a tree in our yard. Within a year, we had 50 students and had moved into the local community center. The parents started calling me "little teacher," but I was learning more from those kids than they ever learned from me. When one of my students, a shy girl named Madina, won a regional English competition, I understood what leadership really means — it's not about being in front, it's about lifting others up.

The clean water project came from anger, honestly. After my grandmother got sick from contaminated water, I couldn't just sit and study biology in a textbook while my community suffered. I gathered a team of five classmates, we researched affordable water filtration, wrote proposals to three NGOs, and installed filters in three schools. We failed with the first two NGOs. The third said yes only because we showed up at their office in Almaty — a 14-hour bus ride — with our data and a prototype.

InVision U represents everything I believe in: that talent is everywhere, but opportunity is not. I want to study environmental science not just to get a degree, but to come back to Qyzylorda and solve the water crisis that has defined my family's life for generations. Kazakhstan's future depends on people who understand both the textbook and the reality on the ground. I am that person.`,
    ai_scores: {
      motivation: { score: 92, confidence: 0.95, evidence: [
        { quote: "I want to study environmental science not just to get a degree, but to come back to Qyzylorda and solve the water crisis", explanation: "Clear, specific goal directly tied to personal experience and community need" },
        { quote: "Kazakhstan's future depends on people who understand both the textbook and the reality on the ground", explanation: "Shows mature understanding of the gap between theory and practice" }
      ]},
      leadership: { score: 88, confidence: 0.92, evidence: [
        { quote: "I began teaching English to neighborhood children under a tree in our yard. Within a year, we had 50 students", explanation: "Self-initiated program that grew organically, showing genuine leadership ability" },
        { quote: "I gathered a team of five classmates, we researched affordable water filtration, wrote proposals to three NGOs", explanation: "Demonstrated ability to mobilize peers and navigate institutional processes" }
      ]},
      technicalPotential: { score: 70, confidence: 0.75, evidence: [
        { quote: "we researched affordable water filtration, wrote proposals to three NGOs, and installed filters in three schools", explanation: "Applied scientific research to practical problem-solving" }
      ]},
      creativity: { score: 65, confidence: 0.70, evidence: [
        { quote: "we showed up at their office in Almaty — a 14-hour bus ride — with our data and a prototype", explanation: "Unconventional approach to securing funding shows resourcefulness" }
      ]},
      resilience: { score: 95, confidence: 0.97, evidence: [
        { quote: "Growing up in Qyzylorda, I watched my grandmother walk two kilometers every morning to fetch clean water. This was not a story from the past — this was 2019", explanation: "Personal experience of systemic disadvantage, presented without self-pity" },
        { quote: "We failed with the first two NGOs. The third said yes only because we showed up at their office", explanation: "Demonstrated persistence through multiple rejections" },
        { quote: "After my grandmother got sick from contaminated water, I couldn't just sit and study biology in a textbook", explanation: "Transformed personal hardship into motivation for action" }
      ]},
      socialImpact: { score: 90, confidence: 0.93, evidence: [
        { quote: "installed filters in three schools", explanation: "Tangible, measurable community impact" },
        { quote: "leadership really means — it's not about being in front, it's about lifting others up", explanation: "Deep understanding of service-oriented leadership" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.08, consistencyScore: 0.95, redFlags: [] },
    ai_summary: "Exceptional candidate demonstrating authentic leadership and resilience. Her trajectory from rural Qyzylorda — teaching 50+ children, leading a water filtration project, and persisting through NGO rejections — reveals genuine change-making potential. Highly aligned with InVision U's mission to discover hidden talent. Recommend for priority interview.",
    status: 'new'
  },
  {
    name: 'Nurlan Saduakas',
    email: 'nurlan.s@gmail.com',
    phone: '+7 702 234 5678',
    university: 'IITU',
    city: 'Almaty',
    region: 'Almaty',
    is_rural: false,
    gpa: 3.9,
    year_of_study: 3,
    achievements: [
      { type: 'project', title: 'EduBot - Telegram Learning Platform', description: 'Built a Telegram bot serving 2000+ students with daily math problems', year: 2024 },
      { type: 'award', title: 'Best Startup Award - TechOrdaHack', description: 'Won first place at national hackathon for EdTech solution', year: 2024 },
      { type: 'olympiad', title: 'Regional Mathematics Olympiad', description: 'Gold medal', year: 2022, level: 'regional' }
    ],
    skills: ['React', 'TypeScript', 'Python', 'Machine Learning', 'Product Management'],
    essay_text: `I believe technology should serve people, not the other way around. This is not a philosophical statement — it is the principle I code by every single day.

When I built EduBot, my Telegram learning platform, everyone told me to monetize it immediately. "You have 2000 users, charge them!" But most of my users are students from small towns who can barely afford internet. I chose to keep it free and fund it through a part-time job at a software company. The late nights were worth it when a student from Aktobe messaged me: "Thanks to your bot, I passed my UNT with 120 points and got into university."

At IITU, I quickly realized that being technically skilled isn't enough. I started organizing "Code for Good" workshops where CS students build free tools for NGOs. We've delivered three projects so far: a donation tracker for a children's hospital, a volunteer matching app for Red Crescent, and an inventory system for a food bank.

My vision is to build an AI-powered personalized education platform for Kazakhstan. Not a copy of Coursera — a system that understands that a student in Turkistan learns differently from a student in Almaty, that considers internet connectivity, language barriers, and economic constraints. InVision U's approach to education aligns perfectly with this vision. I want to learn from the best to build for those who have the least.`,
    ai_scores: {
      motivation: { score: 85, confidence: 0.90, evidence: [
        { quote: "My vision is to build an AI-powered personalized education platform for Kazakhstan", explanation: "Clear, ambitious, and specific goal with social purpose" },
        { quote: "I want to learn from the best to build for those who have the least", explanation: "Articulates why InVision U specifically matters to their goals" }
      ]},
      leadership: { score: 78, confidence: 0.85, evidence: [
        { quote: "I started organizing 'Code for Good' workshops where CS students build free tools for NGOs", explanation: "Self-initiated program connecting tech talent with social needs" },
        { quote: "We've delivered three projects so far", explanation: "Demonstrated ability to lead teams to deliver real results" }
      ]},
      technicalPotential: { score: 95, confidence: 0.95, evidence: [
        { quote: "Built a Telegram bot serving 2000+ students with daily math problems", explanation: "Proven ability to build and scale a technical product independently" },
        { quote: "a system that understands that a student in Turkistan learns differently from a student in Almaty", explanation: "Shows deep technical thinking about personalization and AI" }
      ]},
      creativity: { score: 80, confidence: 0.82, evidence: [
        { quote: "Not a copy of Coursera — a system that considers internet connectivity, language barriers, and economic constraints", explanation: "Original vision adapted to local context rather than copying Western models" }
      ]},
      resilience: { score: 62, confidence: 0.65, evidence: [
        { quote: "I chose to keep it free and fund it through a part-time job at a software company. The late nights were worth it", explanation: "Shows sacrifice and persistence, though from a relatively privileged position" }
      ]},
      socialImpact: { score: 88, confidence: 0.90, evidence: [
        { quote: "a donation tracker for a children's hospital, a volunteer matching app for Red Crescent, and an inventory system for a food bank", explanation: "Multiple concrete social impact projects delivered" },
        { quote: "most of my users are students from small towns who can barely afford internet. I chose to keep it free", explanation: "Prioritized social mission over personal profit" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.12, consistencyScore: 0.92, redFlags: [] },
    ai_summary: "Strong technical candidate with genuine social orientation. His track record of building free tools for underserved communities (EduBot, NGO projects) demonstrates both capability and values alignment. Technical potential is exceptional. Resilience score is moderate as challenges described are less severe. Solid candidate for interview.",
    status: 'interview'
  },
  {
    name: 'Dinara Ospanova',
    email: 'dinara.o@inbox.kz',
    phone: '+7 705 345 6789',
    university: 'Nazarbayev Intellectual School',
    city: 'Atyrau',
    region: 'Atyrau',
    is_rural: true,
    gpa: 3.5,
    year_of_study: 1,
    achievements: [
      { type: 'volunteering', title: 'Youth Mental Health Awareness', description: 'Founded a peer counseling program at school reaching 200 students', year: 2024 },
      { type: 'award', title: 'Regional Debate Champion', description: 'First place in Atyrau regional debate tournament', year: 2023 }
    ],
    skills: ['Psychology', 'Public Speaking', 'Kazakh Language', 'Peer Counseling', 'Event Organization'],
    essay_text: `In Atyrau, we don't talk about mental health. It's not that people don't suffer — they do. My best friend attempted suicide in 10th grade, and the school's response was to tell us to "focus on studies." That day, I decided silence was no longer an option.

I had no training, no resources, and no adult support when I started the peer counseling program. I read everything I could find online — psychology textbooks, WHO guidelines, crisis intervention manuals. I made mistakes. I said the wrong things sometimes. But I showed up, every day, in a small room during lunch break, and slowly, students started coming. First three, then ten, then we had a waiting list.

The hardest part wasn't learning psychology — it was fighting the stigma. Parents called me "the crazy girl who talks about feelings." A teacher told me I was "creating problems where none exist." But when two parents came to me privately, crying, saying their children had started talking to them again after years of silence — that was all the validation I needed.

I want to study at InVision U because I believe Kazakhstan's greatest untapped resource is not oil — it's the human potential locked behind walls of stigma, tradition, and silence. I want to become a clinical psychologist who builds systems, not just treats individuals. A mental health infrastructure for schools across Kazakhstan, starting from the places that need it most — places like Atyrau.`,
    ai_scores: {
      motivation: { score: 90, confidence: 0.93, evidence: [
        { quote: "I want to become a clinical psychologist who builds systems, not just treats individuals", explanation: "Ambitious systemic vision, not just personal career goals" },
        { quote: "A mental health infrastructure for schools across Kazakhstan, starting from the places that need it most", explanation: "Specific, actionable plan tied to personal experience" }
      ]},
      leadership: { score: 85, confidence: 0.90, evidence: [
        { quote: "I had no training, no resources, and no adult support when I started the peer counseling program", explanation: "Created something from nothing against institutional resistance" },
        { quote: "slowly, students started coming. First three, then ten, then we had a waiting list", explanation: "Organic growth demonstrates authentic leadership that attracts followers" }
      ]},
      technicalPotential: { score: 55, confidence: 0.60, evidence: [
        { quote: "I read everything I could find online — psychology textbooks, WHO guidelines, crisis intervention manuals", explanation: "Self-directed learning shows intellectual capacity, though in non-technical domain" }
      ]},
      creativity: { score: 75, confidence: 0.78, evidence: [
        { quote: "Kazakhstan's greatest untapped resource is not oil — it's the human potential locked behind walls of stigma", explanation: "Powerful reframing of national narrative shows creative thinking" }
      ]},
      resilience: { score: 93, confidence: 0.95, evidence: [
        { quote: "Parents called me 'the crazy girl who talks about feelings.' A teacher told me I was 'creating problems where none exist'", explanation: "Faced active opposition from adults and community, persisted regardless" },
        { quote: "My best friend attempted suicide in 10th grade, and the school's response was to tell us to 'focus on studies'", explanation: "Transformed traumatic personal experience into institutional change" }
      ]},
      socialImpact: { score: 92, confidence: 0.94, evidence: [
        { quote: "two parents came to me privately, crying, saying their children had started talking to them again after years of silence", explanation: "Measurable, deeply personal impact on families" },
        { quote: "Founded a peer counseling program at school reaching 200 students", explanation: "Scaled impact to significant portion of school population" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.05, consistencyScore: 0.97, redFlags: [] },
    ai_summary: "Remarkable candidate who demonstrates extraordinary courage and social impact. Despite active opposition from community and school, she built a peer counseling program reaching 200 students. Her essay is deeply authentic and emotionally powerful. Lower technical score is offset by exceptional resilience and social impact. Strongly recommended for interview.",
    status: 'new'
  },
  {
    name: 'Arman Tulegenov',
    email: 'arman.t@mail.ru',
    phone: '+7 700 456 7890',
    university: 'SDU',
    city: 'Almaty',
    region: 'Almaty',
    is_rural: false,
    gpa: 3.8,
    year_of_study: 2,
    achievements: [
      { type: 'olympiad', title: 'National Physics Olympiad', description: 'Silver medal', year: 2023, level: 'national' },
      { type: 'project', title: 'Smart Agriculture Sensor Network', description: 'IoT system for monitoring soil conditions, piloted at 2 farms', year: 2024 },
      { type: 'olympiad', title: 'National Mathematics Olympiad', description: 'Bronze medal', year: 2022, level: 'national' }
    ],
    skills: ['Physics', 'IoT', 'Arduino', 'Python', 'Data Analysis', 'Agriculture Tech'],
    essay_text: `My grandfather is a farmer in Almaty region. Every year, he guesses when to water, when to fertilize, and when to harvest. Sometimes he guesses right. Sometimes the crop fails and the family borrows money until next season. This cycle has repeated for three generations.

Last summer, I spent two months on his farm with a box of Arduino sensors and a solar panel. By August, we had a working prototype that measured soil moisture, temperature, and pH levels, sending alerts to his phone. My grandfather, who had never used a smartphone app before, was checking soil data five times a day.

The pilot expanded to a neighbor's farm. The results were promising — 15% less water usage, better timing on fertilizer application. Nothing revolutionary by Silicon Valley standards, but in a village where farming decisions haven't changed in 50 years, it felt like a breakthrough.

I am applying to InVision U because I want to bridge the gap between high technology and rural Kazakhstan. Our villages don't need cutting-edge AI — they need practical, affordable solutions built by people who understand both the technology and the context. I've seen too many "smart agriculture" startups fail because they designed for California farms, not Kazakh ones. I want to build the opposite.`,
    ai_scores: {
      motivation: { score: 87, confidence: 0.90, evidence: [
        { quote: "I want to bridge the gap between high technology and rural Kazakhstan", explanation: "Clear mission connecting technical skills to social need" },
        { quote: "Our villages don't need cutting-edge AI — they need practical, affordable solutions", explanation: "Mature, realistic understanding of what technology can do" }
      ]},
      leadership: { score: 68, confidence: 0.72, evidence: [
        { quote: "The pilot expanded to a neighbor's farm", explanation: "Shows ability to gain trust and expand impact, though leadership evidence is limited" }
      ]},
      technicalPotential: { score: 92, confidence: 0.94, evidence: [
        { quote: "I spent two months on his farm with a box of Arduino sensors and a solar panel. By August, we had a working prototype", explanation: "Self-directed technical project from hardware to software, deployed in real conditions" },
        { quote: "15% less water usage, better timing on fertilizer application", explanation: "Quantifiable results from technical implementation" }
      ]},
      creativity: { score: 82, confidence: 0.85, evidence: [
        { quote: "I've seen too many 'smart agriculture' startups fail because they designed for California farms, not Kazakh ones", explanation: "Critical analysis of existing solutions shows original thinking" }
      ]},
      resilience: { score: 72, confidence: 0.75, evidence: [
        { quote: "Sometimes the crop fails and the family borrows money until next season. This cycle has repeated for three generations", explanation: "Family context shows awareness of economic challenges, though applicant is from Almaty" }
      ]},
      socialImpact: { score: 78, confidence: 0.82, evidence: [
        { quote: "Nothing revolutionary by Silicon Valley standards, but in a village where farming decisions haven't changed in 50 years, it felt like a breakthrough", explanation: "Understands and values incremental, contextually meaningful impact" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.15, consistencyScore: 0.90, redFlags: [] },
    ai_summary: "Strong technical candidate with excellent practical problem-solving skills. His smart agriculture project demonstrates the ability to apply technology to real-world problems with measurable results. Essay is authentic and well-grounded. Good fit for InVision U's mission of connecting talent with social impact.",
    status: 'under_review'
  },
  {
    name: 'Madina Bekturova',
    email: 'madina.b@student.kz',
    phone: '+7 708 567 8901',
    university: 'Turkistan University',
    city: 'Turkistan',
    region: 'Turkistan',
    is_rural: true,
    gpa: 3.3,
    year_of_study: 1,
    achievements: [
      { type: 'volunteering', title: 'Girls in STEM Workshop Organizer', description: 'Monthly workshops teaching coding to girls in Turkistan, 80+ participants', year: 2024 },
      { type: 'project', title: 'Local Business Digitization', description: 'Helped 15 small businesses create social media presence and simple websites', year: 2023 }
    ],
    skills: ['Web Development', 'Social Media Marketing', 'Kazakh Language', 'Teaching', 'Community Building'],
    essay_text: `When I told my father I wanted to study computer science, he laughed. Not cruelly — he genuinely thought it was funny. "Computers are for boys in Almaty," he said. "You should be a teacher. Teachers are respected here."

He wasn't wrong about the respect part. In Turkistan, teachers are second only to elders. But I wanted to be a different kind of teacher. I started "Girls Code Turkistan" from my bedroom with a borrowed laptop and a cracked screen. The first session had four girls and we learned HTML by building a page about our favorite Kazakh poets. Now we have 80 regular participants and companies in Almaty have started donating old laptops.

The business digitization project happened by accident. A woman selling handmade textiles at the bazaar asked if I could "put her shop on the internet." One Instagram page later, her orders tripled. Word spread. I've now helped 15 small businesses get online. Most are run by women.

My GPA isn't perfect — I struggled with the transition to university-level math, and honestly, my internet at home is so slow that watching lecture recordings is impossible some weeks. But I learn fast when given resources, and I never stop trying. InVision U would give me the tools and environment I need to turn "Girls Code Turkistan" into "Girls Code Kazakhstan."`,
    ai_scores: {
      motivation: { score: 88, confidence: 0.91, evidence: [
        { quote: "InVision U would give me the tools and environment I need to turn 'Girls Code Turkistan' into 'Girls Code Kazakhstan'", explanation: "Specific scaling vision directly tied to InVision U opportunity" }
      ]},
      leadership: { score: 82, confidence: 0.87, evidence: [
        { quote: "I started 'Girls Code Turkistan' from my bedroom with a borrowed laptop and a cracked screen", explanation: "Created impactful program despite extreme resource constraints" },
        { quote: "Now we have 80 regular participants and companies in Almaty have started donating old laptops", explanation: "Grew initiative to attract external support, demonstrating leadership credibility" }
      ]},
      technicalPotential: { score: 68, confidence: 0.70, evidence: [
        { quote: "I've now helped 15 small businesses get online", explanation: "Practical technical application, though more applied than theoretical" }
      ]},
      creativity: { score: 77, confidence: 0.80, evidence: [
        { quote: "we learned HTML by building a page about our favorite Kazakh poets", explanation: "Creative cultural integration into tech education makes learning relatable" }
      ]},
      resilience: { score: 94, confidence: 0.96, evidence: [
        { quote: "When I told my father I wanted to study computer science, he laughed", explanation: "Faced cultural gender barriers in pursuing tech" },
        { quote: "my internet at home is so slow that watching lecture recordings is impossible some weeks", explanation: "Infrastructure barriers that urban students never face" },
        { quote: "I started 'Girls Code Turkistan' from my bedroom with a borrowed laptop and a cracked screen", explanation: "Built impactful program with minimal resources" }
      ]},
      socialImpact: { score: 91, confidence: 0.93, evidence: [
        { quote: "80 regular participants and companies in Almaty have started donating old laptops", explanation: "Significant measurable community impact addressing gender gap in tech" },
        { quote: "One Instagram page later, her orders tripled. Word spread. I've now helped 15 small businesses get online. Most are run by women", explanation: "Economic empowerment of women entrepreneurs through digital skills" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.06, consistencyScore: 0.93, redFlags: [] },
    ai_summary: "Outstanding resilience candidate. Despite gender barriers, poor infrastructure, and limited resources in Turkistan, she built 'Girls Code Turkistan' (80+ participants) and digitized 15 businesses. Lower GPA is contextually explained by infrastructure limitations. This is exactly the type of hidden talent InVision U was designed to find. Priority interview recommended.",
    status: 'new'
  },
  {
    name: 'Bekzat Yermekbayev',
    email: 'bekzat.y@gmail.com',
    phone: '+7 703 678 9012',
    university: 'Nazarbayev University',
    city: 'Astana',
    region: 'Astana',
    is_rural: false,
    gpa: 3.95,
    year_of_study: 3,
    achievements: [
      { type: 'olympiad', title: 'International Mathematics Olympiad', description: 'Honorable mention', year: 2022, level: 'national' },
      { type: 'olympiad', title: 'National Informatics Olympiad', description: 'Gold medal', year: 2023, level: 'national' },
      { type: 'project', title: 'Research Paper on NLP', description: 'Co-authored paper on Kazakh language NLP accepted at regional conference', year: 2024 },
      { type: 'award', title: 'Dean\'s Honor List', description: '5 consecutive semesters', year: 2024 }
    ],
    skills: ['Machine Learning', 'NLP', 'Python', 'Research', 'Mathematics', 'C++'],
    essay_text: `As a computer science student at Nazarbayev University, I have been fortunate to receive an excellent education. My research focuses on natural language processing for the Kazakh language, which remains critically underrepresented in the global AI landscape.

I am motivated by the potential of artificial intelligence to transform education and governance in Kazakhstan. My goal is to pursue graduate studies in AI and return to build language technologies that work for Kazakh speakers. Currently, voice assistants, translation tools, and educational software barely support our language.

I have maintained a 3.95 GPA while co-authoring a research paper on Kazakh NLP. I have also won multiple olympiad medals in mathematics and informatics. I believe my academic track record demonstrates my commitment to excellence and my ability to contribute meaningfully to the InVision U community.

I would be honored to join InVision U and further develop my research capabilities alongside like-minded individuals who share a passion for Kazakhstan's technological advancement.`,
    ai_scores: {
      motivation: { score: 70, confidence: 0.75, evidence: [
        { quote: "My goal is to pursue graduate studies in AI and return to build language technologies that work for Kazakh speakers", explanation: "Clear academic goal but expressed in somewhat generic terms" }
      ]},
      leadership: { score: 45, confidence: 0.60, evidence: [
        { quote: "co-authoring a research paper on Kazakh NLP", explanation: "Academic contribution but no evidence of leading people or initiatives" }
      ]},
      technicalPotential: { score: 96, confidence: 0.97, evidence: [
        { quote: "Co-authored paper on Kazakh language NLP accepted at regional conference", explanation: "Published research as an undergraduate demonstrates exceptional technical capability" },
        { quote: "Gold medal at National Informatics Olympiad", explanation: "Top-tier competitive programming achievement" }
      ]},
      creativity: { score: 55, confidence: 0.58, evidence: [
        { quote: "Kazakh language, which remains critically underrepresented in the global AI landscape", explanation: "Identifies a real gap, but approach is conventional academic path" }
      ]},
      resilience: { score: 35, confidence: 0.55, evidence: [] },
      socialImpact: { score: 50, confidence: 0.60, evidence: [
        { quote: "voice assistants, translation tools, and educational software barely support our language", explanation: "Identifies important social need but no evidence of community engagement" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.45, consistencyScore: 0.88, redFlags: [
      "Essay reads as formulaic and lacks personal specifics beyond academic achievements",
      "No mention of specific challenges, failures, or personal growth moments",
      "Writing style is polished but impersonal — possible AI assistance"
    ] },
    ai_summary: "Academically exceptional candidate with outstanding technical credentials. However, the essay lacks personal depth, specific stories, and evidence of leadership or community engagement. AI-written probability is moderate — the essay reads as polished but generic. Strong on paper but may not align with InVision U's focus on identifying hidden leadership potential and agents of change.",
    status: 'under_review'
  },
  {
    name: 'Zarina Abdullayeva',
    email: 'zarina.a@mail.kz',
    phone: '+7 706 789 0123',
    university: 'Aktau Polytechnic College',
    city: 'Aktau',
    region: 'Mangystau',
    is_rural: true,
    gpa: 3.4,
    year_of_study: 2,
    achievements: [
      { type: 'project', title: 'Solar-Powered Phone Charging Station', description: 'Built and installed at local bus station, used by 50+ people daily', year: 2024 },
      { type: 'volunteering', title: 'Beach Cleanup Coordinator', description: 'Organized monthly Caspian Sea beach cleanups with 100+ volunteers over 18 months', year: 2024 }
    ],
    skills: ['Electrical Engineering', 'Solar Energy', 'Environmental Science', 'Event Planning', 'Kazakh'],
    essay_text: `Aktau sits on the edge of the Caspian Sea, surrounded by desert and oil fields. Everyone here works in oil or dreams of working in oil. I dream of something different.

Last year, I watched a documentary about solar energy in Morocco. Morocco and Mangystau have similar climates — endless sun, vast open spaces. If Morocco can build the world's largest solar farm, why can't we? That question wouldn't leave my mind.

I couldn't build a solar farm, but I could start small. Using parts salvaged from old electronics at the bazaar and a solar panel I ordered online with three months of saved lunch money, I built a phone charging station at the bus stop near my college. The first week, someone tried to steal it. I added a lock and a sign: "Free charging — powered by Aktau's sun." Now about 50 people use it every day. Bus drivers call it "Zarina's station."

The beach cleanups started because I couldn't stand watching plastic wash up on our shore while oil companies talked about "environmental responsibility" in their glossy reports. Organizing 100+ volunteers taught me that people want to act — they just need someone to organize it and show up first.

I know my GPA isn't the highest and I come from a polytechnic college, not a university. But I've built things that work in the real world, and I've proven that one person with a good idea and stubbornness can make a difference. InVision U sees potential, not pedigree. That's why I'm applying.`,
    ai_scores: {
      motivation: { score: 86, confidence: 0.88, evidence: [
        { quote: "If Morocco can build the world's largest solar farm, why can't we? That question wouldn't leave my mind", explanation: "Genuine intellectual curiosity connecting global knowledge to local context" },
        { quote: "InVision U sees potential, not pedigree. That's why I'm applying", explanation: "Self-aware and direct about why this program specifically fits" }
      ]},
      leadership: { score: 80, confidence: 0.85, evidence: [
        { quote: "Organizing 100+ volunteers taught me that people want to act — they just need someone to organize it and show up first", explanation: "Demonstrated community mobilization at significant scale" }
      ]},
      technicalPotential: { score: 74, confidence: 0.78, evidence: [
        { quote: "Using parts salvaged from old electronics at the bazaar and a solar panel I ordered online", explanation: "Resourceful engineering with limited materials shows strong practical technical ability" }
      ]},
      creativity: { score: 85, confidence: 0.87, evidence: [
        { quote: "I added a lock and a sign: 'Free charging — powered by Aktau's sun'", explanation: "Pragmatic problem-solving combined with community branding" },
        { quote: "Using parts salvaged from old electronics at the bazaar", explanation: "Creative resourcefulness in sourcing materials" }
      ]},
      resilience: { score: 90, confidence: 0.92, evidence: [
        { quote: "a solar panel I ordered online with three months of saved lunch money", explanation: "Personal financial sacrifice to pursue a vision" },
        { quote: "I know my GPA isn't the highest and I come from a polytechnic college, not a university", explanation: "Self-aware about structural disadvantages, undeterred" },
        { quote: "The first week, someone tried to steal it. I added a lock", explanation: "Adapted quickly to setbacks rather than giving up" }
      ]},
      socialImpact: { score: 84, confidence: 0.87, evidence: [
        { quote: "Now about 50 people use it every day. Bus drivers call it 'Zarina's station'", explanation: "Tangible daily community impact with community ownership" },
        { quote: "Organized monthly Caspian Sea beach cleanups with 100+ volunteers over 18 months", explanation: "Sustained environmental impact over extended period" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.04, consistencyScore: 0.96, redFlags: [] },
    ai_summary: "Highly authentic candidate with exceptional creativity and resilience. Her solar charging station project — built with saved lunch money and salvaged parts — perfectly embodies the maker spirit InVision U seeks. Essay voice is genuine and distinctive. Polytechnic background should not be held against her; her real-world impact exceeds many university students. Recommended for interview.",
    status: 'new'
  },
  {
    name: 'Daulet Karimov',
    email: 'daulet.k@mail.ru',
    phone: '+7 701 890 1234',
    university: 'Karaganda Technical University',
    city: 'Karaganda',
    region: 'Karaganda',
    is_rural: false,
    gpa: 3.6,
    year_of_study: 2,
    achievements: [
      { type: 'project', title: 'Mine Safety Monitoring App', description: 'Mobile app for real-time safety alerts in coal mines, tested at ArcelorMittal mine', year: 2024 },
      { type: 'volunteering', title: 'Tech Mentor for Orphanage', description: 'Weekly computer literacy classes at Karaganda orphanage for 1 year', year: 2023 },
      { type: 'olympiad', title: 'City Programming Competition', description: 'Second place', year: 2023, level: 'city' }
    ],
    skills: ['Mobile Development', 'Flutter', 'Firebase', 'Safety Systems', 'Mentoring'],
    essay_text: `My father worked in the mines for 22 years. Every morning, my mother would watch the news, waiting to hear that everyone came home safe. Some mornings, they didn't.

Karaganda was built on coal, and coal has taken a lot from this city. When I started studying programming, my first project wasn't a game or a social media app — it was a mine safety monitoring system. I built it in Flutter because I needed it to work on the cheap Android phones that miners actually use.

The app connects to existing gas sensors in the mines and sends real-time alerts to workers' phones when dangerous levels are detected. Getting access to test it at the ArcelorMittal mine took six months of emails, meetings, and being told "students can't solve safety problems." When they finally let me test it, the mine supervisor said, "This is what the engineers should have built ten years ago."

I also teach at the local orphanage every Saturday. Most of those kids have never touched a computer. Seeing a 12-year-old write her first Python program and then explain it to her friend — that's the moment I understood that technology literacy is not a luxury, it's a right.

InVision U is where builders go to learn how to build bigger. I'm already building. I just need the knowledge and network to scale from one mine to every mine in Kazakhstan.`,
    ai_scores: {
      motivation: { score: 89, confidence: 0.92, evidence: [
        { quote: "I'm already building. I just need the knowledge and network to scale from one mine to every mine in Kazakhstan", explanation: "Demonstrates clear scaling ambition grounded in existing work" },
        { quote: "InVision U is where builders go to learn how to build bigger", explanation: "Understands and articulates the value proposition clearly" }
      ]},
      leadership: { score: 75, confidence: 0.80, evidence: [
        { quote: "Getting access to test it at the ArcelorMittal mine took six months of emails, meetings", explanation: "Persistence in navigating corporate bureaucracy shows professional maturity" }
      ]},
      technicalPotential: { score: 88, confidence: 0.90, evidence: [
        { quote: "I built it in Flutter because I needed it to work on the cheap Android phones that miners actually use", explanation: "Thoughtful technology choices driven by end-user constraints" },
        { quote: "The app connects to existing gas sensors in the mines and sends real-time alerts", explanation: "Complex IoT integration project with real-world deployment" }
      ]},
      creativity: { score: 72, confidence: 0.75, evidence: [
        { quote: "my first project wasn't a game or a social media app — it was a mine safety monitoring system", explanation: "Unusual project choice for a student driven by personal purpose" }
      ]},
      resilience: { score: 80, confidence: 0.85, evidence: [
        { quote: "My father worked in the mines for 22 years. Every morning, my mother would watch the news", explanation: "Family background shaped by industrial hardship" },
        { quote: "being told 'students can't solve safety problems'", explanation: "Overcame dismissal from industry professionals" }
      ]},
      socialImpact: { score: 85, confidence: 0.88, evidence: [
        { quote: "the mine supervisor said, 'This is what the engineers should have built ten years ago'", explanation: "Industry validation of social impact potential" },
        { quote: "Seeing a 12-year-old write her first Python program and then explain it to her friend", explanation: "Sustained commitment to tech education for underprivileged children" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.10, consistencyScore: 0.94, redFlags: [] },
    ai_summary: "Compelling candidate combining technical skill with deep personal motivation. His mine safety app — tested at a real ArcelorMittal mine — demonstrates exceptional ability to build practical solutions for critical problems. Orphanage mentoring shows sustained social commitment. Authentic voice throughout.",
    status: 'interview'
  },
  {
    name: 'Aigerim Sultanova',
    email: 'aigerim.s@outlook.com',
    phone: '+7 707 901 2345',
    university: 'Al-Farabi Kazakh National University',
    city: 'Almaty',
    region: 'Almaty',
    is_rural: false,
    gpa: 3.85,
    year_of_study: 3,
    achievements: [
      { type: 'project', title: 'KazFinLit - Financial Literacy App', description: 'Gamified financial education app in Kazakh language with 5000+ downloads', year: 2024 },
      { type: 'award', title: 'Social Entrepreneurship Award', description: 'Winner at Central Asian Social Innovation Forum', year: 2024 },
      { type: 'olympiad', title: 'National Economics Olympiad', description: 'Gold medal', year: 2022, level: 'national' }
    ],
    skills: ['Economics', 'Product Design', 'UX Research', 'Kazakh Language', 'Financial Literacy', 'Entrepreneurship'],
    essay_text: `My mother lost our family's savings to a pyramid scheme in 2018. She's a smart woman — a school principal with 20 years of experience. But financial literacy education doesn't exist in Kazakhstan's school system, and the scheme's marketing was designed to exploit exactly that gap.

That loss changed the trajectory of our family and my life. Instead of the private university my parents had saved for, I studied harder and won a grant to Al-Farabi. Instead of anger, I chose to build a solution.

KazFinLit started as my term project but became my mission. It's a gamified app that teaches financial literacy in Kazakh — because most existing resources are in Russian or English, excluding the very people who need them most. We've had 5000 downloads in six months. More importantly, user surveys show that 70% of users changed at least one financial behavior after using the app.

The Social Innovation Forum award was validating, but what really matters to me is the messages. A grandmother in Shymkent wrote that she finally understood what "interest rate" means. A young father in Semey said he opened a savings account for the first time because of our app.

I believe financial empowerment is the foundation of all other empowerment. You cannot pursue your dreams if you're trapped in debt or vulnerable to fraud. InVision U's mission to create leaders who transform their communities aligns perfectly with my work. I want to scale KazFinLit to every school in Kazakhstan and eventually build a full financial inclusion platform.`,
    ai_scores: {
      motivation: { score: 91, confidence: 0.93, evidence: [
        { quote: "I want to scale KazFinLit to every school in Kazakhstan and eventually build a full financial inclusion platform", explanation: "Specific, ambitious scaling plan grounded in existing successful product" },
        { quote: "Instead of anger, I chose to build a solution", explanation: "Transformed personal loss into constructive action" }
      ]},
      leadership: { score: 83, confidence: 0.86, evidence: [
        { quote: "KazFinLit started as my term project but became my mission", explanation: "Self-directed initiative that grew beyond academic requirement" },
        { quote: "5000 downloads in six months", explanation: "Demonstrated ability to build and distribute a product at scale" }
      ]},
      technicalPotential: { score: 75, confidence: 0.78, evidence: [
        { quote: "It's a gamified app that teaches financial literacy in Kazakh", explanation: "Product development skills including gamification design" }
      ]},
      creativity: { score: 80, confidence: 0.83, evidence: [
        { quote: "most existing resources are in Russian or English, excluding the very people who need them most", explanation: "Identified language gap that others missed in financial education" }
      ]},
      resilience: { score: 78, confidence: 0.82, evidence: [
        { quote: "My mother lost our family's savings to a pyramid scheme in 2018", explanation: "Significant family financial setback" },
        { quote: "Instead of the private university my parents had saved for, I studied harder and won a grant", explanation: "Adapted to changed circumstances through merit" }
      ]},
      socialImpact: { score: 93, confidence: 0.95, evidence: [
        { quote: "70% of users changed at least one financial behavior after using the app", explanation: "Measured behavioral change — rare and impressive impact metric" },
        { quote: "A grandmother in Shymkent wrote that she finally understood what 'interest rate' means", explanation: "Cross-generational impact reaching underserved populations" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.11, consistencyScore: 0.95, redFlags: [] },
    ai_summary: "Impressive social entrepreneur with a working product (5000+ downloads) and measurable impact (70% behavior change). Personal story of family financial loss gives authentic motivation. Strong intersection of economics, technology, and social impact. Excellent fit for InVision U.",
    status: 'new'
  },
  {
    name: 'Temirlan Kozhaev',
    email: 'temirlan.k@yandex.kz',
    phone: '+7 700 012 3456',
    university: 'Shymkent Pedagogical Institute',
    city: 'Shymkent',
    region: 'Shymkent',
    is_rural: false,
    gpa: 3.1,
    year_of_study: 1,
    achievements: [
      { type: 'volunteering', title: 'Youth Football Coach', description: 'Volunteer coach for street children\'s football team for 2 years', year: 2024 }
    ],
    skills: ['Teaching', 'Sports Coaching', 'Youth Work', 'Kazakh Language'],
    essay_text: `I want to be a teacher because teachers changed my life. When I was failing school and spending time on the streets, my history teacher Mr. Serik found me and told me I was smart enough to do anything I wanted. Nobody had ever said that to me before.

I now coach football for kids who are where I used to be — on the streets with nothing to do and nobody who believes in them. We practice in a park because we can't afford a field. Some of them come without shoes. But they come, every day, because on that field they matter.

I don't have olympiad medals or fancy projects. I'm applying because InVision U says it looks for potential, not just achievements. My potential is in understanding kids who the system has given up on, because I was one of them. I want to study education and build programs that catch kids before they fall through the cracks, the way Mr. Serik caught me.`,
    ai_scores: {
      motivation: { score: 82, confidence: 0.85, evidence: [
        { quote: "I want to study education and build programs that catch kids before they fall through the cracks", explanation: "Clear purpose directly connected to personal experience" }
      ]},
      leadership: { score: 70, confidence: 0.75, evidence: [
        { quote: "I now coach football for kids who are where I used to be", explanation: "Giving back through coaching shows informal but genuine leadership" }
      ]},
      technicalPotential: { score: 35, confidence: 0.50, evidence: [] },
      creativity: { score: 58, confidence: 0.60, evidence: [
        { quote: "We practice in a park because we can't afford a field", explanation: "Resourcefulness in making things work with nothing" }
      ]},
      resilience: { score: 92, confidence: 0.93, evidence: [
        { quote: "When I was failing school and spending time on the streets", explanation: "Overcame street life and academic failure" },
        { quote: "my history teacher Mr. Serik found me and told me I was smart enough to do anything", explanation: "Transformative moment that changed his trajectory" },
        { quote: "Some of them come without shoes. But they come, every day, because on that field they matter", explanation: "Understands what it means to have nothing and shows deep empathy" }
      ]},
      socialImpact: { score: 80, confidence: 0.84, evidence: [
        { quote: "I now coach football for kids who are where I used to be", explanation: "Directly paying forward the mentorship that saved him" },
        { quote: "I don't have olympiad medals or fancy projects", explanation: "Honest self-assessment — lack of traditional achievements doesn't diminish real impact" }
      ]}
    },
    ai_flags: { aiWrittenProbability: 0.03, consistencyScore: 0.98, redFlags: [] },
    ai_summary: "Highly authentic candidate with an extraordinary personal story of transformation. Essay is raw, honest, and unmistakably human. Low technical score is offset by exceptional resilience and clear social purpose. This is the kind of candidate traditional selection processes would miss but InVision U was designed to find. His essay is the most genuine in this cohort. Consider for interview despite limited formal achievements.",
    status: 'new'
  }
];

export async function seedDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    // Check if data already exists
    const existing = await client.query('SELECT COUNT(*) FROM candidates');
    if (parseInt(existing.rows[0].count) > 0) {
      console.log('Database already seeded, skipping');
      return;
    }

    // Insert default scoring config
    await client.query(
      'INSERT INTO scoring_config (id, weights) VALUES (1, $1) ON CONFLICT (id) DO NOTHING',
      [JSON.stringify(DEFAULT_WEIGHTS)]
    );

    // Insert candidates
    for (const c of SEED_CANDIDATES) {
      const aiScores = c.ai_scores;
      const achievementScore = calculateAchievementScore(c.achievements as any);
      const compositeScore = calculateCompositeScore(aiScores as any, achievementScore, c.is_rural, DEFAULT_WEIGHTS);

      await client.query(
        `INSERT INTO candidates (
          name, email, phone, university, city, region, is_rural,
          gpa, year_of_study, achievements, skills,
          essay_text, ai_scores, ai_summary, ai_flags,
          ai_model_version, ai_analyzed_at,
          composite_score, achievement_score, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          c.name, c.email, c.phone, c.university, c.city, c.region, c.is_rural,
          c.gpa, c.year_of_study, JSON.stringify(c.achievements), c.skills,
          c.essay_text, JSON.stringify(c.ai_scores), c.ai_summary, JSON.stringify(c.ai_flags),
          'claude-haiku-4-5-20251001', new Date().toISOString(),
          compositeScore, achievementScore, c.status
        ]
      );
    }

    console.log(`Seeded ${SEED_CANDIDATES.length} candidates`);
  } finally {
    client.release();
  }
}
