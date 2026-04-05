import { useState, useEffect } from 'react';
import { Layout, Card, Typography, Steps, Row, Col, Badge, Button, Input, Modal, message, Tag, Space, Divider, Result, DatePicker, Empty, Avatar, Alert } from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  CalendarOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ScheduleOutlined,
  VideoCameraOutlined,
  DownloadOutlined,
  PrinterOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import VideoConference from '../components/VideoConference';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const getAvatar = (candidate: any) => {
  if (!candidate) return '';
  const url = candidate.avatarUrl || candidate.avatar_url;
  if (url) return url;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candidate.name)}`;
};

const CertificatePrint = ({ candidate }: { candidate: any }) => {
  const { t } = useLanguage();
  const appId = candidate.id.slice(0, 8).toUpperCase();
  const approvedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="certificate-print-area" style={{
      width: 794, minHeight: 560, background: 'white', position: 'relative',
      fontFamily: '"Times New Roman", Times, serif', boxSizing: 'border-box',
    }}>
      <div style={{ position: 'absolute', inset: 16, border: '3px solid #16a34a', borderRadius: 4, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 22, border: '1px solid #3dedf1', borderRadius: 2, pointerEvents: 'none' }} />

      <div style={{ padding: '48px 72px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#16a34a,#3dedf1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 22, flexShrink: 0 }}>N</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a', fontFamily: "'Raleway', sans-serif", letterSpacing: 1 }}>inVision U</div>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Raleway', sans-serif", letterSpacing: 2 }}>{t('certScholarship')}</div>
          </div>
        </div>

        <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg,#16a34a,#3dedf1)', margin: '16px auto' }} />

        <div style={{ fontSize: 13, letterSpacing: 4, color: '#64748B', textTransform: 'uppercase', marginBottom: 18, fontFamily: "'Raleway', sans-serif" }}>
          {t('certCertify')}
        </div>

        <div style={{ fontSize: 38, fontWeight: 700, color: '#1E293B', marginBottom: 12, fontFamily: '"Times New Roman", serif', letterSpacing: 1 }}>
          {candidate.name}
        </div>

        <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 24px', fontFamily: "'Raleway', sans-serif" }}>
          {t('certCompleted')}
        </div>

        <div style={{ width: 80, height: 1, background: '#E2E8F0', margin: '0 auto 24px' }} />

        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Raleway', sans-serif" }}>{t('certAppId')}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#16a34a', fontFamily: "'Raleway', sans-serif", letterSpacing: 2 }}>#{appId}</div>
          </div>
          <div style={{ width: 1, background: '#E2E8F0' }} />
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Raleway', sans-serif" }}>{t('certDateApproval')}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', fontFamily: "'Raleway', sans-serif" }}>{approvedDate}</div>
          </div>
          <div style={{ width: 1, background: '#E2E8F0' }} />
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Raleway', sans-serif" }}>{t('certNo')}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', fontFamily: "'Raleway', sans-serif" }}>NVSU-{new Date().getFullYear()}-{appId}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 80 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 140, borderBottom: '1px solid #94A3B8', marginBottom: 6, height: 36 }} />
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Raleway', sans-serif" }}>{t('certHeadAdmissions')}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Raleway', sans-serif" }}>inVision U</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 140, borderBottom: '1px solid #94A3B8', marginBottom: 6, height: 36 }} />
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Raleway', sans-serif" }}>{t('certProgramDirector')}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Raleway', sans-serif" }}>inVision U</div>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: '#CBD5E1', letterSpacing: 1, fontFamily: "'Raleway', sans-serif" }}>
          {t('certDigitalNote')}
        </div>
      </div>
    </div>
  );
};

const StudentStatus = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [activeCall, setActiveCall] = useState<any>(null);

  const email = localStorage.getItem('userEmail');

  // Dark theme helpers
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const textPrimary = isDark ? '#f1f5f9' : '#1E293B';
  const textSecondary = isDark ? '#94a3b8' : '#64748B';
  const surfaceBg = isDark ? '#334155' : '#f5f5f5';

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 10; hour <= 17; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  };

  const fetchBookedSlots = async (date: any) => {
    try {
      const dateStr = date.format('DD MMMM YYYY');
      const res = await axios.get('http://localhost:5000/api/candidates');
      const booked = res.data
        .filter((c: any) => c.interviewTime && c.interviewTime.includes(dateStr))
        .map((c: any) => {
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
        message.error(t('failedLoadStatus'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, navigate, t]);

  const handleScheduleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsScheduling(true);
    const finalSlot = `${selectedDate.format('DD MMMM YYYY')} at ${selectedTime}`;
    try {
      await axios.patch(`http://localhost:5000/api/candidates/${candidate.id}/schedule`, {
        interviewTime: finalSlot
      });
      message.success(t('interviewScheduled'));
      setCandidate({ ...candidate, interviewTime: finalSlot });
    } catch (err) {
      message.error(t('schedulingFailed'));
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 4) return message.warning(t('passwordTooShort'));
    try {
      await axios.patch(`http://localhost:5000/api/candidates/${candidate.id}/password`, { newPassword });
      message.success(t('passwordUpdated'));
      setIsModalVisible(false);
    } catch (err) {
      message.error(t('failedUpdatePassword'));
    }
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const printCertificate = () => {
    window.print();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><LoadingOutlined style={{ fontSize: 40, color: '#16a34a' }} /></div>;
  if (!candidate) return <Result status="404" title={t('appNotFound')} />;

  const getStatusStep = () => {
    const s = candidate.status;
    if (s === 'new') return 0;
    if (s === 'under_review') return 1;
    if (s === 'interview' || s === 'arbitration') return 2;
    if (s === 'waitlisted') return 3;
    if (s === 'accepted' || s === 'declined') return 4;
    return 0;
  };

  const statusInfo: Record<string, { label: string; color: string; bg: string; text: string }> = {
    new: { label: t('statusSubmitted'), color: '#3B82F6', bg: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', text: t('statusSubmittedDesc') },
    under_review: { label: t('statusReview'), color: '#F59E0B', bg: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB', text: t('statusReviewDesc') },
    interview: { label: t('statusInterviewStage'), color: '#8B5CF6', bg: isDark ? 'rgba(139,92,246,0.15)' : '#F5F3FF', text: t('statusInterviewDesc') },
    arbitration: { label: t('statusAdditionalReview'), color: '#EF4444', bg: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', text: t('statusAdditionalDesc') },
    waitlisted: { label: t('statusWaitlisted'), color: '#64748B', bg: isDark ? 'rgba(100,116,139,0.15)' : '#F1F5F9', text: t('statusWaitlistedDesc') },
    accepted: { label: t('statusAcceptedTitle'), color: '#10B981', bg: isDark ? 'rgba(16,185,129,0.15)' : '#F0FDF4', text: t('statusAcceptedDesc') },
    declined: { label: t('statusDeclinedTitle'), color: '#EF4444', bg: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', text: t('statusDeclinedDesc') },
  };
  const currentStatus = statusInfo[candidate.status] || statusInfo['new'];

  return (
    <Layout style={{ minHeight: '100vh', background: isDark ? '#0f172a' : '#fafafa' }}>
      <Content style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%', animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: textPrimary, fontFamily: "'Raleway', sans-serif" }}>{t('portalTitle')}</Title>
            <Text style={{ color: textSecondary }}>{t('personalAccount')} • {candidate.name}</Text>
          </div>
          <Space>
            <Button size="small" type="text" onClick={toggleTheme} style={{ borderRadius: 8 }}>{theme === 'light' ? '🌙' : '☀️'}</Button>
            <Button size="small" type={lang === 'ru' ? 'primary' : 'default'} onClick={() => setLang('ru')} style={{ borderRadius: 8 }}>RU</Button>
            <Button size="small" type={lang === 'kz' ? 'primary' : 'default'} onClick={() => setLang('kz')} style={{ borderRadius: 8 }}>KZ</Button>
            <Button type="text" danger icon={<LogoutOutlined />} onClick={logout}>{t('signOut')}</Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          <Col span={16}>
            {/* Status banner */}
            <div style={{ background: currentStatus.bg, border: `1px solid ${currentStatus.color}30`, borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: currentStatus.color, flexShrink: 0, boxShadow: `0 0 0 4px ${currentStatus.color}30` }} />
              <div>
                <Text strong style={{ color: currentStatus.color, fontSize: 15, display: 'block' }}>{currentStatus.label}</Text>
                <Text style={{ color: textSecondary, fontSize: 13 }}>{currentStatus.text}</Text>
              </div>
            </div>

            <Card variant="borderless" style={{ borderRadius: '20px', marginBottom: '24px', background: cardBg, border: `1px solid ${borderColor}` }}>
              <Steps
                current={getStatusStep()}
                items={[
                  { title: t('stepsApplication'), icon: <FileTextOutlined /> },
                  { title: t('stepsScreening'), icon: candidate.status === 'new' ? <LoadingOutlined /> : <CheckCircleOutlined /> },
                  { title: t('stepsInterview'), icon: <ScheduleOutlined /> },
                  { title: t('stepsReview'), icon: <CheckCircleOutlined /> },
                  { title: t('stepsResult'), icon: <TrophyOutlined /> },
                ]}
              />
            </Card>

            {/* ACCEPTED */}
            {candidate.status === 'accepted' && (
              <Card
                style={{ borderRadius: 20, marginBottom: 24, border: '2px solid #16a34a', background: cardBg, overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ padding: '28px 32px' }}>
                  <Space size={16} align="start">
                    <div style={{ width: 56, height: 56, background: '#16a34a', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TrophyOutlined style={{ fontSize: 28, color: '#141414' }} />
                    </div>
                    <div>
                      <Title level={3} style={{ color: '#16a34a', margin: 0, fontWeight: 800 }}>{t('congratsName', { name: candidate.name })}</Title>
                      <Text style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: 15, display: 'block', marginTop: 6, lineHeight: 1.6 }}>
                        {t('acceptedMsg')}<br />
                        {t('eligibleOffline')}
                      </Text>
                    </div>
                  </Space>

                  <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<PrinterOutlined />}
                      style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 12, height: 48, color: '#ffffff', fontWeight: 700 }}
                      onClick={() => setCertModalOpen(true)}
                    >
                      {t('viewCertificate')}
                    </Button>
                    <Button
                      size="large"
                      icon={<DownloadOutlined />}
                      style={{ borderRadius: 12, height: 48, borderColor: '#16a34a', color: '#16a34a' }}
                      onClick={() => { setCertModalOpen(true); setTimeout(() => window.print(), 400); }}
                    >
                      {t('downloadPdf')}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* DECLINED */}
            {candidate.status === 'declined' && (
              <Alert
                title={t('declinedAlertTitle')}
                description={t('declinedAlertMsg')}
                type="error"
                showIcon
                style={{ borderRadius: 16, marginBottom: 24 }}
              />
            )}

            {candidate.status === 'interview' && !candidate.interviewTime && (
              <Card 
                style={{ borderRadius: '20px', marginBottom: '24px', border: `1px solid ${borderColor}`, overflow: 'hidden', background: cardBg }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ background: surfaceBg, padding: '16px 24px', borderBottom: `1px solid ${borderColor}` }}>
                  <Title level={4} style={{ color: '#16a34a', margin: 0 }}><CalendarOutlined /> {t('interviewScheduler')}</Title>
                </div>
                
                <Row>
                  <Col span={11} style={{ padding: '24px', borderRight: `1px solid ${borderColor}` }}>
                    <Text strong style={{ display: 'block', marginBottom: '15px', color: textPrimary }}>{t('selectDate')}</Text>
                    <div className="calendar-fix-wrapper" style={{ minHeight: '320px', position: 'relative' }}>
                      <DatePicker 
                        open 
                        getPopupContainer={(trigger: any) => trigger.parentNode}
                        style={{ visibility: 'hidden', height: 0, width: 0, padding: 0, position: 'absolute' }}
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        onChange={(date) => { 
                          setSelectedDate(date); 
                          setSelectedTime(null); 
                          if(date) fetchBookedSlots(date);
                        }}
                      />
                    </div>
                  </Col>
                  
                  <Col span={13} style={{ padding: '24px', background: surfaceBg }}>
                    <Text strong style={{ display: 'block', marginBottom: '15px', color: textPrimary }}>
                      {t('availableSlots')} {selectedDate ? `for ${selectedDate.format('MMM DD')}` : ''}
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
                                disabled={isBooked}
                                style={{ 
                                  borderRadius: '10px', 
                                  height: '45px', 
                                  width: '105px',
                                  fontWeight: selectedTime === time ? 'bold' : 'normal'
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
                        <Empty description={t('selectDateHint')} />
                      </div>
                    )}

                    {selectedDate && selectedTime && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(22, 163, 74,0.1)', borderRadius: '16px', border: '1px solid rgba(22, 163, 74,0.3)' }}>
                         <Text strong style={{ color: '#16a34a', display: 'block', marginBottom: '10px' }}>
                           {t('finalCheck', { date: selectedDate.format('MMMM DD, YYYY'), time: selectedTime })}
                         </Text>
                         <Button 
                           type="primary" 
                           block 
                           loading={isScheduling}
                           onClick={handleScheduleConfirm}
                           style={{ height: '45px', borderRadius: '10px', background: '#16a34a', border: 'none', fontWeight: 'bold', color: '#ffffff' }}
                         >
                           {t('confirmAppointment')}
                         </Button>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card>
            )}

            {candidate.interviewTime && (
              <Card style={{ borderRadius: '20px', marginBottom: '24px', border: `1px solid ${borderColor}`, background: cardBg }}>
                <Result
                  status="success"
                  title={<span style={{ color: '#16a34a', fontWeight: 700 }}>{t('interviewConfirmed')}</span>}
                  subTitle={
                    <div style={{ color: isDark ? '#94a3b8' : '#475569' }}>
                      <Paragraph>{t('waitingDate', { date: candidate.interviewTime })}.</Paragraph>
                      <Paragraph>{t('joinVideoHint')}</Paragraph>
                      
                      <Button 
                        type="primary" 
                        size="large" 
                        icon={<VideoCameraOutlined />} 
                        style={{ 
                          background: '#16a34a', 
                          borderColor: '#16a34a', 
                          color: '#141414', 
                          borderRadius: '12px', 
                          height: '50px', 
                          padding: '0 30px',
                          fontWeight: 'bold',
                          marginTop: '10px'
                        }}
                        onClick={() => setActiveCall(candidate)}
                      >
                        {t('joinVideoInterview')}
                      </Button>
                    </div>
                  }
                  extra={<Button type="dashed" onClick={() => {
                    setCandidate({...candidate, interviewTime: null});
                    setSelectedDate(null);
                    setSelectedTime(null);
                  }} style={{ borderRadius: '8px' }}>{t('changeTime')}</Button>}
                />
              </Card>
            )}

            <Card 
              title={<Space><CheckCircleOutlined style={{color: '#16a34a'}}/> <span style={{color: textPrimary}}>{t('aiProfile')}</span></Space>} 
              variant="borderless"
              style={{ borderRadius: '20px', background: cardBg, border: `1px solid ${borderColor}` }}
            >
              <Paragraph style={{ fontSize: '15px', color: textSecondary, lineHeight: '1.6' }}>
                {candidate.aiSummary || t('aiProfileDesc')}
              </Paragraph>
              <Divider style={{ borderColor }} />
              <Row gutter={16}>
                <Col span={8}><Text style={{color:'#94A3B8'}}>{t('gpaStatus')}</Text><br/><Text strong style={{color: textPrimary}}>{candidate.gpa || 'N/A'}</Text></Col>
                <Col span={8}><Text style={{color:'#94A3B8'}}>{t('locationStatus')}</Text><br/><Tag color={candidate.isRural ? 'green' : 'blue'}>{candidate.isRural ? 'Rural Bonus' : 'Urban'}</Tag></Col>
                <Col span={8}><Text style={{color:'#94A3B8'}}>{t('verification')}</Text><br/><Text code style={{ fontSize: '11px', color: '#16a34a' }}>v{candidate.aiModelVersion || '1.0.2'}-stable</Text></Col>
              </Row>
            </Card>
          </Col>

          <Col span={8}>
            <Card variant="borderless" style={{ borderRadius: '20px', textAlign: 'center', background: cardBg, border: `1px solid ${borderColor}` }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <Avatar 
                  size={90} 
                  src={getAvatar(candidate)} 
                  style={{ 
                    border: isDark ? '4px solid #334155' : '4px solid #1f1f1f', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    background: isDark ? '#334155' : '#E0F2FE'
                  }} 
                />
                <Badge status="processing" style={{ position: 'absolute', bottom: '5px', right: '5px' }} />
              </div>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: textPrimary }}>{candidate.name}</Title>
              <Text style={{ color: textSecondary }}>{candidate.email}</Text>
              <Divider style={{ borderColor }} />
              <Button block icon={<LockOutlined />} onClick={() => setIsModalVisible(true)} style={{ borderRadius: '10px', height: '40px', background: surfaceBg, borderColor, color: textPrimary }}>
                {t('accountSettings')}
              </Button>
            </Card>
          </Col>
        </Row>

        <Modal title={t('settingsTitle')} open={isModalVisible} onOk={handlePasswordChange} onCancel={() => setIsModalVisible(false)} okText={t('saveChanges')}>
          <div style={{ padding: '10px 0' }}>
            <Text type="secondary">{t('newPasswordPrompt')}</Text>
            <Input.Password 
              placeholder={t('newPasswordPlaceholder')} 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              style={{ marginTop: '10px', borderRadius: '8px' }}
            />
          </div>
        </Modal>

        <Modal
          open={!!activeCall}
          onCancel={() => setActiveCall(null)}
          footer={null}
          width={1000}
          centered
          destroyOnHidden
          styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: '12px' } }}
        >
          {activeCall && (
            <VideoConference
              roomName={`nVisionU-Interview-${activeCall.id}`}
              userName={candidate.name}
              onClose={() => setActiveCall(null)}
            />
          )}
        </Modal>

        <Modal
          open={certModalOpen}
          onCancel={() => setCertModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setCertModalOpen(false)}>{t('close')}</Button>,
            <Button key="print" type="primary" icon={<PrinterOutlined />}
              style={{ background: '#10B981', borderColor: '#10B981' }}
              onClick={printCertificate}
            >{t('printSave')}</Button>,
          ]}
          width={860}
          centered
          title={<Space><TrophyOutlined style={{ color: '#10B981' }} /> {t('certModalTitle')}</Space>}
        >
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <CertificatePrint candidate={candidate} />
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
          border: 1px solid ${borderColor};
          border-radius: 12px;
          background: ${surfaceBg};
        }
        .calendar-fix-wrapper .ant-picker-panel-container {
          box-shadow: none !important;
        }
        @media print {
          body * { visibility: hidden !important; }
          .certificate-print-area,
          .certificate-print-area * { visibility: visible !important; }
          .certificate-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            background: white !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </Layout>
  );
};

export default StudentStatus;
