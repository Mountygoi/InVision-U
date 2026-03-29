import { useState } from 'react';
import { Button, Card, Radio, Typography, Spin, message, Input } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// --- Scenarios Data ---
interface Scenario {
  id: number;
  title: string;
  situation: string;
  options: { key: string; text: string }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'Кризис лидерства',
    situation: 'Твоя команда работает над проектом с дедлайном через 2 дня. Тимлид заболел, а двое участников конфликтуют и отказываются сотрудничать. Что ты сделаешь?',
    options: [
      { key: 'A', text: 'Возьму на себя роль лидера, распределю задачи и поговорю с конфликтующими отдельно' },
      { key: 'B', text: 'Напишу тимлиду и попрошу его решить конфликт удалённо' },
      { key: 'C', text: 'Буду работать над своей частью и надеяться что другие разберутся' },
      { key: 'D', text: 'Предложу перенести дедлайн и объяснить ситуацию заказчику' },
    ],
  },
  {
    id: 2,
    title: 'Этическая дилемма',
    situation: 'Ты обнаружил, что твой лучший друг в команде скопировал код из чужого проекта без указания авторства. До презентации осталось 3 часа. Что ты сделаешь?',
    options: [
      { key: 'A', text: 'Промолчу — друг важнее, и времени нет на переделку' },
      { key: 'B', text: 'Поговорю с другом наедине и предложу указать источник или переписать' },
      { key: 'C', text: 'Сообщу преподавателю/организатору немедленно' },
      { key: 'D', text: 'Перепишу код сам за оставшиеся 3 часа' },
    ],
  },
  {
    id: 3,
    title: 'Ограниченные ресурсы',
    situation: 'Тебе нужно создать MVP приложения для сельской школы, но у тебя нет бюджета, интернет слабый, а у учеников только старые телефоны. Как поступишь?',
    options: [
      { key: 'A', text: 'Откажусь от проекта — без нормальных ресурсов это невозможно' },
      { key: 'B', text: 'Сделаю offline-first PWA с минимальным трафиком и оптимизацией под слабые устройства' },
      { key: 'C', text: 'Попрошу школу купить новые устройства' },
      { key: 'D', text: 'Сделаю обычное веб-приложение и буду надеяться на улучшение интернета' },
    ],
  },
  {
    id: 4,
    title: 'Восстановление после провала',
    situation: 'Твой стартап-проект провалился на демо-дне: приложение упало при презентации, инвесторы ушли разочарованные. Что дальше?',
    options: [
      { key: 'A', text: 'Забуду этот проект и начну новый с нуля' },
      { key: 'B', text: 'Проанализирую что пошло не так, починю баги, запишу видео-демо и разошлю инвесторам' },
      { key: 'C', text: 'Обвиню команду в плохой подготовке' },
      { key: 'D', text: 'Решу что стартапы не для меня и вернусь к учёбе' },
    ],
  },
];

// --- Types ---
interface ScenarioScores {
  leadership: number;
  problemSolving: number;
  teamwork: number;
  stressResilience: number;
  ethics: number;
}

interface ScenarioResult {
  scenarioId: number;
  feedback: string;
  scores: ScenarioScores;
}

interface SJTResult {
  overallScores: ScenarioScores;
  scenarioResults: ScenarioResult[];
  personalitySummary: string;
}

interface AnswerState {
  chosenOption: string;
  explanation: string;
}

