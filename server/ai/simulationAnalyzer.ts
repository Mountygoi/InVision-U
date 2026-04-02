import Groq from 'groq-sdk';

export interface SimulationMessage {
  role: 'candidate' | 'agent';
  agentId?: 'aigerim' | 'dauren' | 'nurlan';
  agentName?: string;
  content: string;
}

export interface SimulationMessageResponse {
  agentId: 'aigerim' | 'dauren' | 'nurlan';
  agentName: string;
  content: string;
}

export interface SimulationScores {
  leadership: number;
  empathy: number;
  conflictManagement: number;
  teamOrientation: number;
  decisionMaking: number;
  leadershipStyle: 'authoritative' | 'facilitative' | 'democratic' | 'passive';
  narrative: string;
  simulationScore: number;
  modelVersion: string;
  analyzedAt: string;
}

const AGENT_KEYS = ['aigerim', 'dauren', 'nurlan'] as const;
type AgentKey = typeof AGENT_KEYS[number];

const AGENTS: Record<AgentKey, { name: string; systemPrompt: string }> = {
  aigerim: {
    name: 'Айгерим',
    systemPrompt: `Ты Айгерим, участница студенческой волонтёрской команды в Казахстане.
Твой характер: ты перегружена домашними обстоятельствами и не успеваешь выполнить свою часть работы — подготовить учебные материалы. Ты чувствуешь себя виноватой, боишься разочаровать команду, но боишься показаться слабой и попросить конкретной помощи напрямую. Ты говоришь извиняющимся тоном, немного оправдываешься, иногда намекаешь на помощь, но не просишь напрямую.

СИТУАЦИЯ: Ваша команда из 4 человек организует бесплатные образовательные курсы для детей в малообеспеченном районе города. До презентации перед спонсором осталось 48 часов. Ты — единственная, кто должна подготовить учебные материалы, но не успеешь.

ПРАВИЛА: Отвечай ТОЛЬКО на русском языке. Максимум 2-3 коротких предложения. Оставайся в роли.
Не сдавайся легко — продолжай нервничать и чувствовать вину даже если лидер поддерживает тебя. Реагируй напрямую на то, что сказал лидер команды.`,
  },
  dauren: {
    name: 'Даурен',
    systemPrompt: `Ты Даурен, участник студенческой волонтёрской команды в Казахстане.
Твой характер: ты самоуверенный, убеждён что текущий подход команды изначально неправильный. Ты энергичный и напористый, хочешь кардинально изменить формат проекта прямо сейчас — в последние 48 часов. Ты не принимаешь возражений легко, давишь своим мнением, иногда критикуешь план других, считаешь что только твоя идея спасёт проект. Под давлением ты можешь немного уступить, но не сразу.

СИТУАЦИЯ: Ваша команда из 4 человек организует бесплатные образовательные курсы для детей в малообеспеченном районе города. До презентации перед спонсором осталось 48 часов. Ты уверен, что формат нужно полностью изменить.

ПРАВИЛА: Отвечай ТОЛЬКО на русском языке. Максимум 2-3 коротких предложения. Оставайся в роли.
Не соглашайся слишком легко — у тебя твёрдая позиция. Реагируй напрямую на то, что сказал лидер команды.`,
  },
  nurlan: {
    name: 'Нурлан',
    systemPrompt: `Ты Нурлан, участник студенческой волонтёрской команды в Казахстане.
Твой характер: ты выгоревший, апатичный, отвечаешь максимально коротко. Ты не злой — просто эмоционально истощён. Ты избегаешь брать на себя дополнительную ответственность, уклоняешься от конкретных вопросов, отвечаешь односложно ("ок", "не знаю", "как скажешь"). Только если лидер проявит искреннее участие и задаст прямой вопрос о твоём состоянии — ты можешь слегка открыться.

СИТУАЦИЯ: Ваша команда из 4 человек организует бесплатные образовательные курсы для детей в малообеспеченном районе города. До презентации перед спонсором осталось 48 часов. Ты молчишь и явно выгорел.

ПРАВИЛА: Отвечай ТОЛЬКО на русском языке. Максимум 1-2 предложения. Оставайся в роли.
Будь пассивным и уклончивым. Реагируй напрямую на то, что сказал лидер команды.`,
  },
};

