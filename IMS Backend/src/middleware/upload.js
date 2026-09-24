// IMS/server/src/middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаём папку uploads/cars если нет
const carsUploadDir = path.join(__dirname, '..', 'uploads', 'cars');
if (!fs.existsSync(carsUploadDir)) {
  fs.mkdirSync(carsUploadDir, { recursive: true });
}

// Настройка хранения для фото автомобилей
const carStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carsUploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `car-${unique}${path.extname(file.originalname)}`);
  }
});

// Фильтр только для изображений
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Только изображения: jpg, jpeg, png, webp, gif'));
};

// Экспортируем настроенный middleware
export const uploadCarPhotos = multer({
  storage: carStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// Экспортируем общий upload для других нужд
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `file-${unique}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});