import multer from 'multer';
import path from 'path';

// Используем process.cwd(), чтобы путь всегда считался от корня папки /server
// Это гарантирует, что папка 'uploads' будет находиться там же, где ее ищет index.ts
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const rootDir = process.cwd();
    const uploadPath = path.join(rootDir, 'uploads');
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Чистим имя файла от пробелов, чтобы ссылки в браузере не бились
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanFileName = file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix + '-' + cleanFileName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB макс
  fileFilter: (_req, file, cb) => {
    // Список разрешенных расширений
    const allowed = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Documents (PDF, DOCX) and Images (JPG, PNG) are allowed') as any);
    }
  },
});