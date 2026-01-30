-- ===========================================
-- СКРИПТ ДЛЯ СОЗДАНИЯ БАЗЫ ДАННЫХ И ВСЕЙ СТРУКТУРЫ
-- ===========================================

-- 1. Создать базу данных
CREATE DATABASE inventory_db;

-- 2. Создать пользователя
CREATE USER inventory_user WITH PASSWORD 'your_strong_password';

-- 3. Предоставить права на базу данных
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;

-- 4. Подключиться к базе данных
-- \c inventory_db; -- (выполняется в psql, не в скрипте)

-- 5. Предоставить права на схему и объекты
GRANT ALL ON SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;

-- 6. Установить права по умолчанию
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO inventory_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO inventory_user;

-- ===========================================
-- ТАБЛИЦЫ
-- ===========================================

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

-- Категории запчастей
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Например: 'Двигатель', 'Трансмиссия'
    description TEXT
);

-- Производители
CREATE TABLE manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Например: 'Bosch', 'Mann'
    contact_info TEXT, -- Контакты, если нужно
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
    location_id INT REFERENCES locations(id), -- Внешний ключ на локацию
    category_id INT REFERENCES categories(id),
    manufacturer_id INT REFERENCES manufacturers(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT, -- ID пользователя, создавшего запись
    created_by_username VARCHAR(50),
    updated_by_user_id INT, -- ID пользователя, обновившего запись
    part_number VARCHAR(255), -- Номер детали
    car_model VARCHAR(255), -- Модель автомобиля
    vin_number VARCHAR(255), -- VIN номер
    CONSTRAINT chk_quantity_positive CHECK (quantity >= 0) -- Проверка, что количество неотрицательное
);

-- Перемещения
CREATE TABLE movements (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    from_location_id INT REFERENCES locations(id),
    to_location_id INT REFERENCES locations(id),
    quantity INT NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- move, dispose, etc.
    moved_at TIMESTAMP DEFAULT NOW(),
    moved_by_user_id INT, -- ID пользователя, совершившего перемещение
    comment TEXT
);

-- Автомобили в разборе
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    vin VARCHAR(255) UNIQUE NOT NULL,
    arrival_date DATE NOT NULL,
    year INTEGER, -- Год выпуска
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Проданные запчасти
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
    quantity INTEGER DEFAULT 1,
    counterparty_id INTEGER REFERENCES counterparties(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Контрагенты
CREATE TABLE counterparties (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10) DEFAULT 'physical', -- 'physical' или 'legal'
    fio VARCHAR(255), -- Для физ. лиц
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT, -- Физический адрес
    inn VARCHAR(12), -- Для юрлиц
    kpp VARCHAR(9), -- Для юрлиц
    ogrn VARCHAR(13), -- Для юрлиц
    company_name VARCHAR(255), -- Для юрлиц
    legal_address TEXT, -- Юридический адрес
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Поставщики
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

-- Таблица для ожидающих регистрации пользователей
CREATE TABLE pending_registrations (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    confirmation_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL, -- Установим, например, +1 час
    used BOOLEAN DEFAULT FALSE -- Флаг, использован ли код
);

-- Таблица для ожидающих одобрения пользователей
CREATE TABLE pending_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20), -- Новое поле
    confirmation_code VARCHAR(6), -- Новое поле
    created_at TIMESTAMP DEFAULT NOW(),
    approved BOOLEAN DEFAULT FALSE -- Оставим на будущее, если решим одобрять вручную
);

-- ===========================================
-- ДОПОЛНИТЕЛЬНЫЕ ОГРАНИЧЕНИЯ И ИНДЕКСЫ
-- ===========================================

-- Индекс для быстрого поиска по QR-коду
CREATE INDEX idx_items_qr_code ON items(qr_code);

-- Индекс для быстрого поиска по имени товара
CREATE INDEX idx_items_name ON items(name);

-- Индекс для быстрого поиска по локации
CREATE INDEX idx_items_location_id ON items(location_id);

-- Индекс для быстрого поиска по категории
CREATE INDEX idx_items_category_id ON items(category_id);

-- Индекс для быстрого поиска по производителю
CREATE INDEX idx_items_manufacturer_id ON items(manufacturer_id);

-- Индекс для быстрого поиска по VIN автомобиля
CREATE INDEX idx_cars_vin ON cars(vin);

-- Индекс для быстрого поиска по дате продажи
CREATE INDEX idx_sold_parts_sale_date ON sold_parts(sale_date);

-- ===========================================
-- ПРОВЕРОЧНЫЕ ОГРАНИЧЕНИЯ
-- ===========================================

-- Проверка, что дата прибытия автомобиля не в будущем
ALTER TABLE cars ADD CONSTRAINT chk_arrival_date_past CHECK (arrival_date <= CURRENT_DATE);

-- Проверка, что цена продажи положительная
ALTER TABLE sold_parts ADD CONSTRAINT chk_selling_price_positive CHECK (selling_price > 0);

-- Проверка, что количество проданной детали положительно
ALTER TABLE sold_parts ADD CONSTRAINT chk_sold_quantity_positive CHECK (quantity > 0);

-- ===========================================
-- ПОЛЕЗНЫЕ ФУНКЦИИ/ПРЕДСТАВЛЕНИЯ (опционально)
-- ===========================================

-- Представление для получения сводки по продажам
CREATE VIEW sales_summary AS
SELECT 
    sp.sale_date,
    COUNT(*) as daily_sales,
    SUM(sp.selling_price * sp.quantity) as daily_income,
    json_agg(json_build_object(
        'item_name', sp.item_name,
        'quantity', sp.quantity,
        'selling_price', sp.selling_price,
        'counterparty_name', COALESCE(cp.company_name, cp.fio),
        'supplier_name', s.name
    )) as details
FROM sold_parts sp
LEFT JOIN counterparties cp ON sp.counterparty_id = cp.id
LEFT JOIN suppliers s ON sp.supplier_id = s.id
GROUP BY sp.sale_date
ORDER BY sp.sale_date DESC;

-- ===========================================
-- КОМАНДЫ ДЛЯ ОЧИСТКИ ДАННЫХ (при необходимости)
-- ===========================================

-- TRUNCATE TABLE имя_таблицы; -- удалить все из таблицы (без удаления структуры)

-- ===========================================
-- КОНЕЦ СКРИПТА
-- ===========================================