// --- Component ---
const SJTTest = () => {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidateId') || localStorage.getItem('userEmail') || '';

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SJTResult | null>(null);

  const currentScenario = SCENARIOS[currentStep];
  const totalScenarios = SCENARIOS.length;
  const isLastStep = currentStep === totalScenarios - 1;
  const currentAnswer = currentScenario ? answers[currentScenario.id] : undefined;

  const handleOptionChange = (option: string) => {
    if (!currentScenario) return;
    setAnswers(prev => ({
      ...prev,
      [currentScenario.id]: {
        ...prev[currentScenario.id],
        chosenOption: option,
        explanation: prev[currentScenario.id]?.explanation || '',
      },
    }));
  };

  const handleExplanationChange = (text: string) => {
    if (!currentScenario) return;
    setAnswers(prev => ({
      ...prev,
      [currentScenario.id]: {
        ...prev[currentScenario.id],
        chosenOption: prev[currentScenario.id]?.chosenOption || '',
        explanation: text,
      },
    }));
  };

  const handleSubmit = async () => {
  const answersArray = SCENARIOS.map(s => ({
    scenarioId: s.id,
    chosenOption: answers[s.id]?.chosenOption || '',
    explanation: answers[s.id]?.explanation || '',
  }));

  const unanswered = answersArray.filter(a => !a.chosenOption);
  if (unanswered.length > 0) {
    message.error('Пожалуйста, ответьте на все сценарии');
    return;
  }

  setLoading(true);
  try {
    const response = await axios.post('http://localhost:5000/api/sjt/analyze', {
      candidateId,
      answers: answersArray,
    });

    // Ожидаем, что backend вернёт именно SJTResult для этой страницы
    setResult(response.data.sjtResult || response.data);
    // Если нужно — можешь также сохранить compositeScore в localStorage
    // localStorage.setItem('compositeScore', String(response.data.compositeScore));
  } catch {
    message.error('Ошибка при анализе ответов. Проверьте подключение к серверу.');
  } finally {
    setLoading(false);
  }
};

  const handleNext = () => {
    if (!currentAnswer?.chosenOption) {
      message.warning('Выберите один из вариантов ответа');
      return;
    }
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // --- Radar chart data ---
  const radarData = result ? [
    { axis: 'Лидерство', value: result.overallScores.leadership },
    { axis: 'Решение проблем', value: result.overallScores.problemSolving },
    { axis: 'Командная работа', value: result.overallScores.teamwork },
    { axis: 'Стрессоустойчивость', value: result.overallScores.stressResilience },
    { axis: 'Этика', value: result.overallScores.ethics },
  ] : [];

  // --- Loading screen ---
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#006CFF' }} spin />} />
        <Title level={3} style={{ marginTop: 24, color: '#1a1a2e' }}>
          AI анализирует ваши ответы...
        </Title>
        <Text type="secondary">Это может занять 10-15 секунд</Text>
      </div>
    );
  }

  // --- Results screen ---
  if (result) {
    const scenarioTitles: Record<number, string> = {
      1: 'Кризис лидерства',
      2: 'Этическая дилемма',
      3: 'Ограниченные ресурсы',
      4: 'Восстановление после провала',
    };

    return (
      <div style={{
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <CheckCircleFilled style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
            <Title level={2} style={{ marginBottom: 4 }}>Результаты SJT</Title>
            <Text type="secondary">Ваш профиль компетенций по результатам ситуационного теста</Text>
          </div>

          {/* Radar Chart */}
          <Card
            variant="borderless"
            style={{ borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.06)', marginBottom: 24 }}
          >
            <Title level={4} style={{ textAlign: 'center', marginBottom: 16 }}>Профиль компетенций</Title>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 13, fill: '#555' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#006CFF"
                    fill="#006CFF"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Score pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              {radarData.map(d => (
                <div
                  key={d.axis}
                  style={{
                    background: '#F0F7FF',
                    border: '1px solid #006CFF20',
                    borderRadius: 12,
                    padding: '8px 16px',
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>{d.axis}</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#006CFF' }}>{d.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Personality Summary */}
          <Card
            variant="borderless"
            style={{ borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.06)', marginBottom: 24 }}
          >
            <Title level={4} style={{ color: '#006CFF', marginBottom: 12 }}>Личностный профиль</Title>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
              {result.personalitySummary}
            </Paragraph>
          </Card>

          {/* Per-scenario feedback */}
          {result.scenarioResults.map(sr => (
            <Card
              key={sr.scenarioId}
              variant="borderless"
              style={{ borderRadius: 16, boxShadow: '0 6px 20px rgba(0,0,0,0.04)', marginBottom: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: '#006CFF', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14,
                }}>
                  {sr.scenarioId}
                </div>
                <Text strong style={{ fontSize: 15 }}>
                  {scenarioTitles[sr.scenarioId] || `Сценарий ${sr.scenarioId}`}
                </Text>
                <Text type="secondary" style={{ marginLeft: 'auto' }}>
                  Ваш ответ: {answers[sr.scenarioId]?.chosenOption}
                </Text>
              </div>
              <Paragraph style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                {sr.feedback}
              </Paragraph>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- Test form ---
  return (
    <div style={{
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, #006CFF 0%, #00D8E6 100%)',
            borderRadius: 12, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: 20,
          }}>N</div>
          <Title level={2} style={{ marginBottom: 4 }}>Ситуационный тест (SJT)</Title>
          <Text type="secondary">Оцените свои навыки принятия решений в реальных ситуациях</Text>
        </div>

        {/* Progress stepper */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {SCENARIOS.map((s, idx) => (
            <div
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: idx < currentStep ? '#52c41a'
                  : idx === currentStep ? '#006CFF'
                    : '#e0e0e0',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: 14,
                transition: 'all 0.3s ease',
              }}>
                {idx < currentStep ? <CheckCircleFilled /> : idx + 1}
              </div>
              {idx < SCENARIOS.length - 1 && (
                <div style={{
                  width: 40, height: 2,
                  background: idx < currentStep ? '#52c41a' : '#e0e0e0',
                  transition: 'all 0.3s ease',
                }} />
              )}
            </div>
          ))}
        </div>

        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Сценарий {currentStep + 1} из {totalScenarios}
        </Text>

        {/* Scenario Card */}
        {currentScenario && (
          <Card
            variant="borderless"
            style={{
              borderRadius: 20,
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              marginBottom: 24,
            }}
          >
            {/* Scenario badge */}
            <div style={{
              display: 'inline-block',
              background: '#F0F7FF',
              color: '#006CFF',
              padding: '4px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}>
              {currentScenario.title}
            </div>

            <Paragraph style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: '#1a1a2e',
              marginBottom: 28,
            }}>
              {currentScenario.situation}
            </Paragraph>

            {/* Options */}
            <Radio.Group
              value={currentAnswer?.chosenOption}
              onChange={e => handleOptionChange(e.target.value)}
              style={{ width: '100%' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentScenario.options.map(opt => (
                  <div
                    key={opt.key}
                    onClick={() => handleOptionChange(opt.key)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 12,
                      border: currentAnswer?.chosenOption === opt.key
                        ? '2px solid #006CFF'
                        : '2px solid #f0f0f0',
                      background: currentAnswer?.chosenOption === opt.key
                        ? '#F0F7FF'
                        : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Radio value={opt.key} style={{ width: '100%' }}>
                      <Text style={{ fontSize: 14 }}>
                        <span style={{ fontWeight: 600, color: '#006CFF', marginRight: 8 }}>{opt.key})</span>
                        {opt.text}
                      </Text>
                    </Radio>
                  </div>
                ))}
              </div>
            </Radio.Group>

            {/* Explanation */}
            <div style={{ marginTop: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Объясни свой выбор:
              </Text>
              <TextArea
                rows={3}
                value={currentAnswer?.explanation || ''}
                onChange={e => handleExplanationChange(e.target.value)}
                placeholder="Почему ты выбрал(а) этот вариант? Что бы ты сделал(а) конкретно?"
                style={{ borderRadius: 10, fontSize: 14 }}
              />
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            disabled={currentStep === 0}
            style={{ borderRadius: 12, height: 48, paddingInline: 28 }}
          >
            Назад
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleNext}
            style={{
              borderRadius: 12,
              height: 48,
              paddingInline: 28,
              background: '#006CFF',
              boxShadow: '0 4px 12px rgba(0, 108, 255, 0.2)',
            }}
          >
            {isLastStep ? 'Отправить на анализ' : 'Далее'}
            {!isLastStep && <ArrowRightOutlined />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SJTTest;
