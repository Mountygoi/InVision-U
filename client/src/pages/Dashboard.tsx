import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, List, Tag, Avatar } from 'antd';
import { Users, UserCheck, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import type { DashboardStats } from '../types';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  new: '#006CFF',
  under_review: '#F59E0B',
  interview: '#8B5CF6',
  accepted: '#10B981',
  declined: '#EF4444',
  waitlisted: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  under_review: 'Under Review',
  interview: 'Interview',
  accepted: 'Accepted',
  declined: 'Declined',
  waitlisted: 'Waitlisted',
};

const SCORE_COLORS = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#006CFF'];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error('Error loading stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!stats) return <div style={{ padding: 40 }}><Text type="danger">Failed to load dashboard data</Text></div>;

  return (
    <div style={{ padding: '32px 40px', fontFamily: 'Inter, sans-serif' }}>
      <Title level={2} style={{ marginBottom: '8px' }}>Admissions Dashboard</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '32px' }}>AI-powered candidate screening overview for InVision U</Text>

      {/* Metric Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Text type="secondary">Total Applicants</Text>}
              value={stats.total}
              prefix={<Users size={20} style={{ marginRight: 8, color: '#006CFF' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Text type="secondary">Pending Review</Text>}
              value={stats.new + stats.underReview}
              prefix={<Calendar size={20} style={{ marginRight: 8, color: '#F59E0B' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Text type="secondary">In Interview</Text>}
              value={stats.interview}
              prefix={<UserCheck size={20} style={{ marginRight: 8, color: '#8B5CF6' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Text type="secondary">Avg AI Score</Text>}
              value={stats.avgCompositeScore}
              prefix={<TrendingUp size={20} style={{ marginRight: 8, color: '#10B981' }} />}
              suffix="/ 100"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        {/* Score Distribution */}
        <Col span={12}>
          <Card title={<Text strong style={{ fontSize: 16 }}>Score Distribution</Text>} style={{ borderRadius: '16px', height: '100%' }}>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.scoreDistribution.map((_, index) => (
                      <Cell key={index} fill={SCORE_COLORS[index] || '#006CFF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Status Funnel */}
        <Col span={12}>
          <Card title={<Text strong style={{ fontSize: 16 }}>Application Pipeline</Text>} style={{ borderRadius: '16px', height: '100%' }}>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={90}
                    tickFormatter={(v: string) => STATUS_LABELS[v] || v} />
                  <Tooltip formatter={(value) => [String(value), 'Candidates']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.statusFunnel.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#006CFF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row */}
      <Row gutter={[20, 20]}>
        {/* Regional Breakdown */}
        <Col span={14}>
          <Card title={<><MapPin size={16} style={{ marginRight: 8 }} /> Regional Breakdown</>} style={{ borderRadius: '16px' }}>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.regionBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Total" fill="#006CFF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rural" name="Rural" fill="#00D8E6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Recent Applications */}
        <Col span={10}>
          <Card title={<Text strong style={{ fontSize: 16 }}>Recent Applications</Text>} style={{ borderRadius: '16px' }}>
            <List
              dataSource={stats.recentApplications}
              renderItem={item => (
                <List.Item style={{ padding: '10px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name)}`} />}
                    title={<Text strong style={{ fontSize: 13 }}>{item.name}</Text>}
                    description={<Text type="secondary" style={{ fontSize: 12 }}>{item.city} &middot; {item.university || 'N/A'}</Text>}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: '#006CFF', fontSize: 14 }}>{Math.round(item.compositeScore)}</Text>
                    <br />
                    <Tag color={STATUS_COLORS[item.status]} style={{ fontSize: 10, borderRadius: 4, border: 'none', marginRight: 0 }}>
                      {STATUS_LABELS[item.status] || item.status}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
