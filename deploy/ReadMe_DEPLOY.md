# IMS - Система управления складом запчастей

## 🚀 Быстрый старт

### Вариант 1: Windows (самый простой)

1. Скачайте и установите [Node.js LTS](https://nodejs.org/)
2. Скачайте и установите [PostgreSQL 14+](https://www.postgresql.org/download/windows/)
3. Распакуйте архив с системой
4. Запустите `deploy/windows/install.bat`
5. Следуйте инструкциям установщика
6. Запустите `start.bat`
7. Откройте браузер: http://localhost:5173

**Логин администратора:**
- Email: `admin@ims.local`
- Пароль: `admin123`

---

### Вариант 2: Linux/macOS

```bash
# 1. Установка зависимостей
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql

# macOS:
brew install node postgresql

# 2. Запуск установщика
chmod +x deploy/linux/install.sh
./deploy/linux/install.sh

# 3. Запуск системы
./start.sh

# 4. Откройте браузер
http://localhost:5173