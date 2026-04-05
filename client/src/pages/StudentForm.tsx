import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Upload, Select, message, Card, Typography, Row, Col, InputNumber, Space, Tag, Divider, Alert, Modal } from 'antd';
import {
  UploadOutlined, UserOutlined, BookOutlined, EnvironmentOutlined,
  PlusOutlined, DeleteOutlined, MailOutlined, PhoneOutlined,
  CameraOutlined, BulbOutlined,
  RocketOutlined, StarOutlined, EditOutlined, TrophyOutlined
} from '@ant-design/icons';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { API } from '../config';

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

// ===== All Kazakhstan cities =====

const KZ_CITIES = [
  // Cities of republican significance
  { label: 'Алматы', value: 'Almaty' },
  { label: 'Астана', value: 'Astana' },
  { label: 'Шымкент', value: 'Shymkent' },
  // Major city
  { label: 'Караганда', value: 'Karaganda' },
  // Regional capitals
  { label: 'Актобе', value: 'Aktobe' },
  { label: 'Атырау', value: 'Atyrau' },
  { label: 'Актау (Мангистау)', value: 'Aktau' },
  { label: 'Орал (Батыс Қазақстан)', value: 'Oral' },
  { label: 'Өскемен (Шығыс Қазақстан)', value: 'Oskemen' },
  { label: 'Павлодар', value: 'Pavlodar' },
  { label: 'Костанай', value: 'Kostanay' },
  { label: 'Петропавл (Солтүстік Қазақстан)', value: 'Petropavl' },
  { label: 'Кокшетау (Ақмола)', value: 'Kokshetau' },
  { label: 'Тараз (Жамбыл)', value: 'Taraz' },
  { label: 'Түркістан', value: 'Turkistan' },
  { label: 'Қызылорда', value: 'Qyzylorda' },
  { label: 'Талдықорган (Алматы облысы)', value: 'Taldykorgan' },
  { label: 'Жезказган (Ұлытау)', value: 'Zhezkazgan' },
  { label: 'Конаев (Алматы маңы)', value: 'Konaev' },
  { label: 'Семей (Абай облысы)', value: 'Semey' },
  // Other major/notable cities
  { label: 'Темиртау', value: 'Temirtau' },
  { label: 'Экибастуз', value: 'Ekibastuz' },
  { label: 'Рудный', value: 'Rudny' },
  { label: 'Жанаозен', value: 'Zhanaozen' },
  { label: 'Балхаш', value: 'Balkhash' },
  { label: 'Кентау', value: 'Kentau' },
  { label: 'Сатпаев', value: 'Satbayev' },
  { label: 'Степногорск', value: 'Stepnogorsk' },
  { label: 'Риддер', value: 'Ridder' },
  { label: 'Аксу', value: 'Aksu' },
  { label: 'Каскелен', value: 'Kaskelen' },
  { label: 'Талгар', value: 'Talgar' },
  { label: 'Есик', value: 'Esik' },
  { label: 'Капшагай', value: 'Kapshagay' },
  { label: 'Жаркент', value: 'Zharkent' },
  { label: 'Аягоз', value: 'Ayagoz' },
  { label: 'Шу', value: 'Shu' },
  { label: 'Аральск', value: 'Aralsk' },
  { label: 'Байконыр', value: 'Baikonur' },
  { label: 'Щучинск', value: 'Schuchinsk' },
  { label: 'Сарыагаш', value: 'Saryagash' },
  { label: 'Шахтинск', value: 'Shakhtinsk' },
  { label: 'Хромтау', value: 'Khromtau' },
  { label: 'Каратау', value: 'Karatau' },
  { label: 'Лисаковск', value: 'Lisakovsk' },
  { label: 'Житикара', value: 'Zhitikara' },
  { label: 'Форт-Шевченко', value: 'Fort-Shevchenko' },
].map(c => ({
  ...c,
  label: c.label,
}));

const StudentForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeQuestions, setNudgeQuestions] = useState<{ id: string; type: string; question: string; hint: string; priority: string }[]>([]);
  const [nudgeAnswers, setNudgeAnswers] = useState<Record<string, string>>({});
  const [nudgeEncouragement, setNudgeEncouragement] = useState('');
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [schoolOther, setSchoolOther] = useState(false);
  const [nudgeUsed, setNudgeUsed] = useState(false);
  const [showNudgePrompt, setShowNudgePrompt] = useState(false);

  const STORAGE_KEY = 'studentFormDraft';

  // Restore saved form data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft.fields) form.setFieldsValue(draft.fields);
      if (draft.achievements) setAchievements(draft.achievements);
      if (draft.skills) setSkills(draft.skills);
      if (draft.schoolOther) setSchoolOther(true);
    } catch { /* corrupted data — ignore */ }
  }, [form]);

  // Save form data to localStorage on every change
  const saveDraft = useCallback(() => {
    try {
      const fields = form.getFieldsValue();
      // Don't persist file uploads (can't serialize File objects)
      delete fields.avatar;
      delete fields.ieltsFile;
      delete fields.untFile;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        fields,
        achievements,
        skills,
        schoolOther,
      }));
    } catch { /* storage full — ignore */ }
  }, [form, achievements, skills, schoolOther]);

  // Auto-save when achievements/skills/schoolOther change
  useEffect(() => { saveDraft(); }, [saveDraft]);

  const handleGetAIFeedback = async () => {
    const values = form.getFieldsValue();
    const essayText = values.essayText?.trim() || '';
    const hasContent = essayText || achievements.length > 0 || skills.length > 0;

    if (!hasContent) {
      message.warning(t('addContentFirst'));
      return;
    }

    setNudgeUsed(true);
    setNudgeLoading(true);
    try {
      const res = await axios.post(`${API}/nudge`, {
        essayText,
        achievements: achievements.filter(a => a.title),
        skills,
        name: values.name || '',
        city: values.city || '',
      });
      setNudgeQuestions(res.data.questions || []);
      setNudgeAnswers({});
      setNudgeEncouragement(res.data.encouragement || '');
      setNudgeVisible(true);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || t('feedbackFailed');
      message.error(errMsg);
    } finally {
      setNudgeLoading(false);
    }
  };

  const handleSaveAnswers = () => {
    const answered = Object.entries(nudgeAnswers).filter(([, v]) => v.trim());
    if (answered.length === 0) {
      message.info(t('noAnswersSkip'));
      setNudgeVisible(false);
      return;
    }
    setNudgeVisible(false);
    message.success(t('answersSaved', { count: answered.length }));
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
    if (!nudgeUsed) {
      setShowNudgePrompt(true);
      return;
    }
    await submitForm(values);
  };

  const submitForm = async (values: any) => {
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
      // If school is "other", use custom value
      const schoolValue = values.school === 'other' ? (values.schoolCustom || 'Другая школа') : (values.school || '');
      formData.append('school', schoolValue);
      formData.append('city', values.city || '');
      formData.append('contactMethod', 'telegram');
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

      // Новые сертификаты PDF
      if (values.ieltsFile?.[0]?.originFileObj) {
        formData.append('ielts_cert', values.ieltsFile[0].originFileObj);
      }
      if (values.untFile?.[0]?.originFileObj) {
        formData.append('unt_cert', values.untFile[0].originFileObj);
      }

      const res = await axios.post(`${API}/apply`, formData);
      const { id: candidateId, tempPassword } = res.data;

      localStorage.setItem('candidateId', candidateId);
      localStorage.setItem('tempPassword', tempPassword);
      localStorage.setItem('userEmail', values.email || '');
      localStorage.setItem('candidateName', values.name || '');
      localStorage.removeItem(STORAGE_KEY);

      message.success(t('dataSaved'));
      navigate(`/personality-test?candidateId=${candidateId}`);
    } catch (err) {
      console.error('Application submit error:', err);
      message.error(t('saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div style={{
      padding: '60px 20px',
      background: isDark ? 'linear-gradient(160deg, #0f172a 0%, #1a2e1a 100%)' : 'linear-gradient(160deg, #fafafa 0%, #ecfdf5 100%)',
      minHeight: '100vh',
      fontFamily: "'Raleway', sans-serif"
    }}>
      <Card
        variant="borderless"
        style={{
          maxWidth: 860,
          margin: '0 auto',
          borderRadius: '24px',
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.3)' : '0 24px 64px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
          background: isDark ? '#1e293b' : '#ffffff',
          border: 'none',
          animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: '#16a34a',
            borderRadius: '14px', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontWeight: 'bold', fontSize: '18px',
            fontFamily: "'Raleway', sans-serif",
            boxShadow: '0 4px 20px rgba(22, 163, 74, 0.3)',
          }}>iU</div>
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 4 }}>
            <Button size="small" type="text" onClick={toggleTheme} style={{ color: '#64748B' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
            <Button size="small" type="text" onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{ color: '#64748B' }}>
              {lang === 'ru' ? '🇰🇿 Қазақша' : '🇷🇺 Русский'}
            </Button>
          </div>
          <Title level={2} style={{ marginBottom: '8px', color: isDark ? '#f1f5f9' : '#1E293B', fontFamily: "'Raleway', sans-serif" }}>{t('scholarshipApp')}</Title>
          <Text style={{ color: '#64748B' }}>{t('formSubtitle')}</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={saveDraft} requiredMark={false} autoComplete="off" scrollToFirstError onFinishFailed={() => message.error(t('fillAllFields'))}
          onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }}
        >
          
          <Title level={5} style={{ marginBottom: 16, color: isDark ? '#4ade80' : '#166534', fontFamily: "'Raleway', sans-serif" }}>{t('profilePhoto')}</Title>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <Form.Item name="avatar" valuePropName="fileList" getValueFromEvent={normFile}>
              <Upload listType="picture-circle" maxCount={1} beforeUpload={() => false} accept="image/*">
                <div style={{ textAlign: 'center' }}>
                  <CameraOutlined style={{ fontSize: '24px', color: '#16a34a' }} />
                  <div style={{ marginTop: 8, fontSize: '12px' }}>{t('upload')}</div>
                </div>
              </Upload>
            </Form.Item>
          </div>

          <Divider />

          <Title level={5} style={{ marginBottom: 16, color: isDark ? '#4ade80' : '#166534', fontFamily: "'Raleway', sans-serif" }}>{t('formPersonalInfo')}</Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="name" label={<Text strong>{t('formName')}</Text>} rules={[{ required: true, message: t('nameRequired') }]}>
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Aisha Kanatova" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label={<Text strong>{t('formEmail')}</Text>} rules={[{ type: 'email', required: true, message: t('emailInvalid') }]}>
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="aisha@example.com" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="phone" label={<Text strong>{t('formPhone')}</Text>} rules={[{ required: true, message: t('phoneRequired') }]}>
                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="+7 701 123 4567" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="school" label={<Text strong>{t('formSchool')}</Text>} rules={[{ required: true, message: t('schoolRequired') }]}>
                <Select
                  showSearch
                  placeholder={t('selectSchool')}
                  optionFilterProp="label"
                  style={{ height: '45px' }}
                  suffixIcon={<BookOutlined style={{ color: '#bfbfbf' }} />}
                  onChange={(v) => setSchoolOther(v === 'other')}
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
              {schoolOther && (
                <Form.Item name="schoolCustom" rules={[{ required: true, message: t('customSchoolRequired') }]}>
                  <Input placeholder={t('customSchool')} style={{ height: '45px', borderRadius: '8px' }} />
                </Form.Item>
              )}
            </Col>
            <Col span={8}>
              <Form.Item name="city" label={<Text strong>{t('formCity')}</Text>} rules={[{ required: true, message: t('cityRequired') }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('selectCity')}
                  style={{ height: '45px' }}
                  suffixIcon={<EnvironmentOutlined />}
                  options={KZ_CITIES}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="contactHandle" label={<Text strong>Telegram</Text>} rules={[{ required: true, message: t('contactHandleRequired') }]}>
                <Input prefix={<span style={{ color: '#bfbfbf' }}>@</span>} placeholder="username" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* IELTS & UNT SECTION */}
          <Title level={5} style={{ marginBottom: 16, color: isDark ? '#4ade80' : '#166534' }}>{t('academicCreds')}</Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="ielts" label={<Text strong>{t('ieltsScore')}</Text>}>
                <InputNumber min={0} max={9} step={0.5} placeholder="7.5" style={{ width: '100%', height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unt" label={<Text strong>{t('untScore')}</Text>}>
                <InputNumber min={0} max={140} placeholder="115" style={{ width: '100%', height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="ieltsFile" label={<Text strong>{t('ieltsCertPdf')}</Text>} valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
                  <Button icon={<UploadOutlined />} style={{ width: '100%', borderRadius: '8px' }}>{t('upload')} IELTS PDF</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="untFile" label={<Text strong>{t('untCertPdf')}</Text>} valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
                  <Button icon={<UploadOutlined />} style={{ width: '100%', borderRadius: '8px' }}>{t('upload')} UNT PDF</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* VIDEO PRESENTATION SECTION */}
          <Title level={5} style={{ marginBottom: 16, color: isDark ? '#4ade80' : '#166534' }}>{t('videoPresentation')}</Title>
          <Alert
            title={t('videoAlertTitle')}
            description={t('videoAlertDesc')}
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: '12px' }}
          />
          <Form.Item 
            name="videoUrl" 
            label={<Text strong>{t('videoLink')}</Text>}
            rules={[{ required: true, message: t('videoRequired') }]}
          >
            <Input 
              prefix={<CameraOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="https://..." 
              style={{ height: '45px', borderRadius: '8px' }} 
            />
          </Form.Item>

          <Divider />

          {/* Skills */}
          <Title level={5} style={{ marginTop: 24, marginBottom: 16, color: isDark ? '#4ade80' : '#166534' }}>{t('skills')}</Title>
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
                placeholder={t('skillPlaceholder')}
                style={{ borderRadius: '8px', height: '40px' }}
              />
              <Button onClick={addSkill} type="dashed">{t('addSkill')}</Button>
            </div>
          </div>

          {/* Achievements */}
          <Title level={5} style={{ marginTop: 24, marginBottom: 16, color: isDark ? '#4ade80' : '#166534' }}>{t('achievements')}</Title>
          {achievements.map((a, i) => (
            <Card key={i} size="small" style={{
              marginBottom: 12, borderRadius: '12px',
              background: isDark ? '#334155' : '#F9FAFB',
              transition: 'box-shadow 0.2s ease',
              border: isDark ? '1px solid #475569' : '1px solid #E2E8F0',
            }}
              extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeAchievement(i)} />}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Select value={a.type} onChange={v => updateAchievement(i, 'type', v)} style={{ width: '100%' }}>
                    <Select.Option value="olympiad">{t('olympiad')}</Select.Option>
                    <Select.Option value="volunteering">{t('volunteering')}</Select.Option>
                    <Select.Option value="project">{t('project')}</Select.Option>
                    <Select.Option value="award">{t('award')}</Select.Option>
                  </Select>
                </Col>
                <Col span={10}>
                  <Input placeholder={t('titlePlaceholder')} value={a.title} onChange={e => updateAchievement(i, 'title', e.target.value)} />
                </Col>
                <Col span={4}>
                  <InputNumber placeholder={t('yearPlaceholder')} value={a.year} onChange={v => updateAchievement(i, 'year', v)} style={{ width: '100%' }} />
                </Col>
                {a.type === 'olympiad' && (
                  <Col span={4}>
                    <Select placeholder={t('levelPlaceholder')} value={a.level} onChange={v => updateAchievement(i, 'level', v)} style={{ width: '100%' }}>
                      <Select.Option value="national">{t('national')}</Select.Option>
                      <Select.Option value="regional">{t('regional')}</Select.Option>
                      <Select.Option value="city">{t('cityLevel')}</Select.Option>
                      <Select.Option value="school">{t('schoolLevel')}</Select.Option>
                    </Select>
                  </Col>
                )}
              </Row>
              <Input placeholder={t('descPlaceholder')} value={a.description} onChange={e => updateAchievement(i, 'description', e.target.value)} style={{ marginTop: 8 }} />
            </Card>
          ))}
          <Button type="dashed" onClick={addAchievement} icon={<PlusOutlined />} style={{ width: '100%', marginBottom: 24, borderRadius: '8px', height: '40px' }}>
            {t('addAchievement')}
          </Button>

          {/* Essay */}
          <Title level={5} style={{ marginTop: 8, marginBottom: 16, color: isDark ? '#4ade80' : '#166534' }}>{t('motivationEssay')}</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            {t('essayDesc')}
          </Text>

          <Form.Item name="essayText" label={<Text strong>{t('writeEssay')}</Text>}>
            <TextArea
              rows={8}
              placeholder={t('tellAboutYourself')}
              style={{ borderRadius: '8px', fontSize: '14px' }}
            />
          </Form.Item>

          {/* AI Nudge Button */}
          <div style={{
            background: isDark ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.08)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '24px',
            border: '1px solid rgba(22, 163, 74, 0.2)',
          }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <BulbOutlined style={{ fontSize: 20, color: '#16a34a' }} />
                  <div>
                    <Text strong style={{ fontSize: 14, color: isDark ? '#e2e8f0' : '#1E293B' }}>{t('aiAssistantTitle')}</Text>
                    <br />
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      {t('aiAssistantDesc')}
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
                  {nudgeLoading ? t('analyzing') : t('getAiFeedback')}
                </Button>
              </Col>
            </Row>

            {/* AI Questions — only questions shown, no scores/strength visible to candidate */}
            {nudgeVisible && nudgeQuestions.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Divider style={{ margin: '16px 0 12px' }} />

                {/* Questions with answer fields */}
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {nudgeQuestions.map((q, i) => {
                    const iconMap: Record<string, any> = {
                      essay: <EditOutlined style={{ color: '#16a34a' }} />,
                      achievements: <TrophyOutlined style={{ color: '#F59E0B' }} />,
                      skills: <StarOutlined style={{ color: '#10B981' }} />,
                      general: <RocketOutlined style={{ color: '#8B5CF6' }} />,
                    };
                    const priorityColor = q.priority === 'high' ? '#16a34a' : q.priority === 'medium' ? '#F59E0B' : '#9CA3AF';

                    return (
                      <div key={q.id} style={{
                        background: isDark ? '#1e293b' : '#FFFFFF',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
                        borderLeft: `4px solid ${priorityColor}`,
                      }}>
                        <Space align="start" style={{ marginBottom: 10 }}>
                          <div style={{ marginTop: 2 }}>{iconMap[q.type] || <BulbOutlined />}</div>
                          <div>
                            <Text strong style={{ fontSize: 14, color: isDark ? '#e2e8f0' : '#1F2937', display: 'block' }}>
                              {i + 1}. {q.question}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {q.hint}
                            </Text>
                          </div>
                        </Space>
                        <TextArea
                          rows={2}
                          placeholder={t('yourAnswer')}
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
                      {t('skipAll')}
                    </Button>
                  </Col>
                  <Col>
                  <Button
                    type="primary"
                    onClick={handleSaveAnswers}
                    icon={<EditOutlined />}
                    style={{ borderRadius: '10px', fontWeight: 600, background: '#16a34a' }}
                  >
                    {t('saveAnswers')}
                  </Button>
                  </Col>
                </Row>

                {/* Encouragement */}
                {nudgeEncouragement && (
                  <div style={{
                    marginTop: 12,
                    padding: '10px 16px',
                    background: isDark ? 'rgba(22, 163, 74, 0.12)' : '#F0FDF4',
                    borderRadius: '10px',
                    border: isDark ? '1px solid rgba(22, 163, 74, 0.25)' : '1px solid #DCFCE7',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: isDark ? '#6ee7b7' : '#166534', fontSize: 12 }}>
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
                background: '#16a34a',
                color: '#141414',
                border: 'none',
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: "'Raleway', sans-serif",
                boxShadow: '0 4px 20px rgba(22, 163, 74, 0.3)',
              }}
            >
              {submitting ? t('submitting') : t('nextSJT')}
            </Button>
          </Form.Item>
        </Form>

        <Modal
          open={showNudgePrompt}
          onCancel={() => setShowNudgePrompt(false)}
          footer={null}
          centered
          width={420}
          closable={false}
          styles={{ mask: { backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.45)' } }}
        >
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <BulbOutlined style={{ fontSize: 24, color: '#16a34a' }} />
            </div>
            <Title level={5} style={{ margin: '0 0 8px', color: isDark ? '#e2e8f0' : '#1F2937' }}>
              {t('nudgePromptTitle') || 'Усильте свою заявку!'}
            </Title>
            <Text style={{ color: isDark ? '#94a3b8' : '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
              {t('nudgePromptDesc') || 'AI может дать персональные вопросы, ответы на которые покажут рецензентам ваши сильные стороны. Это займёт пару минут.'}
            </Text>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button
                block
                onClick={async () => {
                  setShowNudgePrompt(false);
                  setNudgeUsed(true);
                  try {
                    const values = await form.validateFields();
                    await submitForm(values);
                  } catch { /* validation failed */ }
                }}
                style={{ height: 44, borderRadius: 10, fontWeight: 600 }}
              >
                {t('nudgePromptSkip') || 'Пройти дальше'}
              </Button>
              <Button
                type="primary"
                block
                icon={<BulbOutlined />}
                onClick={() => {
                  setShowNudgePrompt(false);
                  handleGetAIFeedback();
                }}
                style={{ height: 44, borderRadius: 10, fontWeight: 600, background: '#16a34a' }}
              >
                {t('nudgePromptGet') || 'Получить AI отзыв'}
              </Button>
            </div>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default StudentForm;

