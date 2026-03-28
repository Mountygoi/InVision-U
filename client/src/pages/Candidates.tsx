import { useState, useEffect, useCallback } from 'react';
import { Row, Col, List, Avatar, Tag, Button, Typography, Space, Empty, message, Input, Layout, Card, Divider } from 'antd';
import { ShieldCheck, FileText, Send, XCircle, MoreVertical, MapPin, GraduationCap, Award, CheckCircle2 } from 'lucide-react'; 
import axios from 'axios';
import {  RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Radar as RadarArea } from 'recharts';
import { useScoring } from '../context/ScoringContext';
import { calculateCandidateScore } from '../utils/scoringUtils';
import AppHeader from '../layout/AppHeader';

// Твои SVG иконки из assets
import searchIcon from '../assets/icons/search.svg';
import filterIcon from '../assets/icons/filter.svg';

import type { Candidate } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { weights } = useScoring();

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/candidates');
      setCandidates(res.data);
      if (res.data.length > 0 && !selectedId) setSelectedId(res.data[0].id);
    } catch (err) {
      console.error('Data fetch error:', err);
      message.error('Ошибка загрузки данных с сервера');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Полный пересчет с сортировкой
  const scoredCandidates = candidates.map(c => ({
    ...c,
    dynamicScore: calculateCandidateScore(c, weights)
  })).sort((a, b) => b.dynamicScore - a.dynamicScore);

  const selectedCandidate = scoredCandidates.find(c => c.id === selectedId);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/candidates/${id}/status`, { status: newStatus });
      message.success(`Кандидат переведен в статус: ${newStatus}`);
      fetchCandidates();
    } catch (err) {
      console.error('Update status error:', err);
      message.error('Ошибка обновления статуса');
    }
  };

  const radarData = selectedCandidate?.competencies ? [
    { subject: 'Leadership', A: selectedCandidate.competencies.leadership },
    { subject: 'Motivation', A: selectedCandidate.competencies.motivation },
    { subject: 'Technical', A: selectedCandidate.competencies.technicalPotential },
    { subject: 'Creativity', A: selectedCandidate.competencies.creativity },
    { subject: 'Empathy', A: selectedCandidate.competencies.empathy },
  ] : [];

  return (
    <Layout style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#FFFFFF' }}>
      <AppHeader />
      
      <Content style={{ padding: '24px', marginTop: '72px' }}>
        <Row gutter={0} style={{ 
          background: '#FFFFFF', 
          borderRadius: '16px', 
          border: '1px solid #F0F0F0', 
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)' 
        }}>
          
          {/* ЛЕВАЯ КОЛОНКА: СПИСОК */}
          <Col span={9} style={{ borderRight: '1px solid #F0F0F0', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #F0F0F0' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700, fontFamily: 'Inter' }}>
                  Applicants <Text type="secondary" style={{ fontWeight: 400 }}>({scoredCandidates.length})</Text>
                </Title>
                <Button type="text" icon={<img src={filterIcon} alt="filter" style={{ width: 16 }} />} style={{ fontFamily: 'Inter' }}>
                  Filters
                </Button>
              </Row>
              <Input 
                placeholder="Search by name or university..." 
                prefix={<img src={searchIcon} alt="search" style={{ width: '14px', marginRight: '4px' }} />} 
                style={{ 
                  borderRadius: '10px', 
                  background: '#F5F7FA', 
                  border: '1px solid #F0F0F0', 
                  height: '40px', 
                  fontFamily: 'Inter' 
                }}
              />
            </div>

            <List
              loading={loading}
              dataSource={scoredCandidates}
              style={{ flex: 1, overflowY: 'auto' }}
              renderItem={(item) => (
                <List.Item
                  onClick={() => setSelectedId(item.id)}
                  style={{ 
                    padding: '20px 24px', 
                    cursor: 'pointer',
                    background: selectedId === item.id ? '#F0F7FF' : '#FFFFFF',
                    borderLeft: selectedId === item.id ? '4px solid #006CFF' : '4px solid transparent',
                    borderBottom: '1px solid #F0F0F0',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Row align="middle" gutter={16} style={{ width: '100%' }}>
                    <Col span={4}>
                      <Avatar size={52} src={item.avatarUrl} style={{ border: '2px solid #FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    </Col>
                    <Col span={15}>
                      <Text strong style={{ fontSize: '15px', display: 'block', color: selectedId === item.id ? '#006CFF' : '#1F2937', fontFamily: 'Inter' }}>
                        {item.name}
                      </Text>
                      <Space size={4} style={{ marginTop: '2px' }}>
                        <GraduationCap size={12} color="#9CA3AF" />
                        <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'Inter' }}>{item.university || 'N/A'}</Text>
                      </Space>
                    </Col>
                    <Col span={5} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Text strong style={{ fontSize: '18px', color: '#006CFF', fontFamily: 'Inter' }}>{item.dynamicScore}</Text>
                        <Tag color={item.isRural ? 'green' : 'blue'} style={{ fontSize: '10px', marginRight: 0, borderRadius: '4px', border: 'none' }}>
                          {item.isRural ? 'RURAL' : 'CITY'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Col>

          {/* ПРАВАЯ КОЛОНКА: ДЕТАЛИ */}
          <Col span={15} style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', background: '#FFFFFF' }}>
            {selectedCandidate ? (
              <div style={{ padding: '40px' }}>
                {/* Header профиля */}
                <Row justify="space-between" align="top" style={{ marginBottom: '32px' }}>
                  <Space size={24}>
                    <Avatar size={100} src={selectedCandidate.avatarUrl} style={{ border: '4px solid #F0F7FF', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
                    <div>
                      <Title level={2} style={{ margin: 0, fontWeight: 700, fontFamily: 'Inter', letterSpacing: '-0.5px' }}>
                        {selectedCandidate.name}
                      </Title>
                      <Space size="large" style={{ marginTop: '8px' }}>
                        <Space><MapPin size={16} color="#006CFF" /><Text type="secondary">{selectedCandidate.city}, KZ</Text></Space>
                        <Space><GraduationCap size={16} color="#006CFF" /><Text type="secondary">{selectedCandidate.university}</Text></Space>
                      </Space>
                    </div>
                  </Space>
                  <Space>
                    <Button icon={<FileText size={18} />} size="large" style={{ borderRadius: '10px', fontFamily: 'Inter' }}>View Essay</Button>
                    <Button type="text" icon={<MoreVertical size={20} />} />
                  </Space>
                </Row>

                <Divider style={{ margin: '24px 0' }} />

                <Row gutter={40}>
                  {/* Левая часть карточки */}
                  <Col span={11}>
                    <div style={{ background: '#F0FDF4', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #DCFCE7' }}>
                      <Title level={5} style={{ color: '#166534', marginBottom: '16px', fontFamily: 'Inter', display: 'flex', alignItems: 'center' }}>
                        <ShieldCheck size={20} style={{ marginRight: '8px' }} /> AI Assessment
                      </Title>
                      <Paragraph style={{ fontSize: '14px', lineHeight: '1.6', color: '#166534', fontFamily: 'Inter' }}>
                        Кандидат демонстрирует исключительный потенциал в области <strong>Leadership</strong>. Анализ эссе подтверждает высокую социальную ответственность и четкие цели.
                      </Paragraph>
                      <Space wrap style={{ marginTop: '12px' }}>
                        <Tag color="success" icon={<CheckCircle2 size={10} />}>Community Leader</Tag>
                        <Tag color="success" icon={<CheckCircle2 size={10} />}>High Motivation</Tag>
                      </Space>
                    </div>

                    <Title level={5} style={{ fontFamily: 'Inter', marginBottom: '16px', fontWeight: 600 }}>Key Achievements</Title>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Card bodyStyle={{ padding: '12px 16px' }} style={{ borderRadius: '12px', background: '#F9FAFB', border: 'none' }}>
                        <Space><Award size={16} color="#006CFF" /><Text strong style={{ fontFamily: 'Inter' }}>Subject Olympiad Winner</Text></Space>
                      </Card>
                      <Card bodyStyle={{ padding: '12px 16px' }} style={{ borderRadius: '12px', background: '#F9FAFB', border: 'none' }}>
                        <Space><CheckCircle2 size={16} color="#006CFF" /><Text strong style={{ fontFamily: 'Inter' }}>Volunteering (2+ years)</Text></Space>
                      </Card>
                    </Space>
                  </Col>

                  {/* Правая часть (График) */}
                  <Col span={13}>
                    <Card 
                      title={<Text strong style={{ fontSize: '16px', fontFamily: 'Inter' }}>Competency Map</Text>} 
                      variant="borderless" 
                      style={{ border: '1px solid #F0F0F0', borderRadius: '16px', height: '100%' }}
                    >
                      <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#E5E7EB" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6B7280', fontFamily: 'Inter' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <RadarArea 
                              name="Candidate" 
                              dataKey="A" 
                              stroke="#006CFF" 
                              fill="#006CFF" 
                              fillOpacity={0.12} 
                              dot={{ r: 4, fill: '#006CFF', strokeWidth: 2 }} 
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Footer с кнопками */}
                <div style={{ 
                  marginTop: '48px', 
                  padding: '24px', 
                  background: '#F9FAFB', 
                  borderRadius: '16px',
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text type="secondary" style={{ fontFamily: 'Inter' }}>Review this candidate for the next stage</Text>
                  <Space size="middle">
                    <Button 
                      danger 
                      icon={<XCircle size={18} />} 
                      size="large"
                      style={{ borderRadius: '10px', fontWeight: 600, padding: '0 24px', height: '48px' }}
                      onClick={() => handleStatusChange(selectedCandidate.id, 'declined')}
                    >
                      Decline
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<Send size={18} />} 
                      size="large"
                      style={{ background: '#006CFF', borderRadius: '10px', fontWeight: 600, padding: '0 32px', height: '48px' }}
                      onClick={() => handleStatusChange(selectedCandidate.id, 'interview')}
                    >
                      Approve for Interview
                    </Button>
                  </Space>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Empty description="Please select a candidate from the left panel" />
              </div>
            )}
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Candidates;