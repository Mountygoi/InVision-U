import { useState } from 'react';
import { Form, Input, Button, Upload, Select, message, Card, Typography, Row, Col, InputNumber, Space, Tag, Modal, Divider } from 'antd';
import { 
  UploadOutlined, UserOutlined, BookOutlined, EnvironmentOutlined, 
  PlusOutlined, DeleteOutlined, MailOutlined, PhoneOutlined, 
  CopyOutlined, CheckCircleFilled, CameraOutlined 
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
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('city', values.city);
      if (values.email) formData.append('email', values.email);
      if (values.phone) formData.append('phone', values.phone);
      if (values.university) formData.append('university', values.university);
      if (values.gpa) formData.append('gpa', values.gpa.toString());
      if (values.yearOfStudy) formData.append('yearOfStudy', values.yearOfStudy.toString());
      
      // Навыки и достижения
      formData.append('achievements', JSON.stringify(achievements.filter(a => a.title)));
      formData.append('skills', JSON.stringify(skills));

      // ДОБАВЛЕНО: Файл аватара
      const avatarFile = values.avatar?.[0]?.originFileObj;
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const hasEssayText = values.essayText?.trim();
      const hasEssayFile = values.essayFile?.[0]?.originFileObj;

      if (!hasEssayText && !hasEssayFile) {
        message.error('Please provide a motivation essay — either upload a PDF or write it directly.');
        setSubmitting(false);
        return;
      }

      if (hasEssayText) formData.append('essayText', values.essayText.trim());
      if (hasEssayFile) formData.append('essay', hasEssayFile);

      // ОТПРАВКА
      const response = await axios.post('http://localhost:5000/api/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log("ПОЛНЫЙ ОТВЕТ СЕРВЕРА:", response.data);
      const { tempPassword } = response.data;

      // МОДАЛЬНОЕ ОКНО С ПАРОЛЕМ
      Modal.confirm({
        title: <Title level={4}><CheckCircleFilled style={{ color: '#52c41a' }} /> Application Submitted!</Title>,
        icon: null,
        width: 500,
        content: (
          <div style={{ marginTop: '20px' }}>
            <Text>Your application has been received. We've generated a <b>temporary password</b> so you can track your status in the personal cabinet:</Text>
            
            <div style={{ 
              background: '#F0F7FF', 
              padding: '20px', 
              borderRadius: '12px', 
              textAlign: 'center', 
              margin: '20px 0',
              border: '2px dashed #006CFF',
              position: 'relative'
            }}>
              <Title level={2} style={{ margin: 0, color: '#006CFF', letterSpacing: '4px' }}>
                {tempPassword}
              </Title>
              <Button 
                type="link" 
                icon={<CopyOutlined />} 
                onClick={() => copyToClipboard(tempPassword)}
                style={{ marginTop: '8px' }}
              >
                Copy Password
              </Button>
            </div>
            
            <Text type="secondary" style={{ fontSize: '12px' }}>
              * Make sure to save this password. You can change it later in your dashboard settings.
            </Text>
          </div>
        ),
        okText: 'Go to My Status',
        cancelButtonProps: { style: { display: 'none' } }, 
        onOk: () => {
          localStorage.setItem('userEmail', values.email);
          navigate('/status');
        },
      });

    } catch (err) {
      console.error('Submit error:', err);
      message.error('Failed to submit application. Please make sure the backend is running.');
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

          <Form.Item style={{ marginTop: '30px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{
                height: '50px', borderRadius: '12px', background: '#006CFF',
                fontSize: '16px', fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0, 108, 255, 0.2)'
              }}
            >
              {submitting ? 'Submitting & Analyzing...' : 'Submit Application'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StudentForm;