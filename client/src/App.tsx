import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppHeader from './layout/AppHeader';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Settings from './pages/Settings';
import StudentForm from './pages/StudentForm';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/apply" element={<StudentForm />} />

        {/* Candidates has its own layout with AppHeader built-in */}
        <Route path="/candidates" element={<Candidates />} />

        {/* Other admin routes share a common layout */}
        <Route
          path="/*"
          element={
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
              <AppHeader />
              <main style={{ flex: 1, width: '100%', marginTop: '72px', display: 'flex', flexDirection: 'column' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
