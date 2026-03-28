import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ScoringProvider } from './context/ScoringContext';
import AppHeader from './layout/AppHeader';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Settings from './pages/Settings';
import StudentForm from './pages/StudentForm';

const Scheduler = () => (
  <div style={{ padding: '40px' }}>
    <h1>Interview Scheduler (Coming Soon)</h1>
  </div>
);

function App() {
  return (
    <ScoringProvider>
      <Router>
        <Routes>
          {/* Публичный маршрут */}
          <Route path="/apply" element={<StudentForm />} />

          {/* Приватные маршруты */}
          <Route
            path="/*"
            element={
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', // Элементы (Хедер и Мейн) идут друг за другом вниз
                minHeight: '100vh',
                width: '100%' 
              }}>
                <AppHeader />
                <main style={{ 
                  flex: 1, 
                  width: '100%', 
                  marginTop: '72px', // Высота хедера, чтобы контент не залезал под него
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/candidates" element={<Candidates />} />
                    <Route path="/scheduler" element={<Scheduler />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </Router>
    </ScoringProvider>
  );
}

export default App;