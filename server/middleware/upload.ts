import multer from 'multer';
import path from 'path';
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from '../ai/constants.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const rootDir = process.cwd();
    const uploadPath = path.join(rootDir, 'uploads');
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanFileName = file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix + '-' + cleanFileName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Documents (PDF, DOCX) and Images (JPG, PNG) are allowed'));
    }
  },
});