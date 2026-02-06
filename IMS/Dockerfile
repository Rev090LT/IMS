FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # создаёт /app/dist

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf  
COPY --from=builder /app/dist /usr/share/nginx/html/  # копирует ваши файлы
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]