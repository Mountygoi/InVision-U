import { useState, useEffect, useRef } from 'react';
import { Layout, Card, Typography, Steps, Row, Col, Badge, Button, Input, Modal, message, Tag, Space, Divider, Result, DatePicker, Empty, Avatar, Alert } from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
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

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const getAvatar = (candidate: any) => {
  if (!candidate) return '';
  const url = candidate.avatarUrl || candidate.avatar_url;
  if (url) return url;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candidate.name)}`;
};

const CertificatePrint = ({ candidate }: { candidate: any }) => {
  const appId = candidate.id.slice(0, 8).toUpperCase();
  const approvedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="certificate-print-area" style={{
      width: 794, minHeight: 560, background: 'white', position: 'relative',
      fontFamily: '"Times New Roman", Times, serif', boxSizing: 'border-box',
    }}>
      {/* Outer border */}
      <div style={{ position: 'absolute', inset: 16, border: '3px solid #c1f11d', borderRadius: 4, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 22, border: '1px solid #3dedf1', borderRadius: 2, pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ padding: '48px 72px', textAlign: 'center' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#c1f11d,#3dedf1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 22, flexShrink: 0 }}>N</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#c1f11d', fontFamily: "'Raleway', sans-serif", letterSpacing: 1 }}>inVision U</div>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Raleway', sans-serif", letterSpacing: 2 }}>SCHOLARSHIP PROGRAM · KAZAKHSTAN</div>
          </div>
        </div>

        <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg,#c1f11d,#3dedf1)', margin: '16px auto' }} />

        <div style={{ fontSize: 13, letterSpacing: 4, color: '#64748B', textTransform: 'uppercase', marginBottom: 18, fontFamily: "'Raleway', sans-serif" }}>
          This is to certify that
        </div>

        <div style={{ fontSize: 38, fontWeight: 700, color: '#1E293B', marginBottom: 12, fontFamily: '"Times New Roman", serif', letterSpacing: 1 }}>
          {candidate.name}
        </div>

        <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 24px', fontFamily: "'Raleway', sans-serif" }}>
          has successfully completed the <strong>inVision U Selection Process</strong> and is officially
          confirmed as eligible for the next stage — the <strong>Offline Selection</strong>.
        </div>

        <div style={{ width: 80, height: 1, background: '#E2E8F0', margin: '0 auto 24px' }} />

        {/* Details row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Raleway', sans-serif" }}>Application ID</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#c1f11d', fontFamily: "'Raleway', sans-serif", letterSpacing: 2 }}>#{appId}</div>
          </div>
          <div style={{ width: 1, background: '#E2E8F0' }} />
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Raleway', sans-serif" }}>Date of Approval</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', fontFamily: "'Raleway', sans-serif" }}>{approvedDate}</div>
          </div>
          <div style={{ width: 1, background: '#E2E8F0' }} />
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Raleway', sans-serif" }}>Certificate No.</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', fontFamily: "'Raleway', sans-serif" }}>NVSU-{new Date().getFullYear()}-{appId}</div>
          </div>
        </div>

        {/* Signature */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 80 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 140, borderBottom: '1px solid #94A3B8', marginBottom: 6, height: 36 }} />
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Raleway', sans-serif" }}>Head of Admissions</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Raleway', sans-serif" }}>inVision U</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 140, borderBottom: '1px solid #94A3B8', marginBottom: 6, height: 36 }} />
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Raleway', sans-serif" }}>Program Director</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Raleway', sans-serif" }}>inVision U</div>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: '#CBD5E1', letterSpacing: 1, fontFamily: "'Raleway', sans-serif" }}>
          This certificate is digitally generated and verified by inVision U Admissions System
        </div>
      </div>
    </div>
  );
};

const StudentStatus = () => {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [activeCall, setActiveCall] = useState<any>(null); // Состояние для MiroTalk

  const email = localStorage.getItem('userEmail');

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

  const printCertificate = () => {
    window.print();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><LoadingOutlined style={{ fontSize: 40, color: '#c1f11d' }} /></div>;
  if (!candidate) return <Result status="404" title="Application not found" />;

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
    new: { label: 'Application Submitted', color: '#3B82F6', bg: '#EFF6FF', text: 'Your application has been received and is awaiting review.' },
    under_review: { label: 'Under Review', color: '#F59E0B', bg: '#FFFBEB', text: 'Our committee is currently reviewing your application and test results.' },
    interview: { label: 'Interview Stage', color: '#8B5CF6', bg: '#F5F3FF', text: 'Congratulations! You have been selected for an interview. Please schedule your slot below.' },
    arbitration: { label: 'Under Additional Review', color: '#EF4444', bg: '#FEF2F2', text: 'Your evaluation is undergoing an additional review by the committee.' },
    waitlisted: { label: 'Waitlisted', color: '#64748B', bg: '#F1F5F9', text: 'You have been placed on the waitlist. We will notify you if a spot opens up.' },
    accepted: { label: 'Accepted — Congratulations!', color: '#10B981', bg: '#F0FDF4', text: 'You have successfully passed all stages of the inVision U selection process!' },
    declined: { label: 'Application Not Accepted', color: '#EF4444', bg: '#FEF2F2', text: 'Unfortunately, your application was not successful at this stage. Thank you for applying.' },
  };
  const currentStatus = statusInfo[candidate.status] || statusInfo['new'];

  return (
    <Layout style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Content style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%', animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#1E293B', fontFamily: "'Raleway', sans-serif" }}>Portal inVision U</Title>
            <Text style={{ color: '#64748B' }}>Personal Account \u2022 {candidate.name}</Text>
          </div>
          <Button type="text" danger icon={<LogoutOutlined />} onClick={logout}>Sign Out</Button>
        </div>

        <Row gutter={[24, 24]}>
          <Col span={16}>
            {/* Status banner */}
            <div style={{ background: currentStatus.bg, border: `1px solid ${currentStatus.color}30`, borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: currentStatus.color, flexShrink: 0, boxShadow: `0 0 0 4px ${currentStatus.color}30` }} />
              <div>
                <Text strong style={{ color: currentStatus.color, fontSize: 15, display: 'block' }}>{currentStatus.label}</Text>
                <Text style={{ color: '#64748B', fontSize: 13 }}>{currentStatus.text}</Text>
              </div>
            </div>

            <Card variant="borderless" style={{ borderRadius: '20px', marginBottom: '24px', background: '#ffffff', border: '1px solid #E2E8F0' }}>
              <Steps
                current={getStatusStep()}
                items={[
                  { title: 'Application', icon: <FileTextOutlined /> },
                  { title: 'AI Screening', icon: candidate.status === 'new' ? <LoadingOutlined /> : <CheckCircleOutlined /> },
                  { title: 'Interview', icon: <ScheduleOutlined /> },
                  { title: 'Review', icon: <CheckCircleOutlined /> },
                  { title: 'Result', icon: <TrophyOutlined /> },
                ]}
              />
            </Card>

            {/* ACCEPTED: Congratulations + Certificate */}
            {candidate.status === 'accepted' && (
              <Card
                style={{ borderRadius: 20, marginBottom: 24, border: '2px solid #c1f11d', background: '#ffffff', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ padding: '28px 32px' }}>
                  <Space size={16} align="start">
                    <div style={{ width: 56, height: 56, background: '#c1f11d', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TrophyOutlined style={{ fontSize: 28, color: '#141414' }} />
                    </div>
                    <div>
                      <Title level={3} style={{ color: '#c1f11d', margin: 0, fontWeight: 800 }}>🎉 Congratulations, {candidate.name}!</Title>
                      <Text style={{ color: '#475569', fontSize: 15, display: 'block', marginTop: 6, lineHeight: 1.6 }}>
                        You have successfully passed all stages of the inVision U selection process.<br />
                        You are now eligible for the <strong>Offline Selection stage</strong>. Your digital certificate is ready.
                      </Text>
                    </div>
                  </Space>

                  <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<PrinterOutlined />}
                      style={{ background: '#c1f11d', borderColor: '#c1f11d', borderRadius: 12, height: 48, color: '#141414', fontWeight: 700 }}
                      onClick={() => setCertModalOpen(true)}
                    >
                      View Certificate
                    </Button>
                    <Button
                      size="large"
                      icon={<DownloadOutlined />}
                      style={{ borderRadius: 12, height: 48, borderColor: '#c1f11d', color: '#c1f11d' }}
                      onClick={() => { setCertModalOpen(true); setTimeout(() => window.print(), 400); }}
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* DECLINED */}
            {candidate.status === 'declined' && (
              <Alert
                title="Application Not Accepted"
                description="Thank you for your effort and time applying to inVision U. We encourage you to continue developing your skills and apply again in the future."
                type="error"
                showIcon
                style={{ borderRadius: 16, marginBottom: 24 }}
              />
            )}

            {candidate.status === 'interview' && !candidate.interviewTime && (
              <Card 
                style={{ borderRadius: '20px', marginBottom: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', background: '#ffffff' }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ background: '#f5f5f5', padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
                  <Title level={4} style={{ color: '#c1f11d', margin: 0 }}><CalendarOutlined /> Interview Scheduler</Title>
                </div>
                
                <Row>
                  <Col span={11} style={{ padding: '24px', borderRight: '1px solid #E2E8F0' }}>
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
                          if(date) fetchBookedSlots(date);
                        }}
                      />
                    </div>
                  </Col>
                  
                  <Col span={13} style={{ padding: '24px', background: '#f5f5f5' }}>
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
                        <Empty description="Select a date to see available time slots" />
                      </div>
                    )}

                    {selectedDate && selectedTime && (
                      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(193,241,29,0.1)', borderRadius: '16px', border: '1px solid rgba(193,241,29,0.3)' }}>
                         <Text strong style={{ color: '#c1f11d', display: 'block', marginBottom: '10px' }}>
                           Final check: {selectedDate.format('MMMM DD, YYYY')} at {selectedTime}
                         </Text>
                         <Button 
                           type="primary" 
                           block 
                           loading={isScheduling}
                           onClick={handleScheduleConfirm}
                           style={{ height: '45px', borderRadius: '10px', background: '#c1f11d', border: 'none', fontWeight: 'bold', color: '#141414' }}
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
              <Card style={{ borderRadius: '20px', marginBottom: '24px', border: '1px solid #E2E8F0', background: '#ffffff' }}>
                <Result
                  status="success"
                  title={<span style={{ color: '#c1f11d', fontWeight: 700 }}>Interview Confirmed!</span>}
                  subTitle={
                    <div style={{ color: '#475569' }}>
                      <Paragraph>We are waiting for you on <b>{candidate.interviewTime}</b>.</Paragraph>
                      <Paragraph>You can join the video call directly using the button below:</Paragraph>
                      
                      <Button 
                        type="primary" 
                        size="large" 
                        icon={<VideoCameraOutlined />} 
                        style={{ 
                          background: '#c1f11d', 
                          borderColor: '#c1f11d', 
                          color: '#141414', 
                          borderRadius: '12px', 
                          height: '50px', 
                          padding: '0 30px',
                          fontWeight: 'bold',
                          marginTop: '10px'
                        }}
                        onClick={() => setActiveCall(candidate)} // ОТКРЫВАЕТ МОДАЛКУ
                      >
                        Join Video Interview
                      </Button>
                    </div>
                  }
                  extra={<Button type="dashed" onClick={() => {
                    setCandidate({...candidate, interviewTime: null});
                    setSelectedDate(null);
                    setSelectedTime(null);
                  }} style={{ borderRadius: '8px' }}>Change Time</Button>}
                />
              </Card>
            )}

            <Card 
              title={<Space><CheckCircleOutlined style={{color: '#c1f11d'}}/> <span style={{color:'#1E293B'}}>AI Profile Analysis</span></Space>} 
              variant="borderless"
              style={{ borderRadius: '20px', background: '#ffffff', border: '1px solid #E2E8F0' }}
            >
              <Paragraph style={{ fontSize: '15px', color: '#64748B', lineHeight: '1.6' }}>
                {candidate.aiSummary || "Our neural network is currently evaluating your motivation essay and achievements."}
              </Paragraph>
              <Divider />
              <Row gutter={16}>
                <Col span={8}><Text style={{color:'#94A3B8'}}>GPA Status</Text><br/><Text strong style={{color:'#1E293B'}}>{candidate.gpa || 'N/A'}</Text></Col>
                <Col span={8}><Text style={{color:'#94A3B8'}}>Location Status</Text><br/><Tag color={candidate.isRural ? 'green' : 'blue'}>{candidate.isRural ? 'Rural Bonus' : 'Urban'}</Tag></Col>
                <Col span={8}><Text style={{color:'#94A3B8'}}>Verification</Text><br/><Text code style={{ fontSize: '11px', color: '#c1f11d' }}>v{candidate.aiModelVersion || '1.0.2'}-stable</Text></Col>
              </Row>
            </Card>
          </Col>

          <Col span={8}>
            <Card variant="borderless" style={{ borderRadius: '20px', textAlign: 'center', background: '#ffffff', border: '1px solid #E2E8F0' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <Avatar 
                  size={90} 
                  src={getAvatar(candidate)} 
                  style={{ 
                    border: '4px solid #1f1f1f', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    background: '#E0F2FE'
                  }} 
                />
                <Badge status="processing" style={{ position: 'absolute', bottom: '5px', right: '5px' }} />
              </div>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{candidate.name}</Title>
              <Text style={{ color: '#64748B' }}>{candidate.email}</Text>
              <Divider />
              <Button block icon={<LockOutlined />} onClick={() => setIsModalVisible(true)} style={{ borderRadius: '10px', height: '40px', background: '#f5f5f5', borderColor: '#E2E8F0', color: '#1E293B' }}>
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

        {/* ВИДЕОСВЯЗЬ */}
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

        {/* CERTIFICATE MODAL */}
        <Modal
          open={certModalOpen}
          onCancel={() => setCertModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setCertModalOpen(false)}>Close</Button>,
            <Button key="print" type="primary" icon={<PrinterOutlined />}
              style={{ background: '#10B981', borderColor: '#10B981' }}
              onClick={printCertificate}
            >Print / Save as PDF</Button>,
          ]}
          width={860}
          centered
          title={<Space><TrophyOutlined style={{ color: '#10B981' }} /> Selection Completion Certificate</Space>}
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
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          background: #f5f5f5;
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