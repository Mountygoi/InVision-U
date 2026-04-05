import { useState } from 'react';
import { Button, Card, Typography, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../i18n/ThemeContext';
import { API } from '../config';

const { Title, Text } = Typography;

// ── Types ──────────────────────────────────────────────────────────────────

type ClusterId =
  | 'leadershipInitiative'
  | 'responsibility'
  | 'growthMindset'
  | 'ambition'
  | 'ethics'
  | 'communityOrientation'
  | 'collaboration'
  | 'criticalThinking';

interface Option {
  text: string;
  score: number;
}

interface Question {
  id: number;
  text: string;
  clusterId: ClusterId;
  options: Option[];
}

interface Cluster {
  id: ClusterId;
  label: string;
  icon: string;
  questions: Question[];
}

// ── Data ───────────────────────────────────────────────────────────────────

const CLUSTERS: Cluster[] = [
  {
    id: 'leadershipInitiative',
    label: 'Leadership Initiative',
    icon: '🚀',
    questions: [
      {
        id: 1,
        clusterId: 'leadershipInitiative',
        text: 'When I see that something can be improved, I usually…',
        options: [
          { text: 'Wait until I fully understand how to make it better.', score: 2 },
          { text: 'Discuss with others whether something should be changed.', score: 3 },
          { text: 'Try to make an improvement right away, even a small one.', score: 4 },
          { text: 'Notice what could be better but avoid getting involved unless asked.', score: 1 },
        ],
      },
      {
        id: 2,
        clusterId: 'leadershipInitiative',
        text: 'When a group discussion reaches a \'dead end\' and no one suggests ideas, I…',
        options: [
          { text: 'Pause and wait for someone else to speak first.', score: 2 },
          { text: 'Ask a question to restart the discussion.', score: 3 },
          { text: 'Offer an idea, even if it\'s not fully developed.', score: 4 },
          { text: 'Suggest postponing the discussion until later.', score: 1 },
        ],
      },
      {
        id: 13,
        clusterId: 'leadershipInitiative',
        text: 'When I\'m praised for good work, I…',
        options: [
          { text: 'Take it as a sign to aim even higher.', score: 4 },
          { text: 'Feel happy and think about maintaining this level.', score: 3 },
          { text: 'Thank them and keep doing the same.', score: 2 },
          { text: 'Feel embarrassed and try not to stand out again.', score: 1 },
        ],
      },
      {
        id: 14,
        clusterId: 'leadershipInitiative',
        text: 'When I\'m offered a challenging, high-risk task where I could shine, I…',
        options: [
          { text: 'Avoid such situations.', score: 1 },
          { text: 'Weigh the risks and prepare to minimize errors.', score: 3 },
          { text: 'Wait for someone else to take it first.', score: 2 },
          { text: 'Take it on — the chance to prove myself is worth the risk.', score: 4 },
        ],
      },
      {
        id: 15,
        clusterId: 'leadershipInitiative',
        text: 'When I imagine my ideal career path, I see myself…',
        options: [
          { text: 'In a position where my decisions make a real impact.', score: 4 },
          { text: 'As an expert whose opinion is respected.', score: 3 },
          { text: 'In a stable job with little responsibility.', score: 2 },
          { text: 'In a calm job without pressure to prove myself.', score: 1 },
        ],
      },
    ],
  },
  {
    id: 'responsibility',
    label: 'Responsibility',
    icon: '⚖️',
    questions: [
      {
        id: 4,
        clusterId: 'responsibility',
        text: 'If a teammate makes a mistake that affects my part of the project, I…',
        options: [
          { text: 'Discuss it with them and help fix it since it\'s a shared outcome.', score: 4 },
          { text: 'Inform the supervisor and let them decide what to do.', score: 2 },
          { text: 'Mention the mistake but avoid interfering — everyone is responsible for their part.', score: 2 },
          { text: 'Point out that my part was done correctly and it\'s not my responsibility.', score: 1 },
        ],
      },
      {
        id: 5,
        clusterId: 'responsibility',
        text: 'If I promised to help someone but realize I won\'t make it on time, I…',
        options: [
          { text: 'Let them know I can\'t help and explain why.', score: 3 },
          { text: 'Inform them early, apologize, and try to fulfill my promise later.', score: 4 },
          { text: 'Avoid contact for a while to skip awkward explanations.', score: 1 },
          { text: 'Wait until they solve it on their own.', score: 1 },
        ],
      },
      {
        id: 6,
        clusterId: 'responsibility',
        text: 'If I promised the team to complete a task but realize I can\'t, I…',
        options: [
          { text: 'Inform them in advance and help reassign the task.', score: 4 },
          { text: 'Stay silent, hoping to finish at least part of it.', score: 2 },
          { text: 'Explain later that my situation changed and it\'s not my fault.', score: 1 },
          { text: 'Warn the team at the last moment and ask for their help.', score: 3 },
        ],
      },
      {
        id: 26,
        clusterId: 'responsibility',
        text: 'When I realize that my inaction has caused someone a problem, I…',
        options: [
          { text: 'Think that if I didn\'t do anything, I\'m not to blame.', score: 1 },
          { text: 'Admit that I\'m also responsible, because harm can come from silence.', score: 4 },
          { text: 'Believe that everyone is only responsible for their own actions.', score: 1 },
          { text: 'Reflect on how I could have acted differently.', score: 4 },
        ],
      },
      {
        id: 34,
        clusterId: 'responsibility',
        text: 'When someone in the group doesn\'t keep their promises, I…',
        options: [
          { text: 'Calmly discuss what went wrong and look for ways to rebuild trust.', score: 4 },
          { text: 'Decide that I can\'t trust anyone and it\'s better to do everything myself.', score: 1 },
          { text: 'Feel disappointed but try not to show it.', score: 2 },
          { text: 'Bring it up directly but politely, without blaming.', score: 4 },
        ],
      },
    ],
  },
  {
    id: 'growthMindset',
    label: 'Growth Mindset',
    icon: '🌱',
    questions: [
      {
        id: 3,
        clusterId: 'growthMindset',
        text: 'When I face a problem I\'ve never encountered before, I…',
        options: [
          { text: 'Look for a solution on my own, using available resources.', score: 4 },
          { text: 'First learn how others have solved similar problems.', score: 3 },
          { text: 'Ask someone who knows better.', score: 3 },
          { text: 'Leave it as it is to avoid making things worse.', score: 1 },
        ],
      },
      {
        id: 7,
        clusterId: 'growthMindset',
        text: 'When I\'m learning something new and face difficulties, I…',
        options: [
          { text: 'See it as part of growth and look for solutions.', score: 4 },
          { text: 'Stop doing it, thinking it\'s just not for me.', score: 1 },
          { text: 'Put it aside and return later when inspired.', score: 2 },
          { text: 'Ask for help to save time.', score: 3 },
        ],
      },
      {
        id: 8,
        clusterId: 'growthMindset',
        text: 'When I think about my future, I…',
        options: [
          { text: 'Plan which skills to develop to move forward.', score: 4 },
          { text: 'Go with the flow — life will show the way.', score: 2 },
          { text: 'Listen to advice and try to define a direction for growth.', score: 3 },
          { text: 'Don\'t think about it much — luck decides most things.', score: 1 },
        ],
      },
      {
        id: 9,
        clusterId: 'growthMindset',
        text: 'When I notice the teacher explains something superficially, I…',
        options: [
          { text: 'Assume it\'s not that important.', score: 1 },
          { text: 'Ask for additional reading materials.', score: 3 },
          { text: 'Wait, hoping the next class will clarify things.', score: 2 },
          { text: 'Find extra sources and study the topic deeper on my own.', score: 4 },
        ],
      },
      {
        id: 10,
        clusterId: 'growthMindset',
        text: 'When a task takes more time than expected, I…',
        options: [
          { text: 'Adjust my approach and continue until I finish.', score: 4 },
          { text: 'Switch to something else to avoid getting stuck.', score: 2 },
          { text: 'Wait until I get more support or resources.', score: 1 },
          { text: 'Break it down into smaller parts to move gradually.', score: 4 },
        ],
      },
    ],
  },
  {
    id: 'ambition',
    label: 'Ambition',
    icon: '🎯',
    questions: [
      {
        id: 11,
        clusterId: 'ambition',
        text: 'When I lack motivation or energy, I…',
        options: [
          { text: 'Remind myself why I started and finish anyway.', score: 4 },
          { text: 'Switch to easier parts to maintain momentum.', score: 3 },
          { text: 'Stop, believing that forcing myself won\'t help.', score: 1 },
          { text: 'Take a break and wait for the right mood.', score: 2 },
        ],
      },
      {
        id: 12,
        clusterId: 'ambition',
        text: 'When competition rules suddenly change at the final stage, I…',
        options: [
          { text: 'Complete it formally — it\'s too late to change much.', score: 2 },
          { text: 'Keep the same approach but improve the presentation.', score: 3 },
          { text: 'Adapt my project to the new requirements.', score: 4 },
          { text: 'Drop out, believing it\'s unfair.', score: 1 },
        ],
      },
      {
        id: 28,
        clusterId: 'ambition',
        text: 'When I think about my city (or neighborhood), I…',
        options: [
          { text: 'Dream of leaving as soon as possible — nothing will ever change here.', score: 1 },
          { text: 'Wish it could become more comfortable and safer.', score: 3 },
          { text: 'Think that little depends on me personally.', score: 1 },
          { text: 'Want people here to feel they can make changes themselves.', score: 4 },
        ],
      },
      {
        id: 29,
        clusterId: 'ambition',
        text: 'When I think about my future, I…',
        options: [
          { text: 'Believe that stability and comfort are the most important things.', score: 2 },
          { text: 'Want to combine personal success with helping others.', score: 4 },
          { text: 'Want to be useful to people, not just earn money.', score: 3 },
          { text: 'Think that helping others is a personal choice, not an obligation.', score: 2 },
        ],
      },
      {
        id: 38,
        clusterId: 'ambition',
        text: 'When I think about my future, I…',
        options: [
          { text: 'Believe that my efforts will determine what I achieve.', score: 4 },
          { text: 'Think that circumstances and luck play the biggest role.', score: 1 },
          { text: 'Hope that if I don\'t give up, things will work out.', score: 3 },
          { text: 'Believe success depends more on fate than on personal effort.', score: 1 },
        ],
      },
    ],
  },
  {
    id: 'ethics',
    label: 'Ethics',
    icon: '🧭',
    questions: [
      {
        id: 16,
        clusterId: 'ethics',
        text: 'When I see injustice, but speaking up might complicate my life, I…',
        options: [
          { text: 'Prefer not to get involved to avoid trouble.', score: 1 },
          { text: 'Still speak up, because it\'s hard for me to stay silent when someone is hurt.', score: 4 },
          { text: 'Think it\'s not my business since I can\'t change anything anyway.', score: 1 },
          { text: 'Try at least to talk to the person affected.', score: 3 },
        ],
      },
      {
        id: 17,
        clusterId: 'ethics',
        text: 'If I notice someone takes my help for granted, I…',
        options: [
          { text: 'Try to explain that my help is a choice, not an obligation.', score: 3 },
          { text: 'Feel irritated and cut off contact completely.', score: 2 },
          { text: 'Distance myself, as I don\'t want to be taken advantage of.', score: 2 },
          { text: 'Keep helping anyway — I don\'t do it for gratitude.', score: 4 },
        ],
      },
      {
        id: 20,
        clusterId: 'ethics',
        text: 'When I notice that my university deletes negative feedback, explaining it as \'protecting its image,\' I…',
        options: [
          { text: 'Think it\'s normal practice and see nothing wrong with it.', score: 1 },
          { text: 'Ask the administration if they could at least analyze the complaints before deleting them.', score: 3 },
          { text: 'Suggest responding openly to criticism and using it to fix problems.', score: 4 },
          { text: 'Decide not to get involved, thinking it\'s not my area of influence.', score: 1 },
        ],
      },
      {
        id: 25,
        clusterId: 'ethics',
        text: 'If I find out that someone is getting advantages through connections, I…',
        options: [
          { text: 'Consider that being able to \'negotiate\' is also a kind of skill.', score: 1 },
          { text: 'Discuss it with others who are also dissatisfied, to see if something can be done.', score: 3 },
          { text: 'Think such things have always existed and are part of the system.', score: 1 },
          { text: 'Believe it\'s unfair and at least try to speak openly about it.', score: 4 },
        ],
      },
      {
        id: 27,
        clusterId: 'ethics',
        text: 'When someone says \'the end justifies the means,\' I…',
        options: [
          { text: 'Fully agree, because winners aren\'t judged.', score: 1 },
          { text: 'Partially agree — it depends on the consequences.', score: 2 },
          { text: 'Think that sometimes tough decisions are unavoidable.', score: 2 },
          { text: 'Believe that if the means cause harm, the goal loses its value.', score: 4 },
        ],
      },
    ],
  },
  {
    id: 'communityOrientation',
    label: 'Community Orientation',
    icon: '🌍',
    questions: [
      {
        id: 18,
        clusterId: 'communityOrientation',
        text: 'When I see someone doesn\'t have the materials for an exam, I…',
        options: [
          { text: 'Pretend not to notice, otherwise they\'ll keep asking.', score: 1 },
          { text: 'Share mine — we\'re learning together after all.', score: 4 },
          { text: 'Tell them where they can find the materials.', score: 3 },
          { text: 'Think everyone should take care of themselves.', score: 1 },
        ],
      },
      {
        id: 19,
        clusterId: 'communityOrientation',
        text: 'If, during an internship, I see that the supervisor uses students as free labor, I…',
        options: [
          { text: 'Gather opinions from other interns and prepare a constructive message to management together.', score: 4 },
          { text: 'Agree with others that \'everyone does that, there is no point trying to change anything.\'', score: 1 },
          { text: 'Prefer to finish my internship quietly and avoid unnecessary conflicts.', score: 1 },
          { text: 'Try to have a calm, honest conversation with the supervisor personally.', score: 3 },
        ],
      },
      {
        id: 21,
        clusterId: 'communityOrientation',
        text: 'When I see recycling bins installed on campus but nobody uses them, I…',
        options: [
          { text: 'Suggest adding a short explanation nearby to raise awareness.', score: 4 },
          { text: 'Think people just need time to adapt and decide not to interfere.', score: 2 },
          { text: 'Ignore it — it\'s not my initiative or responsibility.', score: 1 },
          { text: 'Simply use the bin correctly myself, because personal example matters more than words.', score: 3 },
        ],
      },
      {
        id: 23,
        clusterId: 'communityOrientation',
        text: 'When someone shares a personal story that goes against my values, I…',
        options: [
          { text: 'Decide that I shouldn\'t listen to something that contradicts my beliefs.', score: 1 },
          { text: 'Politely change the topic if I feel uncomfortable.', score: 2 },
          { text: 'Try to avoid such topics in the future.', score: 1 },
          { text: 'Try to listen without judgment to better understand the person.', score: 4 },
        ],
      },
      {
        id: 24,
        clusterId: 'communityOrientation',
        text: 'When someone receives fewer opportunities than others, I…',
        options: [
          { text: 'Try to understand how to level the playing field or support them.', score: 4 },
          { text: 'Believe that if someone didn\'t get the opportunity, they probably didn\'t deserve it.', score: 1 },
          { text: 'Think the main thing is to focus on my own business.', score: 1 },
          { text: 'Think life isn\'t always fair, but I try to be attentive to people.', score: 3 },
        ],
      },
    ],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: '🤝',
    questions: [
      {
        id: 22,
        clusterId: 'collaboration',
        text: 'If I am assigned to work with someone who is considered \'difficult\' by others, I…',
        options: [
          { text: 'Stay calm and cooperate without unnecessary emotions.', score: 3 },
          { text: 'Try to see their strengths and understand what lies behind their behavior.', score: 4 },
          { text: 'Work with them formally, just to complete the task.', score: 2 },
          { text: 'Prefer to avoid collaboration to save my nerves.', score: 1 },
        ],
      },
      {
        id: 31,
        clusterId: 'collaboration',
        text: 'When I notice that someone in the team has withdrawn, I…',
        options: [
          { text: 'Try to gently engage them through open discussion.', score: 3 },
          { text: 'Approach them directly and ask what\'s going on, as it\'s important to bring them back into the process.', score: 4 },
          { text: 'Think that not everyone has to be equally active.', score: 2 },
          { text: 'Don\'t pay attention — if they\'re silent, it means they don\'t want to participate.', score: 1 },
        ],
      },
      {
        id: 32,
        clusterId: 'collaboration',
        text: 'When a team discussion reaches a dead end, I…',
        options: [
          { text: 'Ask for an outside perspective to get a fresh view.', score: 3 },
          { text: 'Suggest identifying exactly where we disagree and moving forward from there.', score: 4 },
          { text: 'Propose voting to settle the issue and move on.', score: 3 },
          { text: 'Believe there\'s no point in arguing any further.', score: 1 },
        ],
      },
      {
        id: 33,
        clusterId: 'collaboration',
        text: 'When my classmates suggest teaming up for a project or competition, I…',
        options: [
          { text: 'Think it\'s easier to do everything myself so I don\'t depend on others.', score: 1 },
          { text: 'Agree to join if I understand how the roles will be distributed.', score: 3 },
          { text: 'Feel glad to work together, since collaboration increases our chances of success.', score: 4 },
          { text: 'Support the idea but try not to take an active role.', score: 2 },
        ],
      },
      {
        id: 35,
        clusterId: 'collaboration',
        text: 'When I come across new information, I…',
        options: [
          { text: 'Trust it if the source looks reliable.', score: 2 },
          { text: 'Sometimes verify it if something feels off.', score: 3 },
          { text: 'Think about who said it and why, and try to understand their motives and source.', score: 4 },
          { text: 'Don\'t see the point in checking — you can never know the full truth anyway.', score: 1 },
        ],
      },
    ],
  },
  {
    id: 'criticalThinking',
    label: 'Critical Thinking',
    icon: '🧠',
    questions: [
      {
        id: 30,
        clusterId: 'criticalThinking',
        text: 'When I hear someone criticize our community, I…',
        options: [
          { text: 'Think about how to reduce the reasons for criticism.', score: 4 },
          { text: 'Just agree — everyone has their opinion, no need to take it personally.', score: 2 },
          { text: 'Try to explain that things are not so simple and highlight the positive sides.', score: 3 },
          { text: 'Ignore it — criticism always exists, there\'s no point in trying to change anything.', score: 1 },
        ],
      },
      {
        id: 36,
        clusterId: 'criticalThinking',
        text: 'When someone points out my mistake, I…',
        options: [
          { text: 'Listen carefully, since others can notice what I might have missed.', score: 4 },
          { text: 'Assume the person is just being picky.', score: 1 },
          { text: 'Try not to pay attention, though I don\'t like being criticized.', score: 1 },
          { text: 'Feel a bit irritated but try to take the feedback constructively.', score: 3 },
        ],
      },
      {
        id: 37,
        clusterId: 'criticalThinking',
        text: 'When I\'m asked to do something new, I…',
        options: [
          { text: 'Refuse, because I don\'t like feeling inexperienced.', score: 1 },
          { text: 'Accept that I might not succeed right away and stay calm about it.', score: 4 },
          { text: 'Prefer to stick to what I already know well.', score: 1 },
          { text: 'Hope I\'ll manage, though I worry about possible mistakes.', score: 2 },
        ],
      },
      {
        id: 39,
        clusterId: 'criticalThinking',
        text: 'When I feel envy, I…',
        options: [
          { text: 'Acknowledge it and think about what I can do to improve myself.', score: 4 },
          { text: 'Think life is unfair and get into a bad mood.', score: 1 },
          { text: 'Try not to show that something has affected me.', score: 2 },
          { text: 'Shift my focus to something else to calm down.', score: 3 },
        ],
      },
      {
        id: 40,
        clusterId: 'criticalThinking',
        text: 'When I feel irritated by others, I…',
        options: [
          { text: 'Step aside to cool down a bit.', score: 3 },
          { text: 'Try not to show my irritation, even if I\'m boiling inside.', score: 2 },
          { text: 'Acknowledge my feelings and try to understand what exactly triggered me.', score: 4 },
          { text: 'Think irritation is a normal reaction and don\'t see a reason to overthink it.', score: 2 },
        ],
      },
    ],
  },
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// ── Component ──────────────────────────────────────────────────────────────

const PersonalityTest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Dark theme helpers
  const pageBg = isDark ? 'linear-gradient(160deg, #0f172a 0%, #1a2332 100%)' : 'linear-gradient(160deg, #fafafa 0%, #f0f4e8 100%)';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const textPrimary = isDark ? '#f1f5f9' : '#1E293B';
  const textSecondary = isDark ? '#94a3b8' : '#64748B';
  const surfaceBg = isDark ? '#334155' : '#f5f5f5';

  // Read candidateId from query param first, then localStorage
  const candidateId =
    searchParams.get('candidateId') ||
    localStorage.getItem('candidateId') ||
    localStorage.getItem('userEmail') ||
    '';

  const [clusterStep, setClusterStep] = useState(0);
  // answers: questionId → optionIndex (0–3)
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const currentCluster = CLUSTERS[clusterStep];
  const totalClusters = CLUSTERS.length;
  const isLastCluster = clusterStep === totalClusters - 1;

  const clusterComplete = currentCluster.questions.every(q => answers[q.id] !== undefined);

  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNext = () => {
    if (!clusterComplete) return;
    if (isLastCluster) {
      handleSubmit();
    } else {
      setClusterStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setClusterStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const answersArray = CLUSTERS.flatMap(cluster =>
      cluster.questions.map(q => ({
        questionId: q.id,
        clusterId: cluster.id,
        value: q.options[answers[q.id]].score,
      }))
    );

    setLoading(true);
    try {
      await axios.post(`${API}/personality/analyze`, {
        candidateId: candidateId || undefined,
        answers: answersArray,
      });
    } catch {
      // Even if analysis fails, navigate forward — scores are for admin only
    } finally {
      const params = candidateId ? `?candidateId=${encodeURIComponent(candidateId)}` : '';
      navigate(`/test${params}`);
    }
  };

  // ── Loading screen ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: isDark ? '#0f172a' : '#fafafa',
        fontFamily: "'Raleway', sans-serif",
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#c1f11d' }} spin />} />
        <Title level={3} style={{ marginTop: 24, color: textPrimary }}>
          ИИ анализирует ваш профиль ценностей...
        </Title>
        <Text style={{ color: textSecondary }}>Это займёт 10–20 секунд</Text>
      </div>
    );
  }

  // ── Test screen ──────────────────────────────────────────────────────────

  return (
    <div style={{
      padding: '40px 20px',
      background: pageBg,
      minHeight: '100vh', fontFamily: "'Raleway', sans-serif",
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>

        {/* Theme toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <Button size="small" type="text" onClick={toggleTheme} style={{ borderRadius: 8 }}>{theme === 'light' ? '🌙' : '☀️'}</Button>
        </div>

        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48,
            background: '#c1f11d',
            borderRadius: 12, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#141414', fontWeight: 'bold', fontSize: 18,
            fontFamily: "'Raleway', sans-serif",
          }}>iU</div>
          <Title level={2} style={{ marginBottom: 4, color: textPrimary, fontFamily: "'Raleway', sans-serif" }}>Тест ценностей и личности</Title>
          <Text style={{ color: textSecondary }}>
            Ответьте честно — нет правильных или неправильных ответов
          </Text>
        </div>

        {/* Cluster stepper */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6,
          flexWrap: 'wrap', marginBottom: 16,
        }}>
          {CLUSTERS.map((c, idx) => (
            <div
              key={c.id}
              title={c.label}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: idx < clusterStep ? '#52c41a'
                  : idx === clusterStep ? '#c1f11d'
                    : isDark ? '#334155' : '#E2E8F0',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
                transition: 'all 0.3s ease',
                cursor: idx < clusterStep ? 'pointer' : 'default',
              }}
              onClick={() => idx < clusterStep && setClusterStep(idx)}
            >
              {idx < clusterStep ? <CheckCircleFilled style={{ fontSize: 14 }} /> : idx + 1}
            </div>
          ))}
        </div>

        {/* Progress text */}
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
          Блок {clusterStep + 1} из 8
        </Text>

        {/* Cluster Card */}
        <Card variant="borderless" style={{
          borderRadius: 20, boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.3)' : '0 20px 40px rgba(0,0,0,0.06)', marginBottom: 24,
          background: cardBg, border: `1px solid ${borderColor}`,
        }}>
          {/* Cluster header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
          }}>
            <div style={{
              fontSize: 28, width: 44, height: 44, borderRadius: 12,
              background: surfaceBg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {currentCluster.icon}
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: textPrimary }}>
                {currentCluster.label}
              </Title>
            </div>
          </div>

          <div style={{
            height: 2, background: 'linear-gradient(90deg, #c1f11d, #3dedf1)',
            borderRadius: 2, marginBottom: 24,
          }} />

          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {currentCluster.questions.map((q, qIdx) => {
              const selectedIndex = answers[q.id];
              return (
                <div key={q.id}>
                  <Text style={{
                    fontSize: 15, lineHeight: 1.6, display: 'block',
                    marginBottom: 14, color: textPrimary,
                  }}>
                    <span style={{
                      fontWeight: 700, color: isDark ? '#a3e635' : '#4d7c0f',
                      marginRight: 8, fontSize: 13,
                    }}>
                      {clusterStep * 5 + qIdx + 1}.
                    </span>
                    {q.text}
                  </Text>

                  {/* Option cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((option, optIdx) => {
                      const isSelected = selectedIndex === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswer(q.id, optIdx)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 16px',
                            borderRadius: 12,
                            border: isSelected
                              ? '2px solid #c1f11d'
                              : `2px solid ${borderColor}`,
                            background: isSelected ? 'rgba(193,241,29,0.1)' : surfaceBg,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            outline: 'none',
                            width: '100%',
                          }}
                        >
                          <div style={{
                            minWidth: 28, height: 28, borderRadius: '50%',
                            background: isSelected ? '#c1f11d' : isDark ? '#334155' : '#E2E8F0',
                            color: isSelected ? '#141414' : textSecondary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                          }}>
                            {OPTION_LETTERS[optIdx]}
                          </div>
                          <span style={{
                            fontSize: 14, color: isSelected ? '#c1f11d' : isDark ? '#cbd5e1' : '#475569',
                            fontWeight: isSelected ? 600 : 400,
                            lineHeight: 1.5, paddingTop: 4,
                          }}>
                            {option.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            disabled={clusterStep === 0}
            style={{ borderRadius: 12, height: 48, paddingInline: 28 }}
          >
            Назад
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleNext}
            disabled={!clusterComplete}
            style={{
              borderRadius: 12, height: 48, paddingInline: 28,
              background: clusterComplete ? '#c1f11d' : undefined,
              color: clusterComplete ? '#141414' : undefined,
              border: 'none',
              fontWeight: 700,
              boxShadow: clusterComplete ? '0 4px 20px rgba(193,241,29,0.3)' : 'none',
            }}
          >
            {isLastCluster ? (
              'Отправить'
            ) : (
              <>Далее <ArrowRightOutlined /></>
            )}
          </Button>
        </div>

        {/* Answered count */}
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 12 }}>
          {Object.keys(answers).length} / 40 вопросов отвечено
        </Text>
      </div>
    </div>
  );
};

export default PersonalityTest;

