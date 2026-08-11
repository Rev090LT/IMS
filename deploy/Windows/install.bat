@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ========================================
echo    IMS - Система управления складом
echo    Установка
echo ========================================
echo.

:: Проверка Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js не найден!
    echo.
    echo Скачайте и установите Node.js LTS:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [+] Node.js найден: 
node --version
echo.

:: Проверка PostgreSQL
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] PostgreSQL не найден!
    echo.
    echo Скачайте и установите PostgreSQL 14+:
    echo https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

echo [+] PostgreSQL найден
echo.

:: Настройка
echo === Настройка ===
echo.
set /p DB_HOST="Хост базы данных [localhost]: "
if "!DB_HOST!"=="" set DB_HOST=localhost

set /p DB_PORT="Порт базы данных [5432]: "
if "!DB_PORT!"=="" set DB_PORT=5432

set /p DB_NAME="Имя базы данных [ims_db]: "
if "!DB_NAME!"=="" set DB_NAME=ims_db

set /p DB_USER="Пользователь БД [postgres]: "
if "!DB_USER!"=="" set DB_USER=postgres

set /p DB_PASS="Пароль БД: "
if "!DB_PASS!"=="" (
    echo [!] Пароль не может быть пустым!
    pause
    exit /b 1
)

:: Создание .env файла
echo.
echo [+] Создание конфигурации...
(
echo PORT=3000
echo DB_HOST=!DB_HOST!
echo DB_PORT=!DB_PORT!
echo DB_NAME=!DB_NAME!
echo DB_USER=!DB_USER!
echo DB_PASS=!DB_PASS!
echo JWT_SECRET=ims_secret_key_!random!
echo NODE_ENV=production
) > server\.env

echo [+] Конфигурация создана: server\.env
echo.

:: Установка зависимостей
echo [+] Установка зависимостей...
cd server
call npm install --production
if %errorlevel% neq 0 (
    echo [!] Ошибка установки зависимостей!
    pause
    exit /b 1
)
cd ..

cd src
call npm install --production
if %errorlevel% neq 0 (
    echo [!] Ошибка установки зависимостей!
    pause
    exit /b 1
)
cd ..

echo.

:: Создание базы данных
echo [+] Создание базы данных...
set PGPASSWORD=!DB_PASS!
psql -h !DB_HOST! -p !DB_PORT! -U !DB_USER! -c "CREATE DATABASE !DB_NAME!;" 2>nul
if %errorlevel% neq 0 (
    echo [!] База данных уже существует или ошибка создания
)

psql -h !DB_HOST! -p !DB_PORT! -U !DB_USER! -d !DB_NAME! -f deploy\init.sql
if %errorlevel% neq 0 (
    echo [!] Ошибка импорта SQL!
    pause
    exit /b 1
)

echo [+] База данных создана и настроена
echo.

:: Создание ярлыка для запуска
echo [+] Создание ярлыка для запуска...
(
echo @echo off
echo chcp 65001 ^>nul
echo cd /d "%~dp0server"
echo start "" npm start
echo cd ..\src
echo start "" npm run dev
) > start.bat

echo [+] Ярлык создан: start.bat
echo.

echo ========================================
echo    Установка завершена!
echo ========================================
echo.
echo Для запуска системы:
echo   1. Запустите файл start.bat
echo   2. Откройте браузер: http://localhost:5173
echo.
echo Логин администратора по умолчанию:
echo   Email: admin@ims.local
echo   Пароль: admin123
echo.
echo ========================================
pause