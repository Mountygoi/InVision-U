import { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Avatar, Tag, Button, Typography, Space, Empty, message, Input, Layout, Card, Divider, Select, Progress, Badge, Alert, Modal, Slider, Popover, Checkbox } from 'antd';
import { ShieldCheck, FileText, Send, XCircle, MapPin, GraduationCap, CheckCircle2, AlertTriangle, Bot, TrendingUp, User, EyeOff, Scale, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Radar as RadarArea } from 'recharts';
import searchIcon from '../assets/icons/search.svg';
import type { Candidate } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { themeColors } from '../i18n/themeColors';
import { API, API_BASE } from '../config';
import { getAvatarUrl } from '../utils/helpers';


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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = themeColors(isDark);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('score_desc');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  // Арбитраж
  const [isArbModalOpen, setIsArbModalOpen] = useState(false);
  const [arbLoading, setArbLoading] = useState(false);
  const [arbResolveScore, setArbResolveScore] = useState<number | ''>(75);
  const [arbResolveNotes, setArbResolveNotes] = useState('');
  const [arbReport, setArbReport] = useState<{
    candidateName: string;
    summary: string;
    panelA: { score: number; note: string; analysis?: string };
    panelB: { score: number; note: string; analysis?: string };
    disagreementFactors?: string[];
    verdict: string;
    suggestedScore?: number;
  } | null>(null);

  // Документы
  const [essayModalOpen, setEssayModalOpen] = useState(false);
  const [certModal, setCertModal] = useState<{ type: 'ielts' | 'unt'; open: boolean }>({ type: 'ielts', open: false });
  const [certApproving, setCertApproving] = useState(false);

  // Оценка интервью
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalSaving, setEvalSaving] = useState(false);
  const [techScore, setTechScore] = useState<number | ''>('');
  const [softScore, setSoftScore] = useState<number | ''>('');
  const [techNotes, setTechNotes] = useState('');
  const [softNotes, setSoftNotes] = useState('');
  const [assessmentTab, setAssessmentTab] = useState<'simulation' | 'sjt' | 'personality'>('simulation');

  const isDataHidden = (_status: string) => {
    return false;
  };

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params: FetchCandidatesParams = { sort: 'composite_score', order: 'desc' };
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get(`${API}/candidates`, { params });
      setCandidates(res.data);
      if (res.data.length > 0 && !selectedId) setSelectedId(res.data[0].id);
    } catch (err) {
      console.error('Data fetch error:', err);
      message.error(t('errorLoadData'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, t]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const selectedCandidate = candidates.find(c => c.id === selectedId);

  // Client-side filtering for score range and multi-status
  const filteredCandidates = useMemo(() => {
    let result = candidates.filter(c => {
      const score = Math.round(c.compositeScore || 0);
      return score >= scoreRange[0] && score <= scoreRange[1];
    });
    if (statusFilters.length > 0) {
      result = result.filter(c => statusFilters.includes(c.status));
    }
    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'score_asc': return (a.compositeScore || 0) - (b.compositeScore || 0);
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        default: return (b.compositeScore || 0) - (a.compositeScore || 0);
      }
    });
    return result;
  }, [candidates, scoreRange, statusFilters, sortBy]);

  const activeFilterCount = (statusFilters.length > 0 ? 1 : 0) + (scoreRange[0] > 0 || scoreRange[1] < 100 ? 1 : 0) + (sortBy !== 'score_desc' ? 1 : 0);

  const resetFilters = () => {
    setStatusFilters([]);
    setScoreRange([0, 100]);
    setSortBy('score_desc');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`${API}/candidates/${id}/status`, { status: newStatus });
      message.success(t('statusUpdated', { status: newStatus }));
      fetchCandidates();
    } catch (err) {
      console.error('Update status error:', err);
      message.error(t('errorUpdateStatus'));
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedId) return;
    try {
      await axios.patch(`${API}/candidates/${selectedId}/review`, {
        notes: reviewNotes,
        reviewedBy: 'admin'
      });
      message.success(t('reviewNotesSaved'));
      fetchCandidates();
    } catch (error) {
      console.error('Save notes error:', error);
      message.error(t('errorSaveNotes'));
    }
  };

  // ФУНКЦИЯ ДЛЯ КНОПКИ AUDIT INFO
  const showAuditInfo = () => {
    Modal.info({
      title: t('auditTitle'),
      content: (
        <div style={{ marginTop: 12 }}>
          <Paragraph style={{ fontSize: '13px', color: c.textDark }}>
            <ShieldCheck size={16} style={{ marginRight: 8, color: '#10B981', verticalAlign: 'middle' }} /> 
            {t('auditDesc')}
          </Paragraph>
          <ul style={{ fontSize: '12px', color: c.textSecondary, paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>{t('auditTimestamp')}</li>
            <li>{t('auditTraceability')}</li>
            <li>{t('auditAccountability')}</li>
          </ul>
          <Divider style={{ margin: '12px 0' }} />
          <Text type="secondary" style={{ fontSize: '11px', display: 'block', textAlign: 'center' }}>
            {t('auditGoal')}
          </Text>
        </div>
      ),
      onOk() {},
      okText: t('understood'),
      width: 450
    });
  };

  // AI Арбитраж — реальный анализ расхождения оценок панелей
  const generateArbitrationReport = async (candidate: Candidate) => {
    setArbLoading(true);
    message.loading({ content: t('aiAnalyzing'), key: 'arb_gen' });
    try {
      const res = await axios.post(`${API}/candidates/${candidate.id}/arbitration`);
      setArbReport(res.data);
      setIsArbModalOpen(true);
      message.success({ content: t('reportReady'), key: 'arb_gen' });
    } catch (err) {
      console.error('Arbitration error:', err);
      message.error({ content: t('reportFailed'), key: 'arb_gen' });
    } finally {
      setArbLoading(false);
    }
  };

  // Одобрение сертификата
  const approveCert = async (candidateId: string, certType: 'ielts' | 'unt') => {
    setCertApproving(true);
    try {
      await axios.patch(`${API}/candidates/${candidateId}/approve-cert`, { certType });
      message.success(t('certApproved', { type: certType.toUpperCase() }));
      fetchCandidates();
    } catch {
      message.error(t('certApproveFailed'));
    } finally {
      setCertApproving(false);
    }
  };

  // Сохранение оценок интервью
  const handleSaveEval = async () => {
    if (!selectedId) return;
    if (techScore === '' || softScore === '') {
      message.warning(t('enterBothScores'));
      return;
    }
    setEvalSaving(true);
    try {
      await axios.patch(`${API}/candidates/${selectedId}/status`, {
        status: 'under_review',
        tech_score: Number(techScore),
        soft_score: Number(softScore),
        tech_notes: techNotes,
        soft_notes: softNotes,
      });
      message.success(t('scoresSaved'));
      setEvalModalOpen(false);
      setTechScore(''); setSoftScore(''); setTechNotes(''); setSoftNotes('');
      fetchCandidates();
    } catch (err) {
      message.error(t('errorSaveScores'));
    } finally {
      setEvalSaving(false);
    }
  };

  const radarData = selectedCandidate?.aiScores ? [
    { subject: t('motivation'), A: selectedCandidate.aiScores.motivation.score },
    { subject: t('leadership'), A: selectedCandidate.aiScores.leadership.score },
    { subject: t('technicalPotential'), A: selectedCandidate.aiScores.technicalPotential.score },
    { subject: t('creativity'), A: selectedCandidate.aiScores.creativity.score },
    { subject: t('resilience'), A: selectedCandidate.aiScores.resilience.score },
  ] : [];

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', background: c.pageBg }}>
      <style>{`
        .candidates-layout { overflow: hidden; }
        .ant-layout { background: ${c.pageBg} !important; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: ${c.scrollThumb}; border-radius: 10px; }
      `}</style>

      <Content style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease both' }}>
        <Row gutter={0} style={{
          flex: 1,
          background: c.pageBg,
          borderRadius: '16px',
          border: `1px solid ${c.borderLight}`,
          overflow: 'hidden',
          boxShadow: c.shadowMd
        }}>

          {/* LEFT: Candidate List */}
          <Col span={9} style={{ borderRight: `1px solid ${c.borderLight}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${c.borderLight}` }}>
              <Alert
                title={<Text strong style={{ fontSize: 12 }}>{t('antiBiasTitle')}</Text>}
                description={<Text style={{ fontSize: 11 }}>{t('antiBiasDesc')}</Text>}
                type="success"
                showIcon
                icon={<ShieldCheck size={20} />}
                style={{ marginBottom: 16, borderRadius: 10, background: c.greenBg, border: `1px solid ${c.greenBorder}` }}
              />

              <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  {t('applicants')} <Text type="secondary" style={{ fontWeight: 400 }}>({filteredCandidates.length})</Text>
                </Title>
              </Row>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input
                  placeholder={t('search')}
                  prefix={<img src={searchIcon} alt="search" style={{ width: '14px', marginRight: '4px' }} />}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ borderRadius: '10px', background: c.surfaceAlt, border: `1px solid ${c.borderLight}`, height: '40px', flex: 1 }}
                  allowClear
                />
                <Popover
                  open={filterOpen}
                  onOpenChange={setFilterOpen}
                  trigger="click"
                  placement="bottomRight"
                  content={
                    <div style={{ width: 280, padding: 4 }}>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>{t('filterStatus')}</Text>
                        <Checkbox.Group
                          value={statusFilters}
                          onChange={v => setStatusFilters(v as string[])}
                          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                        >
                          <Checkbox value="new">{t('statusNew')}</Checkbox>
                          <Checkbox value="under_review">{t('statusUnderReview')}</Checkbox>
                          <Checkbox value="interview">{t('statusInterview')}</Checkbox>
                          <Checkbox value="arbitration">{t('statusArbitration')}</Checkbox>
                          <Checkbox value="accepted">{t('statusAccepted')}</Checkbox>
                          <Checkbox value="declined">{t('statusDeclined')}</Checkbox>
                        </Checkbox.Group>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>{t('filterScore')}: {scoreRange[0]} – {scoreRange[1]}</Text>
                        <Slider
                          range
                          min={0}
                          max={100}
                          value={scoreRange}
                          onChange={v => setScoreRange(v as [number, number])}
                        />
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>{t('filterSort')}</Text>
                        <Select value={sortBy} onChange={setSortBy} style={{ width: '100%' }} size="small">
                          <Select.Option value="score_desc">{t('sortScoreDesc')}</Select.Option>
                          <Select.Option value="score_asc">{t('sortScoreAsc')}</Select.Option>
                          <Select.Option value="name_asc">{t('sortNameAsc')}</Select.Option>
                          <Select.Option value="name_desc">{t('sortNameDesc')}</Select.Option>
                        </Select>
                      </div>
                      <Button size="small" type="link" onClick={resetFilters} style={{ padding: 0, color: '#EF4444' }}>
                        {t('resetFilters')}
                      </Button>
                    </div>
                  }
                >
                  <Badge count={activeFilterCount} size="small" offset={[-2, 2]}>
                    <Button
                      icon={<SlidersHorizontal size={16} />}
                      style={{ height: 40, width: 40, borderRadius: 10, background: c.surfaceAlt, border: `1px solid ${c.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                  </Badge>
                </Popover>
              </div>
            </div>

            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <span>{t('loading')}</span>
                </div>
              ) : (
                filteredCandidates.map((item) => {
                  const hidden = isDataHidden(item.status);
                  return (
                    <div
                      key={item.id}
                      onClick={() => { setSelectedId(item.id); setReviewNotes(item.reviewerNotes || ''); }}
                      style={{
                        padding: '16px 24px',
                        cursor: 'pointer',
                        background: selectedId === item.id ? c.greenBg : c.pageBg,
                        borderLeft: selectedId === item.id ? '4px solid #16a34a' : '4px solid transparent',
                        borderBottom: `1px solid ${c.borderLight}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Row align="middle" gutter={12} style={{ width: '100%' }}>
                        <Col span={4}>
                          {hidden ? <Avatar size={48} icon={<User />} style={{ background: '#E5E7EB', color: c.textMuted }} /> : <Avatar size={48} src={getAvatarUrl(item)} />}
                        </Col>
                        <Col span={14}>
                          <Text strong style={{ fontSize: '14px', display: 'block', color: selectedId === item.id ? '#16a34a' : c.text }}>
                            {hidden ? `${t('applicant')} #${item.id.slice(-5).toUpperCase()}` : item.name}
                          </Text>
                          <Space size={4} style={{ marginTop: '2px' }}>
                            <GraduationCap size={12} color={c.textMuted} />
                            <Text type="secondary" style={{ fontSize: '12px' }}>{hidden ? `${t('score')}: ${Math.round(item.compositeScore)}` : item.school || item.university || t('na')}</Text>
                          </Space>
                          <div style={{ marginTop: 4 }}><Tag color={STATUS_COLORS[item.status]} style={{ fontSize: '10px' }}>{item.status.toUpperCase()}</Tag></div>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                          <Text strong style={{ fontSize: '20px', color: getScoreColor(item.compositeScore) }}>{Math.round(item.compositeScore)}</Text>
                          <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>/100</Text>
                        </Col>
                      </Row>
                    </div>
                  );
                })
              )}
            </div>
          </Col>

          {/* RIGHT: Candidate Detail */}
          <Col span={15} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.pageBg }}>
            {selectedCandidate ? (
              <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '36px', paddingBottom: '120px' }}>
                <Row justify="space-between" align="top" style={{ marginBottom: '28px' }}>
                  <Space size={20}>
                    {isDataHidden(selectedCandidate.status) ? <Avatar size={90} icon={<EyeOff size={40} />} /> : <Avatar size={90} src={getAvatarUrl(selectedCandidate)} />}
                    <div>
                      <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                        {isDataHidden(selectedCandidate.status) ? `${t('applicant')} #${selectedCandidate.id.slice(-5).toUpperCase()}` : selectedCandidate.name}
                      </Title>
                      <Space size="large" style={{ marginTop: '6px' }}>
                         <Space><MapPin size={14} /><Text type="secondary">{isDataHidden(selectedCandidate.status) ? t('hidden') : selectedCandidate.city}</Text></Space>
                         <Space><GraduationCap size={14} /><Text type="secondary">{isDataHidden(selectedCandidate.status) ? t('hidden') : selectedCandidate.school || selectedCandidate.university}</Text></Space>
                         {selectedCandidate.gpa && <Text strong>GPA: {selectedCandidate.gpa}</Text>}
                      </Space>
                      {/* Document action buttons */}
                      {!isDataHidden(selectedCandidate.status) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                          {selectedCandidate.essayText && (
                            <Button
                              size="small"
                              icon={<FileText size={13} />}
                              onClick={() => setEssayModalOpen(true)}
                              style={{ borderRadius: 10, fontSize: 12, padding: '2px 12px', height: 30 }}
                            >
                              {t('viewEssay')}
                            </Button>
                          )}
                          {selectedCandidate.ieltsFilePath ? (
                            <Button
                              size="small"
                              icon={selectedCandidate.ieltsApproved ? <CheckCircle2 size={13} /> : <FileText size={13} />}
                              style={{
                                borderRadius: 10, fontSize: 12, padding: '2px 12px', height: 30,
                                ...(selectedCandidate.ieltsApproved ? { borderColor: '#10B981', color: '#10B981', background: 'rgba(16,185,129,0.06)' } : {})
                              }}
                              onClick={() => setCertModal({ type: 'ielts', open: true })}
                            >
                              IELTS {selectedCandidate.ieltsApproved ? '✅' : ''}
                            </Button>
                          ) : (
                            <Tag style={{ borderRadius: 10, fontSize: 11, padding: '2px 10px', lineHeight: '24px' }}>{t('noIeltsCert')}</Tag>
                          )}
                          {selectedCandidate.untFilePath ? (
                            <Button
                              size="small"
                              icon={selectedCandidate.untApproved ? <CheckCircle2 size={13} /> : <FileText size={13} />}
                              style={{
                                borderRadius: 10, fontSize: 12, padding: '2px 12px', height: 30,
                                ...(selectedCandidate.untApproved ? { borderColor: '#10B981', color: '#10B981', background: 'rgba(16,185,129,0.06)' } : {})
                              }}
                              onClick={() => setCertModal({ type: 'unt', open: true })}
                            >
                              UBT {selectedCandidate.untApproved ? '✅' : ''}
                            </Button>
                          ) : (
                            <Tag style={{ borderRadius: 10, fontSize: 11, padding: '2px 10px', lineHeight: '24px' }}>{t('noUbtCert')}</Tag>
                          )}
                        </div>
                      )}
                    </div>
                  </Space>
                </Row>

                <Divider />

                {/* ARBITRATION BLOCK */}
                {selectedCandidate.status === 'arbitration' && (
                  <div style={{ marginBottom: '24px' }}>
                    <Alert
                      title={<Text strong style={{ color: '#851d1d', fontSize: '15px' }}>{t('conflictTitle')}</Text>}
                      description={
                        <div style={{ marginTop: 8 }}>
                          <Paragraph style={{ color: '#851d1d', fontSize: '13px', margin: 0 }}>
                            {t('conflictDesc')}
                          </Paragraph>
                          <Space style={{ marginTop: 12 }} wrap>
                            <Button size="small" danger icon={<Bot size={14} />} loading={arbLoading} onClick={() => generateArbitrationReport(selectedCandidate)}>{t('compareAI')}</Button>
                            <Button size="small" icon={<Scale size={14} />} onClick={showAuditInfo}>{t('auditInfo')}</Button>
                          </Space>
                        </div>
                      }
                      type="error"
                      showIcon
                      icon={<AlertTriangle size={24} />}
                      style={{ borderRadius: '14px', padding: '16px' }}
                    />
                    <Card size="small" style={{ marginTop: 12, borderRadius: 12, border: `1px solid ${c.border}` }}>
                      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>{t('commissionDecision')}</Text>
                      <div style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, color: c.textSecondary, display: 'block', marginBottom: 4 }}>{t('finalScore')}</Text>
                        <Slider min={0} max={100} value={typeof arbResolveScore === 'number' ? arbResolveScore : 75} onChange={v => setArbResolveScore(v)} />
                        <Text type="secondary" style={{ fontSize: 11 }}>Текущий: {arbResolveScore}</Text>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, color: c.textSecondary, display: 'block', marginBottom: 4 }}>{t('commissionComment')}</Text>
                        <TextArea rows={2} value={arbResolveNotes} onChange={e => setArbResolveNotes(e.target.value)} placeholder={t('justification')} style={{ borderRadius: 8 }} />
                      </div>
                      <Space wrap>
                        <Button type="primary" size="small" style={{ background: '#16a34a', borderRadius: 8 }}
                          onClick={() => {
                            Modal.confirm({
                              title: t('acceptCandidate'),
                              content: `Итоговый балл: ${arbResolveScore}`,
                              onOk: async () => {
                                await axios.patch(`${API}/candidates/${selectedCandidate.id}/status`, {
                                  status: 'accepted', reviewer_notes: `[Арбитраж] Балл: ${arbResolveScore}. ${arbResolveNotes}`
                                });
                                message.success(t('candidateAccepted'));
                                fetchCandidates();
                              }
                            });
                          }}>
                          {t('accept')}
                        </Button>
                        <Button size="small" danger style={{ borderRadius: 8 }}
                          onClick={() => {
                            Modal.confirm({
                              title: t('declineCandidate'),
                              content: `Итоговый балл: ${arbResolveScore}`,
                              onOk: async () => {
                                await axios.patch(`${API}/candidates/${selectedCandidate.id}/status`, {
                                  status: 'declined', reviewer_notes: `[Арбитраж] Балл: ${arbResolveScore}. ${arbResolveNotes}`
                                });
                                message.success(t('candidateDeclined'));
                                fetchCandidates();
                              }
                            });
                          }}>
                          {t('decline')}
                        </Button>
                        <Button size="small" style={{ borderRadius: 8, borderColor: '#8B5CF6', color: '#8B5CF6' }}
                          onClick={async () => {
                            await axios.patch(`${API}/candidates/${selectedCandidate.id}/status`, {
                              status: 'interview', reviewer_notes: `[Арбитраж → повторное интервью] ${arbResolveNotes}`
                            });
                            message.success(t('reInterviewScheduled'));
                            fetchCandidates();
                          }}>
                          {t('reInterview')}
                        </Button>
                      </Space>
                    </Card>
                  </div>
                )}

                {/* AI Assessment Summary */}
                {selectedCandidate.aiSummary && (
                  <div style={{ background: c.pageBg, padding: '20px', borderRadius: '14px', marginBottom: '24px', border: `1px solid ${c.border}` }}>
                    <Title level={5} style={{ display: 'flex', alignItems: 'center' }}><ShieldCheck size={18} style={{ marginRight: 8 }} /> {t('aiAssessment')}</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>{selectedCandidate.aiSummary}</Paragraph>
                  </div>
                )}

                {/* AI Flags */}
                {selectedCandidate.aiFlags && (() => {
                   // Support both field names: new AI uses is_ai_generated, seed data uses aiWrittenProbability
                   const aiProb: number = selectedCandidate.aiFlags.is_ai_generated
                     ?? selectedCandidate.aiFlags.aiWrittenProbability
                     ?? 0;
                   const aiProbPct = Math.round(aiProb * 100);
                   return (
                     <Row gutter={16} style={{ marginBottom: 24 }}>
                       <Col span={8}>
                         <Card size="small" style={{ textAlign: 'center' }}>
                           <Bot size={16} />
                           <div style={{ fontSize: 12, marginBottom: 4 }}>AI-Generated Essay</div>
                           <Progress percent={aiProbPct} size="small" strokeColor={aiProb > 0.5 ? '#EF4444' : '#10B981'} />
                           <div style={{ fontSize: 11, color: aiProb > 0.5 ? '#EF4444' : '#10B981', marginTop: 2 }}>
                             {aiProbPct}% {t('probability')}
                           </div>
                         </Card>
                       </Col>
                       <Col span={8}><Card size="small" style={{ textAlign: 'center' }}><CheckCircle2 size={16} /><div style={{ fontSize: 12 }}>{t('quality')}</div><Text strong style={{ color: selectedCandidate.aiFlags.generic_content ? '#F59E0B' : '#10B981' }}>{selectedCandidate.aiFlags.generic_content ? t('generic') : t('authentic')}</Text></Card></Col>
                       <Col span={8}><Card size="small" style={{ textAlign: 'center' }}><TrendingUp size={16} /><div style={{ fontSize: 12 }}>{t('potential')}</div><Text strong style={{ color: selectedCandidate.aiFlags.high_potential_outlier ? '#16a34a' : c.textSecondary }}>{selectedCandidate.aiFlags.high_potential_outlier ? `⭐ ${t('outlier')}` : t('standard')}</Text></Card></Col>
                     </Row>
                   );
                })()}

                {/* Explainability: Score Evidence Quotes */}
                {selectedCandidate.aiScores && (
                  <div style={{ background: c.pageBg, padding: '20px', borderRadius: '14px', marginBottom: '24px', border: `1px solid ${c.border}` }}>
                    <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} /> {t('scoreBreakdown')}
                    </Title>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(Object.entries(selectedCandidate.aiScores) as [string, { score: number; evidence: string | { quote: string; explanation: string } }][]).map(([key, val]) => {
                        const label: Record<string, string> = {
                          motivation: t('motivation'),
                          leadership: t('leadership'),
                          technicalPotential: t('technicalPotential'),
                          creativity: t('creativity'),
                          resilience: t('resilience'),
                          socialImpact: t('socialImpact'),
                        };
                        const color = val.score >= 70 ? '#10B981' : val.score >= 50 ? '#F59E0B' : '#EF4444';
                        // evidence can be: plain string | { quote, explanation } | Array<{ quote, explanation }>
                        let evidenceText = '';
                        if (typeof val.evidence === 'string') {
                          evidenceText = val.evidence;
                        } else if (Array.isArray(val.evidence) && val.evidence.length > 0) {
                          evidenceText = val.evidence[0]?.quote || val.evidence[0]?.explanation || '';
                        } else if (val.evidence && typeof val.evidence === 'object') {
                          evidenceText = (val.evidence as any).quote || (val.evidence as any).explanation || '';
                        }
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: c.cardBg, borderRadius: 10, border: `1px solid ${c.borderLight}` }}>
                            <div style={{ minWidth: 42, height: 42, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Text strong style={{ fontSize: 16, color }}>{val.score}</Text>
                            </div>
                            <div>
                              <Text strong style={{ fontSize: 12, color: c.textDark }}>{label[key] || key}</Text>
                              <Text type="secondary" style={{ fontSize: 12, display: 'block', fontStyle: 'italic', marginTop: 2 }}>
                                {evidenceText ? `"${evidenceText}"` : '—'}
                              </Text>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assessment Dropdown */}
                {(selectedCandidate.simulationScores || selectedCandidate.sjtScores || selectedCandidate.personalityScores) && (
                  <div style={{ marginBottom: 16 }}>
                    <Select
                      value={assessmentTab}
                      onChange={setAssessmentTab}
                      style={{ width: 260 }}
                      options={[
                        ...(selectedCandidate.simulationScores ? [{ value: 'simulation', label: t('simTitle') }] : []),
                        ...(selectedCandidate.sjtScores ? [{ value: 'sjt', label: t('sjtTitle') }] : []),
                        ...(selectedCandidate.personalityScores ? [{ value: 'personality', label: t('personalityTitle') }] : []),
                      ]}
                    />
                  </div>
                )}

                {/* Simulation Assessment Results */}
                {assessmentTab === 'simulation' && selectedCandidate.simulationScores && (
                  <div style={{ background: c.orangeBg, padding: '20px', borderRadius: '14px', marginBottom: '24px', border: `1px solid ${c.orangeBorder}` }}>
                    <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                      <Title level={5} style={{ margin: 0 }}>{t('simTitle')}</Title>
                      <Tag color="orange" style={{ fontSize: 13, padding: '2px 10px' }}>
                        {t('score')}: {selectedCandidate.simulationScores.simulationScore}/100
                      </Tag>
                    </Row>

                    {/* Style Badge */}
                    <div style={{ marginBottom: 12 }}>
                      {(() => {
                        const styleColors: Record<string, string> = { authoritative: '#ff7a00', facilitative: '#16a34a', democratic: '#52c41a', passive: '#8c8c8c' };
                        const styleLabels: Record<string, string> = { authoritative: t('leadershipAuthoritative'), facilitative: t('leadershipFacilitative'), democratic: t('leadershipDemocratic'), passive: t('leadershipPassive') };
                        const style = selectedCandidate.simulationScores!.leadershipStyle;
                        const col = styleColors[style] || '#8c8c8c';
                        return (
                          <span style={{ display: 'inline-block', background: col + '18', color: col, border: `1px solid ${col}44`, borderRadius: 12, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                            {styleLabels[style] || style}
                          </span>
                        );
                      })()}
                    </div>

                    {/* 5 Dimension Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {([ ['leadership',t('simLeadership')], ['empathy',t('simEmpathy')], ['conflictManagement',t('simConflict')], ['teamOrientation',t('simTeam')], ['decisionMaking',t('simDecisions')] ] as [keyof typeof selectedCandidate.simulationScores, string][]).map(([key, label]) => {
                        const score = selectedCandidate.simulationScores![key] as number;
                        const color = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                        return (
                          <div key={key} style={{ background: c.cardBg, borderRadius: 8, padding: '4px 10px', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 12 }}>{label}</Text>
                            <Text strong style={{ fontSize: 13, color }}>{score}</Text>
                            <div style={{ width: 40, height: 4, background: isDark ? '#374151' : '#e8e8e8', borderRadius: 2 }}>
                              <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Narrative */}
                    {selectedCandidate.simulationScores.narrative && (
                      <div style={{ background: c.cardBg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${c.orangeBorder}` }}>
                        <Text style={{ fontSize: 12, color: '#92400e', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                          {t('simNarrative')}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.7 }}>
                          {selectedCandidate.simulationScores.narrative}
                        </Text>
                      </div>
                    )}
                  </div>
                )}

                {/* SJT Assessment Results */}
                {assessmentTab === 'sjt' && selectedCandidate.sjtScores && (() => {
                  const sjt = selectedCandidate.sjtScores!;
                  const overall = sjt.overallScores || {};
                  const overallValues = Object.values(overall) as number[];
                  const avgScore = overallValues.length > 0 ? Math.round(overallValues.reduce((a, b) => a + b, 0) / overallValues.length) : 0;
                  const verdict = avgScore >= 70 ? { label: t('sjtStrong'), color: '#10B981', bg: c.greenBg }
                    : avgScore >= 50 ? { label: t('sjtAverage'), color: '#F59E0B', bg: '#FFFBEB' }
                    : { label: t('sjtWeak'), color: '#EF4444', bg: c.redBg };
                  const labels: Record<string, string> = {
                    leadership: t('sjtLeadership'),
                    problemSolving: t('sjtProblemSolving'),
                    teamwork: t('sjtTeamwork'),
                    stressResilience: t('sjtResilience'),
                    ethics: t('sjtEthics'),
                  };
                  return (
                    <div style={{ background: c.greenBg, padding: '20px', borderRadius: '14px', marginBottom: '24px', border: `1px solid ${c.greenBorder}` }}>
                      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                        <Title level={5} style={{ margin: 0 }}>{t('sjtTitle')}</Title>
                        <Space>
                          <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>Avg: {avgScore}/100</Tag>
                          <span style={{ background: verdict.bg, color: verdict.color, border: `1px solid ${verdict.color}44`, borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                            {verdict.label}
                          </span>
                        </Space>
                      </Row>

                      {/* Score pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                        {Object.entries(overall).map(([key, val]) => {
                          const score = val as number;
                          const color = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                          return (
                            <div key={key} style={{ background: c.cardBg, borderRadius: 8, padding: '4px 10px', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 12 }}>{labels[key] || key}</Text>
                              <Text strong style={{ fontSize: 13, color }}>{score}</Text>
                              <div style={{ width: 36, height: 4, background: isDark ? '#374151' : '#e8e8e8', borderRadius: 2 }}>
                                <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Per-scenario feedback */}
                      {sjt.scenarioResults && sjt.scenarioResults.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <Text strong style={{ fontSize: 12, color: c.textDark, display: 'block', marginBottom: 8 }}>{t('sjtScenarioAnalysis')}</Text>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {sjt.scenarioResults.map((sr, idx) => {
                              const srAvg = Math.round(Object.values(sr.scores).reduce((a, b) => a + b, 0) / Object.values(sr.scores).length);
                              const srColor = srAvg >= 70 ? '#10B981' : srAvg >= 50 ? '#F59E0B' : '#EF4444';
                              return (
                                <div key={idx} style={{ background: c.cardBg, borderRadius: 10, padding: '10px 14px', border: `1px solid ${c.greenBorder}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                  <div style={{ minWidth: 36, height: 36, borderRadius: 8, background: `${srColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Text strong style={{ fontSize: 13, color: srColor }}>{srAvg}</Text>
                                  </div>
                                  <div>
                                    <Text strong style={{ fontSize: 12, color: c.textDark }}>Scenario {sr.scenarioId}</Text>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', fontStyle: 'italic', marginTop: 2, lineHeight: 1.5 }}>{sr.feedback}</Text>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      {sjt.personalitySummary && (
                        <div style={{ background: c.cardBg, borderRadius: 10, padding: '10px 14px', border: `1px solid ${c.greenBorder}` }}>
                          <Text style={{ fontSize: 12, color: isDark ? '#6ee7b7' : '#065F46', fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('sjtPersonalityInsight')}</Text>
                          <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>{sjt.personalitySummary}</Text>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <Row gutter={28}>
                   <Col span={11}>
                      <Title level={5}>{t('achievements')}</Title>
                      <Space orientation="vertical" style={{ width: '100%', marginBottom: 24 }}>
                        {selectedCandidate.achievements.length > 0 ? selectedCandidate.achievements.map((a, i) => (
                          <Card key={i} styles={{ body: { padding: '10px' } }} style={{ background: c.surfaceBg }}>
                            <Space><span>{ACHIEVEMENT_ICONS[a.type] || '📌'}</span><Text strong>{a.title}</Text></Space>
                          </Card>
                        )) : <Text type="secondary">{t('noAchievements')}</Text>}
                      </Space>
                   </Col>
                   <Col span={13}>
                      <Card title={t('competencyMap')} variant="borderless" style={{ border: `1px solid ${c.borderLight}` }}>
                        <div style={{ height: '260px', width: '100%' }}>
                          <ResponsiveContainer width="99%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis domain={[0, 100]} tick={false} />
                              <RadarArea dataKey="A" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                   </Col>
                </Row>

                {/* Personality Assessment Results */}
                {assessmentTab === 'personality' && selectedCandidate.personalityScores && (
                  <div style={{ background: c.greenBg, padding: '20px', borderRadius: '14px', marginBottom: '24px', border: `1px solid ${c.greenBorder}` }}>
                    <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                      <Title level={5} style={{ margin: 0 }}>{t('personalityTitle')}</Title>
                      <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>
                        Overall: {selectedCandidate.personalityScores.overallScore}/100
                      </Tag>
                    </Row>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {Object.entries(selectedCandidate.personalityScores.clusterScores).map(([key, val]) => {
                        const labels: Record<string, string> = {
                          leadershipInitiative: t('persLeadership'),
                          responsibility: t('persResponsibility'),
                          growthMindset: t('persGrowth'),
                          ambition: t('persAmbition'),
                          ethics: t('persEthics'),
                          communityOrientation: t('persCommunity'),
                          collaboration: t('persCollaboration'),
                          criticalThinking: t('persCritical'),
                        };
                        const score = val as number;
                        const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                        return (
                          <div key={key} style={{ background: c.cardBg, borderRadius: 8, padding: '4px 10px', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 12 }}>{labels[key] || key}</Text>
                            <Text strong style={{ fontSize: 13, color }}>{score}</Text>
                          </div>
                        );
                      })}
                    </div>
                    {selectedCandidate.personalityScores.narrative && (
                      <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
                        {selectedCandidate.personalityScores.narrative}
                      </Text>
                    )}
                  </div>
                )}

                {/* Video Embed */}
                {selectedCandidate.videoUrl && (() => {
                  const url = selectedCandidate.videoUrl!;
                  const ALLOWED_DOMAINS = ['youtube.com', 'youtu.be', 'loom.com', 'drive.google.com', 'vimeo.com'];
                  const isSafe = (() => { try { const h = new URL(url).hostname; return ALLOWED_DOMAINS.some(d => h === d || h.endsWith('.' + d)); } catch { return false; } })();
                  let embedUrl = '';
                  if (isSafe) {
                    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
                    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                    const loomMatch = url.match(/loom\.com\/share\/([\w-]+)/);
                    if (loomMatch) embedUrl = `https://www.loom.com/embed/${loomMatch[1]}`;
                    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                    if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                  }
                  return (
                    <div style={{ background: c.surfaceBg, padding: '20px', borderRadius: '14px', marginBottom: '24px', border: `1px solid ${c.borderLight}` }}>
                      <Title level={5} style={{ margin: '0 0 12px' }}>🎥 {t('watchVideo')}</Title>
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          style={{ width: '100%', height: 280, borderRadius: 10, border: 'none' }}
                          sandbox="allow-scripts allow-same-origin allow-presentation"
                          allowFullScreen
                          title="Candidate video"
                        />
                      ) : isSafe ? (
                        <Button type="link" href={url} target="_blank" rel="noopener noreferrer">{url}</Button>
                      ) : (
                        <Alert type="warning" message={t('unsafeVideoLink')} showIcon />
                      )}
                    </div>
                  );
                })()}

                {/* Learnability / Coachability Section */}
                {selectedCandidate.learnabilityScore && (
                  <div style={{ marginTop: 24 }}>
                    <Title level={5} style={{ color: c.text }}>📊 {t('learnabilityTitle')}</Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: selectedCandidate.learnabilityScore.verdict === 'high' ? (isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5')
                          : selectedCandidate.learnabilityScore.verdict === 'medium' ? (isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB')
                          : (isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2'),
                        border: `2px solid ${selectedCandidate.learnabilityScore.verdict === 'high' ? '#10B981' : selectedCandidate.learnabilityScore.verdict === 'medium' ? '#F59E0B' : '#EF4444'}`,
                      }}>
                        <span style={{
                          fontSize: 20, fontWeight: 800,
                          color: selectedCandidate.learnabilityScore.verdict === 'high' ? '#10B981' : selectedCandidate.learnabilityScore.verdict === 'medium' ? '#F59E0B' : '#EF4444',
                        }}>{selectedCandidate.learnabilityScore.overallScore}</span>
                      </div>
                      <div>
                        <Tag color={selectedCandidate.learnabilityScore.verdict === 'high' ? 'green' : selectedCandidate.learnabilityScore.verdict === 'medium' ? 'orange' : 'red'}>
                          {selectedCandidate.learnabilityScore.verdict === 'high' ? t('highLearnability') : selectedCandidate.learnabilityScore.verdict === 'medium' ? t('mediumLearnability') : t('lowLearnability')}
                        </Tag>
                        {selectedCandidate.learnabilityScore.verdictText && (
                          <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 4 }}>{selectedCandidate.learnabilityScore.verdictText}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {(selectedCandidate.learnabilityScore.dimensions || []).map((dim: any) => {
                        const labelMap: Record<string, string> = {
                          coachability: t('dimCoachability'),
                          leadershipPotential: t('dimLeadership'),
                          growthTrajectory: t('dimGrowth'),
                          authenticity: t('dimAuthenticity'),
                          engagement: t('dimEngagement'),
                          selfAwareness: t('dimSelfAwareness'),
                        };
                        const color = dim.score >= 75 ? '#10B981' : dim.score >= 50 ? '#F59E0B' : '#EF4444';
                        return (
                          <div key={dim.key} style={{ background: c.surfaceBg, borderRadius: 8, padding: '8px 12px', border: `1px solid ${c.borderLight}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: c.text, fontWeight: 600 }}>{labelMap[dim.key] || dim.key}</span>
                              <span style={{ color, fontWeight: 700 }}>{dim.score}</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 2, background: isDark ? '#374151' : '#e5e7eb', marginTop: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${dim.score}%`, height: '100%', borderRadius: 2, background: color }} />
                            </div>
                            <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>{dim.evidence}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 24 }}>
                  <Title level={5}>{t('reviewerNotes')}</Title>
                  <TextArea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} placeholder={t('reviewNotesPlaceholder')} />
                  <Button size="small" style={{ marginTop: 8 }} onClick={handleSaveNotes}>{t('saveSync')}</Button>
                </div>

                {/* Final Bar */}
                <div style={{ marginTop: '28px', padding: '20px', background: c.surfaceBg, borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {(selectedCandidate.status === 'new' || (selectedCandidate.status === 'under_review' && selectedCandidate.techScore == null)) ? (() => {
                    const hasCerts = selectedCandidate.ieltsFilePath || selectedCandidate.untFilePath;
                    const certsApproved = (!selectedCandidate.ieltsFilePath || selectedCandidate.ieltsApproved)
                      && (!selectedCandidate.untFilePath || selectedCandidate.untApproved);
                    const interviewEnabled = !hasCerts || certsApproved;
                    return (
                      <Space>
                        <Button danger icon={<XCircle size={16} />} onClick={() => handleStatusChange(selectedCandidate.id, 'declined')}>{t('decline')}</Button>
                        <Button
                          type="primary"
                          icon={<Send size={16} />}
                          disabled={!interviewEnabled}
                          title={!interviewEnabled ? t('verifyCertsFirst') : ''}
                          onClick={() => {
                            if (!interviewEnabled) {
                              message.warning(t('verifyCertsFirst'));
                              return;
                            }
                            handleStatusChange(selectedCandidate.id, 'interview');
                          }}
                          style={!interviewEnabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          {t('approveInterview')} {interviewEnabled ? '' : '🔒'}
                        </Button>
                        {!interviewEnabled && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {t('verifyCertsFirst')}
                          </Text>
                        )}
                      </Space>
                    );
                  })() : selectedCandidate.status === 'interview' ? (
                    <Space>
                      <Button danger icon={<XCircle size={16} />} onClick={() => handleStatusChange(selectedCandidate.id, 'declined')}>{t('decline')}</Button>
                      <Button
                        type="primary"
                        icon={<CheckCircle2 size={16} />}
                        style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8 }}
                        onClick={() => {
                          setTechScore(selectedCandidate.techScore ?? '');
                          setSoftScore(selectedCandidate.softScore ?? '');
                          setTechNotes(selectedCandidate.techNotes || '');
                          setSoftNotes(selectedCandidate.softNotes || '');
                          setEvalModalOpen(true);
                        }}
                      >
                        {t('evaluateCandidate')}
                      </Button>
                    </Space>
                  ) : (
                    <Space>
                      <CheckCircle2 size={24} color="#10B981" />
                      <Text strong>{t('decisionSavedAudit')}</Text>
                      <Button
                        type="primary" size="small"
                        style={{ borderRadius: 8 }}
                        onClick={() => navigate(`/admin/review/${selectedCandidate.id}`)}
                      >
                        {t('openFullReview')}
                      </Button>
                    </Space>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Empty description={t('selectCandidate')} /></div>
            )}
          </Col>
        </Row>
      </Content>

      {/* ARBITRATION MODAL */}
      <Modal
        title={<Space><Bot size={20} color="#16a34a" /> {t('arbModalTitle')}</Space>}
        open={isArbModalOpen}
        onCancel={() => setIsArbModalOpen(false)}
        footer={[<Button key="ok" type="primary" onClick={() => setIsArbModalOpen(false)}>{t('arbDone')}</Button>]}
        width={720}
      >
        {arbReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Alert title={t('arbAnalysis')} description={arbReport.summary} type="warning" showIcon />

            <Row gutter={16}>
              <Col span={12}>
                <Card title={<Space><ShieldCheck size={14} color="#10B981" /> {t('arbPanelA')}</Space>} size="small" style={{ background: c.greenBg, border: `1px solid ${c.greenBorder}` }}>
                  <Text strong style={{ fontSize: 28, color: '#10B981', display: 'block' }}>{arbReport.panelA.score}<Text style={{ fontSize: 14, color: c.textSecondary }}>/100</Text></Text>
                  <Paragraph italic style={{ fontSize: 12, marginTop: 6, marginBottom: 4 }}>{arbReport.panelA.note}</Paragraph>
                  {arbReport.panelA.analysis && arbReport.panelA.analysis !== arbReport.panelA.note && (
                    <Text type="secondary" style={{ fontSize: 12 }}>{arbReport.panelA.analysis}</Text>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title={<Space><AlertTriangle size={14} color="#EF4444" /> {t('arbPanelB')}</Space>} size="small" style={{ background: c.redBg, border: '1px solid #FECACA' }}>
                  <Text strong style={{ fontSize: 28, color: '#EF4444', display: 'block' }}>{arbReport.panelB.score}<Text style={{ fontSize: 14, color: c.textSecondary }}>/100</Text></Text>
                  <Paragraph italic style={{ fontSize: 12, marginTop: 6, marginBottom: 4 }}>{arbReport.panelB.note}</Paragraph>
                  {arbReport.panelB.analysis && arbReport.panelB.analysis !== arbReport.panelB.note && (
                    <Text type="secondary" style={{ fontSize: 12 }}>{arbReport.panelB.analysis}</Text>
                  )}
                </Card>
              </Col>
            </Row>

            {arbReport.disagreementFactors && arbReport.disagreementFactors.length > 0 && (
              <div style={{ background: '#FFFBEB', padding: '14px', borderRadius: 10, border: '1px solid #FDE68A' }}>
                <Text strong style={{ fontSize: 12, color: '#92400E', display: 'block', marginBottom: 8 }}>{t('arbFactors')}</Text>
                {arbReport.disagreementFactors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <Text style={{ color: '#F59E0B', fontSize: 12 }}>•</Text>
                    <Text style={{ fontSize: 12 }}>{f}</Text>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: c.greenBg, padding: '16px', borderRadius: 12, border: `1px solid ${c.greenBorder}` }}>
              <Title level={5} style={{ color: '#1D4ED8', marginBottom: 8 }}>{t('arbVerdict')}</Title>
              <Paragraph style={{ margin: 0, fontSize: 13 }}>{arbReport.verdict}</Paragraph>
              {arbReport.suggestedScore !== undefined && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('arbSuggestedScore')}</Text>
                  <Text strong style={{ fontSize: 20, color: getScoreColor(arbReport.suggestedScore) }}>{arbReport.suggestedScore}/100</Text>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ESSAY MODAL */}
      {selectedCandidate && (
        <Modal
          title={<Space><FileText size={16} /> {t('essayTitle', { name: selectedCandidate.name })}</Space>}
          open={essayModalOpen}
          onCancel={() => setEssayModalOpen(false)}
          footer={[<Button key="ok" onClick={() => setEssayModalOpen(false)}>{t('close')}</Button>]}
          width={720}
        >
          <div style={{ maxHeight: 500, overflowY: 'auto', padding: '4px 0' }}>
            <Paragraph style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selectedCandidate.essayText || t('noEssayText')}
            </Paragraph>
          </div>
        </Modal>
      )}

      {/* EVALUATE MODAL */}
      <Modal
        title={<Space><CheckCircle2 size={18} color="#7C3AED" /> {t('evalTitle')} — {selectedCandidate?.name}</Space>}
        open={evalModalOpen}
        onCancel={() => setEvalModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setEvalModalOpen(false)}>{t('cancel')}</Button>,
          <Button key="save" type="primary" loading={evalSaving} onClick={handleSaveEval}
            style={{ background: '#7C3AED', borderColor: '#7C3AED' }}>
            {t('evalSave')}
          </Button>,
        ]}
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
          <div style={{ background: c.greenBg, padding: 16, borderRadius: 12, border: `1px solid ${c.greenBorder}` }}>
            <Text strong style={{ display: 'block', marginBottom: 10, color: isDark ? '#6ee7b7' : '#065F46' }}>{t('evalPanelA')}</Text>
            <Input
              type="number"
              min={0} max={100}
              value={techScore}
              onChange={e => setTechScore(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))}
              placeholder={t('evalScorePlaceholder')}
              size="large"
              style={{ marginBottom: 10 }}
            />
            <TextArea
              value={techNotes}
              onChange={e => setTechNotes(e.target.value)}
              rows={2}
              placeholder={t('evalNoteA')}
            />
          </div>
          <div style={{ background: c.blueBg, padding: 16, borderRadius: 12, border: `1px solid ${c.greenBorder}` }}>
            <Text strong style={{ display: 'block', marginBottom: 10, color: '#1E3A8A' }}>{t('evalPanelB')}</Text>
            <Input
              type="number"
              min={0} max={100}
              value={softScore}
              onChange={e => setSoftScore(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))}
              placeholder={t('evalScorePlaceholder')}
              size="large"
              style={{ marginBottom: 10 }}
            />
            <TextArea
              value={softNotes}
              onChange={e => setSoftNotes(e.target.value)}
              rows={2}
              placeholder={t('evalNoteB')}
            />
          </div>
          <Alert
            title={t('autoArbitrationTitle')}
            description={t('autoArbitrationDesc')}
            type="info"
            showIcon
          />
        </div>
      </Modal>

      {/* CERTIFICATE MODAL */}
      {selectedCandidate && certModal.open && (
        <Modal
          title={
            <Space>
              <FileText size={16} />
              {certModal.type === 'ielts' ? t('ieltsCert') : t('ubtCert')} — {selectedCandidate.name}
              {(certModal.type === 'ielts' ? selectedCandidate.ieltsApproved : selectedCandidate.untApproved) && (
                <Badge color="green" text={t('approved')} />
              )}
            </Space>
          }
          open={certModal.open}
          onCancel={() => setCertModal(prev => ({ ...prev, open: false }))}
          footer={[
            <Button key="close" onClick={() => setCertModal(prev => ({ ...prev, open: false }))}>{t('close')}</Button>,
            !(certModal.type === 'ielts' ? selectedCandidate.ieltsApproved : selectedCandidate.untApproved) && (
              <Button
                key="approve"
                type="primary"
                loading={certApproving}
                icon={<CheckCircle2 size={14} />}
                style={{ background: '#10B981', borderColor: '#10B981' }}
                onClick={async () => {
                  await approveCert(selectedCandidate.id, certModal.type);
                  setCertModal(prev => ({ ...prev, open: false }));
                }}
              >
                {t('approve')}
              </Button>
            ),
          ].filter(Boolean)}
          width={800}
        >
          {(() => {
            const filePath = certModal.type === 'ielts' ? selectedCandidate.ieltsFilePath : selectedCandidate.untFilePath;
            if (!filePath) return <Text type="secondary">{t('noCertUploaded')}</Text>;
            const url = filePath.startsWith('/uploads/') ? `${API_BASE}${filePath}` : filePath;
            const isPdf = url.toLowerCase().endsWith('.pdf');
            return isPdf ? (
              <iframe src={url} style={{ width: '100%', height: 480, border: 'none', borderRadius: 8 }} title="Certificate" />
            ) : (
              <img src={url} alt="Certificate" style={{ maxWidth: '100%', borderRadius: 8, border: `1px solid ${c.border}` }} />
            );
          })()}
        </Modal>
      )}
    </Layout>
  );
};

export default Candidates;
