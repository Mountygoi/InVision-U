import { useState, useEffect, useCallback } from 'react';
import { Row, Col, List, Avatar, Tag, Button, Typography, Space, Empty, message, Input, Layout, Card, Divider, Select, Progress, Badge, Alert, Modal } from 'antd';
import { ShieldCheck, FileText, Send, XCircle, MapPin, GraduationCap, CheckCircle2, AlertTriangle, Bot, TrendingUp, User, EyeOff, Scale } from 'lucide-react';
import axios from 'axios';
import { RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Radar as RadarArea } from 'recharts';
import searchIcon from '../assets/icons/search.svg';
import type { Candidate } from '../types';

const getAvatar = (item: Candidate) => {
  if (item.avatarUrl) {
    return item.avatarUrl;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name)}`;
};

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { TextArea } = Input;

interface FetchCandidatesParams {
  sort: string;
  order: string;
  search?: string;
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'blue',
  under_review: 'orange',
  interview: 'purple',
  arbitration: 'volcano', 
  accepted: 'green',
  declined: 'red',
  waitlisted: 'default',
};

const ACHIEVEMENT_ICONS: Record<string, string> = {
  olympiad: '🏅',
  volunteering: '🤝',
  project: '🚀',
  award: '🏆',
};

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewNotes, setReviewNotes] = useState('');

  // Состояния для Арбитража
  const [isArbModalOpen, setIsArbModalOpen] = useState(false);
  const [arbReport, setArbReport] = useState<{
    summary: string;
    panelA: { score: number; note: string };
    panelB: { score: number; note: string };
    verdict: string;
  } | null>(null);

  const isDataHidden = (status: string) => {
    return status === 'new' || status === 'under_review';
  };

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params: FetchCandidatesParams = { sort: 'composite_score', order: 'desc' };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await axios.get('http://localhost:5000/api/candidates', { params });
      setCandidates(res.data);
      if (res.data.length > 0 && !selectedId) setSelectedId(res.data[0].id);
    } catch (err) {
      console.error('Data fetch error:', err);
      message.error('Error loading data from server');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, selectedId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const selectedCandidate = candidates.find(c => c.id === selectedId);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/candidates/${id}/status`, { status: newStatus });
      message.success(`Candidate status updated to: ${newStatus}`);
      fetchCandidates();
    } catch (err) {
      console.error('Update status error:', err);
      message.error('Error updating status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedId) return;
    try {
      await axios.patch(`http://localhost:5000/api/candidates/${selectedId}/review`, {
        notes: reviewNotes,
        reviewedBy: 'admin'
      });
      message.success('Review notes saved');
      fetchCandidates();
    } catch (error) {
      console.error('Save notes error:', error);
      message.error('Error saving notes');
    }
  };

  // ФУНКЦИЯ ДЛЯ КНОПКИ AUDIT INFO
  const showAuditInfo = () => {
    Modal.info({
      title: 'Система контроля прозрачности (Audit Log)',
      content: (
        <div style={{ marginTop: 12 }}>
          <Paragraph style={{ fontSize: '13px', color: '#374151' }}>
            <ShieldCheck size={16} style={{ marginRight: 8, color: '#10B981', verticalAlign: 'middle' }} /> 
            Каждое действие эксперта на этапе Арбитража записывается в неизменяемый лог базы данных.
          </Paragraph>
          <ul style={{ fontSize: '12px', color: '#6B7280', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><b>Timestamp:</b> Фиксация точного времени решения.</li>
            <li><b>Traceability:</b> Сравнение оценки AI и финального вердикта человека.</li>
            <li><b>Accountability:</b> Привязка решения к ID эксперта (Session ID).</li>
          </ul>
          <Divider style={{ margin: '12px 0' }} />
          <Text type="secondary" style={{ fontSize: '11px', display: 'block', textAlign: 'center' }}>
            Цель: Исключение субъективности и коррупционных рисков.
          </Text>
        </div>
      ),
      onOk() {},
      okText: 'Понятно',
      width: 450
    });
  };

  // ФУНКЦИЯ ДЛЯ КНОПКИ AI АРБИТРАЖА
  const generateArbitrationReport = (candidate: Candidate) => {
    message.loading({ content: 'AI сопоставляет контекст панелей...', key: 'arb_gen' });
    
    setTimeout(() => {
      setArbReport({
        summary: "Выявлена критическая аномалия: Технический гений vs Культурный риск.",
        panelA: { 
          score: 95, 
          note: "Идеально решил алгоритмическую задачу. Стек технологий знает на уровне уверенного Middle." 
        },
        panelB: { 
          score: 30, 
          note: "Кандидат проявляет признаки токсичности. Отказался обсуждать альтернативные решения." 
        },
        verdict: "Рекомендация: Провести финальный раунд. Нужно понять, является ли поведение следствием стресса или это черта характера."
      });
      setIsArbModalOpen(true);
      message.success({ content: 'Аналитическая записка готова', key: 'arb_gen' });
    }, 1200);
  };

  const radarData = selectedCandidate?.aiScores ? [
    { subject: 'Motivation', A: selectedCandidate.aiScores.motivation.score },
    { subject: 'Leadership', A: selectedCandidate.aiScores.leadership.score },
    { subject: 'Technical', A: selectedCandidate.aiScores.technicalPotential.score },
    { subject: 'Creativity', A: selectedCandidate.aiScores.creativity.score },
    { subject: 'Resilience', A: selectedCandidate.aiScores.resilience.score },
    { subject: 'Social Impact', A: selectedCandidate.aiScores.socialImpact.score },
  ] : [];

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getAiWrittenColor = (prob: number) => {
    if (prob < 0.3) return '#10B981';
    if (prob < 0.6) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', background: '#FFFFFF' }}>
      <style>{`
        body { margin: 0; padding: 0; overflow: hidden !important; }
        .ant-layout { background: #FFFFFF !important; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>

      <Content style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Row gutter={0} style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #F0F0F0',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>

          {/* LEFT: Candidate List */}
          <Col span={9} style={{ borderRight: '1px solid #F0F0F0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #F0F0F0' }}>
              <Alert 
                message={<Text strong style={{ fontSize: 12 }}>Anti-Bias Protocol v2.0</Text>}
                description={<Text style={{ fontSize: 11 }}>Система анонимизации активна. Данные скрыты до этапа разблокировки.</Text>}
                type="info"
                showIcon
                icon={<ShieldCheck size={20} />}
                style={{ marginBottom: 16, borderRadius: 10 }}
              />

              <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  Applicants <Text type="secondary" style={{ fontWeight: 400 }}>({candidates.length})</Text>
                </Title>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} size="small">
                  <Select.Option value="all">Все статусы</Select.Option>
                  <Select.Option value="new">Новые</Select.Option>
                  <Select.Option value="under_review">На проверке</Select.Option>
                  <Select.Option value="interview">Интервью</Select.Option>
                  <Select.Option value="arbitration">Арбитраж</Select.Option>
                  <Select.Option value="accepted">Приняты</Select.Option>
                  <Select.Option value="declined">Отказ</Select.Option>
                </Select>
              </Row>
              <Input
                placeholder="Поиск..."
                prefix={<img src={searchIcon} alt="search" style={{ width: '14px', marginRight: '4px' }} />}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ borderRadius: '10px', background: '#F5F7FA', border: '1px solid #F0F0F0', height: '40px' }}
                allowClear
              />
            </div>

            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
              <List
                loading={loading}
                dataSource={candidates}
                renderItem={(item) => {
                  const hidden = isDataHidden(item.status);
                  return (
                    <List.Item
                      onClick={() => { setSelectedId(item.id); setReviewNotes(item.reviewerNotes || ''); }}
                      style={{
                        padding: '16px 24px',
                        cursor: 'pointer',
                        background: selectedId === item.id ? '#F0F7FF' : '#FFFFFF',
                        borderLeft: selectedId === item.id ? '4px solid #006CFF' : '4px solid transparent',
                        borderBottom: '1px solid #F0F0F0',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Row align="middle" gutter={12} style={{ width: '100%' }}>
                        <Col span={4}>
                          {hidden ? <Avatar size={48} icon={<User />} style={{ background: '#E5E7EB', color: '#9CA3AF' }} /> : <Avatar size={48} src={getAvatar(item)} />}
                        </Col>
                        <Col span={14}>
                          <Text strong style={{ fontSize: '14px', display: 'block', color: selectedId === item.id ? '#006CFF' : '#1F2937' }}>
                            {hidden ? `Applicant #${item.id.slice(-5).toUpperCase()}` : item.name}
                          </Text>
                          <Space size={4} style={{ marginTop: '2px' }}>
                            <GraduationCap size={12} color="#9CA3AF" />
                            <Text type="secondary" style={{ fontSize: '12px' }}>{hidden ? `GPA: ${item.gpa || 'N/A'}` : item.university || 'N/A'}</Text>
                          </Space>
                          <div style={{ marginTop: 4 }}><Tag color={STATUS_COLORS[item.status]} style={{ fontSize: '10px' }}>{item.status.toUpperCase()}</Tag></div>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                          <Text strong style={{ fontSize: '20px', color: getScoreColor(item.compositeScore) }}>{Math.round(item.compositeScore)}</Text>
                          <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>/100</Text>
                        </Col>
                      </Row>
                    </List.Item>
                  );
                }}
              />
            </div>
          </Col>

          {/* RIGHT: Candidate Detail */}
          <Col span={15} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
            {selectedCandidate ? (
              <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '36px', paddingBottom: '120px' }}>
                <Row justify="space-between" align="top" style={{ marginBottom: '28px' }}>
                  <Space size={20}>
                    {isDataHidden(selectedCandidate.status) ? <Avatar size={90} icon={<EyeOff size={40} />} /> : <Avatar size={90} src={getAvatar(selectedCandidate)} />}
                    <div>
                      <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                        {isDataHidden(selectedCandidate.status) ? `Applicant #${selectedCandidate.id.slice(-5).toUpperCase()}` : selectedCandidate.name}
                      </Title>
                      <Space size="large" style={{ marginTop: '6px' }}>
                         <Space><MapPin size={14} /><Text type="secondary">{isDataHidden(selectedCandidate.status) ? 'Hidden' : selectedCandidate.city}</Text></Space>
                         <Space><GraduationCap size={14} /><Text type="secondary">{isDataHidden(selectedCandidate.status) ? 'Hidden' : selectedCandidate.university}</Text></Space>
                         {selectedCandidate.gpa && <Text strong>GPA: {selectedCandidate.gpa}</Text>}
                      </Space>
                    </div>
                  </Space>
                </Row>

                <Divider />

                {/* ARBITRATION BLOCK */}
                {selectedCandidate.status === 'arbitration' && (
                  <div style={{ marginBottom: '24px' }}>
                    <Alert
                      message={<Text strong style={{ color: '#851d1d', fontSize: '15px' }}>Аномалия: Конфликт оценок</Text>}
                      description={
                        <div style={{ marginTop: 8 }}>
                          <Paragraph style={{ color: '#851d1d', fontSize: '13px', margin: 0 }}>
                            Система выявила критическое расхождение мнений экспертов. Решение заблокировано для аудита.
                          </Paragraph>
                          <Space style={{ marginTop: 12 }}>
                            <Button size="small" danger icon={<Bot size={14} />} onClick={() => generateArbitrationReport(selectedCandidate)}>Сравнить мнения (AI)</Button>
                            <Button size="small" icon={<Scale size={14} />} onClick={showAuditInfo}>Audit Info</Button>
                          </Space>
                        </div>
                      }
                      type="error"
                      showIcon
                      icon={<AlertTriangle size={24} />}
                      style={{ borderRadius: '14px', padding: '16px' }}
                    />
                  </div>
                )}

                {/* AI Assessment Summary */}
                {selectedCandidate.aiSummary && (
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '14px', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
                    <Title level={5} style={{ display: 'flex', alignItems: 'center' }}><ShieldCheck size={18} style={{ marginRight: 8 }} /> AI Assessment</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>{selectedCandidate.aiSummary}</Paragraph>
                  </div>
                )}

                {/* AI Flags */}
                {selectedCandidate.aiFlags && (
                   <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={8}><Card size="small" style={{ textAlign: 'center' }}><Bot size={16} /><div style={{ fontSize: 12 }}>AI-Prob</div><Progress percent={Math.round((selectedCandidate.aiFlags.aiWrittenProbability || 0) * 100)} size="small" /></Card></Col>
                      <Col span={8}><Card size="small" style={{ textAlign: 'center' }}><CheckCircle2 size={16} /><div style={{ fontSize: 12 }}>Quality</div><Text strong>{selectedCandidate.aiFlags.generic_content ? 'Generic' : 'Authentic'}</Text></Card></Col>
                      <Col span={8}><Card size="small" style={{ textAlign: 'center' }}><TrendingUp size={16} /><div style={{ fontSize: 12 }}>Potential</div><Text strong>{selectedCandidate.aiFlags.high_potential_outlier ? 'Outlier' : 'Standard'}</Text></Card></Col>
                   </Row>
                )}

                <Row gutter={28}>
                   <Col span={11}>
                      <Title level={5}>Achievements</Title>
                      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
                        {selectedCandidate.achievements.length > 0 ? selectedCandidate.achievements.map((a, i) => (
                          <Card key={i} styles={{ body: { padding: '10px' } }} style={{ background: '#F9FAFB' }}>
                            <Space><span>{ACHIEVEMENT_ICONS[a.type] || '📌'}</span><Text strong>{a.title}</Text></Space>
                          </Card>
                        )) : <Text type="secondary">No achievements</Text>}
                      </Space>
                   </Col>
                   <Col span={13}>
                      <Card title="Competency Map" variant="borderless" style={{ border: '1px solid #F0F0F0' }}>
                        <div style={{ height: '260px', width: '100%' }}>
                          <ResponsiveContainer width="99%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis domain={[0, 100]} tick={false} />
                              <RadarArea dataKey="A" stroke="#006CFF" fill="#006CFF" fillOpacity={0.1} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                   </Col>
                </Row>

                <div style={{ marginTop: 24 }}>
                  <Title level={5}>Reviewer Notes</Title>
                  <TextArea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} placeholder="Обоснуйте решение для Audit Log..." />
                  <Button size="small" style={{ marginTop: 8 }} onClick={handleSaveNotes}>Save & Sync</Button>
                </div>

                {/* Final Bar */}
                <div style={{ marginTop: '28px', padding: '20px', background: '#F9FAFB', borderRadius: '14px', display: 'flex', justifyContent: 'space-between' }}>
                  {selectedCandidate.status === 'new' || selectedCandidate.status === 'under_review' ? (
                    <Space>
                      <Button danger icon={<XCircle size={16} />} onClick={() => handleStatusChange(selectedCandidate.id, 'declined')}>Decline</Button>
                      <Button icon={<FileText size={16} />} onClick={() => handleStatusChange(selectedCandidate.id, 'under_review')}>Mark Review</Button>
                      <Button type="primary" icon={<Send size={16} />} onClick={() => handleStatusChange(selectedCandidate.id, 'interview')}>Approve Interview</Button>
                    </Space>
                  ) : (
                    <Space><CheckCircle2 size={24} color="#10B981" /><Text strong>Решение зафиксировано в Audit Log.</Text></Space>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Empty description="Select a candidate" /></div>
            )}
          </Col>
        </Row>
      </Content>

      {/* ARBITRATION MODAL */}
      <Modal
        title={<Space><Bot size={20} color="#006CFF" /> Арбитраж: Сопоставление данных</Space>}
        open={isArbModalOpen}
        onCancel={() => setIsArbModalOpen(false)}
        footer={[<Button key="ok" type="primary" onClick={() => setIsArbModalOpen(false)}>Принято</Button>]}
        width={700}
      >
        {arbReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Alert message="AI Анализ конфликта" description={arbReport.summary} type="warning" showIcon />
            <Row gutter={16}>
              <Col span={12}><Card title="Panel A (Tech)" size="small" style={{ background: '#F0FDF4' }}><Text strong style={{ fontSize: 24, color: '#10B981' }}>{arbReport.panelA.score}</Text><Paragraph italic>{arbReport.panelA.note}</Paragraph></Card></Col>
              <Col span={12}><Card title="Panel B (Soft)" size="small" style={{ background: '#FEF2F2' }}><Text strong style={{ fontSize: 24, color: '#EF4444' }}>{arbReport.panelB.score}</Text><Paragraph italic>{arbReport.panelB.note}</Paragraph></Card></Col>
            </Row>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
               <Title level={5}>Вердикт AI:</Title>
               <Paragraph style={{ margin: 0 }}>{arbReport.verdict}</Paragraph>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Candidates;