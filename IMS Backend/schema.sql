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

CREATE TABLE pending_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20), -- Новое поле
    confirmation_code VARCHAR(6), -- Новое поле
    created_at TIMESTAMP DEFAULT NOW(),
    approved BOOLEAN DEFAULT FALSE -- Оставим на будущее, если решим одобрять вручную
);
--класс запчасти
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Например: 'Двигатель', 'Трансмиссия'
    description TEXT
);
-- производитель
CREATE TABLE manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Например: 'Bosch', 'Mann'
    contact_info TEXT, -- Контакты, если нужно
    created_at TIMESTAMP DEFAULT NOW()
);
--автомобили в разборе
CREATE TABLE cars (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  vin VARCHAR(255) UNIQUE NOT NULL,
  arrival_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--проданные запчасти
CREATE TABLE sold_parts (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  part_number VARCHAR(255),
  car_model VARCHAR(255),
  vin_number VARCHAR(255),
  selling_price DECIMAL(10, 2) NOT NULL,
  sale_date DATE DEFAULT CURRENT_DATE,
  buyer_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--контрагенты
CREATE TABLE counterparties (
  id SERIAL PRIMARY KEY,
  fio VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--поставщики 
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  inn VARCHAR(20),
  ogrn VARCHAR(20),
  kpp VARCHAR(20),
  legal_address TEXT,
  actual_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE items ADD COLUMN category_id INTEGER REFERENCES categories(id);
ALTER TABLE items ADD COLUMN manufacturer_id INTEGER REFERENCES manufacturers(id);
ALTER TABLE items ADD COLUMN part_number VARCHAR(255);
ALTER TABLE items ADD COLUMN car_model VARCHAR(255);
ALTER TABLE items ADD COLUMN vin_number VARCHAR(255);
ALTER TABLE cars ADD COLUMN year INTEGER;

ALTER TABLE counterparties ADD COLUMN type VARCHAR(10) DEFAULT 'physical'; -- physical или legal
ALTER TABLE counterparties ADD COLUMN inn VARCHAR(12); -- Для юрлиц
ALTER TABLE counterparties ADD COLUMN kpp VARCHAR(9); -- Для юрлиц
ALTER TABLE counterparties ADD COLUMN ogrn VARCHAR(13); -- Для юрлиц
ALTER TABLE counterparties ADD COLUMN company_name VARCHAR(255); -- Для юрлиц
ALTER TABLE counterparties ADD COLUMN legal_address TEXT; -- Для юрлиц
ALTER TABLE counterparties ALTER COLUMN fio DROP NOT NULL;
ALTER TABLE sold_parts ADD COLUMN counterparty_id INTEGER REFERENCES counterparties(id);
ALTER TABLE sold_parts ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id);
-- Если колонка selling_price не существует
ALTER TABLE sold_parts ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2);

-- Если колонка sale_date не существует
ALTER TABLE sold_parts ADD COLUMN IF NOT EXISTS sale_date DATE;

-- Если колонка quantity не существует
ALTER TABLE sold_parts ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Если колонка supplier_id не существует
ALTER TABLE sold_parts ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id);
TRUNCATE TABLE имя_таблицы; --удалить все из таблицы