import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider, useTheme } from './i18n/ThemeContext';
import AppHeader from './layout/AppHeader';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Settings from './pages/Settings';
import StudentForm from './pages/StudentForm';
import Scheduler from './pages/Scheduler';
import StudentStatus from './pages/StudentStatus';
import Login from './pages/Login';
import SJTTest from './pages/SJTTest';
import PersonalityTest from './pages/PersonalityTest';
import TeamSimulation from './pages/TeamSimulation';
import ReviewPage from './pages/ReviewPage';
import Reviews from './pages/Reviews';
import Landing from './pages/Landing';

const AppInner = () => {
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#16a34a',
          colorLink: '#16a34a',
          fontFamily: "'Raleway', Arial, sans-serif",
          borderRadius: 12,
          colorBgContainer: isDark ? '#1e293b' : '#ffffff',
          colorBgElevated: isDark ? '#1e293b' : '#ffffff',
          colorText: isDark ? '#f1f5f9' : undefined,
        },
        components: {
          Steps: {
            colorPrimary: '#16a34a',
            colorTextDescription: '#94A3B8',
          },
          Button: {
            colorPrimary: '#16a34a',
            colorPrimaryHover: '#15803d',
            primaryColor: '#ffffff',
          },
          Menu: {
            colorPrimary: '#16a34a',
          },
        },
      }}
    >
    <Router>
      <Routes>
        {/* Public routes */}
        
        <Route path="/apply" element={<StudentForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/status" element={<StudentStatus />} />
        <Route path="/personality-test" element={<PersonalityTest />} />
        <Route path="/test" element={<SJTTest />} />
        <Route path="/simulation" element={<TeamSimulation />} />

        {/* Admin panel routes */}
        <Route
          path="/admin/*"
          element={
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
              <AppHeader />
              <main style={{ flex: 1, width: '100%', marginTop: '72px', display: 'flex', flexDirection: 'column' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/candidates" element={<Candidates />} />
                  <Route path="/review/:id" element={<ReviewPage />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/scheduler" element={<Scheduler />} />
                </Routes>
              </main>
            </div>
          }
        />

        {/* Landing page */}
        <Route path="/" element={<Landing />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;