export async function generateAgentResponse(
  history: SimulationMessage[],
  candidateMessage: string,
  turnIndex: number,
  candidateName?: string
): Promise<SimulationMessageResponse> {
  const agentKey = AGENT_KEYS[turnIndex % 3];
  const agent = AGENTS[agentKey];

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Inject candidate's real name into system prompt so agents address them correctly
  const nameNote = candidateName
    ? `\nВАЖНО: Лидера команды зовут ${candidateName}. Обращайся к нему/ней по имени ${candidateName} когда это уместно.`
    : '';

  // Build messages for the Groq call
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: agent.systemPrompt + nameNote },
  ];

  // Include recent history for context (last 8 messages max)
  const recent = history.slice(-8);
  for (const msg of recent) {
    if (msg.role === 'candidate') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.agentId === agentKey) {
      messages.push({ role: 'assistant', content: msg.content });
    }
  }

  // Add the current candidate message
  messages.push({ role: 'user', content: candidateMessage });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 120,
      temperature: 0.75,
    });

    const content = completion.choices[0]?.message?.content?.trim() || `(${agent.name} не отвечает)`;
    return { agentId: agentKey, agentName: agent.name, content };
  } catch (err) {
    console.error('Groq agent response error:', err);
    return { agentId: agentKey, agentName: agent.name, content: `(${agent.name} не отвечает)` };
  }
}

