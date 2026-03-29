import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppHeader from './layout/AppHeader';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Settings from './pages/Settings';
import StudentForm from './pages/StudentForm';
import Scheduler from './pages/Scheduler';
import StudentStatus from './pages/StudentStatus'; // Твой личный кабинет
import Login from './pages/Login';                 // Твоя страница входа
import SJTTest from './pages/SJTTest';             // Ситуационный тест

function App() {
  return (
    <Router>
      <Routes>
        {/* --- ПУБЛИЧНЫЕ РОУТЫ ДЛЯ КАНДИДАТОВ --- */}
        
        {/* Подача заявки */}
        <Route path="/apply" element={<StudentForm />} />
        
        {/* Вход в личный кабинет */}
        <Route path="/login" element={<Login />} />
        
        {/* Страница статуса (Личный кабинет) */}
        <Route path="/status" element={<StudentStatus />} />

        {/* Ситуационный тест (SJT) */}
        <Route path="/test" element={<SJTTest />} />

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
  );
}

export default App;