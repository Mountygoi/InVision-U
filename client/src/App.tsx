import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import AppHeader from './layout/AppHeader';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Settings from './pages/Settings';
import StudentForm from './pages/StudentForm';
import Scheduler from './pages/Scheduler';
import StudentStatus from './pages/StudentStatus'; // Твой личный кабинет
import Login from './pages/Login';                 // Твоя страница входа
import SJTTest from './pages/SJTTest';             // Ситуационный тест
import PersonalityTest from './pages/PersonalityTest'; // Тест личности (40 вопросов)
import TeamSimulation from './pages/TeamSimulation'; // Командная симуляция
import ReviewPage from './pages/ReviewPage';          // Страница ревью (admin)
import Reviews from './pages/Reviews';               // Список кандидатов на проверке

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#c1f11d',
          colorLink: '#c1f11d',
          fontFamily: "'Raleway', Arial, sans-serif",
          borderRadius: 12,
          colorBgContainer: '#ffffff',
        },
        components: {
          Steps: {
            colorPrimary: '#c1f11d',
            colorTextDescription: '#94A3B8',
          },
          Button: {
            colorPrimary: '#c1f11d',
            colorPrimaryHover: '#d4f74d',
            primaryColor: '#141414',
          },
          Menu: {
            colorPrimary: '#c1f11d',
          },
        },
      }}
    >
    <Router>
      <Routes>
        {/* --- ПУБЛИЧНЫЕ РОУТЫ ДЛЯ КАНДИДАТОВ --- */}
        
        {/* Подача заявки */}
        <Route path="/apply" element={<StudentForm />} />
        
        {/* Вход в личный кабинет */}
        <Route path="/login" element={<Login />} />
        
        {/* Страница статуса (Личный кабинет) */}
        <Route path="/status" element={<StudentStatus />} />

        {/* Тест личности (40 вопросов) */}
        <Route path="/personality-test" element={<PersonalityTest />} />

        {/* Ситуационный тест (SJT) */}
        <Route path="/test" element={<SJTTest />} />

        {/* Командная симуляция */}
        <Route path="/simulation" element={<TeamSimulation />} />

        {/* --- РОУТЫ АДМИН ПАНЕЛИ (С префиксом /admin) --- */}
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

        {/* Редирект по умолчанию (если зашел на корень сайта) */}
        <Route path="/" element={<Navigate to="/apply" replace />} />
        
        {/* Обработка несуществующих страниц */}
        <Route path="*" element={<Navigate to="/apply" replace />} />
      </Routes>
    </Router>
    </ConfigProvider>
  );
}

export default App;