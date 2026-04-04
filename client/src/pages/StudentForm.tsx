import { useState } from 'react';
import { Form, Input, Button, Upload, Select, message, Card, Typography, Row, Col, InputNumber, Space, Tag, Modal, Divider, Alert, Spin } from 'antd';
import {
  UploadOutlined, UserOutlined, BookOutlined, EnvironmentOutlined,
  PlusOutlined, DeleteOutlined, MailOutlined, PhoneOutlined,
  CameraOutlined, BulbOutlined,
  RocketOutlined, StarOutlined, EditOutlined, TrophyOutlined
} from '@ant-design/icons';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ФУНКЦИЯ-ПОМОЩНИК: Чтобы Ant Design корректно забирал файл из компонента Upload
const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

interface AchievementEntry {
  type: 'olympiad' | 'volunteering' | 'project' | 'award';
  title: string;
  description: string;
  year: number | null;
  level?: string;
}

const StudentForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeQuestions, setNudgeQuestions] = useState<{ id: string; type: string; question: string; hint: string; priority: string }[]>([]);
  const [nudgeAnswers, setNudgeAnswers] = useState<Record<string, string>>({});
  const [nudgeStrength, setNudgeStrength] = useState<string>('');
  const [nudgeEncouragement, setNudgeEncouragement] = useState('');
  const [nudgeVisible, setNudgeVisible] = useState(false);

  const handleGetAIFeedback = async () => {
    const values = form.getFieldsValue();
    const essayText = values.essayText?.trim() || '';
    const hasContent = essayText || achievements.length > 0 || skills.length > 0;

    if (!hasContent) {
      message.warning('Сначала добавьте контент — эссе, достижения или навыки — чтобы AI мог дать обратную связь.');
      return;
    }

    setNudgeLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/nudge', {
        essayText,
        achievements: achievements.filter(a => a.title),
        skills,
        name: values.name || '',
        city: values.city || '',
      });
      setNudgeQuestions(res.data.questions || []);
      setNudgeAnswers({});
      setNudgeStrength(res.data.overallStrength || 'moderate');
      setNudgeEncouragement(res.data.encouragement || '');
      setNudgeVisible(true);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Не удалось получить обратную связь от AI';
      message.error(errMsg);
    } finally {
      setNudgeLoading(false);
    }
  };

  const handleSaveAnswers = () => {
    const answered = Object.entries(nudgeAnswers).filter(([, v]) => v.trim());
    if (answered.length === 0) {
      message.info('Вы не ответили ни на один вопрос. Пропускаем.');
      setNudgeVisible(false);
      return;
    }
    setNudgeVisible(false);
    message.success(`${answered.length} ответов сохранено!`);
  };

  const handleApplyAnswers = () => {
    const answered = Object.entries(nudgeAnswers).filter(([, v]) => v.trim());
    if (answered.length === 0) {
      message.info('Вы не ответили ни на один вопрос. Пропускаем.');
      setNudgeVisible(false);
      return;
    }
    const currentEssay = form.getFieldValue('essayText') || '';
    const additions = answered.map(([qId, answer]) => {
      const q = nudgeQuestions.find(nq => nq.id === qId);
      return `**${q?.question}**\n${answer.trim()}`;
    }).join('\n\n');
    const newEssay = currentEssay.trim() ? `${currentEssay.trim()}\n\n${additions}` : additions;
    form.setFieldValue('essayText', newEssay);
    setNudgeVisible(false);
    message.success(`${answered.length} ответов добавлено в эссе!`);
  };

  const addAchievement = () => {
    setAchievements([...achievements, { type: 'project', title: '', description: '', year: null }]);
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const updateAchievement = (index: number, field: string, value: any) => {
    const updated = [...achievements];
    (updated[index] as any)[field] = value;
    setAchievements(updated);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const nudgeAnswersList = Object.entries(nudgeAnswers)
        .filter(([, v]) => v.trim())
        .map(([id, answer]) => {
          const q = nudgeQuestions.find(x => x.id === id);
          return { questionId: id, question: q?.question, type: q?.type, answer: answer.trim() };
        });

      const formData = new FormData();
      formData.append('name', values.name || '');
      formData.append('email', values.email || '');
      formData.append('phone', values.phone || '');
      formData.append('school', values.school || '');
      formData.append('city', values.city || '');
      formData.append('contactMethod', values.contactMethod || '');
      formData.append('contactHandle', values.contactHandle || '');
      
      // Новые академические данные
      if (values.ielts != null) formData.append('ielts', String(values.ielts));
      if (values.unt != null) formData.append('unt', String(values.unt));
      formData.append('videoUrl', values.videoUrl || '');

      formData.append('essayText', values.essayText || '');
      formData.append('achievements', JSON.stringify(achievements.filter(a => a.title)));
      formData.append('skills', JSON.stringify(skills));
      
      if (nudgeAnswersList.length > 0) {
        formData.append('nudgeAnswers', JSON.stringify(nudgeAnswersList));
      }

      const avatarList = values.avatar;
      if (avatarList?.length > 0 && avatarList[0].originFileObj) {
        formData.append('avatar', avatarList[0].originFileObj);
      }
      const essayFileList = values.essayFile;
      if (essayFileList?.length > 0 && essayFileList[0].originFileObj) {
        formData.append('essay', essayFileList[0].originFileObj);
      }
      
      // Новые сертификаты PDF
      if (values.ieltsFile?.[0]?.originFileObj) {
        formData.append('ielts_cert', values.ieltsFile[0].originFileObj);
      }
      if (values.untFile?.[0]?.originFileObj) {
        formData.append('unt_cert', values.untFile[0].originFileObj);
      }

      const res = await axios.post('http://localhost:5000/api/apply', formData);
      const { id: candidateId, tempPassword } = res.data;

      localStorage.setItem('candidateId', candidateId);
      localStorage.setItem('tempPassword', tempPassword);
      localStorage.setItem('userEmail', values.email || '');
      localStorage.setItem('candidateName', values.name || '');

      message.success('Данные сохранены! Переходим к тесту личности...');
      navigate(`/personality-test?candidateId=${candidateId}`);
    } catch (err) {
      console.error('Application submit error:', err);
      message.error('Ошибка сохранения заявки. Попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      padding: '60px 20px',
      background: 'linear-gradient(160deg, #fafafa 0%, #f0f4e8 100%)',
      minHeight: '100vh',
      fontFamily: "'Raleway', sans-serif"
    }}>
      <Card
        variant="borderless"
        style={{
          maxWidth: 860,
          margin: '0 auto',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
          background: '#ffffff',
          border: 'none',
          animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: '#c1f11d',
            borderRadius: '14px', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#141414', fontWeight: 'bold', fontSize: '18px',
            fontFamily: "'Raleway', sans-serif",
            boxShadow: '0 4px 20px rgba(193, 241, 29, 0.3)',
          }}>iU</div>
          <Title level={2} style={{ marginBottom: '8px', color: '#1E293B', fontFamily: "'Raleway', sans-serif" }}>Scholarship Application</Title>
          <Text style={{ color: '#64748B' }}>Fill out the form so our AI can analyze your potential for inVision U</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} autoComplete="off">
          
          <Title level={5} style={{ marginBottom: 16, color: '#4d7c0f', fontFamily: "'Raleway', sans-serif" }}>Profile Photo</Title>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <Form.Item name="avatar" valuePropName="fileList" getValueFromEvent={normFile}>
              <Upload listType="picture-circle" maxCount={1} beforeUpload={() => false} accept="image/*">
                <div style={{ textAlign: 'center' }}>
                  <CameraOutlined style={{ fontSize: '24px', color: '#c1f11d' }} />
                  <div style={{ marginTop: 8, fontSize: '12px' }}>Upload</div>
                </div>
              </Upload>
            </Form.Item>
          </div>

          <Divider />

          <Title level={5} style={{ marginBottom: 16, color: '#4d7c0f', fontFamily: "'Raleway', sans-serif" }}>Personal Information</Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="name" label={<Text strong>Full Name</Text>} rules={[{ required: true, message: 'Please enter your full name' }]}>
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Aisha Kanatova" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label={<Text strong>Email</Text>} rules={[{ type: 'email', required: true, message: 'Please enter a valid email' }]}>
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="aisha@example.com" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="phone" label={<Text strong>Phone</Text>} rules={[{ required: true, message: 'Phone is required for status tracking' }]}>
                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="+7 701 123 4567" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="school" label={<Text strong>School</Text>} rules={[{ required: true, message: 'Please select your school' }]}>
                <Select
                  showSearch
                  placeholder="Select your school"
                  optionFilterProp="label"
                  style={{ height: '45px' }}
                  suffixIcon={<BookOutlined style={{ color: '#bfbfbf' }} />}
                  options={[
                    { label: 'НИШ ФМН Алматы', value: 'НИШ ФМН Алматы' },
                    { label: 'НИШ ФМН Астана', value: 'НИШ ФМН Астана' },
                    { label: 'НИШ ХБН Алматы', value: 'НИШ ХБН Алматы' },
                    { label: 'НИШ ХБН Астана', value: 'НИШ ХБН Астана' },
                    { label: 'НИШ ФМН Шымкент', value: 'НИШ ФМН Шымкент' },
                    { label: 'НИШ ФМН Караганда', value: 'НИШ ФМН Караганда' },
                    { label: 'НИШ ФМН Актобе', value: 'НИШ ФМН Актобе' },
                    { label: 'НИШ ФМН Атырау', value: 'НИШ ФМН Атырау' },
                    { label: 'НИШ ФМН Кызылорда', value: 'НИШ ФМН Кызылорда' },
                    { label: 'НИШ ФМН Тараз', value: 'НИШ ФМН Тараз' },
                    { label: 'НИШ ФМН Уральск', value: 'НИШ ФМН Уральск' },
                    { label: 'НИШ ФМН Актау', value: 'НИШ ФМН Актау' },
                    { label: 'НИШ ФМН Костанай', value: 'НИШ ФМН Костанай' },
                    { label: 'НИШ ФМН Павлодар', value: 'НИШ ФМН Павлодар' },
                    { label: 'НИШ ФМН Петропавловск', value: 'НИШ ФМН Петропавловск' },
                    { label: 'НИШ ФМН Семей', value: 'НИШ ФМН Семей' },
                    { label: 'НИШ ФМН Талдыкорган', value: 'НИШ ФМН Талдыкорган' },
                    { label: 'НИШ ФМН Туркестан', value: 'НИШ ФМН Туркестан' },
                    { label: 'НИШ ФМН Усть-Каменогорск', value: 'НИШ ФМН Усть-Каменогорск' },
                    { label: 'НИШ ХБН Караганда', value: 'НИШ ХБН Караганда' },
                    { label: 'НИШ ХБН Шымкент', value: 'НИШ ХБН Шымкент' },
                    { label: 'НИШ ХБН Актобе', value: 'НИШ ХБН Актобе' },
                    { label: 'БИЛ Алматы', value: 'БИЛ Алматы' },
                    { label: 'БИЛ Астана', value: 'БИЛ Астана' },
                    { label: 'БИЛ Шымкент', value: 'БИЛ Шымкент' },
                    { label: 'БИЛ Караганда', value: 'БИЛ Караганда' },
                    { label: 'БИЛ Актобе', value: 'БИЛ Актобе' },
                    { label: 'БИЛ Атырау', value: 'БИЛ Атырау' },
                    { label: 'БИЛ Кызылорда', value: 'БИЛ Кызылорда' },
                    { label: 'БИЛ Тараз', value: 'БИЛ Тараз' },
                    { label: 'БИЛ Уральск', value: 'БИЛ Уральск' },
                    { label: 'БИЛ Актау', value: 'БИЛ Актау' },
                    { label: 'Гимназия №1 Алматы', value: 'Гимназия №1 Алматы' },
                    { label: 'Гимназия №1 Астана', value: 'Гимназия №1 Астана' },
                    { label: 'Лицей №1 Алматы', value: 'Лицей №1 Алматы' },
                    { label: 'Лицей №1 Астана', value: 'Лицей №1 Астана' },
                    { label: 'РФМШ Алматы', value: 'РФМШ Алматы' },
                    { label: 'Haileybury Almaty', value: 'Haileybury Almaty' },
                    { label: 'Haileybury Astana', value: 'Haileybury Astana' },
                    { label: 'QSI Almaty', value: 'QSI Almaty' },
                    { label: 'QSI Astana', value: 'QSI Astana' },
                    { label: 'Miras International School', value: 'Miras International School' },
                    { label: 'Другая школа', value: 'other' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="city" label={<Text strong>City / Region</Text>} rules={[{ required: true, message: 'Please select your city' }]}>
                <Select placeholder="Select your location" style={{ height: '45px' }} suffixIcon={<EnvironmentOutlined />}>
                  <Select.Option value="Almaty">Almaty</Select.Option>
                  <Select.Option value="Astana">Astana</Select.Option>
                  <Select.Option value="Shymkent">Shymkent</Select.Option>
                  <Select.Option value="Karaganda">Karaganda</Select.Option>
                  <Select.Option value="Qyzylorda">Qyzylorda (Rural Bonus)</Select.Option>
                  <Select.Option value="Atyrau">Atyrau (Rural Bonus)</Select.Option>
                  <Select.Option value="Turkistan">Turkistan (Rural Bonus)</Select.Option>
                  <Select.Option value="Aktau">Aktau (Rural Bonus)</Select.Option>
                  <Select.Option value="Kostanay">Kostanay (Rural Bonus)</Select.Option>
                  <Select.Option value="Taraz">Taraz (Rural Bonus)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="contactMethod" label={<Text strong>Preferred Contact Method</Text>} rules={[{ required: true, message: 'Please select a contact method' }]}>
                <Select placeholder="How should we contact you?" style={{ height: '45px' }}>
                  <Select.Option value="telegram">Telegram</Select.Option>
                  <Select.Option value="instagram">Instagram</Select.Option>
                  <Select.Option value="whatsapp">WhatsApp</Select.Option>
                  <Select.Option value="email">Email</Select.Option>
                  <Select.Option value="phone">Phone</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactHandle" label={<Text strong>Contact Handle</Text>} rules={[{ required: true, message: 'Please enter your contact handle' }]}>
                <Input placeholder="@username or phone number" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* IELTS & UNT SECTION */}
          <Title level={5} style={{ marginBottom: 16, color: '#4d7c0f' }}>Academic Credentials</Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="ielts" label={<Text strong>IELTS Score (6.5-9.0)</Text>}>
                <InputNumber min={0} max={9} step={0.5} placeholder="7.5" style={{ width: '100%', height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unt" label={<Text strong>ҰБТ / ЕНТ Score (80-140)</Text>}>
                <InputNumber min={0} max={140} placeholder="115" style={{ width: '100%', height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="ieltsFile" label={<Text strong>IELTS Certificate (PDF)</Text>} valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
                  <Button icon={<UploadOutlined />} style={{ width: '100%', borderRadius: '8px' }}>Upload IELTS PDF</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="untFile" label={<Text strong>ҰБТ / ЕНТ Certificate (PDF)</Text>} valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
                  <Button icon={<UploadOutlined />} style={{ width: '100%', borderRadius: '8px' }}>Upload UNT PDF</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* VIDEO PRESENTATION SECTION */}
          <Title level={5} style={{ marginBottom: 16, color: '#4d7c0f' }}>Video Presentation</Title>
          <Alert
            title="Better to lose strong than pass weak"
            description="Mandatory 1-minute video introduction. Link to Loom, YouTube, or Google Drive."
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: '12px' }}
          />
          <Form.Item 
  name="videoUrl" 
  label={<Text strong>Video Link (YouTube/Loom/Google Drive)</Text>}
  rules={[{ required: true, message: 'Video presentation is mandatory' }]}
>
  <Input 
    prefix={<CameraOutlined style={{ color: '#bfbfbf' }} />} 
    placeholder="https://..." 
    style={{ height: '45px', borderRadius: '8px' }} 
  />
</Form.Item>

          <Divider />

          {/* Skills */}
          <Title level={5} style={{ marginTop: 24, marginBottom: 16, color: '#4d7c0f' }}>Skills</Title>
          <div style={{ marginBottom: 16 }}>
            <Space wrap>
              {skills.map((skill, i) => (
                <Tag key={i} closable onClose={() => setSkills(skills.filter((_, idx) => idx !== i))} color="blue" style={{ padding: '4px 12px', fontSize: '13px' }}>
                  {skill}
                </Tag>
              ))}
            </Space>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onPressEnter={addSkill}
                placeholder="Type a skill and press Enter (e.g., Python, Leadership)"
                style={{ borderRadius: '8px', height: '40px' }}
              />
              <Button onClick={addSkill} type="dashed">Add</Button>
            </div>
          </div>

          {/* Achievements */}
          <Title level={5} style={{ marginTop: 24, marginBottom: 16, color: '#4d7c0f' }}>Achievements</Title>
          {achievements.map((a, i) => (
            <Card key={i} size="small" style={{ marginBottom: 12, borderRadius: '12px', background: '#F9FAFB', transition: 'box-shadow 0.2s ease', border: '1px solid #E2E8F0' }}
              extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeAchievement(i)} />}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Select value={a.type} onChange={v => updateAchievement(i, 'type', v)} style={{ width: '100%' }}>
                    <Select.Option value="olympiad">Olympiad</Select.Option>
                    <Select.Option value="volunteering">Volunteering</Select.Option>
                    <Select.Option value="project">Project</Select.Option>
                    <Select.Option value="award">Award</Select.Option>
                  </Select>
                </Col>
                <Col span={10}>
                  <Input placeholder="Title" value={a.title} onChange={e => updateAchievement(i, 'title', e.target.value)} />
                </Col>
                <Col span={4}>
                  <InputNumber placeholder="Year" value={a.year} onChange={v => updateAchievement(i, 'year', v)} style={{ width: '100%' }} />
                </Col>
                {a.type === 'olympiad' && (
                  <Col span={4}>
                    <Select placeholder="Level" value={a.level} onChange={v => updateAchievement(i, 'level', v)} style={{ width: '100%' }}>
                      <Select.Option value="national">National</Select.Option>
                      <Select.Option value="regional">Regional</Select.Option>
                      <Select.Option value="city">City</Select.Option>
                      <Select.Option value="school">School</Select.Option>
                    </Select>
                  </Col>
                )}
              </Row>
              <Input placeholder="Brief description" value={a.description} onChange={e => updateAchievement(i, 'description', e.target.value)} style={{ marginTop: 8 }} />
            </Card>
          ))}
          <Button type="dashed" onClick={addAchievement} icon={<PlusOutlined />} style={{ width: '100%', marginBottom: 24, borderRadius: '8px', height: '40px' }}>
            Add Achievement
          </Button>

          {/* Essay */}
          <Title level={5} style={{ marginTop: 8, marginBottom: 16, color: '#4d7c0f' }}>Motivation Essay</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Upload a PDF or write your essay directly. Our AI will evaluate your leadership potential, motivation, resilience, and more.
          </Text>

          <Form.Item 
            name="essayFile" 
            label={<Text strong>Upload Essay (PDF)</Text>}
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
              <Button icon={<UploadOutlined />} style={{ width: '100%', height: '45px', borderRadius: '8px', borderStyle: 'dashed' }}>
                Upload PDF
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item name="essayText" label={<Text strong>Or write your essay here</Text>}>
            <TextArea
              rows={8}
              placeholder="Tell us about yourself..."
              style={{ borderRadius: '8px', fontSize: '14px' }}
            />
          </Form.Item>

          {/* AI Nudge Button */}
          <div style={{
            background: 'rgba(193, 241, 29, 0.08)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '24px',
            border: '1px solid rgba(193, 241, 29, 0.2)',
          }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <BulbOutlined style={{ fontSize: 20, color: '#c1f11d' }} />
                  <div>
                    <Text strong style={{ fontSize: 14, color: '#1E293B' }}>AI Application Assistant</Text>
                    <br />
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      Get personalized tips to strengthen your application before submitting
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Button
                  type="primary"
                  ghost
                  icon={nudgeLoading ? undefined : <BulbOutlined />}
                  loading={nudgeLoading}
                  onClick={handleGetAIFeedback}
                  style={{ borderRadius: '10px', fontWeight: 600, height: '40px' }}
                >
                  {nudgeLoading ? 'Analyzing...' : 'Get AI Feedback'}
                </Button>
              </Col>
            </Row>

            {/* AI Questions */}
            {nudgeVisible && nudgeQuestions.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Divider style={{ margin: '16px 0 12px' }} />

                {/* Strength indicator */}
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                  <Tag
                    color={nudgeStrength === 'strong' ? 'green' : nudgeStrength === 'moderate' ? 'orange' : 'red'}
                    style={{ fontSize: 13, padding: '4px 16px', borderRadius: 20 }}
                  >
                    {nudgeStrength === 'strong' ? '💪 Strong Draft' : nudgeStrength === 'moderate' ? '📝 Good Start — answer questions below to improve!' : '🚀 Let us help you — answer these questions!'}
                  </Tag>
                </div>

                {/* Questions with answer fields */}
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {nudgeQuestions.map((q, i) => {
                    const iconMap: Record<string, any> = {
                      essay: <EditOutlined style={{ color: '#c1f11d' }} />,
                      achievements: <TrophyOutlined style={{ color: '#F59E0B' }} />,
                      skills: <StarOutlined style={{ color: '#10B981' }} />,
                      general: <RocketOutlined style={{ color: '#8B5CF6' }} />,
                    };
                    const priorityColor = q.priority === 'high' ? '#c1f11d' : q.priority === 'medium' ? '#F59E0B' : '#9CA3AF';

                    return (
                      <div key={q.id} style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        borderLeft: `4px solid ${priorityColor}`,
                      }}>
                        <Space align="start" style={{ marginBottom: 10 }}>
                          <div style={{ marginTop: 2 }}>{iconMap[q.type] || <BulbOutlined />}</div>
                          <div>
                            <Text strong style={{ fontSize: 14, color: '#1F2937', display: 'block' }}>
                              {i + 1}. {q.question}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {q.hint}
                            </Text>
                          </div>
                        </Space>
                        <TextArea
                          rows={2}
                          placeholder="Your answer (or skip)..."
                          value={nudgeAnswers[q.id] || ''}
                          onChange={e => setNudgeAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          style={{ borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
                        />
                      </div>
                    );
                  })}
                </Space>

                {/* Action buttons */}
                <Row justify="space-between" align="middle" style={{ marginTop: 16 }}>
                  <Col>
                    <Button type="text" size="small" onClick={() => setNudgeVisible(false)} style={{ color: '#9CA3AF' }}>
                      Skip all
                    </Button>
                  </Col>
                  <Col>
                  <Button
                    type="primary"
                    onClick={handleSaveAnswers}
                    icon={<EditOutlined />}
                    style={{ borderRadius: '10px', fontWeight: 600, background: '#c1f11d' }}
                  >
                    Save answers
                  </Button>
                  </Col>
                </Row>

                {/* Encouragement */}
                {nudgeEncouragement && (
                  <div style={{
                    marginTop: 12,
                    padding: '10px 16px',
                    background: '#F0FDF4',
                    borderRadius: '10px',
                    border: '1px solid #DCFCE7',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#166534', fontSize: 12 }}>
                      {nudgeEncouragement}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>

          <Form.Item style={{ marginTop: '30px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{
                height: '52px',
                borderRadius: '14px',
                background: '#c1f11d',
                color: '#141414',
                border: 'none',
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: "'Raleway', sans-serif",
                boxShadow: '0 4px 20px rgba(193, 241, 29, 0.3)',
              }}
            >
              {submitting ? 'Submitting ...' : 'Next: Situational Test'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StudentForm;