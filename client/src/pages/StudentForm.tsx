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

  // НИЧЕГО не добавляем в essayText, просто закрываем блок
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

  const newEssay = currentEssay.trim()
    ? `${currentEssay.trim()}\n\n${additions}`
    : additions;

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

  
  // Функция для копирования пароля
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Password copied to clipboard!');
  };

  const onFinish = async (values: any) => {
  setSubmitting(true);

  try {
    // Сформировать массив ответов с вопросами
    const nudgeAnswersList = Object.entries(nudgeAnswers)
      .filter(([, v]) => v.trim())
      .map(([id, answer]) => {
        const q = nudgeQuestions.find(x => x.id === id);
        return {
          questionId: id,
          question: q?.question,
          type: q?.type,
          answer: answer.trim(),
        };
      });

    const applicationPayload = {
      ...values,
      achievements: achievements.filter(a => a.title),
      skills,
      nudgeAnswers: nudgeAnswersList,
    };

    // 1) для SJT
    localStorage.setItem('applicationData', JSON.stringify(applicationPayload));

    // 2) сохранить в базе (НО НЕ анализировать пока)
    await axios.post('http://localhost:5000/api/apply', applicationPayload);

    message.success('✅ Данные сохранены! Переходим к SJT тесту...');
    navigate('/sjt-test');
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <Card
        variant="borderless"
        style={{
          maxWidth: 860,
          margin: '0 auto',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #006CFF 0%, #00D8E6 100%)',
            borderRadius: '12px', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '20px'
          }}>N</div>
          <Title level={2} style={{ marginBottom: '8px' }}>Scholarship Application</Title>
          <Text type="secondary">Fill out the form so our AI can analyze your potential for nVision U</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} autoComplete="off">
          
          {/* Section: Profile Photo */}
          <Title level={5} style={{ marginBottom: 16, color: '#006CFF' }}>Profile Photo</Title>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <Form.Item 
              name="avatar" 
              valuePropName="fileList" 
              getValueFromEvent={normFile}
            >
              <Upload 
                listType="picture-circle" 
                maxCount={1} 
                beforeUpload={() => false}
                accept="image/*"
              >
                <div style={{ textAlign: 'center' }}>
                  <CameraOutlined style={{ fontSize: '24px', color: '#006CFF' }} />
                  <div style={{ marginTop: 8, fontSize: '12px' }}>Upload</div>
                </div>
              </Upload>
            </Form.Item>
          </div>

          <Divider />

          {/* Personal Info */}
          <Title level={5} style={{ marginBottom: 16, color: '#006CFF' }}>Personal Information</Title>
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
              <Form.Item name="university" label={<Text strong>University / School</Text>} rules={[{ required: true, message: 'Please enter your institution' }]}>
                <Input prefix={<BookOutlined style={{ color: '#bfbfbf' }} />} placeholder="SDU / IITU / AITU" style={{ height: '45px', borderRadius: '8px' }} />
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
            <Col span={8}>
              <Form.Item name="gpa" label={<Text strong>GPA</Text>}>
                <InputNumber min={0} max={4} step={0.1} placeholder="3.5" style={{ width: '100%', height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="yearOfStudy" label={<Text strong>Year of Study</Text>}>
                <Select placeholder="Select year" style={{ height: '45px' }}>
                  <Select.Option value={1}>1st year</Select.Option>
                  <Select.Option value={2}>2nd year</Select.Option>
                  <Select.Option value={3}>3rd year</Select.Option>
                  <Select.Option value={4}>4th year</Select.Option>
                  <Select.Option value={0}>High School</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Skills */}
          <Title level={5} style={{ marginTop: 24, marginBottom: 16, color: '#006CFF' }}>Skills</Title>
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
          <Title level={5} style={{ marginTop: 24, marginBottom: 16, color: '#006CFF' }}>Achievements</Title>
          {achievements.map((a, i) => (
            <Card key={i} size="small" style={{ marginBottom: 12, borderRadius: '12px', background: '#F9FAFB' }}
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
          <Title level={5} style={{ marginTop: 8, marginBottom: 16, color: '#006CFF' }}>Motivation Essay</Title>
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
            background: 'linear-gradient(135deg, #F0F7FF 0%, #E8F4FD 100%)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '24px',
            border: '1px solid #D6E8FF',
          }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <BulbOutlined style={{ fontSize: 20, color: '#006CFF' }} />
                  <div>
                    <Text strong style={{ fontSize: 14, color: '#1F2937' }}>AI Application Assistant</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
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
                      essay: <EditOutlined style={{ color: '#006CFF' }} />,
                      achievements: <TrophyOutlined style={{ color: '#F59E0B' }} />,
                      skills: <StarOutlined style={{ color: '#10B981' }} />,
                      general: <RocketOutlined style={{ color: '#8B5CF6' }} />,
                    };
                    const priorityColor = q.priority === 'high' ? '#006CFF' : q.priority === 'medium' ? '#F59E0B' : '#9CA3AF';

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
  style={{ borderRadius: '10px', fontWeight: 600, background: '#006CFF' }}
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
              block
              loading={submitting}
              style={{
                height: '50px', borderRadius: '12px', background: '#006CFF',
                fontSize: '16px', fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0, 108, 255, 0.2)'
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