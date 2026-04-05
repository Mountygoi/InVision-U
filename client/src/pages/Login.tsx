import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Layout } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import { API } from '../config';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      // Ищем кандидата по email
      const res = await axios.get(`${API}/candidates?search=${values.email}`);
      const user = res.data.find((c: { email: string; password: string }) => c.email === values.email);

      if (user && user.password === values.password) {
        message.success(t('welcomeMsg'));
        localStorage.setItem('userEmail', values.email);
        navigate('/status');
      } else {
        message.error(t('invalidCredentials'));
      }
    } catch (err) {
      message.error(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: isDark ? 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(160deg, #fafafa 0%, #ecfdf5 100%)' }}>
      <div style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 440, 
          borderRadius: 24, 
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.3)' : '0 24px 64px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
          padding: '28px 24px',
          background: isDark ? '#1e293b' : '#ffffff',
          border: 'none',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: '48px', height: '48px',
            background: '#16a34a',
            borderRadius: '14px', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontWeight: 'bold', fontSize: '20px',
            fontFamily: "'Raleway', sans-serif",
            boxShadow: '0 4px 20px rgba(22, 163, 74, 0.3)',
          }}>iU</div>
          <Title level={3} style={{ margin: '0 0 4px', color: isDark ? '#f1f5f9' : '#1E293B', fontFamily: "'Raleway', sans-serif" }}>{t('candidateLogin')}</Title>
          <Text style={{ color: isDark ? '#94a3b8' : '#64748B', fontSize: 14 }}>{t('loginSubtitle')}</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item 
            name="email" 
            rules={[{ required: true, type: 'email', message: t('emailRequired') }]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#94A3B8' }} />} 
              placeholder={t('emailPlaceholder')} 
              style={{ 
                background: isDark ? '#334155' : '#f8f9fa', 
                border: `1px solid ${isDark ? '#475569' : '#E2E8F0'}`, 
                borderRadius: 12,
                color: isDark ? '#f1f5f9' : '#1E293B',
                height: 50,
              }}
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[{ required: true, message: t('passwordRequired') }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#94A3B8' }} />} 
              placeholder={t('passwordPlaceholder')}
              style={{ 
                background: isDark ? '#334155' : '#f8f9fa', 
                border: `1px solid ${isDark ? '#475569' : '#E2E8F0'}`, 
                borderRadius: 12,
                color: isDark ? '#f1f5f9' : '#1E293B',
                height: 50,
              }}
            />
          </Form.Item>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading}
            icon={<ArrowRightOutlined />}
            style={{ 
              height: 50, 
              borderRadius: 14, 
              background: '#16a34a', 
              color: '#141414',
              border: 'none',
              marginTop: 12,
              fontWeight: 700,
              fontFamily: "'Raleway', sans-serif",
              fontSize: '15px',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 16px rgba(22, 163, 74, 0.3)',
            }}
          >
            {t('signIn')}
          </Button>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Text style={{ color: isDark ? '#64748b' : '#94A3B8', fontSize: 13 }}>{t('noAccountYet')}</Text>
          <Button type="link" onClick={() => navigate('/apply')} style={{ padding: 0, color: '#15803d', fontWeight: 600, fontSize: 13 }}>{t('applyNow')}</Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Button size="small" type="text" onClick={() => navigate('/')} style={{ color: '#64748B', fontSize: 12 }}>
            <HomeOutlined />
          </Button>
          <Button size="small" type="text" onClick={toggleTheme} style={{ color: '#64748B', fontSize: 12 }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </Button>
          <Button size="small" type="text" onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{ color: '#64748B', fontSize: 12 }}>
            {lang === 'ru' ? '🇰🇿 Қазақша' : '🇷🇺 Русский'}
          </Button>
        </div>
      </Card>
      </div>
    </Layout>
  );
};

export default Login;