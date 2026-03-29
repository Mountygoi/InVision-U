import { useState, useEffect, useCallback } from 'react';
import { Row, Col, List, Avatar, Tag, Button, Typography, Space, Empty, message, Input, Layout, Card, Divider, Select, Progress, Badge } from 'antd';
import { ShieldCheck, FileText, Send, XCircle, MapPin, GraduationCap, CheckCircle2, AlertTriangle, Bot, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Radar as RadarArea } from 'recharts';
import searchIcon from '../assets/icons/search.svg';
import type { Candidate } from '../types';

const getAvatar = (item: Candidate) => {
  // Если в базе есть ссылка на фото, используем её
  if (item.avatarUrl) {
    return item.avatarUrl;
  }
  // Если нет - используем генератор по имени
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name)}`;
};

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { TextArea } = Input;

// 1. ИСПРАВЛЕНИЕ: Интерфейс для параметров запроса (вместо any)
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

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      // 2. ИСПРАВЛЕНИЕ: Используем типизированный объект параметров
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
      // 3. ИСПРАВЛЕНИЕ: Используем ошибку в логе, чтобы линтер не ругался
      console.error('Save notes error:', error);
      message.error('Error saving notes');
    }
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
    <Layout style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}>

      <Content style={{ padding: '24px' }}>
        <Row gutter={0} style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #F0F0F0',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>

          {/* LEFT: Candidate List */}
          <Col span={9} style={{ borderRight: '1px solid #F0F0F0', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #F0F0F0' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  Applicants <Text type="secondary" style={{ fontWeight: 400 }}>({candidates.length})</Text>
                </Title>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} size="small">
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="new">New</Select.Option>
                  <Select.Option value="under_review">Under Review</Select.Option>
                  <Select.Option value="interview">Interview</Select.Option>
                  <Select.Option value="accepted">Accepted</Select.Option>
                  <Select.Option value="declined">Declined</Select.Option>
                </Select>
              </Row>
              <Input
                placeholder="Search by name or university..."
                prefix={<img src={searchIcon} alt="search" style={{ width: '14px', marginRight: '4px' }} />}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ borderRadius: '10px', background: '#F5F7FA', border: '1px solid #F0F0F0', height: '40px' }}
                allowClear
              />
            </div>

            <List
              loading={loading}
              dataSource={candidates}
              style={{ flex: 1, overflowY: 'auto' }}
              renderItem={(item) => (
                <List.Item
                  onClick={() => {
                    setSelectedId(item.id);
                    setReviewNotes(item.reviewerNotes || '');
                  }}
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
                      <Avatar size={48} src={getAvatar(item)} style={{ border: '2px solid #FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    </Col>
                    <Col span={14}>
                      <Text strong style={{ fontSize: '14px', display: 'block', color: selectedId === item.id ? '#006CFF' : '#1F2937' }}>
                        {item.name}
                      </Text>
                      <Space size={4} style={{ marginTop: '2px' }}>
                        <GraduationCap size={12} color="#9CA3AF" />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{item.university || 'N/A'}</Text>
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        <Tag color={STATUS_COLORS[item.status]} style={{ fontSize: '10px', borderRadius: '4px', border: 'none' }}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </Tag>
                        {item.isRural && <Tag color="green" style={{ fontSize: '10px', borderRadius: '4px', border: 'none' }}>RURAL</Tag>}
                      </div>
                    </Col>
                    <Col span={6} style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: '20px', color: getScoreColor(item.compositeScore) }}>
                        {Math.round(item.compositeScore)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>/100</Text>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Col>

          {/* RIGHT: Candidate Detail */}
          <Col span={15} style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', background: '#FFFFFF' }}>
            {selectedCandidate ? (
              <div style={{ padding: '36px' }}>
                <Row justify="space-between" align="top" style={{ marginBottom: '28px' }}>
                  <Space size={20}>
                    <Avatar size={90} src={getAvatar(selectedCandidate)} style={{ border: '4px solid #F0F7FF', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
                    <div>
                      <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
                        {selectedCandidate.name}
                      </Title>
                      <Space size="large" style={{ marginTop: '6px' }}>
                        <Space><MapPin size={14} color="#006CFF" /><Text type="secondary">{selectedCandidate.city}, KZ</Text></Space>
                        <Space><GraduationCap size={14} color="#006CFF" /><Text type="secondary">{selectedCandidate.university}</Text></Space>
                        {selectedCandidate.gpa && <Text type="secondary">GPA: {selectedCandidate.gpa}</Text>}
                      </Space>
                      <div style={{ marginTop: 6 }}>
                        <Tag color={STATUS_COLORS[selectedCandidate.status]} style={{ borderRadius: 4 }}>
                          {selectedCandidate.status.replace('_', ' ').toUpperCase()}
                        </Tag>
                        {selectedCandidate.isRural && <Tag color="green">RURAL BONUS</Tag>}
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                          Composite Score: <Text strong style={{ color: getScoreColor(selectedCandidate.compositeScore), fontSize: 16 }}>{Math.round(selectedCandidate.compositeScore)}</Text>/100
                        </Text>
                      </div>
                    </div>
                  </Space>
                </Row>

                <Divider style={{ margin: '20px 0' }} />

                {/* AI Assessment Summary */}
                {selectedCandidate.aiSummary ? (
                  <div style={{
                    background: selectedCandidate.compositeScore >= 70 ? '#F0FDF4' : selectedCandidate.compositeScore >= 50 ? '#FFFBEB' : '#FEF2F2',
                    padding: '20px',
                    borderRadius: '14px',
                    marginBottom: '24px',
                    border: `1px solid ${selectedCandidate.compositeScore >= 70 ? '#DCFCE7' : selectedCandidate.compositeScore >= 50 ? '#FEF3C7' : '#FECACA'}`
                  }}>
                    <Title level={5} style={{
                      color: selectedCandidate.compositeScore >= 70 ? '#166534' : selectedCandidate.compositeScore >= 50 ? '#92400E' : '#991B1B',
                      marginBottom: '10px', display: 'flex', alignItems: 'center'
                    }}>
                      <ShieldCheck size={18} style={{ marginRight: '8px' }} /> AI Assessment
                    </Title>
                    <Paragraph style={{
                      fontSize: '14px', lineHeight: '1.6',
                      color: selectedCandidate.compositeScore >= 70 ? '#166534' : selectedCandidate.compositeScore >= 50 ? '#92400E' : '#991B1B',
                      margin: 0
                    }}>
                      {selectedCandidate.aiSummary}
                    </Paragraph>
                  </div>
                ) : (
                  <div style={{
                    background: '#F5F7FA',
                    padding: '20px',
                    borderRadius: '14px',
                    marginBottom: '24px',
                    border: '1px solid #E5E7EB',
                    textAlign: 'center'
                  }}>
                    <Bot size={24} color="#9CA3AF" style={{ marginBottom: 8 }} />
                    <Title level={5} style={{ color: '#6B7280', marginBottom: 4 }}>AI Analysis Not Available</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      No motivation essay was submitted for this candidate. AI scoring requires an essay to evaluate leadership potential, motivation, and other dimensions.
                    </Text>
                  </div>
                )}

                {/* AI Flags */}
                {selectedCandidate.aiFlags && (() => {
                  const flags = selectedCandidate.aiFlags;
                  const aiProb = flags.is_ai_generated ?? flags.aiWrittenProbability ?? 0;
                  return (
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={8}>
                        <Card size="small" style={{ borderRadius: 12, textAlign: 'center' }}>
                          <Bot size={16} color={getAiWrittenColor(aiProb)} />
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>AI-Written Probability</div>
                          <Progress
                            percent={Math.round(aiProb * 100)}
                            size="small"
                            strokeColor={getAiWrittenColor(aiProb)}
                            format={p => `${p}%`}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" style={{ borderRadius: 12, textAlign: 'center' }}>
                          {flags.generic_content
                            ? <AlertTriangle size={16} color="#EF4444" />
                            : <CheckCircle2 size={16} color="#10B981" />
                          }
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Content Quality</div>
                          <Text strong style={{
                            fontSize: 16,
                            color: flags.generic_content ? '#EF4444' : '#10B981'
                          }}>
                            {flags.generic_content ? 'Generic' : 'Authentic'}
                          </Text>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" style={{ borderRadius: 12, textAlign: 'center' }}>
                          <TrendingUp size={16} color={flags.high_potential_outlier ? '#006CFF' : '#9CA3AF'} />
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Potential</div>
                          <Text strong style={{
                            fontSize: 16,
                            color: flags.high_potential_outlier ? '#006CFF' : '#6B7280'
                          }}>
                            {flags.high_potential_outlier ? 'Outlier' : 'Standard'}
                          </Text>
                        </Card>
                      </Col>
                    </Row>
                  );
                })()}

                <Row gutter={28}>
                  {/* Left: Achievements + Evidence */}
                  <Col span={11}>
                    <Title level={5} style={{ marginBottom: '12px', fontWeight: 600 }}>Achievements</Title>
                    <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }} size="small">
                      {selectedCandidate.achievements.length > 0 ? selectedCandidate.achievements.map((a, i) => (
                        <Card key={i} styles={{ body: { padding: '10px 14px' } }} style={{ borderRadius: '10px', background: '#F9FAFB', border: 'none' }}>
                          <Space>
                            <span>{ACHIEVEMENT_ICONS[a.type] || '📌'}</span>
                            <div>
                              <Text strong style={{ fontSize: 13 }}>{a.title}</Text>
                              {a.description && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{a.description}</Text>}
                            </div>
                          </Space>
                        </Card>
                      )) : (
                        <Text type="secondary">No achievements listed</Text>
                      )}
                    </Space>

                    <Title level={5} style={{ marginBottom: 12, fontWeight: 600 }}>
                      <TrendingUp size={16} style={{ marginRight: 6 }} />Key Evidence from Essay
                    </Title>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      {Object.entries(selectedCandidate.aiScores || {})
                        .sort(([, a], [, b]) => (b as { score: number }).score - (a as { score: number }).score)
                        .slice(0, 3)
                        .map(([key, val]) => {
                          const scoreVal = val as { score: number; evidence?: any };
                          // Handle both formats: string (new AI) and array (seed data)
                          const evidenceText = typeof scoreVal.evidence === 'string'
                            ? scoreVal.evidence
                            : Array.isArray(scoreVal.evidence) && scoreVal.evidence.length > 0
                              ? scoreVal.evidence[0].quote || ''
                              : '';
                          if (!evidenceText) return null;
                          return (
                            <Card key={key} size="small" style={{ borderRadius: 10, borderLeft: `3px solid ${getScoreColor(scoreVal.score)}` }}>
                              <Tag color={getScoreColor(scoreVal.score)} style={{ marginBottom: 6, fontSize: 10 }}>
                                {key.replace(/([A-Z])/g, ' $1').trim()} — {scoreVal.score}
                              </Tag>
                              <Paragraph italic style={{ fontSize: 12, margin: 0, color: '#374151' }}>
                                "{evidenceText}"
                              </Paragraph>
                            </Card>
                          );
                        })}
                    </Space>
                  </Col>

                  {/* Right: Radar Chart + Dimension Scores */}
                  <Col span={13}>
                    <Card
                      title={<Text strong style={{ fontSize: '15px' }}>Competency Map</Text>}
                      variant="borderless"
                      style={{ border: '1px solid #F0F0F0', borderRadius: '14px' }}
                    >
                      {radarData.length > 0 ? (
                        <>
                          <div style={{ height: '260px', width: '100%', minWidth: 0 }}>
                            <ResponsiveContainer width="99%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="78%" data={radarData}>
                                <PolarGrid stroke="#E5E7EB" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <RadarArea name="Candidate" dataKey="A" stroke="#006CFF" fill="#006CFF" fillOpacity={0.12} dot={{ r: 3, fill: '#006CFF', strokeWidth: 2 }} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Dimension Breakdown */}
                          {selectedCandidate.aiScores && (
                            <div style={{ marginTop: 12 }}>
                              {Object.entries(selectedCandidate.aiScores).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                                  <Text style={{ fontSize: 12, width: 110, color: '#6B7280' }}>
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </Text>
                                  <Progress
                                    percent={val.score}
                                    size="small"
                                    style={{ flex: 1 }}
                                    strokeColor={getScoreColor(val.score)}
                                    format={() => <Text style={{ fontSize: 11 }}>{val.score}</Text>}
                                  />
                                  {val.confidence != null && (
                                    <Badge
                                      count={val.confidence >= 0.9 ? 'HIGH' : val.confidence >= 0.7 ? 'MED' : 'LOW'}
                                      style={{
                                        backgroundColor: val.confidence >= 0.9 ? '#10B981' : val.confidence >= 0.7 ? '#F59E0B' : '#EF4444',
                                        fontSize: 9, padding: '0 4px'
                                      }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                          <Bot size={32} color="#D1D5DB" />
                          <Text type="secondary" style={{ marginTop: 12, fontSize: 13 }}>No essay submitted</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>AI competency analysis requires a motivation essay</Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginTop: 24 }}>
                  <Title level={5} style={{ fontWeight: 600, marginBottom: 8 }}>Reviewer Notes</Title>
                  <TextArea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder="Add assessment notes..."
                    style={{ borderRadius: 8, marginBottom: 8 }}
                  />
                  <Button size="small" onClick={handleSaveNotes}>Save Notes</Button>
                </div>

                <div style={{
                  marginTop: '28px',
                  padding: '20px',
                  background: '#F9FAFB',
                  borderRadius: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Space size="middle">
                    <Button
                      danger
                      icon={<XCircle size={16} />}
                      style={{ borderRadius: '10px', fontWeight: 600, height: '44px' }}
                      onClick={() => handleStatusChange(selectedCandidate.id, 'declined')}
                    >
                      Decline
                    </Button>
                    <Button
                      style={{ borderRadius: '10px', fontWeight: 600, height: '44px', borderColor: '#F59E0B', color: '#F59E0B' }}
                      icon={<FileText size={16} />}
                      onClick={() => handleStatusChange(selectedCandidate.id, 'under_review')}
                    >
                      Mark Review
                    </Button>
                    <Button
                      type="primary"
                      icon={<Send size={16} />}
                      style={{ background: '#006CFF', borderRadius: '10px', fontWeight: 600, height: '44px' }}
                      onClick={() => handleStatusChange(selectedCandidate.id, 'interview')}
                    >
                      Approve Interview
                    </Button>
                  </Space>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Empty description="Select a candidate from the list" />
              </div>
            )}
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Candidates;