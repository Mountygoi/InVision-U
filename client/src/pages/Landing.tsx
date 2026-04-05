import { Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FileText, LogIn, Shield } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';
import logoImg from '../assets/icons/logo.png';

const { Text } = Typography;

const Landing = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
      fontFamily: "'Raleway', Arial, sans-serif",
      padding: '40px 20px',
    }}>
      {/* Theme toggle + Language switcher */}
      <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button
          type="text"
          size="small"
          onClick={toggleTheme}
          style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 16 }}
        >
          {isDark ? '☀️' : '🌙'}
        </Button>
        <Space size={4}>
          {(['ru', 'kz'] as const).map(l => (
            <Button
              key={l}
              type={lang === l ? 'primary' : 'text'}
              size="small"
              onClick={() => setLang(l)}
              style={{
                borderRadius: 8,
                fontWeight: lang === l ? 700 : 400,
                ...(lang === l ? {} : { color: isDark ? '#94a3b8' : '#64748b' }),
              }}
            >
              {l.toUpperCase()}
            </Button>
          ))}
        </Space>
      </div>

      <img
        src={logoImg}
        alt="inVision U"
        style={{ width: 180, height: 180, marginBottom: 32, borderRadius: 32, objectFit: 'contain' }}
      />

      <Text style={{
        fontSize: 18,
        color: isDark ? '#94a3b8' : '#475569',
        marginTop: 12,
        marginBottom: 48,
        textAlign: 'center',
        maxWidth: 480,
      }}>
        {t('landingSubtitle')}
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 340 }}>
        <Button
          type="primary"
          size="large"
          icon={<FileText size={18} />}
          onClick={() => navigate('/apply')}
          style={{
            height: 52,
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 16,
            background: '#16a34a',
            borderColor: '#16a34a',
          }}
          block
        >
          {t('landingApply')}
        </Button>

        <Button
          size="large"
          icon={<LogIn size={18} />}
          onClick={() => navigate('/login')}
          style={{
            height: 52,
            borderRadius: 14,
            fontWeight: 600,
            fontSize: 16,
            borderColor: isDark ? '#334155' : '#cbd5e1',
            color: isDark ? '#f1f5f9' : '#0f172a',
            background: isDark ? '#1e293b' : '#ffffff',
          }}
          block
        >
          {t('landingLogin')}
        </Button>

        <Button
          size="large"
          icon={<Shield size={18} />}
          onClick={() => navigate('/admin')}
          style={{
            height: 52,
            borderRadius: 14,
            fontWeight: 600,
            fontSize: 16,
            borderColor: isDark ? '#334155' : '#e2e8f0',
            color: isDark ? '#94a3b8' : '#64748b',
            background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.6)',
          }}
          block
        >
          {t('landingAdmin')}
        </Button>
      </div>
    </div>
  );
};

export default Landing;
