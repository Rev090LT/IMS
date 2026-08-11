// IMS/server/utils/logger.js
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Форматирование логов
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Создание logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ims-backend' },
  transports: [
    // Ошибки в отдельный файл
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Все логи в один файл
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// В development режиме выводим в консоль
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Helper функции
export const logInfo = (message, meta = {}) => logger.info(message, meta);
export const logError = (message, meta = {}) => logger.error(message, meta);
export const logWarn = (message, meta = {}) => logger.warn(message, meta);
export const logDebug = (message, meta = {}) => logger.debug(message, meta);

// Middleware для логирования HTTP запросов
export const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      logError(`HTTP ${res.statusCode}`, logData);
    } else if (res.statusCode >= 400) {
      logWarn(`HTTP ${res.statusCode}`, logData);
    } else {
      logInfo(`HTTP ${res.statusCode}`, logData);
    }
  });

  next();
};

export default logger;