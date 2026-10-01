# IMS Backend Dockerfile
FROM node:18-alpine

# Рабочая директория
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем директории для uploads и fonts
RUN mkdir -p uploads services fonts images

# Порт бэкенда
EXPOSE 3000

# Переменные окружения
ENV NODE_ENV=production

# Запуск приложения
CMD ["node", "src/server.js"]