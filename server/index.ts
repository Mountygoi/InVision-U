import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Имитация базы данных
let candidates = [
  { 
    id: '1', 
    name: 'Aisha Kanatova', 
    university: 'Korkyt Ata University',
    region: 'Qyzylorda', 
    city: 'Qyzylorda',
    isRural: true, 
    experience: ['volunteering', 'olympiad'], 
    skills: ['Python', 'Leadership'], 
    status: 'new',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
    competencies: {
        leadership: 88,
        motivation: 92,
        technicalPotential: 70,
        creativity: 65,
        empathy: 95,
        socialImpact: 90
    }
  },
  { 
    id: '2', 
    name: 'Nurlan Saduakas', 
    university: 'IITU',
    region: 'Almaty', 
    city: 'Almaty',
    isRural: false, 
    experience: ['project'], 
    skills: ['React', 'TypeScript'], 
    status: 'interview',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nurlan',
    competencies: {
        leadership: 60,
        motivation: 75,
        technicalPotential: 95,
        creativity: 80,
        empathy: 70,
        socialImpact: 50
    }
  },
];

// 1. Получение всех кандидатов
app.get('/api/candidates', (req, res) => {
  res.json(candidates);
});

// 2. Статистика для Dashboard
app.get('/api/stats', (req, res) => {
  const stats = {
    total: candidates.length,
    new: candidates.filter(c => c.status === 'new').length,
    interview: candidates.filter(c => c.status === 'interview').length,
    rural: candidates.filter(c => c.isRural).length
  };
  res.json(stats);
});

// 3. Регистрация ученика (POST)
app.post('/api/apply', (req, res) => {
  const { name, city, university } = req.body;
  
  const newCandidate = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    city,
    university: university || 'Not Specified',
    region: city, // В прототипе приравниваем
    isRural: city === 'Qyzylorda' || city === 'Atyrau', // Авто-определение бонуса
    experience: [],
    skills: [],
    status: 'new',
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    // Генерируем "результаты анализа ИИ"
    competencies: {
        leadership: Math.floor(Math.random() * 40) + 60,
        motivation: Math.floor(Math.random() * 40) + 60,
        technicalPotential: Math.floor(Math.random() * 40) + 50,
        creativity: Math.floor(Math.random() * 40) + 50,
        empathy: Math.floor(Math.random() * 40) + 60,
        socialImpact: Math.floor(Math.random() * 40) + 60
    }
  };
  
  candidates.push(newCandidate);
  console.log(`✅ New student registered: ${name}`);
  res.status(201).json(newCandidate);
});

// 4. Обновление статуса (PATCH)
app.patch('/api/candidates/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  candidates = candidates.map(c => 
    c.id === id ? { ...c, status } : c
  );
  
  res.json({ message: 'Status updated successfully' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`
  🚀 Server is running!
  📡 API Base: http://localhost:${PORT}/api
  👥 Candidates: http://localhost:${PORT}/api/candidates
  📊 Stats: http://localhost:${PORT}/api/stats
  `);
});