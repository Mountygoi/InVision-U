import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, List, Tag, Avatar } from 'antd';
import { Users, UserCheck, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import type { DashboardStats } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { themeColors } from '../i18n/themeColors';
import { API } from '../config';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  new: '#16a34a',
  under_review: '#F59E0B',
  interview: '#8B5CF6',
  accepted: '#10B981',
  declined: '#EF4444',
  waitlisted: '#6B7280',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  new: 'statusNew',
  under_review: 'statusUnderReview',
  interview: 'statusInterview',
  accepted: 'statusAccepted',
  declined: 'statusDeclined',
  waitlisted: 'statusWaitlisted',
  arbitration: 'statusArbitration',
};

const SCORE_COLORS = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#16a34a'];

const Dashboard = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = themeColors(isDark);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/stats`)
      .then(res => setStats(res.data))
      .catch(err => console.error('Error loading stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!stats) return <div style={{ padding: 40 }}><Text type="danger">{t('failedLoadDashboard')}</Text></div>;

  return (
    <div className="dashboard-page" style={{ padding: '32px 40px', fontFamily: "'Raleway', sans-serif", animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both', background: c.pageBg, color: c.text }}>
      <Title level={2} style={{ marginBottom: '8px', letterSpacing: '-0.02em', color: c.text }}>{t('admissionsDashboard')}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '32px', fontSize: 15, color: c.textSecondary }}>{t('dashboardSubtitle')}</Text>

      {/* Metric Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }} className="dashboard-metrics">
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'transform 0.25s ease, box-shadow 0.25s ease', cursor: 'default' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}>
            <Statistic
              title={<Text type="secondary">{t('totalApplicants')}</Text>}
              value={stats.total}
              prefix={<Users size={20} style={{ marginRight: 8, color: '#16a34a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'transform 0.25s ease, box-shadow 0.25s ease', cursor: 'default' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}>
            <Statistic
              title={<Text type="secondary">{t('pendingReview')}</Text>}
              value={stats.new + stats.underReview}
              prefix={<Calendar size={20} style={{ marginRight: 8, color: '#F59E0B' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'transform 0.25s ease, box-shadow 0.25s ease', cursor: 'default' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}>
            <Statistic
              title={<Text type="secondary">{t('inInterview')}</Text>}
              value={stats.interview}
              prefix={<UserCheck size={20} style={{ marginRight: 8, color: '#8B5CF6' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'transform 0.25s ease, box-shadow 0.25s ease', cursor: 'default' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}>
            <Statistic
              title={<Text type="secondary">{t('avgAiScore')}</Text>}
              value={stats.avgCompositeScore}
              prefix={<TrendingUp size={20} style={{ marginRight: 8, color: '#10B981' }} />}
              suffix="/ 100"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }} className="dashboard-charts">
        <Col span={12}>
          <Card title={<Text strong style={{ fontSize: 16, color: c.text }}>{t('scoreDistribution')}</Text>} style={{ borderRadius: '16px', height: '100%', border: `1px solid ${c.border}`, background: c.cardBg }}>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderLight} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: c.textMuted }} />
                  <YAxis tick={{ fontSize: 12, fill: c.textMuted }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.scoreDistribution.map((_, index) => (
                      <Cell key={index} fill={SCORE_COLORS[index] || '#16a34a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Status Funnel */}
        <Col span={12}>
          <Card title={<Text strong style={{ fontSize: 16, color: c.text }}>{t('applicationPipeline')}</Text>} style={{ borderRadius: '16px', height: '100%', border: `1px solid ${c.border}`, background: c.cardBg }}>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderLight} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: c.textMuted }} allowDecimals={false} />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 12, fill: c.textMuted }} width={90}
                    tickFormatter={(v: string) => t(STATUS_LABEL_KEYS[v] || v)} />
                  <Tooltip formatter={(value) => [String(value), t('candidates')]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.statusFunnel.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#16a34a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row */}
      <Row gutter={[20, 20]} className="dashboard-bottom">
        {/* Regional Breakdown */}
        <Col span={14}>
          <Card title={<><MapPin size={16} style={{ marginRight: 8, color: c.text }} /> {t('regionalBreakdown')}</>} style={{ borderRadius: '16px', border: `1px solid ${c.border}`, background: c.cardBg }}>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.regionBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderLight} />
                  <XAxis dataKey="region" tick={{ fontSize: 11, fill: c.textMuted }} />
                  <YAxis tick={{ fontSize: 12, fill: c.textMuted }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name={t('total')} fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rural" name={t('rural')} fill="#3dedf1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Recent Applications */}
        <Col span={10}>
          <Card title={<Text strong style={{ fontSize: 16, color: c.text }}>{t('recentApplications')}</Text>} style={{ borderRadius: '16px', border: `1px solid ${c.border}`, background: c.cardBg }}>
            <List
              dataSource={stats.recentApplications}
              renderItem={item => (
                <List.Item style={{ padding: '10px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name)}`} />}
                    title={<Text strong style={{ fontSize: 13 }}>{item.name}</Text>}
                    description={<Text type="secondary" style={{ fontSize: 12 }}>{item.city} &middot; {item.university || t('na')}</Text>}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: '#16a34a', fontSize: 14 }}>{Math.round(item.compositeScore)}</Text>
                    <br />
                    <Tag color={STATUS_COLORS[item.status]} style={{ fontSize: 10, borderRadius: 4, border: 'none', marginRight: 0 }}>
                      {t(STATUS_LABEL_KEYS[item.status] || item.status)}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Diamond Talents */}
      {stats.topTalents && stats.topTalents.length > 0 && (
        <Card
          title={<Text strong style={{ fontSize: 16, color: c.text }}>{t('diamondTalents')}</Text>}
          style={{ borderRadius: '16px', border: `1px solid ${c.border}`, background: c.cardBg, marginTop: 24 }}
        >
          <Row gutter={[16, 16]}>
            {stats.topTalents.map(talent => {
              const icons: Record<string, string> = { diamond: '💎', leader: '🏆', rising_star: '⭐' };
              const labels: Record<string, string> = { diamond: t('diamondLabel'), leader: t('leaderLabel'), rising_star: t('risingStarLabel') };
              const colors: Record<string, string> = { diamond: '#8B5CF6', leader: '#F59E0B', rising_star: '#10B981' };
              return (
                <Col key={talent.id} xs={24} sm={12} md={8} lg={6}>
                  <div style={{
                    background: isDark ? '#1e293b' : '#fafafa',
                    borderRadius: 12,
                    padding: '16px',
                    border: `1px solid ${colors[talent.category]}40`,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{icons[talent.category]}</div>
                    <Text strong style={{ fontSize: 14, display: 'block' }}>{talent.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{talent.city}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag color={colors[talent.category]} style={{ borderRadius: 6, fontSize: 11 }}>{labels[talent.category]}</Tag>
                      <Text strong style={{ color: colors[talent.category], fontSize: 15, marginLeft: 8 }}>{Math.round(talent.score)}</Text>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
