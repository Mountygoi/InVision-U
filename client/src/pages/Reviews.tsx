import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Avatar, Tag, Button, Typography, Space, Spin, Empty, Progress, Badge, Input, Select, Slider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons';
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState<string>('composite_desc');

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

  // Filtered and sorted candidates
  const filtered = useMemo(() => {
    let result = [...candidates];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.school?.toLowerCase().includes(q) ||
        c.university?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }

    result = result.filter(c => {
      const score = Math.round(c.compositeScore || 0);
      return score >= scoreRange[0] && score <= scoreRange[1];
    });

    // Sort
    switch (sortBy) {
      case 'composite_asc':
        result.sort((a, b) => (a.compositeScore || 0) - (b.compositeScore || 0));
        break;
      case 'composite_desc':
        result.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));
        break;
      case 'name_asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
    }

    return result;
  }, [candidates, searchQuery, scoreRange, sortBy]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spin size="large" />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Content style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', width: '100%', animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            <Trophy size={28} style={{ marginRight: 10, color: '#F59E0B', verticalAlign: 'middle' } as any} />
            Committee Reviews
          </Title>
          <Text type="secondary">Candidates who passed both interview panels — ready for final decision</Text>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: 24, borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }} styles={{ body: { padding: '16px 20px' } }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search by name, school, city..."
                prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                allowClear
                style={{ borderRadius: 10, height: 40 }}
              />
            </Col>
            <Col>
              <Select value={sortBy} onChange={setSortBy} style={{ width: 180 }}>
                <Select.Option value="composite_desc">Балл ↓</Select.Option>
                <Select.Option value="composite_asc">Балл ↑</Select.Option>
                <Select.Option value="name_asc">Имя A-Z</Select.Option>
                <Select.Option value="name_desc">Имя Z-A</Select.Option>
              </Select>
            </Col>
            <Col style={{ minWidth: 200 }}>
              <Text style={{ fontSize: 12, color: '#6B7280', marginRight: 8 }}>Баллы:</Text>
              <Slider
                range
                min={0}
                max={100}
                value={scoreRange}
                onChange={v => setScoreRange(v as [number, number])}
                style={{ width: 150, display: 'inline-block', verticalAlign: 'middle' }}
              />
            </Col>
          </Row>
        </Card>

        {filtered.length === 0 ? (
          <Empty
            description="No candidates match the filters"
            style={{ marginTop: 80 }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(c => {
              const panelAvg = (c.techScore != null && c.softScore != null)
                ? Math.round((c.techScore + c.softScore) / 2)
                : null;
              const composite = Math.round(c.compositeScore || 0);

              return (
                <Card
                  key={c.id}
                  style={{
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    minHeight: 140,
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                  styles={{ body: { padding: 0 } }}
                >
                  <Row align="middle" style={{ height: '100%' }}>
                    {/* Left: Avatar + Info */}
                    <Col style={{ padding: '20px', display: 'flex', alignItems: 'center', minWidth: 280 }}>
                      <Space size={16}>
                        <Avatar
                          size={56}
                          src={getAvatarUrl(c)}
                          style={{ border: '3px solid #c1f11d', flexShrink: 0 }}
                        />
                        <div>
                          <Text strong style={{ color: '#1E293B', fontSize: 16, display: 'block' }}>{c.name}</Text>
                          <Space size={6} style={{ marginTop: 2 }}>
                            <GraduationCap size={12} color="#64748B" />
                            <Text style={{ color: '#64748B', fontSize: 12 }}>{c.school || c.university || '—'}</Text>
                          </Space>
                          {c.city && (
                            <Space size={6} style={{ marginTop: 2 }}>
                              <MapPin size={12} color="#64748B" />
                              <Text style={{ color: '#64748B', fontSize: 12 }}>{c.city}</Text>
                            </Space>
                          )}
                        </div>
                      </Space>
                    </Col>

                    {/* Middle: Scores */}
                    <Col flex="auto" style={{ padding: '16px 24px' }}>
                      <Row gutter={24} align="middle">
                        {panelAvg != null && (
                          <Col>
                            <Text style={{ fontSize: 11, color: '#6B7280', display: 'block' }}>Interview Avg</Text>
                            <Text strong style={{ fontSize: 18, color: score2color(panelAvg) }}>{panelAvg}</Text>
                          </Col>
                        )}
                        {c.techScore != null && (
                          <Col>
                            <Text style={{ fontSize: 11, color: '#6B7280', display: 'block' }}>Panel A</Text>
                            <Text strong style={{ fontSize: 16, color: score2color(c.techScore) }}>{c.techScore}</Text>
                          </Col>
                        )}
                        {c.softScore != null && (
                          <Col>
                            <Text style={{ fontSize: 11, color: '#6B7280', display: 'block' }}>Panel B</Text>
                            <Text strong style={{ fontSize: 16, color: score2color(c.softScore) }}>{c.softScore}</Text>
                          </Col>
                        )}
                        <Col>
                          <Space size={6}>
                            {c.ielts && <Badge color="#10B981" text={<Text style={{ fontSize: 11 }}>IELTS {c.ielts}</Text>} />}
                            {c.unt && <Badge color="#6366F1" text={<Text style={{ fontSize: 11 }}>UBT {c.unt}</Text>} />}
                          </Space>
                        </Col>
                      </Row>
                    </Col>

                    {/* Right: Composite + Actions */}
                    <Col style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'center', background: '#F0FDF4', borderRadius: 12, padding: '8px 16px', border: '1px solid #BBF7D0', transition: 'box-shadow 0.2s ease' }}>
                        <Text strong style={{ fontSize: 28, color: score2color(composite), lineHeight: 1 }}>{composite}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 11, display: 'block' }}>/100</Text>
                      </div>
                      <Space direction="vertical" size={6}>
                        <Button
                          size="small"
                          icon={<FileTextOutlined />}
                          style={{ borderRadius: 8, borderColor: '#c1f11d', color: '#65a30d' }}
                          onClick={() => navigate(`/admin/review/${c.id}`)}
                        >
                          Review
                        </Button>
                        <Space size={4}>
                          <Button
                            size="small" danger
                            icon={<CloseCircleOutlined />}
                            style={{ borderRadius: 8 }}
                            onClick={() => handleDecline(c.id)}
                          />
                          <Button
                            size="small" type="primary"
                            icon={<CheckCircleOutlined />}
                            style={{ borderRadius: 8, background: '#10B981', borderColor: '#10B981' }}
                            onClick={() => handleApprove(c.id)}
                          />
                        </Space>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default Reviews;
