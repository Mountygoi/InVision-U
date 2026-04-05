import { useState, useRef, useEffect } from 'react';
import { Button, Typography, Input, Spin, Card } from 'antd';
import { SendOutlined, TeamOutlined, CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import type { SimulationChatMessage } from '../types';
import { useTheme } from '../i18n/ThemeContext';
import { API } from '../config';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Agent display config
const AGENT_CONFIG = {
  aigerim: { name: 'Айгерим', emoji: '😟', color: '#faad14', bg: '#fffbe6', label: 'Перегружена, чувствует вину' },
  dauren:  { name: 'Даурен',  emoji: '🔥', color: '#ff4d4f', bg: '#fff1f0', label: 'Уверен в своей правоте, конфликтный' },
  nurlan:  { name: 'Нурлан',  emoji: '😶', color: '#8c8c8c', bg: '#f5f5f5', label: 'Выгоревший, избегает ответственности' },
} as const;

// Hardcoded opening messages (instant, no API)
const OPENING_MESSAGES: SimulationChatMessage[] = [
  {
    role: 'agent', agentId: 'aigerim', agentName: 'Айгерим',
    content: 'Ребята, я не успею закончить материалы к завтрашнему вечеру... у меня дома ситуация. Извините.',
    timestamp: new Date().toISOString(),
  },
  {
    role: 'agent', agentId: 'dauren', agentName: 'Даурен',
    content: 'Я вообще думаю, что наш формат изначально был неправильным. Нам нужно всё переосмыслить, иначе спонсор не поверит.',
    timestamp: new Date().toISOString(),
  },
  {
    role: 'agent', agentId: 'nurlan', agentName: 'Нурлан',
    content: 'ок',
    timestamp: new Date().toISOString(),
  },
];


// All 3 agents reply after each candidate message; candidate sends 5 messages total
const TOTAL_TURNS = 5;
const AGENT_ORDER: Array<'aigerim' | 'dauren' | 'nurlan'> = ['aigerim', 'dauren', 'nurlan'];

export default function TeamSimulation() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidateId') || localStorage.getItem('candidateId') || '';
  const candidateName = localStorage.getItem('candidateName') || '';
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Dark theme helpers
  const pageBg = isDark ? '#0f172a' : '#fafafa';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const textPrimary = isDark ? '#f1f5f9' : '#1E293B';
  const textSecondary = isDark ? '#94a3b8' : '#64748B';
  const surfaceBg = isDark ? '#334155' : '#f5f5f5';

  const [phase, setPhase] = useState<'intro' | 'chat' | 'result'>('intro');
  const [messages, setMessages] = useState<SimulationChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [candidateTurnCount, setCandidateTurnCount] = useState(0);
  const [result, setResult] = useState<boolean>(false);
  const [finishLoading, setFinishLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  function startSimulation() {
    setMessages(OPENING_MESSAGES);
    setPhase('chat');
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || isAgentTyping || candidateTurnCount >= TOTAL_TURNS) return;

    const currentTurn = candidateTurnCount;

    const candidateMsg: SimulationChatMessage = {
      role: 'candidate',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const historyWithCandidate = [...messages, candidateMsg];
    setMessages(historyWithCandidate);
    setInputText('');
    setCandidateTurnCount(currentTurn + 1);
    setIsAgentTyping(true);

    // All 3 agents reply sequentially after each candidate message
    let currentHistory = historyWithCandidate;
    for (let i = 0; i < AGENT_ORDER.length; i++) {
      const agentIndex = i; // 0=aigerim, 1=dauren, 2=nurlan
      try {
        const response = await axios.post(`${API}/simulation/message`, {
          history: currentHistory,
          candidateMessage: text,
          turnIndex: agentIndex, // use agentIndex directly to pick specific agent
          candidateName: candidateName || undefined,
        });

        const agentMsg: SimulationChatMessage = {
          role: 'agent',
          agentId: response.data.agentId,
          agentName: response.data.agentName,
          content: response.data.content,
          timestamp: new Date().toISOString(),
        };

        currentHistory = [...currentHistory, agentMsg];
        setMessages([...currentHistory]);
      } catch (err) {
        console.error(`Agent ${AGENT_ORDER[agentIndex]} response error:`, err);
      }
    }

    setIsAgentTyping(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function finishSimulation() {
    if (finishLoading || candidateTurnCount < TOTAL_TURNS) return;
    setFinishLoading(true);
    try {
      await axios.post(`${API}/simulation/finish`, {
        history: messages,
        candidateId: candidateId || undefined,
      });
      setResult(true);
      setPhase('result');
    } catch (err) {
      console.error('Finish simulation error:', err);
    } finally {
      setFinishLoading(false);
    }
  }

  // ─── INTRO SCREEN ──────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{
        padding: '40px 20px',
        background: isDark ? 'linear-gradient(160deg, #0f172a 0%, #1a2332 100%)' : 'linear-gradient(160deg, #fafafa 0%, #f0f4e8 100%)',
        minHeight: '100vh',
        fontFamily: "'Raleway', sans-serif",
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button size="small" type="text" onClick={toggleTheme} style={{ borderRadius: 8 }}>{theme === 'light' ? '🌙' : '☀️'}</Button>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 56, height: 56,
              background: '#c1f11d',
              borderRadius: 16, margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TeamOutlined style={{ fontSize: 28, color: '#141414' }} />
            </div>
            <Title level={2} style={{ marginBottom: 8, color: textPrimary, fontFamily: "'Raleway', sans-serif" }}>Командная симуляция</Title>
            <Text style={{ fontSize: 15, color: textSecondary }}>
              Оценка лидерства и командной работы в реальной ситуации
            </Text>
          </div>

          {/* Scenario Card */}
          <Card
            variant="borderless"
            style={{ borderRadius: 20, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.06)', marginBottom: 28, background: cardBg, border: `1px solid ${borderColor}` }}
          >
            <div style={{
              display: 'inline-block', background: 'rgba(193,241,29,0.1)', color: '#c1f11d',
              padding: '4px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16,
            }}>
              Ситуация
            </div>
            <Title level={4} style={{ marginBottom: 12, color: textPrimary }}>"Команда мечты под давлением"</Title>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: isDark ? '#cbd5e1' : '#475569' }}>
              Ваша команда из 4 человек (включая вас) выиграла небольшой грант и взялась организовать{' '}
              <strong>бесплатные образовательные курсы для детей в малообеспеченном районе города</strong>.
              До презентации результатов для спонсора (который решает, продолжить ли финансирование){' '}
              осталось <strong>48 часов</strong>. Внезапно — ситуация в команде стала критической.
            </Paragraph>
            <Paragraph style={{ fontSize: 14, color: textSecondary, margin: 0 }}>
              Вы — неформальный лидер команды. В чате уже написали ваши коллеги.
              Напишите команде 5 сообщений — после каждого все трое ответят вам.
              Нет правильных или неправильных ответов. Оценивается ваш стиль, ценности и поведение.
            </Paragraph>
          </Card>

          {/* Agent Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 36 }}>
            {(Object.keys(AGENT_CONFIG) as Array<keyof typeof AGENT_CONFIG>).map(key => {
              const agent = AGENT_CONFIG[key];
              return (
                <div key={key} style={{
                  background: surfaceBg,
                  borderRadius: 16,
                  padding: '20px 16px',
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
                  borderLeft: `4px solid ${agent.color}`,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{agent.emoji}</div>
                  <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 6, color: textPrimary }}>{agent.name}</Text>
                  <Text style={{ fontSize: 13, color: textSecondary }}>{agent.label}</Text>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={startSimulation}
              style={{
                borderRadius: 12, height: 52, paddingInline: 48,
                background: '#c1f11d', color: '#141414', border: 'none',
                fontSize: 16, fontWeight: 700, fontFamily: "'Raleway', sans-serif",
              }}
            >
              Начать симуляцию
            </Button>
            <div style={{ marginTop: 10 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                5 сообщений · ~5 минут · Результаты сохраняются автоматически
              </Text>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULT SCREEN ─────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const tempPassword = localStorage.getItem('tempPassword') || '';
    const userEmail = localStorage.getItem('userEmail') || '';

    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '40px 20px',
        background: pageBg,
        fontFamily: "'Raleway', sans-serif",
      }}>
        <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
          <CheckCircleFilled style={{ fontSize: 72, color: '#52c41a', marginBottom: 24 }} />
          <Title level={2} style={{ marginBottom: 12, color: textPrimary }}>
            🎉 Заявка полностью отправлена!
          </Title>
          <Paragraph style={{ fontSize: 16, color: textSecondary, lineHeight: 1.8, marginBottom: 28 }}>
            {candidateName ? `${candidateName}, ваши` : 'Ваши'} ответы записаны и переданы
            приёмной комиссии inVision U для детального анализа.
          </Paragraph>

          {/* Temp password reveal */}
          {tempPassword && (
            <Card
              variant="borderless"
              style={{
                borderRadius: 16, boxShadow: '0 6px 20px rgba(0,108,255,0.12)',
                marginBottom: 24, background: '#1f1f1f', border: '1px solid rgba(193,241,29,0.15)',
              }}
            >
              <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                Ваш временный пароль для личного кабинета:
              </Text>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#c1f11d', letterSpacing: 4, marginBottom: 6 }}>
                {tempPassword}
              </div>
              {userEmail && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Логин: <strong>{userEmail}</strong>
                </Text>
              )}
            </Card>
          )}

          <Card
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)', marginBottom: 28, background: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#bbf7d0'}` }}
          >
            <Text style={{ fontSize: 14, color: '#15803d', lineHeight: 1.7, display: 'block' }}>
              Комиссия получит подробный разбор вашего стиля лидерства, уровня эмпатии,
              умения управлять конфликтом и принимать решения в напряжённой ситуации.
            </Text>
          </Card>

          <Button
            type="primary"
            size="large"
            href="/login"
            style={{ borderRadius: 12, height: 52, paddingInline: 40, background: '#c1f11d', fontSize: 16 }}
          >
            Войти в личный кабинет →
          </Button>
        </div>
      </div>
    );
  }

  // ─── CHAT SCREEN ───────────────────────────────────────────────────
  const inputDisabled = isAgentTyping || candidateTurnCount >= TOTAL_TURNS;
  const finishEnabled = candidateTurnCount >= TOTAL_TURNS && !finishLoading;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: pageBg, fontFamily: "'Raleway', sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', padding: '14px 20px',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, borderBottom: `1px solid ${borderColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38,
            background: '#c1f11d',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TeamOutlined style={{ color: '#141414', fontSize: 18 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 15, display: 'block', lineHeight: 1.2, color: textPrimary }}>Командный чат</Text>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>Бесплатные курсы для детей · 48 часов до презентации</Text>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Сообщение {Math.min(candidateTurnCount, TOTAL_TURNS)}/{TOTAL_TURNS}
          </Text>
          <Button
            type="primary"
            size="small"
            disabled={!finishEnabled}
            loading={finishLoading}
            onClick={finishSimulation}
            style={{
              borderRadius: 8, background: finishEnabled ? '#52c41a' : undefined,
              borderColor: finishEnabled ? '#52c41a' : undefined,
            }}
          >
            Завершить симуляцию
          </Button>
        </div>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {messages.map((msg, idx) => {
            if (msg.role === 'candidate') {
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                  <div style={{
                    background: '#c1f11d', color: '#141414',
                    borderRadius: '18px 18px 4px 18px',
                    padding: '10px 16px', maxWidth: '70%',
                    fontSize: 15, lineHeight: 1.5,
                    boxShadow: '0 2px 8px rgba(193,241,29,0.3)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            }

            const agentKey = msg.agentId as keyof typeof AGENT_CONFIG | undefined;
            const agent = agentKey ? AGENT_CONFIG[agentKey] : null;
            const borderColor = agent?.color || '#8c8c8c';
            const name = agent?.name || msg.agentName || 'Агент';
            const emoji = agent?.emoji || '👤';

            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: surfaceBg, border: `2px solid ${borderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {emoji}
                </div>
                <div style={{ maxWidth: '70%' }}>
                  <Text style={{ fontSize: 12, color: borderColor, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    {name}
                  </Text>
                  <div style={{
                    background: cardBg, borderRadius: '4px 18px 18px 18px',
                    borderLeft: `3px solid ${borderColor}`,
                    padding: '10px 16px', fontSize: 15, lineHeight: 1.5, color: textPrimary,
                    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isAgentTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: surfaceBg, border: `2px solid ${borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                💬
              </div>
              <div style={{
                background: cardBg, borderRadius: '4px 18px 18px 18px',
                borderLeft: '3px solid #333',
                padding: '10px 16px',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 14, color: '#8c8c8c' }} spin />} />
                <Text type="secondary" style={{ fontSize: 13, marginLeft: 8 }}>команда отвечает...</Text>
              </div>
            </div>
          )}

          {/* Lock message when done */}
          {candidateTurnCount >= TOTAL_TURNS && !isAgentTyping && (
            <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Вы написали все 5 сообщений. Нажмите «Завершить симуляцию» для завершения.
              </Text>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        background: cardBg, padding: '14px 16px',
        boxShadow: isDark ? '0 -2px 8px rgba(0,0,0,0.3)' : '0 -2px 8px rgba(0,0,0,0.2)', flexShrink: 0,
        borderTop: `1px solid ${borderColor}`,
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <TextArea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputDisabled && candidateTurnCount >= TOTAL_TURNS ? 'Симуляция завершена' : 'Напишите ответ команде... (Enter — отправить)'}
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={inputDisabled}
            style={{ flex: 1, borderRadius: 12, resize: 'none', fontSize: 15 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            disabled={inputDisabled || !inputText.trim()}
            style={{
              borderRadius: 12, height: 44, width: 44, padding: 0,
              background: '#c1f11d', flexShrink: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}

