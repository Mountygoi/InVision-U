import { useState, useEffect, useCallback } from 'react';
import { Layout, Row, Col, Card, Avatar, Tag, Button, Typography, Calendar, Space, message, Modal, List, Divider, Empty, Statistic, Badge, Select, Input, InputNumber, Progress } from 'antd';
import { Video, RefreshCw, Mail, BookOpen, Calendar as CalIcon, MapPin, ChevronRight, Star, Clock, Phone, FileText, User, Users, ShieldAlert, AlertTriangle, Lightbulb, Heart, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import dayjs from 'dayjs';
import VideoConference from '../components/VideoConference';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Candidate {
  id: string;
  name: string;
  university: string;
  status: string;
  avatarUrl?: string; 
  interviewTime?: string;
  email: string;
  phone?: string;
  city?: string;
  gpa?: number;
  skills?: string[];
  bio?: string;
}

const Scheduler = () => {
    const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [isSlotsModalVisible, setIsSlotsModalVisible] = useState(false);
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
  const [activeCall, setActiveCall] = useState<Candidate | null>(null); 

  // Состояния для Глубокой Оценки (Scorecard)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
const [evalData, setEvalData] = useState({ 
  panelType: 'Technical',
  techNotes: '', 
  softNotes: '' 
});  
  // РАСШИРЕННЫЕ КРИТЕРИИ (8 параметров для элитной школы)
 const [scores, setScores] = useState<Record<string, number>>({
  logic: 5, academic: 5, problemSolving: 5, criticalThinking: 5,      // Panel A
  communication: 5, curiosity: 5, teamFit: 5, emotionalIntel: 5       // Panel B
});
  const getNormalizedTime = (timeStr: string | undefined) => {
    if (!timeStr) return null;
    if (timeStr.includes('T') || timeStr.includes('Z')) {
      return dayjs(timeStr).format('DD MMMM YYYY [at] HH:mm');
    }
    return timeStr;
  };

  // Расчет итогового балла на основе критериев выбранной роли
  const calculateTotalScore = () => {
  const isTech = evalData.panelType === 'Technical';
  // Берем только те оценки, которые относятся к текущей панели
  const vals = isTech 
    ? [scores.logic, scores.academic, scores.problemSolving, scores.criticalThinking]
    : [scores.communication, scores.curiosity, scores.teamFit, scores.emotionalIntel];

  const sum = vals.reduce((a, b) => (a || 0) + (b || 0), 0);
  return Math.round((sum / (vals.length * 10)) * 100);
};

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/candidates');
      const interviewCandidates = res.data
        .filter((c: any) => c.status === 'interview' || c.interviewTime)
        .map((c: any) => ({
          ...c,
          avatarUrl: c.avatarUrl || c.avatar_url 
        }));
      setCandidates(interviewCandidates);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Database sync failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleScoreSubmit = async () => {
  const id = evaluatingId;
  if (!id) {
    message.error("Критическая ошибка: ID потерян");
    return;
  }

  try {
    const finalScore = calculateTotalScore();
    const payload: any = {};

    if (evalData.panelType === 'Technical') {
      payload.tech_score = finalScore;
      payload.tech_notes = evalData.techNotes;
    } else {
      payload.soft_score = finalScore;
      payload.soft_notes = evalData.softNotes;
    }

    const response = await axios.patch(
      `http://localhost:5000/api/candidates/${id}/status`,
      payload
    );

    if (response.status === 200) {
      const updated = response.data;
      if (updated.status === 'under_review') {
        message.success('Обе панели оценили! Кандидат отправлен на проверку ✅');
      } else if (updated.status === 'arbitration') {
        message.warning('Конфликт оценок панелей! Кандидат отправлен на арбитраж ⚠️');
      } else {
        message.success(`Оценка панели сохранена. Ожидается оценка второй панели.`);
      }
      setIsEvalModalOpen(false);
      setEvaluatingId(null);
      setViewCandidate(null);
      fetchCandidates();
    }
  } catch (err: any) {
    message.error("Сервер недоступен или ошибка в базе");
  }
};
  const daySlots: string[] = [];
  for (let hour = 10; hour <= 17; hour++) {
    daySlots.push(`${hour}:00`);
    daySlots.push(`${hour}:30`);
  }

  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateStr = value.format('DD MMMM YYYY');
    const count = candidates.filter(c => {
      const norm = getNormalizedTime(c.interviewTime);
      return norm && norm.includes(dateStr);
    }).length;
    
    return count > 0 ? (
      <div style={{ marginTop: '4px' }}>
        <CustomBadge text={`${count} slots`} />
      </div>
    ) : null;
  };

  const handleSelect = (date: dayjs.Dayjs, info: { source: 'year' | 'month' | 'date' | 'customize' }) => {
    setSelectedDate(date);
    if (info.source === 'date') {
      setIsSlotsModalVisible(true);
    }
  };

  const pendingCandidates = candidates.filter(c => !c.interviewTime);

  const getAvatar = (c: Candidate) => {
    return c.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}`;
  };

  // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОТРИСОВКИ КРИТЕРИЕВ
  const renderCriterion = (label: string, key: string, desc: string, icon: any) => (
    <div style={{ marginBottom: 20, padding: '12px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
        <Space>
          {icon}
          <div>
            <Text strong style={{ fontSize: 13, display: 'block' }}>{label}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{desc}</Text>
          </div>
        </Space>
        <Text strong style={{ color: '#c1f11d', fontSize: 16 }}>{scores[key]}</Text>
      </Row>
      <Row gutter={12} align="middle">
        <Col flex="auto">
          <Progress 
            percent={scores[key] * 10} 
            showInfo={false} 
            strokeWidth={8}
            strokeColor={scores[key] > 7 ? '#10B981' : scores[key] > 4 ? '#F59E0B' : '#EF4444'} 
          />
        </Col>
        <Col>
          <InputNumber min={1} max={10} size="small" value={scores[key]} onChange={(v) => setScores({...scores, [key]: v || 1})} />
        </Col>
      </Row>
    </div>
  );

  return (
    <Content style={{ 
      padding: '24px', 
      background: '#fafafa', 
      height: 'calc(100vh - 64px)', 
      overflow: 'hidden', 
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.4s ease both'
    }}>
      <style>{`
        .scheduler-layout { overflow: hidden; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .candidate-item-hover:hover { background: #f5f5f5 !important; transform: translateX(4px); }
        .ant-picker-calendar-header { padding: 12px 16px !important; }
        .ant-picker-calendar-date-content { height: 60px !important; }
      `}</style>

      <Row gutter={24} style={{ flex: 1, minHeight: 0 }}>
        
        {/* LEFT: Очередь кандидатов */}
        <Col span={8} style={{ height: '100%', paddingBottom: '24px' }}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: '24px', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}
            styles={{ body: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 } }}
            title={
              <div style={{ padding: '8px 4px' }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Applicants Queue</Title>
                <Text type="secondary" style={{ fontSize: '13px' }}>Waiting for assignment</Text>
              </div>
            }
          >
            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
              <List
                dataSource={pendingCandidates}
                renderItem={(c) => (
                  <div 
                    onClick={() => setViewCandidate(c)}
                    style={{
                      padding: '18px 24px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    className="candidate-item-hover"
                  >
                    <Space size={16}>
                      <Avatar size={48} src={getAvatar(c)} style={{ border: '2px solid #E2E8F0' }} />
                      <div>
                        <Text strong style={{ display: 'block', fontSize: '14px' }}>{c.name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{c.university}</Text>
                      </div>
                    </Space>
                    <ChevronRight size={18} color="#CBD5E1" />
                  </div>
                )}
                locale={{ emptyText: <Empty description="Queue is empty" style={{ marginTop: 60 }} /> }}
              />
            </div>
          </Card>
        </Col>

        {/* RIGHT: Календарь */}
        <Col span={16} style={{ height: '100%', paddingBottom: '24px' }}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: '24px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
              height: '100%',
              overflow: 'hidden'
            }}
            styles={{ body: { height: 'calc(100% - 70px)', overflow: 'hidden', padding: '16px' } }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space><CalIcon size={22} color="#c1f11d" /><Title level={4} style={{ margin: 0, fontWeight: 800 }}>Global Scheduler</Title></Space>
                <Button icon={<RefreshCw size={16} />} onClick={fetchCandidates} loading={loading} type="primary" ghost style={{ borderRadius: '10px' }}>Refresh</Button>
              </div>
            }
          >
            <div className="custom-scroll" style={{ height: '100%', overflowY: 'auto' }}>
              <Calendar 
                fullscreen={true}
                onSelect={(date, info) => handleSelect(date, info)}
                cellRender={dateCellRender}
                style={{ borderRadius: '16px' }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* MODAL 1: Слоты дня */}
      <Modal
        title={<Space><Clock size={20} color="#c1f11d" /> <Text strong>Interviews: {selectedDate.format('DD MMMM YYYY')}</Text></Space>}
        open={isSlotsModalVisible}
        onCancel={() => setIsSlotsModalVisible(false)}
        footer={null}
        width={580}
        centered
      >
        <div className="custom-scroll" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '8px' }}>
          {daySlots.map((time) => {
            const dateStr = selectedDate.format('DD MMMM YYYY');
            const targetFullString = `${dateStr} at ${time}`;
            const candidate = candidates.find(c => getNormalizedTime(c.interviewTime) === targetFullString);
            
            return (
              <div key={time} style={{ 
                display: 'flex', alignItems: 'center', padding: '14px 18px', marginBottom: '10px', 
                borderRadius: '16px', background: candidate ? '#f0fce0' : '#FAFAFA',
                border: candidate ? '1px solid #BAE7FF' : '1px solid #F1F5F9'
              }}>
                <Text strong style={{ width: '70px', color: candidate ? '#c1f11d' : '#94A3B8', fontSize: '15px' }}>{time}</Text>
                <Divider type="vertical" style={{ height: '24px' }} />
                <div style={{ flex: 1 }}>
                  {candidate ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong style={{ cursor: 'pointer', color: '#1E293B', textDecoration: 'underline' }} onClick={() => setViewCandidate(candidate)}>
                          {candidate.name}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag icon={<Users size={10} />} color="processing" style={{ fontSize: 10 }}>Panel A: Academic</Tag>
                          <Tag icon={<Users size={10} />} color="warning" style={{ fontSize: 10 }}>Panel B: Psych</Tag>
                        </div>
                      </div>
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<Video size={14} />} 
                        style={{ borderRadius: '8px', background: '#10B981', borderColor: '#10B981' }}
                        onClick={() => { setActiveCall(candidate); setIsSlotsModalVisible(false); }}
                      >
                        Join Panel
                      </Button>
                    </div>
                  ) : <Text type="secondary" italic style={{ fontSize: '13px' }}>Available</Text>}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* MODAL 2: Профиль */}
      <Modal 
        open={!!viewCandidate} 
        onCancel={() => setViewCandidate(null)} 
        // Modal 2 Footer
footer={[
  <Button key="close" onClick={() => setViewCandidate(null)}>Close</Button>,
  <Button 
  key="eval" 
  type="primary" 
  onClick={() => {
    console.log("Запоминаю ID:", viewCandidate?.id);
    setEvaluatingId(viewCandidate?.id || null); // Сохраняем ID в отдельную память
    setIsEvalModalOpen(true);
  }}
>
  Evaluate Child
</Button>
]} 
        width={650} 
        centered
        zIndex={2000}
        styles={{ body: { padding: 0 } }}
      >
        {viewCandidate && (
          <div style={{ overflow: 'hidden', borderRadius: '16px' }}>
            <div style={{ background: '#c1f11d', padding: '40px', color: '#fff' }}>
              <Row align="middle" gutter={24}>
                <Col><Avatar size={90} src={getAvatar(viewCandidate)} style={{ border: '4px solid rgba(255,255,255,0.3)' }} /></Col>
                <Col>
                  <Title level={2} style={{ color: '#fff', margin: 0 }}>{viewCandidate.name}</Title>
                  <Space style={{ marginTop: '10px' }}>
                    <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: 'none' }}><MapPin size={12}/> {viewCandidate.city || 'Almaty'}</Tag>
                    <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: 'none' }}><BookOpen size={12}/> {viewCandidate.university}</Tag>
                  </Space>
                </Col>
              </Row>
            </div>
            <div style={{ padding: '32px' }}>
              <Row gutter={[24, 24]}>
                <Col span={12}><Statistic title="Internal GPA" value={viewCandidate.gpa || 0} precision={2} prefix={<Star size={18} color="#F59E0B" fill="#F59E0B" />} /></Col>
                <Col span={12}>
                   <div style={{ background: '#fafafa', padding: '12px', borderRadius: '12px' }}>
                      <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>CONTACTS</Text>
                      <Text style={{ fontSize: '13px', display: 'block', marginTop: '4px' }}>{viewCandidate.email}</Text>
                      <Text style={{ fontSize: '13px', display: 'block' }}>{viewCandidate.phone || '+7 (707) 123 45 67'}</Text>
                   </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: РАСШИРЕННЫЙ SCORECARD (8 КРИТЕРИЕВ) */}
      <Modal
  title={<Space><ShieldCheck size={20} color="#c1f11d" /> <Text strong>Evidence-Based Scorecard: {viewCandidate?.name}</Text></Space>}
  open={isEvalModalOpen}
  onCancel={() => setIsEvalModalOpen(false)}
  onOk={() => handleScoreSubmit()}
  okText="Submit Scorecard"
  centered
  width={650}
>
        <Space direction="vertical" style={{ width: '100%', padding: '10px 0' }} size="large">
          <Card size="small" style={{ background: '#fafafa', border: '1px solid #E2E8F0' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>ТЕКУЩАЯ КОМИССИЯ:</Text>
            <Select style={{ width: '100%', marginTop: 8 }} value={evalData.panelType} onChange={v => setEvalData({...evalData, panelType: v})}>
              <Select.Option value="Technical">Академическая панель (Panel A)</Select.Option>
              <Select.Option value="SoftSkills">Психологическая панель (Panel B)</Select.Option>
            </Select>
          </Card>

          <div style={{ padding: '0 5px' }}>
            {evalData.panelType === 'Technical' ? (
              <>
                {renderCriterion('Логика и Алгоритмы', 'logic', 'Способность находить закономерности.', <Lightbulb size={16} color="#c1f11d"/>)}
                {renderCriterion('Академическая база', 'academic', 'Математика и общая эрудиция.', <BookOpen size={16} color="#c1f11d"/>)}
                {renderCriterion('Problem Solving', 'problemSolving', 'Поиск решений в нестандартных ситуациях.', <ShieldCheck size={16} color="#c1f11d"/>)}
                {renderCriterion('Критическое мышление', 'criticalThinking', 'Умение анализировать информацию.', <Star size={16} color="#c1f11d"/>)}
              </>
            ) : (
              <>
                {renderCriterion('Коммуникация', 'communication', 'Навыки общения и вежливость.', <Users size={16} color="#722ed1"/>)}
                {renderCriterion('Curiosity (Интерес)', 'curiosity', 'Тяга к знаниям и активность.', <Lightbulb size={16} color="#722ed1"/>)}
                {renderCriterion('Team Spirit', 'teamFit', 'Умение работать в группе.', <Heart size={16} color="#722ed1"/>)}
                {renderCriterion('Эмоциональный интеллект', 'emotionalIntel', 'Понимание своих и чужих эмоций.', <ShieldAlert size={16} color="#722ed1"/>)}
              </>
            )}
          </div>

          <div style={{ background: '#f0fce0', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px dashed #c1f11d' }}>
            <Statistic title="Прогноз успешности ученика (AI Model)" value={calculateTotalScore()} suffix="%" valueStyle={{ color: '#c1f11d', fontWeight: 800 }} />
            {calculateTotalScore() < 45 && (
              <Tag color="error" style={{ marginTop: 10 }} icon={<AlertTriangle size={12} />}>
                Arbitration Check Required
              </Tag>
            )}
          </div>

          <div>
            <Text strong>Обоснование оценки:</Text>
<TextArea 
  rows={4} 
  style={{ marginTop: 8 }} 
  placeholder="Опишите конкретные примеры поведения ребенка..." 
  // Показываем нужные заметки в зависимости от активной панели
  value={evalData.panelType === 'Technical' ? evalData.techNotes : evalData.softNotes} 
  onChange={e => {
    const val = e.target.value;
    setEvalData(prev => ({
      ...prev,
      // Динамически обновляем либо techNotes, либо softNotes
      [prev.panelType === 'Technical' ? 'techNotes' : 'softNotes']: val
    }));
  }} 
/>          </div>
        </Space>
      </Modal>

      {/* MODAL 3: Video Call */}
      <Modal
        open={!!activeCall}
        onCancel={() => setActiveCall(null)}
        footer={null}
        width={1000}
        centered
        destroyOnClose
        styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: '12px' } }}
      >
        {activeCall && (
          <VideoConference 
            roomName={`nVisionU-School-Interview-${activeCall.id}`}
            userName="Expert Evaluator"
            onClose={() => setActiveCall(null)}
          />
        )}
      </Modal>

    </Content>
  );
};

const CustomBadge = ({ text }: { text: string }) => (
  <span style={{ fontSize: '10px', background: '#c1f11d', color: '#141414', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
    {text}
  </span>
);

export default Scheduler;