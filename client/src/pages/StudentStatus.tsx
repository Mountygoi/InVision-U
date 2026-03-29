import { useState, useEffect } from 'react';
import { Layout, Card, Typography, Steps, Row, Col, Badge, Button, Input, Modal, message, Tag, Space, Divider, Result, DatePicker, Empty, Avatar } from 'antd';
import { 
  CheckCircleOutlined, 
  LoadingOutlined, 
  LockOutlined, 
  CalendarOutlined, 
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const getAvatar = (candidate: any) => {
  if (!candidate) return '';
  const url = candidate.avatarUrl || candidate.avatar_url;
  if (url) return url;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candidate.name)}`;
};

const StudentStatus = () => {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]); // Состояние для занятых слотов

  const email = localStorage.getItem('userEmail');

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 10; hour <= 17; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  };

  // Загрузка занятых слотов для выбранной даты
  const fetchBookedSlots = async (date: any) => {
    try {
      const dateStr = date.format('DD MMMM YYYY');
      const res = await axios.get('http://localhost:5000/api/candidates');
      // Ищем всех кандидатов, у которых интервью в этот день
      const booked = res.data
        .filter((c: any) => c.interviewTime && c.interviewTime.includes(dateStr))
        .map((c: any) => {
          // Извлекаем только время (например, "14:30") из строки "25 March 2026 at 14:30"
          const parts = c.interviewTime.split(' at ');
          return parts.length > 1 ? parts[1] : null;
        })
        .filter(Boolean);
      setBookedSlots(booked);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    }
  };

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/candidates?search=${email}`);
        if (res.data.length > 0) {
          setCandidate(res.data[0]);
        }
      } catch (err) {
        message.error('Failed to load status');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, navigate]);

  const handleScheduleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsScheduling(true);
    
    const finalSlot = `${selectedDate.format('DD MMMM YYYY')} at ${selectedTime}`;
    
    try {
      await axios.patch(`http://localhost:5000/api/candidates/${candidate.id}/schedule`, {
        interviewTime: finalSlot
      });
      message.success('Interview scheduled successfully!');
      setCandidate({ ...candidate, interviewTime: finalSlot });
    } catch (err) {
      message.error('Scheduling failed');
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 4) return message.warning('Password too short');
    try {
      await axios.patch(`http://localhost:5000/api/candidates/${candidate.id}/password`, { newPassword });
      message.success('Password updated successfully!');
      setIsModalVisible(false);
    } catch (err) {
      message.error('Failed to update password');
    }
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><LoadingOutlined style={{ fontSize: 40, color: '#006CFF' }} /></div>;
  if (!candidate) return <Result status="404" title="Application not found" />;

  const getStatusStep = () => {
    const s = candidate.status;
    if (s === 'new') return 0;
    if (s === 'under_review') return 1;
    if (s === 'interview') return 2;
    if (s === 'accepted' || s === 'declined') return 3;
    return 0;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Content style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#1E293B' }}>Portal nVision U</Title>
            <Text style={{ color: '#64748B' }}>Personal Account • {candidate.name}</Text>
          </div>
          <Button type="text" danger icon={<LogoutOutlined />} onClick={logout}>Sign Out</Button>
        </div>

        <Row gutter={[24, 24]}>
          <Col span={16}>
            <Card bordered={false} style={{ borderRadius: '20px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Steps
                current={getStatusStep()}
                items={[
                  { title: 'Application', icon: <FileTextOutlined /> },
                  { title: 'AI Screening', icon: candidate.status === 'new' ? <LoadingOutlined /> : <CheckCircleOutlined /> },
                  { title: 'Interview', icon: <ScheduleOutlined /> },
                  { title: 'Result', icon: <CheckCircleOutlined /> },
                ]}
              />
            </Card>

            {candidate.status === 'interview' && !candidate.interviewTime && (
              <Card 
                style={{ borderRadius: '20px', marginBottom: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ background: 'linear-gradient(90deg, #006CFF 0%, #00D8E6 100%)', padding: '16px 24px' }}>
                  <Title level={4} style={{ color: '#fff', margin: 0 }}><CalendarOutlined /> Interview Scheduler</Title>
                </div>
                
                <Row>
                  <Col span={11} style={{ padding: '24px', borderRight: '1px solid #F1F5F9' }}>
                    <Text strong style={{ display: 'block', marginBottom: '15px' }}>1. Select Date</Text>
                    <div className="calendar-fix-wrapper" style={{ minHeight: '320px', position: 'relative' }}>
                      <DatePicker 
                        open 
                        getPopupContainer={(trigger: any) => trigger.parentNode}
                        style={{ visibility: 'hidden', height: 0, width: 0, padding: 0, position: 'absolute' }}
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        onChange={(date) => { 
                          setSelectedDate(date); 
                          setSelectedTime(null); 
                          if(date) fetchBookedSlots(date); // Подгружаем занятые слоты
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Pick an available day from the calendar</Text>
                    </div>
                  </Col>
                  
                  <Col span={13} style={{ padding: '24px', background: '#FAFCFF' }}>
                    <Text strong style={{ display: 'block', marginBottom: '15px' }}>
                      2. Available Slots {selectedDate ? `for ${selectedDate.format('MMM DD')}` : ''}
                    </Text>
                    
                    {selectedDate ? (
                      <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '10px' }}>
                        <Space wrap size={[12, 12]}>
                          {generateTimeSlots().map(time => {
                            const isBooked = bookedSlots.includes(time);
                            return (
                              <Button 
                                key={time}
                                type={selectedTime === time ? 'primary' : 'default'}
                                onClick={() => !isBooked && setSelectedTime(time)}
                                disabled={isBooked} // Кнопка недоступна, если слот занят
                                style={{ 
                                  borderRadius: '10px', 
                                  height: '45px', 
                                  width: '105px',
                                  fontWeight: selectedTime === time ? 'bold' : 'normal',
                                  textDecoration: isBooked ? 'line-through' : 'none',
                                  opacity: isBooked ? 0.5 : 1
                                }}
                              >
                                {time}
                              </Button>
                            );
                          })}
                        </Space>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', marginTop: '60px' }}>
                        <Empty description="Select a date to see available time slots" />
                      </div>
                    )}

                    {selectedDate && selectedTime && (
                      <div style={{ marginTop: '30px', padding: '20px', background: '#E0F2FE', borderRadius: '16px', border: '1px solid #BAE6FD' }}>
                         <Text strong style={{ color: '#0369A1', display: 'block', marginBottom: '10px' }}>
                           Final check: {selectedDate.format('MMMM DD, YYYY')} at {selectedTime}
                         </Text>
                         <Button 
                           type="primary" 
                           block 
                           loading={isScheduling}
                           onClick={handleScheduleConfirm}
                           style={{ height: '45px', borderRadius: '10px', background: '#0369A1', border: 'none', fontWeight: 'bold' }}
                         >
                           Confirm Appointment
                         </Button>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card>
            )}

            {candidate.interviewTime && (
              <Card style={{ borderRadius: '20px', marginBottom: '24px', border: 'none', background: '#ECFDF5', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <Result
                  status="success"
                  title={<span style={{ color: '#065F46', fontWeight: 700 }}>Interview Confirmed!</span>}
                  subTitle={<Text style={{ color: '#065F46' }}>We are waiting for you on <b>{candidate.interviewTime}</b>. Meeting details sent to email.</Text>}
                  extra={<Button type="dashed" onClick={() => {
                    setCandidate({...candidate, interviewTime: null});
                    setSelectedDate(null);
                    setSelectedTime(null);
                  }} style={{ borderRadius: '8px' }}>Change Time</Button>}
                />
              </Card>
            )}

            <Card 
              title={<Space><CheckCircleOutlined style={{color: '#006CFF'}}/> AI Profile Analysis</Space>} 
              bordered={false} 
              style={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
            >
              <Paragraph style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                {candidate.aiSummary || "Our neural network is currently evaluating your motivation essay and achievements. Please check back in 2-3 minutes."}
              </Paragraph>
              <Divider />
              <Row gutter={16}>
                <Col span={8}><Text type="secondary">GPA Status</Text><br/><Text strong>{candidate.gpa || 'N/A'}</Text></Col>
                <Col span={8}><Text type="secondary">Location Status</Text><br/><Tag color={candidate.isRural ? 'green' : 'blue'}>{candidate.isRural ? 'Rural Bonus' : 'Urban'}</Tag></Col>
                <Col span={8}><Text type="secondary">Verification</Text><br/><Text code style={{ fontSize: '11px' }}>v{candidate.aiModelVersion || '1.0.2'}-stable</Text></Col>
              </Row>
            </Card>
          </Col>

          <Col span={8}>
            <Card bordered={false} style={{ borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <Avatar 
                  size={90} 
                  src={getAvatar(candidate)} 
                  style={{ 
                    border: '4px solid #F0F7FF', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    background: '#E0F2FE'
                  }} 
                />
                <Badge status="processing" style={{ position: 'absolute', bottom: '5px', right: '5px' }} />
              </div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{candidate.name}</Title>
              <Text type="secondary">{candidate.email}</Text>
              <Divider />
              <Button block icon={<LockOutlined />} onClick={() => setIsModalVisible(true)} style={{ borderRadius: '10px', height: '40px' }}>
                Account Settings
              </Button>
            </Card>
          </Col>
        </Row>

        <Modal title="Account Settings" open={isModalVisible} onOk={handlePasswordChange} onCancel={() => setIsModalVisible(false)} okText="Save Changes">
          <div style={{ padding: '10px 0' }}>
            <Text type="secondary">Enter your new password:</Text>
            <Input.Password 
              placeholder="New password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              style={{ marginTop: '10px', borderRadius: '8px' }}
            />
          </div>
        </Modal>

      </Content>

      <style>{`
        .calendar-fix-wrapper .ant-picker-dropdown {
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
          box-shadow: none !important;
          display: inline-block;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
        }
        .calendar-fix-wrapper .ant-picker-panel-container {
          box-shadow: none !important;
        }
      `}</style>
    </Layout>
  );
};

export default StudentStatus;