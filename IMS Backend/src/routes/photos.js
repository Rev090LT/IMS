// IMS/server/routes/photos.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/db.js';

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/item_photos/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB лимит
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// Загрузка фотографии
router.post('/items/:itemId/photos', upload.single('photo'), async (req, res) => {
  try {
    const { itemId } = req.params;
    const { is_primary } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const photo_url = `/uploads/item_photos/${req.file.filename}`;
    
    // Если это основное фото, сбросим другие
    if (is_primary === 'true') {
      await pool.query(
        'UPDATE item_photos SET is_primary = false WHERE item_id = $1',
        [itemId]
      );
    }

    const result = await pool.query(
      `INSERT INTO item_photos (item_id, photo_url, photo_name, file_size, mime_type, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [itemId, photo_url, req.file.originalname, req.file.size, req.file.mimetype, is_primary === 'true']
    );

    res.json({ success: true, photo: result.rows[0] });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Ошибка при загрузке фото' });
  }
});

// Получить все фото товара
router.get('/items/:itemId/photos', async (req, res) => {
  try {
    const { itemId } = req.params;
    const result = await pool.query(
      'SELECT * FROM item_photos WHERE item_id = $1 ORDER BY is_primary DESC, uploaded_at DESC',
      [itemId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Ошибка при получении фото' });
  }
});

// Удалить фотографию
router.delete('/items/:itemId/photos/:photoId', async (req, res) => {
  try {
    const { itemId, photoId } = req.params;
    
    // Получить путь к файлу перед удалением
    const photoResult = await pool.query(
      'SELECT photo_url FROM item_photos WHERE id = $1 AND item_id = $2',
      [photoId, itemId]
    );

    if (photoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Фото не найдено' });
    }

    const photoPath = '.' + photoResult.rows[0].photo_url;
    
    // Удалить файл с диска
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Удалить запись из БД
    await pool.query('DELETE FROM item_photos WHERE id = $1', [photoId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Ошибка при удалении фото' });
  }
});

// Сделать фото основным
router.patch('/items/:itemId/photos/:photoId/primary', async (req, res) => {
  try {
    const { itemId, photoId } = req.params;
    
    await pool.query('BEGIN');
    
    // Сбросить все основные фото
    await pool.query(
      'UPDATE item_photos SET is_primary = false WHERE item_id = $1',
      [itemId]
    );
    
    // Установить новое основное фото
    await pool.query(
      'UPDATE item_photos SET is_primary = true WHERE id = $1 AND item_id = $2',
      [photoId, itemId]
    );
    
    await pool.query('COMMIT');
    
    res.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error setting primary photo:', error);
    res.status(500).json({ error: 'Ошибка при установке основного фото' });
  }
});

export default router;