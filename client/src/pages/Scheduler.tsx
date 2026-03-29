import { useState, useEffect, useCallback } from 'react';
import { Layout, Row, Col, Card, Avatar, Tag, Button, Typography, Calendar, Space, message, Modal, List, Divider, Empty, Statistic, Badge } from 'antd';
import { Video, RefreshCw, Mail, BookOpen, Calendar as CalIcon, MapPin, ChevronRight, Star, Clock, Phone, FileText, User } from 'lucide-react';
import axios from 'axios';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface Candidate {
  id: string;
  name: string;
  university: string;
  status: string;
  avatarUrl?: string; // Поле для фото из базы
  interviewTime?: string;
  email: string;
  phone?: string;
  city?: string;
  gpa?: number;
  skills?: string[];
  bio?: string;
}

const Scheduler = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [isSlotsModalVisible, setIsSlotsModalVisible] = useState(false);
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);

  // ФУНКЦИЯ-ПОМОЩНИК: Приводит любой формат даты к единому виду "DD MMMM YYYY at HH:mm"
  // Это решает проблему несовпадения строк при сравнении (ISO vs String)
  const getNormalizedTime = (timeStr: string | undefined) => {
    if (!timeStr) return null;
    // Если это формат ISO (содержит T или Z), парсим его напрямую
    if (timeStr.includes('T') || timeStr.includes('Z')) {
      return dayjs(timeStr).format('DD MMMM YYYY [at] HH:mm');
    }
    // Если это уже твой строковый формат, возвращаем как есть
    return timeStr;
  };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/candidates');
      // ИСПРАВЛЕНИЕ: Фильтруем тех, кто на интервью ИЛИ уже имеет назначенное время
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

  const daySlots: string[] = [];
  for (let hour = 10; hour <= 17; hour++) {
    daySlots.push(`${hour}:00`);
    daySlots.push(`${hour}:30`);
  }

  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateStr = value.format('DD MMMM YYYY');
    // Считаем кандидатов через нормализованное время
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

  return (
   <Content style={{ 
  padding: '24px', 
  background: '#F8FAFC', 
  height: 'calc(100vh - 80px)', 
  /* Мы убрали marginTop, так как fixed header может перекрывать контент. 
     Если контент залез под хедер, верни marginTop, но уменьши его до '80px'. 
     Если же над календарем висит ПУСТОЙ БЕЛЫЙ БЛОК — значит marginTop лишний. */
  overflow: 'hidden', 
  display: 'flex',
  flexDirection: 'column'
}}>
      <style>{`
        body { overflow: hidden !important; }
        .ant-layout { overflow: hidden !important; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .candidate-item-hover:hover { background: #F8FAFC !important; transform: translateX(4px); }
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
                <Space><CalIcon size={22} color="#006CFF" /><Title level={4} style={{ margin: 0, fontWeight: 800 }}>Global Scheduler</Title></Space>
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
        title={<Space><Clock size={20} color="#006CFF" /> <Text strong>Interviews: {selectedDate.format('DD MMMM YYYY')}</Text></Space>}
        open={isSlotsModalVisible}
        onCancel={() => setIsSlotsModalVisible(false)}
        footer={null}
        width={550}
        centered
      >
        <div className="custom-scroll" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '8px' }}>
          {daySlots.map((time) => {
            const dateStr = selectedDate.format('DD MMMM YYYY');
            const targetFullString = `${dateStr} at ${time}`;
            
            // Ищем кандидата, сравнивая с нормализованным временем
            const candidate = candidates.find(c => getNormalizedTime(c.interviewTime) === targetFullString);
            
            return (
              <div key={time} style={{ 
                display: 'flex', alignItems: 'center', padding: '14px 18px', marginBottom: '10px', 
                borderRadius: '16px', background: candidate ? '#F0F7FF' : '#FAFAFA',
                border: candidate ? '1px solid #BAE7FF' : '1px solid #F1F5F9'
              }}>
                <Text strong style={{ width: '70px', color: candidate ? '#006CFF' : '#94A3B8', fontSize: '15px' }}>{time}</Text>
                <Divider type="vertical" style={{ height: '24px' }} />
                <div style={{ flex: 1 }}>
                  {candidate ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text 
                        strong 
                        style={{ cursor: 'pointer', color: '#1E293B', textDecoration: 'underline' }} 
                        onClick={() => setViewCandidate(candidate)}
                      >
                        {candidate.name}
                      </Text>
                      <Button type="primary" size="small" icon={<Video size={14} />} style={{ borderRadius: '8px' }}>Join</Button>
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
        footer={null} 
        width={650} 
        centered
        zIndex={2000}
        styles={{ body: { padding: 0 } }}
      >
        {viewCandidate && (
          <div style={{ overflow: 'hidden', borderRadius: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg, #006CFF 0%, #00D8E6 100%)', padding: '40px', color: '#fff' }}>
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
                <Col span={12}>
                  <Statistic title="Scholarship GPA" value={viewCandidate.gpa || 0} precision={2} prefix={<Star size={18} color="#F59E0B" fill="#F59E0B" />} />
                </Col>
                <Col span={12}>
                   <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px' }}>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>CONTACT DETAILS</Text>
                      <Text style={{ fontSize: '14px', display: 'block', marginTop: '4px' }}><Mail size={12} /> {viewCandidate.email}</Text>
                      <Text style={{ fontSize: '14px', display: 'block' }}><Phone size={12} /> {viewCandidate.phone || '+7 (707) 123 45 67'}</Text>
                   </div>
                </Col>
                <Col span={24}>
                  <Divider style={{ margin: '8px 0' }} />
                  <Title level={5}><FileText size={18} /> Candidate Bio & Goals</Title>
                  <Paragraph type="secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {viewCandidate.bio || "Motivated student seeking an opportunity to apply technical skills in a professional environment."}
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Title level={5}><User size={18} /> Technical Expertise</Title>
                  <Space wrap>
                    {(viewCandidate.skills || ['React', 'Node.js', 'PostgreSQL']).map(skill => (
                      <Tag key={skill} style={{ borderRadius: '8px', padding: '4px 12px', background: '#F1F5F9', border: 'none', fontWeight: 500 }}>{skill}</Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
              <div style={{ marginTop: '40px' }}>
                <Button block type="primary" size="large" onClick={() => setViewCandidate(null)} style={{ height: '50px', borderRadius: '14px', fontWeight: 700, fontSize: '16px' }}>
                  Close Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </Content>
  );
};

// Вспомогательный компонент Badge
const CustomBadge = ({ text }: { text: string }) => (
  <span style={{ fontSize: '10px', background: '#006CFF', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
    {text}
  </span>
);

export default Scheduler;