import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Avatar, Tag, Button, Typography, Space, Spin, Empty, Progress, Badge } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { GraduationCap, MapPin, Trophy } from 'lucide-react';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;

const API = 'http://localhost:5000';

const score2color = (s: number) => s >= 70 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444';

const getAvatarUrl = (c: any) => {
  if (!c?.avatarUrl) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c?.name || 'x')}`;
  return c.avatarUrl.startsWith('/uploads/') ? `${API}${c.avatarUrl}` : c.avatarUrl;
};

const Reviews = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/candidates?status=under_review`);
      setCandidates(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleApprove = async (id: string) => {
    await axios.patch(`${API}/api/candidates/${id}/status`, { status: 'accepted' });
    fetchReviews();
  };

  const handleDecline = async (id: string) => {
    await axios.patch(`${API}/api/candidates/${id}/status`, { status: 'declined' });
    fetchReviews();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spin size="large" />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Content style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', width: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            <Trophy size={28} style={{ marginRight: 10, color: '#F59E0B', verticalAlign: 'middle' } as any} />
            Committee Reviews
          </Title>
          <Text type="secondary">Candidates who passed both interview panels — ready for final decision</Text>
        </div>

        {candidates.length === 0 ? (
          <Empty
            description="No candidates awaiting review"
            style={{ marginTop: 80 }}
          />
        ) : (
          <Row gutter={[20, 20]}>
            {candidates.map(c => {
              const panelAvg = (c.techScore != null && c.softScore != null)
                ? Math.round((c.techScore + c.softScore) / 2)
                : null;
              const composite = Math.round(c.compositeScore || 0);

              return (
                <Col key={c.id} xs={24} sm={12} lg={8}>
                  <Card
                    style={{ borderRadius: 20, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                    styles={{ body: { padding: 0 } }}
                  >
                    {/* Top gradient strip */}
                    <div style={{ background: 'linear-gradient(135deg, #006CFF 0%, #00D8E6 100%)', padding: '20px 20px 16px' }}>
                      <Row align="middle" gutter={12}>
                        <Col>
                          <Avatar
                            size={60}
                            src={getAvatarUrl(c)}
                            style={{ border: '3px solid rgba(255,255,255,0.4)' }}
                          />
                        </Col>
                        <Col flex="auto">
                          <Text strong style={{ color: 'white', fontSize: 16, display: 'block' }}>{c.name}</Text>
                          <Space size={6} style={{ marginTop: 2 }}>
                            <GraduationCap size={12} color="rgba(255,255,255,0.8)" />
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{c.university || '—'}</Text>
                          </Space>
                          {c.city && (
                            <Space size={6} style={{ marginTop: 2 }}>
                              <MapPin size={12} color="rgba(255,255,255,0.8)" />
                              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{c.city}</Text>
                            </Space>
                          )}
                        </Col>
                        <Col>
                          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '8px 12px' }}>
                            <Text style={{ color: 'white', fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{composite}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'block' }}>/100</Text>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* Scores */}
                    <div style={{ padding: '16px 20px' }}>
                      {panelAvg != null && (
                        <div style={{ marginBottom: 12 }}>
                          <Row justify="space-between" style={{ marginBottom: 4 }}>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>Interview Average</Text>
                            <Text strong style={{ fontSize: 13, color: score2color(panelAvg) }}>{panelAvg}/100</Text>
                          </Row>
                          <Progress percent={panelAvg} showInfo={false} strokeColor={score2color(panelAvg)} size="small" />
                        </div>
                      )}

                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        {c.techScore != null && (
                          <Col span={12}>
                            <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '8px 10px', border: '1px solid #BBF7D0' }}>
                              <Text type="secondary" style={{ fontSize: 11 }}>Panel A</Text>
                              <div style={{ fontSize: 20, fontWeight: 800, color: score2color(c.techScore) }}>{c.techScore}</div>
                              {c.techNotes && <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>{c.techNotes.slice(0, 40)}{c.techNotes.length > 40 ? '…' : ''}</Text>}
                            </div>
                          </Col>
                        )}
                        {c.softScore != null && (
                          <Col span={12}>
                            <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '8px 10px', border: '1px solid #BFDBFE' }}>
                              <Text type="secondary" style={{ fontSize: 11 }}>Panel B</Text>
                              <div style={{ fontSize: 20, fontWeight: 800, color: score2color(c.softScore) }}>{c.softScore}</div>
                              {c.softNotes && <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>{c.softNotes.slice(0, 40)}{c.softNotes.length > 40 ? '…' : ''}</Text>}
                            </div>
                          </Col>
                        )}
                      </Row>

                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        {c.gpa && <Col><Badge color="#F59E0B" text={<Text style={{ fontSize: 12 }}>GPA {c.gpa}</Text>} /></Col>}
                        {c.ielts && <Col><Badge color="#10B981" text={<Text style={{ fontSize: 12 }}>IELTS {c.ielts}</Text>} /></Col>}
                        {c.unt && <Col><Badge color="#6366F1" text={<Text style={{ fontSize: 12 }}>UBT {c.unt}</Text>} /></Col>}
                      </Row>
                    </div>

                    {/* Actions */}
                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Button
                        block
                        icon={<FileTextOutlined />}
                        style={{ borderRadius: 10, borderColor: '#006CFF', color: '#006CFF' }}
                        onClick={() => navigate(`/admin/review/${c.id}`)}
                      >
                        Full Review
                      </Button>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Button
                            block danger
                            icon={<CloseCircleOutlined />}
                            style={{ borderRadius: 10 }}
                            onClick={() => handleDecline(c.id)}
                          >
                            Decline
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            block type="primary"
                            icon={<CheckCircleOutlined />}
                            style={{ borderRadius: 10, background: '#10B981', borderColor: '#10B981' }}
                            onClick={() => handleApprove(c.id)}
                          >
                            Approve
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default Reviews;
