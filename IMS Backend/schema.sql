-- 1. Создать базу данных
CREATE DATABASE inventory_db;

-- 2. Создать пользователя
CREATE USER inventory_user WITH PASSWORD 'your_strong_password';

-- 3. Предоставить права на базу данных
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;

-- 4. Подключиться к базе данных
\c inventory_db;

-- 5. Предоставить права на схему и объекты
GRANT ALL ON SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;

-- 6. Установить права по умолчанию
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO inventory_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO inventory_user;
-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Локации
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Товары
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'warehouse',
    employee_id INT,
    location_id INT REFERENCES locations(id), -- Теперь это внешний ключ
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_username VARCHAR(50)
);

-- Перемещения
CREATE TABLE movements (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    from_location_id INT REFERENCES locations(id),
    to_location_id INT REFERENCES locations(id),
    employee_id INT,
    action_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    comment TEXT,
    date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pending_registrations (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    confirmation_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL, -- Установим, например, +1 час
    used BOOLEAN DEFAULT FALSE -- Флаг, использован ли код
);