export async function analyzeLeadership(history: SimulationMessage[]): Promise<SimulationScores> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Build a readable transcript
  const transcript = history.map(msg => {
    if (msg.role === 'candidate') return `[CANDIDATE]: ${msg.content}`;
    return `[${msg.agentName?.toUpperCase() || msg.agentId?.toUpperCase()}]: ${msg.content}`;
  }).join('\n');

  const systemPrompt = `You are an admissions psychologist for InVision U — a competitive scholarship university in Kazakhstan that values leaders who GIVE more than they take, support their teams, and create impact in their communities.

You are analyzing a leadership simulation. The CANDIDATE played the role of an informal team leader trying to guide a team through a crisis: organizing free educational courses for children in an underprivileged neighborhood, with a sponsor presentation in 48 hours.

The team members were:
- AIGERIM: Overwhelmed, guilty, afraid to ask for help directly
- DAUREN: Confrontational, pushing his own agenda, resistant to other plans
- NURLAN: Burned out, passive, giving one-word replies

Evaluate the CANDIDATE's behavior across 5 dimensions (0-100 integer each):

1. leadership (0-100): Did they take initiative, give clear direction, step up to organize the team?
   - 80-100: Proactively led, set clear direction, assigned tasks
   - 60-79: Showed initiative but hesitated at key moments
   - 40-59: Reacted rather than led, waited for others
   - 0-39: Passive, avoided leadership responsibility

2. empathy (0-100): Did they acknowledge Aigerim's and Nurlan's difficulties? Did they offer concrete support?
   - 80-100: Genuinely engaged with both struggling members, offered specific help
   - 60-79: Acknowledged difficulties but support was vague
   - 40-59: Noticed but did not act on it meaningfully
   - 0-39: Ignored or dismissed struggling teammates

3. conflictManagement (0-100): How did they handle Dauren's pushback?
   - 80-100: Found a constructive middle ground, de-escalated without dismissing
   - 60-79: Managed conflict but not fully resolved
   - 40-59: Either caved completely or dismissed Dauren's concerns
   - 0-39: Ignored conflict or escalated it

4. teamOrientation (0-100): Did they use "we" language? Did they prioritize team success over personal image?
   - 80-100: Consistently team-first mindset, inclusive language, shared ownership
   - 60-79: Mostly team-focused with occasional self-focus
   - 40-59: Mixed signals
   - 0-39: Primarily self-focused or authoritarian

5. decisionMaking (0-100): Did they make concrete actionable decisions or stay abstract?
   - 80-100: Made clear, specific, practical decisions with reasoning
   - 60-79: Made decisions but lacked specificity
   - 40-59: Suggested directions but avoided committing
   - 0-39: Indecisive or avoided decisions entirely

Also determine leadershipStyle:
- "authoritative": gives commands, expects compliance, may not listen well
- "facilitative": asks questions, draws out ideas from team, coordinates
- "democratic": tries to get consensus from everyone before deciding
- "passive": avoids taking charge, reacts rather than leads

Write a 3-4 sentence English narrative for the admissions committee about what this candidate's behavior reveals about their values, leadership potential, and fit for InVision U's mission of developing leaders who give back to their communities.

Return ONLY valid JSON — no markdown, no explanation:
{
  "leadership": <integer 0-100>,
  "empathy": <integer 0-100>,
  "conflictManagement": <integer 0-100>,
  "teamOrientation": <integer 0-100>,
  "decisionMaking": <integer 0-100>,
  "leadershipStyle": "<authoritative|facilitative|democratic|passive>",
  "narrative": "<3-4 sentences in English>"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `SIMULATION TRANSCRIPT:\n\n${transcript}\n\nAnalyze and return JSON scores only.` },
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON in response');

    let jsonStr = raw.slice(firstBrace, lastBrace + 1);
    // Strip trailing commas before } or ]
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

    const parsed = JSON.parse(jsonStr);

    const scores: SimulationScores = {
      leadership: Math.round(Math.max(0, Math.min(100, Number(parsed.leadership) || 50))),
      empathy: Math.round(Math.max(0, Math.min(100, Number(parsed.empathy) || 50))),
      conflictManagement: Math.round(Math.max(0, Math.min(100, Number(parsed.conflictManagement) || 50))),
      teamOrientation: Math.round(Math.max(0, Math.min(100, Number(parsed.teamOrientation) || 50))),
      decisionMaking: Math.round(Math.max(0, Math.min(100, Number(parsed.decisionMaking) || 50))),
      leadershipStyle: ['authoritative', 'facilitative', 'democratic', 'passive'].includes(parsed.leadershipStyle)
        ? parsed.leadershipStyle
        : 'facilitative',
      narrative: typeof parsed.narrative === 'string' ? parsed.narrative : '',
      simulationScore: 0,
      modelVersion: 'llama-3.3-70b-versatile',
      analyzedAt: new Date().toISOString(),
    };

    scores.simulationScore = Math.round(
      (scores.leadership + scores.empathy + scores.conflictManagement + scores.teamOrientation + scores.decisionMaking) / 5
    );

    if (!scores.narrative) {
      scores.narrative = `The candidate demonstrated a ${scores.leadershipStyle} leadership style during this team crisis simulation. With a simulation score of ${scores.simulationScore}/100, they showed varying degrees of initiative and team support. Their strongest dimension was ${getTopDimension(scores)}, while there is clear room for growth in managing team dynamics under pressure.`;
    }

    return scores;
  } catch (err) {
    console.error('Groq leadership analysis error:', err);
    // Deterministic fallback
    return {
      leadership: 50, empathy: 50, conflictManagement: 50, teamOrientation: 50, decisionMaking: 50,
      leadershipStyle: 'facilitative',
      narrative: 'Analysis could not be completed due to a technical issue. Manual review is recommended.',
      simulationScore: 50,
      modelVersion: 'fallback',
      analyzedAt: new Date().toISOString(),
    };
  }
}

function getTopDimension(scores: SimulationScores): string {
  const dims: [string, number][] = [
    ['leadership', scores.leadership],
    ['empathy', scores.empathy],
    ['conflict management', scores.conflictManagement],
    ['team orientation', scores.teamOrientation],
    ['decision making', scores.decisionMaking],
  ];
  return dims.sort((a, b) => b[1] - a[1])[0][0];
}
