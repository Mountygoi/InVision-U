import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { themeColors } from '../i18n/themeColors';
import {
  Layout, Row, Col, Card, Avatar, Tag, Button, Typography, Space,
  Divider, Progress, Spin, message, Modal, Alert,
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined,
  UserOutlined, TrophyOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { MapPin, GraduationCap, Mail, Shield } from 'lucide-react';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const API = 'http://localhost:5000';

const score2color = (s: number) => s >= 70 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444';

const ScorePill = ({ label, score, isDark }: { label: string; score: number; isDark?: boolean }) => {
  const sc = score2color(score);
  const pc = themeColors(!!isDark);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, background: pc.cardBg,
      borderRadius: 8, padding: '6px 12px', border: `1px solid ${sc}30`,
    }}>
      <Text style={{ fontSize: 12, color: pc.textDark }}>{label}</Text>
      <Text strong style={{ fontSize: 13, color: sc }}>{score}</Text>
      <div style={{ width: 44, height: 4, background: isDark ? '#475569' : '#E5E7EB', borderRadius: 2 }}>
        <div style={{ width: `${score}%`, height: '100%', background: sc, borderRadius: 2 }} />
      </div>
    </div>
  );
};

const ReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = themeColors(isDark);
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`${API}/api/candidates/${id}`)
      .then(r => setCandidate(r.data))
      .catch(() => message.error(t('failedToLoadCandidate')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = () => {
    Modal.confirm({
      title: t('approveConfirmTitle'),
      content: t('approveConfirmDesc'),
      okText: t('yesApprove'),
      okType: 'primary',
      cancelText: t('cancel'),
      onOk: async () => {
        setApproving(true);
        try {
          await axios.patch(`${API}/api/candidates/${id}/status`, { status: 'accepted' });
          message.success(t('candidateApprovedSuccess'));
          setCandidate((prev: any) => ({ ...prev, status: 'accepted' }));
        } catch {
          message.error(t('failedToApprove'));
        } finally {
          setApproving(false);
        }
      },
    });
  };

  const handleDecline = () => {
    Modal.confirm({
      title: t('declineConfirmTitle'),
      content: t('declineConfirmDesc'),
      okText: t('decline'),
      okType: 'danger',
      cancelText: t('cancel'),
      onOk: async () => {
        setDeclining(true);
        try {
          await axios.patch(`${API}/api/candidates/${id}/status`, { status: 'declined' });
          message.success(t('candidateDeclinedSuccess'));
          setCandidate((prev: any) => ({ ...prev, status: 'declined' }));
        } catch {
          message.error(t('failedToDecline'));
        } finally {
          setDeclining(false);
        }
      },
    });
  };

  const getAvatarUrl = (c: any) => {
    if (!c?.avatarUrl) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c?.name || 'x')}`;
    return c.avatarUrl.startsWith('/uploads/') ? `${API}${c.avatarUrl}` : c.avatarUrl;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spin size="large" />
    </div>
  );

  if (!candidate) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Title level={3}>{t('candidateNotFound')}</Title>
      <Button onClick={() => navigate('/admin/candidates')}>{t('backToCandidates')}</Button>
    </div>
  );

  const STATUS_COLOR: Record<string, string> = {
    accepted: 'green', declined: 'red', interview: 'purple',
    under_review: 'orange', new: 'blue', arbitration: 'volcano', waitlisted: 'default',
  };

  const panelAvg = (candidate.techScore != null && candidate.softScore != null)
    ? Math.round((candidate.techScore + candidate.softScore) / 2)
    : null;

  const sjtOverall = candidate.sjtScores?.overallScores
    ? (() => {
        const vals = Object.values(candidate.sjtScores.overallScores) as number[];
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      })()
    : null;

  return (
    <Layout style={{ minHeight: '100vh', background: c.pageBg }}>
      <Content style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', width: '100%', animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>

        {/* Top nav */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 28 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/candidates')}>
            {t('backToCandidates')}
          </Button>
          <Space>
            <Text type="secondary" style={{ fontSize: 13 }}>Review Page</Text>
            <Tag color={STATUS_COLOR[candidate.status] || 'default'} style={{ fontSize: 13 }}>
              {candidate.status.toUpperCase()}
            </Tag>
          </Space>
        </Row>

        {/* Header card */}
        <Card
          style={{ borderRadius: 20, marginBottom: 24, border: `1px solid ${c.border}`, overflow: 'hidden', background: c.cardBg }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ background: '#16a34a', padding: '28px 32px' }}>
            <Row align="middle" gutter={24}>
              <Col flex="none">
                <Avatar
                  size={96}
                  src={getAvatarUrl(candidate)}
                  style={{ border: '4px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                />
              </Col>
              <Col flex="auto">
                <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 800 }}>{candidate.name}</Title>
                <Space size={20} style={{ marginTop: 8, flexWrap: 'wrap' }}>
                  {candidate.university && (
                    <Space size={6}><GraduationCap size={14} color="rgba(255,255,255,0.8)" /><Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{candidate.university}</Text></Space>
                  )}
                  {candidate.city && (
                    <Space size={6}><MapPin size={14} color="rgba(255,255,255,0.8)" /><Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{candidate.city}</Text></Space>
                  )}
                  {candidate.email && (
                    <Space size={6}><Mail size={14} color="rgba(255,255,255,0.8)" /><Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{candidate.email}</Text></Space>
                  )}
                </Space>
                <div style={{ marginTop: 10 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                    {t('applicationId')} <code style={{ color: 'white', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 4 }}>
                      {candidate.id.slice(0, 8).toUpperCase()}
                    </code>
                  </Text>
                </div>
              </Col>
              {/* Score summary */}
              <Col flex="none">
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '16px 24px' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, display: 'block' }}>{t('compositeScore')}</Text>
                  <Text style={{ color: 'white', fontSize: 44, fontWeight: 900, lineHeight: 1 }}>
                    {Math.round(candidate.compositeScore)}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>/100</Text>
                </div>
              </Col>
            </Row>
          </div>

          {/* Quick info bar */}
          <Row style={{ padding: '16px 32px', background: c.cardBg, borderTop: `1px solid ${c.borderAccent}` }} gutter={24}>
            <Col><Text type="secondary" style={{ fontSize: 12 }}>{t('gpa')}</Text><br /><Text strong>{candidate.gpa || 'N/A'}</Text></Col>
            <Divider type="vertical" style={{ height: 36, marginTop: 4 }} />
            <Col><Text type="secondary" style={{ fontSize: 12 }}>{t('yearOfStudy')}</Text><br /><Text strong>{candidate.yearOfStudy || 'N/A'}</Text></Col>
            <Divider type="vertical" style={{ height: 36, marginTop: 4 }} />
            <Col><Text type="secondary" style={{ fontSize: 12 }}>{t('location')}</Text><br /><Tag color={candidate.isRural ? 'green' : 'blue'} style={{ fontSize: 11 }}>{candidate.isRural ? t('ruralBonus') : t('urban')}</Tag></Col>
            {candidate.ielts && (<><Divider type="vertical" style={{ height: 36, marginTop: 4 }} /><Col><Text type="secondary" style={{ fontSize: 12 }}>{t('ielts')}</Text><br /><Text strong>{candidate.ielts}</Text></Col></>)}
            {candidate.unt && (<><Divider type="vertical" style={{ height: 36, marginTop: 4 }} /><Col><Text type="secondary" style={{ fontSize: 12 }}>{t('ubt')}</Text><br /><Text strong>{candidate.unt}</Text></Col></>)}
          </Row>
        </Card>

        <Row gutter={24}>
          <Col span={16}>

            {/* Interview Scores */}
            {(candidate.techScore != null || candidate.softScore != null) && (
              <Card title={<Space><TrophyOutlined style={{ color: '#F59E0B' }} /> {t('interviewEvaluation')}</Space>}
                style={{ borderRadius: 16, marginBottom: 20, border: `1px solid ${c.border}`, background: c.cardBg }}
              >
                <Row gutter={16}>
                  {candidate.techScore != null && (
                    <Col span={12}>
                      <div style={{ background: c.greenBg, borderRadius: 12, padding: '16px', border: `1px solid ${c.greenBorder}` }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{t('panelA')}</Text>
                        <div style={{ fontSize: 36, fontWeight: 800, color: score2color(candidate.techScore) }}>{candidate.techScore}<span style={{ fontSize: 16, color: c.textMuted }}>/100</span></div>
                        <Progress percent={candidate.techScore} showInfo={false} strokeColor={score2color(candidate.techScore)} size="small" />
                        {candidate.techNotes && <Paragraph italic style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>"{candidate.techNotes}"</Paragraph>}
                      </div>
                    </Col>
                  )}
                  {candidate.softScore != null && (
                    <Col span={12}>
                      <div style={{ background: c.blueBg, borderRadius: 12, padding: '16px', border: `1px solid ${c.greenBorder}` }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{t('panelB')}</Text>
                        <div style={{ fontSize: 36, fontWeight: 800, color: score2color(candidate.softScore) }}>{candidate.softScore}<span style={{ fontSize: 16, color: c.textMuted }}>/100</span></div>
                        <Progress percent={candidate.softScore} showInfo={false} strokeColor={score2color(candidate.softScore)} size="small" />
                        {candidate.softNotes && <Paragraph italic style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>"{candidate.softNotes}"</Paragraph>}
                      </div>
                    </Col>
                  )}
                </Row>
                {panelAvg != null && (
                  <div style={{ marginTop: 16, textAlign: 'center', padding: '12px', background: c.surfaceBg, borderRadius: 10 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>{t('combinedPanelAvg')} </Text>
                    <Text strong style={{ fontSize: 20, color: score2color(panelAvg) }}>{panelAvg}/100</Text>
                  </div>
                )}
              </Card>
            )}

            {/* AI Essay Assessment */}
            {candidate.aiSummary && (
              <Card title={<Space><Shield size={16} style={{ color: '#16a34a' } as any} /> {t('aiEssayAssessment')}</Space>}
                style={{ borderRadius: 16, marginBottom: 20, border: `1px solid ${c.border}`, background: c.cardBg }}
              >
                <Paragraph style={{ fontSize: 14, lineHeight: 1.8, color: c.textDark }}>{candidate.aiSummary}</Paragraph>
                {candidate.aiScores && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {[
                      [t('motivation'), candidate.aiScores.motivation?.score],
                      [t('leadership'), candidate.aiScores.leadership?.score],
                      [t('technicalPotential'), candidate.aiScores.technicalPotential?.score],
                      [t('creativity'), candidate.aiScores.creativity?.score],
                      [t('resilience'), candidate.aiScores.resilience?.score],
                      [t('socialImpact'), candidate.aiScores.socialImpact?.score],
                    ].filter(([, s]) => s != null).map(([label, score]) => (
                      <ScorePill key={label as string} label={label as string} score={score as number} isDark={isDark} />
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* SJT */}
            {candidate.sjtScores?.overallScores && (
              <Card title={`📋 ${t('sjtCard')}`}
                style={{ borderRadius: 16, marginBottom: 20, border: `1px solid ${c.greenBorder}`, background: c.greenBg }}
                extra={sjtOverall != null && <Tag color="green">Avg: {sjtOverall}/100</Tag>}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {Object.entries(candidate.sjtScores.overallScores).map(([k, v]) => {
                    const labels: Record<string, string> = { leadership: '🧭 Leadership', problemSolving: '🔧 Problem-Solving', teamwork: '🤝 Teamwork', stressResilience: '💪 Resilience', ethics: '⚖️ Ethics' };
                    return <ScorePill key={k} label={labels[k] || k} score={v as number} isDark={isDark} />;
                  })}
                </div>
                {candidate.sjtScores.personalitySummary && (
                  <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>{candidate.sjtScores.personalitySummary}</Text>
                )}
              </Card>
            )}

            {/* Personality */}
            {candidate.personalityScores?.clusterScores && (
              <Card title={`🧠 ${t('personalityCard')}`}
                style={{ borderRadius: 16, marginBottom: 20, border: `1px solid ${c.greenBorder}`, background: c.greenBg }}
                extra={<Tag color="blue">Overall: {candidate.personalityScores.overallScore}/100</Tag>}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: candidate.personalityScores.narrative ? 12 : 0 }}>
                  {Object.entries(candidate.personalityScores.clusterScores).map(([k, v]) => {
                    const labels: Record<string, string> = { leadershipInitiative: '🚀 Leadership', responsibility: '⚖️ Responsibility', growthMindset: '🌱 Growth', ambition: '🎯 Ambition', ethics: '🧭 Ethics', communityOrientation: '🌍 Community', collaboration: '🤝 Collab', criticalThinking: '🧠 Critical' };
                    return <ScorePill key={k} label={labels[k] || k} score={v as number} isDark={isDark} />;
                  })}
                </div>
                {candidate.personalityScores.narrative && (
                  <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>{candidate.personalityScores.narrative}</Text>
                )}
              </Card>
            )}

            {/* Simulation */}
            {candidate.simulationScores && (
              <Card title={`🎭 ${t('simulationCard')}`}
                style={{ borderRadius: 16, marginBottom: 20, border: `1px solid ${c.orangeBorder}`, background: c.orangeBg }}
                extra={<Tag color="orange">Score: {candidate.simulationScores.simulationScore}/100</Tag>}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {[['🧭 Leadership', candidate.simulationScores.leadership], ['❤️ Empathy', candidate.simulationScores.empathy], ['⚡ Conflict Mgmt', candidate.simulationScores.conflictManagement], ['🤝 Team', candidate.simulationScores.teamOrientation], ['⚖️ Decisions', candidate.simulationScores.decisionMaking]].map(([l, s]) => (
                    <ScorePill key={l as string} label={l as string} score={s as number} isDark={isDark} />
                  ))}
                </div>
                {candidate.simulationScores.narrative && (
                  <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>{candidate.simulationScores.narrative}</Text>
                )}
              </Card>
            )}

            {/* Reviewer Notes */}
            {candidate.reviewerNotes && (
              <Card title={`📝 ${t('reviewerNotesCard')}`} style={{ borderRadius: 16, marginBottom: 20, border: `1px solid ${c.border}`, background: c.cardBg }}>
                <Paragraph style={{ fontSize: 14 }}>{candidate.reviewerNotes}</Paragraph>
              </Card>
            )}
          </Col>

          <Col span={8}>
            {/* Decision card */}
            <Card
              style={{ borderRadius: 16, marginBottom: 20, border: `2px solid ${c.border}`, position: 'sticky', top: 24, background: c.cardBg }}
            >
              <Title level={5} style={{ marginBottom: 16 }}>{t('committeeDecision')}</Title>

              {candidate.status === 'accepted' ? (
                <Alert
                  title={t('statusAccepted')}
                  description={t('candidateApprovedDesc')}
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              ) : candidate.status === 'declined' ? (
                <Alert title={t('statusDeclined')} description={t('candidateDeclinedDesc')} type="error" showIcon />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CheckCircleOutlined />}
                    loading={approving}
                    style={{ background: '#10B981', borderColor: '#10B981', borderRadius: 10, height: 48 }}
                    onClick={handleApprove}
                  >
                    {t('approveCandidate')}
                  </Button>
                  <Button
                    danger block size="large"
                    icon={<CloseCircleOutlined />}
                    loading={declining}
                    style={{ borderRadius: 10, height: 48 }}
                    onClick={handleDecline}
                  >
                    {t('decline')}
                  </Button>
                </Space>
              )}

              <Divider style={{ margin: '16px 0' }} />

              {/* Score summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row justify="space-between">
                  <Text type="secondary" style={{ fontSize: 13 }}>{t('compositeScore')}</Text>
                  <Text strong style={{ color: score2color(candidate.compositeScore) }}>{Math.round(candidate.compositeScore)}/100</Text>
                </Row>
                {panelAvg != null && <Row justify="space-between"><Text type="secondary" style={{ fontSize: 13 }}>{t('interviewAvg')}</Text><Text strong style={{ color: score2color(panelAvg) }}>{panelAvg}/100</Text></Row>}
                {sjtOverall != null && <Row justify="space-between"><Text type="secondary" style={{ fontSize: 13 }}>{t('sjtAvg')}</Text><Text strong style={{ color: score2color(sjtOverall) }}>{sjtOverall}/100</Text></Row>}
                {candidate.personalityScores?.overallScore != null && <Row justify="space-between"><Text type="secondary" style={{ fontSize: 13 }}>{t('personality')}</Text><Text strong style={{ color: score2color(candidate.personalityScores.overallScore) }}>{candidate.personalityScores.overallScore}/100</Text></Row>}
                {candidate.simulationScores?.simulationScore != null && <Row justify="space-between"><Text type="secondary" style={{ fontSize: 13 }}>{t('simulation')}</Text><Text strong style={{ color: score2color(candidate.simulationScores.simulationScore) }}>{candidate.simulationScores.simulationScore}/100</Text></Row>}
              </div>
            </Card>

            {/* Personal info */}
            <Card title={<Space><UserOutlined /> {t('personalInfo')}</Space>} style={{ borderRadius: 16, border: `1px solid ${c.border}`, background: c.cardBg }}>
              {[
                [t('fullName'), candidate.name],
                [t('email'), candidate.email],
                [t('phone'), candidate.phone],
                [t('university'), candidate.university],
                [t('city'), candidate.city],
                [t('gpa'), candidate.gpa],
                [t('year'), candidate.yearOfStudy ? `${t('year')} ${candidate.yearOfStudy}` : null],
                [t('ielts'), candidate.ielts],
                [t('ubt'), candidate.unt],
              ].filter(([, v]) => v != null && v !== '').map(([label, value]) => (
                <Row key={label as string} style={{ marginBottom: 8 }}>
                  <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>{label}</Text></Col>
                  <Col span={14}><Text style={{ fontSize: 13 }}>{String(value)}</Text></Col>
                </Row>
              ))}

              {candidate.skills?.length > 0 && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('skills')}</Text>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {candidate.skills.map((s: string, i: number) => <Tag key={i} style={{ fontSize: 11, borderRadius: 6 }}>{s}</Tag>)}
                  </div>
                </>
              )}
            </Card>

            {/* Essay preview */}
            {candidate.essayText && (
              <Card
                title={<Space><FileTextOutlined /> {t('essayPreview')}</Space>}
                style={{ borderRadius: 16, marginTop: 20, border: `1px solid ${c.border}`, background: c.cardBg }}
                styles={{ body: { maxHeight: 240, overflowY: 'auto' } }}
              >
                <Paragraph style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: c.textDark }}>
                  {candidate.essayText}
                </Paragraph>
              </Card>
            )}
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default ReviewPage;
