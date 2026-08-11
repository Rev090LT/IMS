# ============================================================================
# IMS - Inventory Management System
# Скрипт установки для Windows (PowerShell)
# Версия: 2.0
# Требует: PowerShell 5.1+, Node.js 18+, PostgreSQL 14+
# ============================================================================

#Requires -Version 5.1
#Requires -RunAsAdministrator

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# Цвета для вывода
function Write-Header {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "   $Text" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "[✓] $Text" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "[✗] $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "[•] $Text" -ForegroundColor Yellow
}

# ============================================================================
# 1. ПРОВЕРКА ТРЕБОВАНИЙ
# ============================================================================

Write-Header "IMS - Система управления складом"

# Проверка Node.js
Write-Info "Проверка Node.js..."
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js найден: $nodeVersion"
    } else {
        throw "Node.js не найден"
    }
} catch {
    Write-Error-Custom "Node.js не установлен!"
    Write-Host "`nСкачайте и установите Node.js LTS:"
    Write-Host "https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "`nПосле установки перезапустите PowerShell" -ForegroundColor Yellow
    pause
    exit 1
}

# Проверка PostgreSQL
Write-Info "Проверка PostgreSQL..."
try {
    $psqlPath = Get-Command psql -ErrorAction Stop
    Write-Success "PostgreSQL найден: $($psqlPath.Source)"
    
    # Получаем версию PostgreSQL
    $pgVersion = & psql --version
    Write-Info "Версия: $pgVersion"
} catch {
    Write-Error-Custom "PostgreSQL не найден!"
    Write-Host "`nСкачайте и установите PostgreSQL 14+:"
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "`nРекомендуется использовать pgAdmin для управления БД" -ForegroundColor Yellow
    pause
    exit 1
}

# Проверка npm
Write-Info "Проверка npm..."
try {
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "npm найден: v$npmVersion"
    } else {
        throw "npm не найден"
    }
} catch {
    Write-Error-Custom "npm не найден! Переустановите Node.js"
    pause
    exit 1
}

# ============================================================================
# 2. НАСТРОЙКА
# ============================================================================

Write-Header "Настройка подключения к базе данных"

# Функция для безопасного ввода пароля
function Get-SecurePassword {
    $password = Read-Host "Пароль PostgreSQL пользователя 'postgres'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    $PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    return $PlainPassword
}

$DB_HOST = Read-Host "Хост базы данных" -Prompt "localhost"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }

$DB_PORT = Read-Host "Порт базы данных" -Prompt "5432"
if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = "5432" }

$DB_NAME = Read-Host "Имя базы данных" -Prompt "ims_db"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "ims_db" }

$DB_USER = Read-Host "Пользователь PostgreSQL" -Prompt "postgres"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "postgres" }

$DB_PASS = Get-SecurePassword
if ([string]::IsNullOrWhiteSpace($DB_PASS)) {
    Write-Error-Custom "Пароль не может быть пустым!"
    pause
    exit 1
}

# Генерация случайного JWT_SECRET
$JWT_SECRET = "ims_secret_" + -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# ============================================================================
# 3. СОЗДАНИЕ КОНФИГУРАЦИИ
# ============================================================================

Write-Header "Создание файлов конфигурации"

$serverDir = Join-Path $PSScriptRoot "..\..\server"
$srcDir = Join-Path $PSScriptRoot "..\..\src"

# Создаём .env для сервера
$envContent = @"
PORT=3000
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
"@

$envPath = Join-Path $serverDir ".env"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Success "Создан файл: $envPath"

# Создаём .env для фронтенда (если нужно)
$frontendEnvPath = Join-Path $srcDir ".env"
if (-not (Test-Path $frontendEnvPath)) {
    $frontendEnvContent = @"
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=IMS System
"@
    Set-Content -Path $frontendEnvPath -Value $frontendEnvContent -Encoding UTF8
    Write-Success "Создан файл: $frontendEnvPath"
}

# ============================================================================
# 4. УСТАНОВКА ЗАВИСИМОСТЕЙ
# ============================================================================

Write-Header "Установка зависимостей npm"

# Backend
Write-Info "Установка зависимостей сервера..."
Set-Location $serverDir
try {
    npm install --production 2>&1 | Out-Host
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Зависимости сервера установлены"
    } else {
        throw "Ошибка npm install"
    }
} catch {
    Write-Error-Custom "Не удалось установить зависимости сервера!"
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

# Frontend
Write-Info "Установка зависимостей фронтенда..."
Set-Location $srcDir
try {
    npm install 2>&1 | Out-Host
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Зависимости фронтенда установлены"
    } else {
        throw "Ошибка npm install"
    }
} catch {
    Write-Error-Custom "Не удалось установить зависимости фронтенда!"
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

Set-Location $PSScriptRoot

# ============================================================================
# 5. СОЗДАНИЕ БАЗЫ ДАННЫХ
# ============================================================================

Write-Header "Инициализация базы данных"

$env:PGPASSWORD = $DB_PASS

# Проверяем существует ли БД
Write-Info "Проверка существования базы данных..."
$dbExists = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>&1

if ($dbExists -match "1") {
    Write-Info "База данных '$DB_NAME' уже существует"
    $overwrite = Read-Host "Пересоздать базу данных? (y/n)" -Prompt "n"
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        Write-Info "Удаление существующей базы данных..."
        & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | Out-Host
    } else {
        Write-Info "Используем существующую базу данных"
    }
}

# Создаём БД если не существует
$dbExists = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>&1
if ($dbExists -notmatch "1") {
    Write-Info "Создание базы данных '$DB_NAME'..."
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Host
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "База данных создана"
    } else {
        Write-Error-Custom "Ошибка создания базы данных!"
        pause
        exit 1
    }
}

# Импортируем схему
Write-Info "Импорт схемы базы данных..."
$initSqlPath = Join-Path $PSScriptRoot "init.sql"
if (Test-Path $initSqlPath) {
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $initSqlPath 2>&1 | Out-Host
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Схема базы данных импортирована"
    } else {
        Write-Error-Custom "Ошибка импорта схемы!"
        Write-Host "Проверьте файл: $initSqlPath" -ForegroundColor Yellow
        pause
        exit 1
    }
} else {
    Write-Error-Custom "Файл init.sql не найден: $initSqlPath"
    pause
    exit 1
}

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

# ============================================================================
# 6. СОЗДАНИЕ СКРИПТОВ ЗАПУСКА
# ============================================================================

Write-Header "Создание скриптов запуска"

# Создаём Start-IMS.ps1
$startScript = @"
# IMS System - Запуск
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   IMS - Запуск системы" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Запуск сервера
Write-Host "[1/2] Запуск backend сервера..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverDir'; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

# Запуск фронтенда
Write-Host "[2/2] Запуск frontend приложения..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$srcDir'; npm run dev" -WindowStyle Normal

Write-Host "`n[✓] Система запущена!" -ForegroundColor Green
Write-Host "`nОткройте браузер: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nНажмите Ctrl+C для остановки" -ForegroundColor Yellow
"@

$startScriptPath = Join-Path $PSScriptRoot "Start-IMS.ps1"
Set-Content -Path $startScriptPath -Value $startScript -Encoding UTF8
Write-Success "Создан скрипт запуска: $startScriptPath"

# Создаём ярлык на рабочем столе
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "IMS System.lnk"

try {
    $WShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = "powershell.exe"
    $Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$startScriptPath`""
    $Shortcut.IconLocation = "shell32.dll,13"
    $Shortcut.Description = "IMS Inventory System"
    $Shortcut.WorkingDirectory = $PSScriptRoot
    $Shortcut.Save()
    Write-Success "Создан ярлык на рабочем столе"
} catch {
    Write-Info "Не удалось создать ярлык (это не критично)"
}

# ============================================================================
# 7. ФИНАЛИЗАЦИЯ
# ============================================================================

Write-Header "Установка завершена!"

Write-Host @"
✓ Все компоненты установлены успешно!

📋 СЛЕДУЮЩИЕ ШАГИ:

1. Запустите систему:
   • Двойной клик на ярлык 'IMS System' на рабочем столе
   • Или выполните: .\Start-IMS.ps1

2. Откройте браузер:
   http://localhost:5173

3. Войдите в систему:
   Email: admin@ims.local
   Пароль: admin123

📁 РАСПОЛОЖЕНИЕ ФАЙЛОВ:

• Сервер:  $serverDir
• Фронтенд: $srcDir
• Конфиг:  $envPath
• База данных: PostgreSQL ($DB_HOST:$DB_PORT/$DB_NAME)

🔐 БЕЗОПАСНОСТЬ:

• Измените пароль администратора после первого входа
• Сохраните файл .env в безопасном месте
• Не публикуйте .env в репозиторий

📞 ПОДДЕРЖКА:

При возникновении проблем:
1. Проверьте что PostgreSQL запущен
2. Проверьте логи в папке server/logs/
3. Убедитесь что порты 3000 и 5173 свободны

========================================
"@ -ForegroundColor Green

# Предложение открыть браузер
$openBrowser = Read-Host "Открыть браузер сейчас?" -Prompt "y"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "http://localhost:5173"
}

pause