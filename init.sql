-- ===========================================
-- СКРИПТ ДЛЯ СОЗДАНИЯ СТРУКТУРЫ БАЗЫ ДАННЫХ
-- ===========================================

-- ===========================================
-- ТАБЛИЦЫ (в правильном порядке - сначала без внешних ключей)
-- ===========================================

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Локации
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Категории запчастей
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Например: 'Двигатель', 'Трансмиссия'
    description TEXT
);

-- Производители
CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Например: 'Bosch', 'Mann'
    contact_info TEXT, -- Контакты, если нужно
    created_at TIMESTAMP DEFAULT NOW()
);

-- Контрагенты (без внешних ключей на этапе создания)
CREATE TABLE IF NOT EXISTS counterparties (
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

-- Поставщики (без внешних ключей на этапе создания)
CREATE TABLE IF NOT EXISTS suppliers (
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

-- Автомобили в разборе
CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    vin VARCHAR(255) UNIQUE NOT NULL,
    arrival_date DATE NOT NULL,
    year INTEGER, -- Год выпуска
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Товары (без внешних ключей на этапе создания)
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'warehouse',
    location_id INT, -- Внешний ключ будет добавлен позже
    category_id INT, -- Внешний ключ будет добавлен позже
    manufacturer_id INT, -- Внешний ключ будет добавлен позже
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

-- Перемещения (без внешних ключей на этапе создания)
CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    item_id INT, -- Внешний ключ будет добавлен позже
    from_location_id INT, -- Внешний ключ будет добавлен позже
    to_location_id INT, -- Внешний ключ будет добавлен позже
    quantity INT NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- move, dispose, etc.
    moved_at TIMESTAMP DEFAULT NOW(),
    moved_by_user_id INT, -- ID пользователя, совершившего перемещение
    comment TEXT
);

-- Проданные запчасти (без внешних ключей на этапе создания)
CREATE TABLE IF NOT EXISTS sold_parts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER, -- Внешний ключ будет добавлен позже
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    part_number VARCHAR(255),
    car_model VARCHAR(255),
    vin_number VARCHAR(255),
    selling_price DECIMAL(10, 2) NOT NULL,
    sale_date DATE DEFAULT CURRENT_DATE,
    quantity INTEGER DEFAULT 1,
    counterparty_id INTEGER, -- Внешний ключ будет добавлен позже
    supplier_id INTEGER, -- Внешний ключ будет добавлен позже
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для ожидающих регистрации пользователей
CREATE TABLE IF NOT EXISTS pending_registrations (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    confirmation_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL, -- Установим, например, +1 час
    used BOOLEAN DEFAULT FALSE -- Флаг, использован ли код
);

-- Таблица для ожидающих одобрения пользователей
CREATE TABLE IF NOT EXISTS pending_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20), -- Новое поле
    confirmation_code VARCHAR(6), -- Новое поле
    created_at TIMESTAMP DEFAULT NOW(),
    approved BOOLEAN DEFAULT FALSE -- Оставим на будущее, если решим одобрять вручную
);

-- ===========================================
-- ДОБАВЛЕНИЕ ВНЕШНИХ КЛЮЧЕЙ (после создания всех таблиц)
-- ===========================================

ALTER TABLE items ADD CONSTRAINT fk_items_location FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE items ADD CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE items ADD CONSTRAINT fk_items_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id);

ALTER TABLE movements ADD CONSTRAINT fk_movements_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
ALTER TABLE movements ADD CONSTRAINT fk_movements_from_location FOREIGN KEY (from_location_id) REFERENCES locations(id);
ALTER TABLE movements ADD CONSTRAINT fk_movements_to_location FOREIGN KEY (to_location_id) REFERENCES locations(id);

ALTER TABLE sold_parts ADD CONSTRAINT fk_sold_parts_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
ALTER TABLE sold_parts ADD CONSTRAINT fk_sold_parts_counterparty FOREIGN KEY (counterparty_id) REFERENCES counterparties(id);
ALTER TABLE sold_parts ADD CONSTRAINT fk_sold_parts_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

-- ===========================================
-- ДОПОЛНИТЕЛЬНЫЕ ОГРАНИЧЕНИЯ И ИНДЕКСЫ
-- ===========================================

-- Индекс для быстрого поиска по QR-коду
CREATE INDEX IF NOT EXISTS idx_items_qr_code ON items(qr_code);

-- Индекс для быстрого поиска по имени товара
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

-- Индекс для быстрого поиска по локации
CREATE INDEX IF NOT EXISTS idx_items_location_id ON items(location_id);

-- Индекс для быстрого поиска по категории
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);

-- Индекс для быстрого поиска по производителю
CREATE INDEX IF NOT EXISTS idx_items_manufacturer_id ON items(manufacturer_id);

-- Индекс для быстрого поиска по VIN автомобиля
CREATE INDEX IF NOT EXISTS idx_cars_vin ON cars(vin);

-- Индекс для быстрого поиска по дате продажи
CREATE INDEX IF NOT EXISTS idx_sold_parts_sale_date ON sold_parts(sale_date);

-- ===========================================
-- ПРОВЕРОЧНЫЕ ОГРАНИЧЕНИЯ
-- ===========================================

-- Проверка, что дата прибытия автомобиля не в будущем
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_arrival_date_past') THEN
        ALTER TABLE cars ADD CONSTRAINT chk_arrival_date_past CHECK (arrival_date <= CURRENT_DATE);
    END IF;
END $$;

-- Проверка, что цена продажи положительная
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_selling_price_positive') THEN
        ALTER TABLE sold_parts ADD CONSTRAINT chk_selling_price_positive CHECK (selling_price > 0);
    END IF;
END $$;

-- Проверка, что количество проданной детали положительно
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sold_quantity_positive') THEN
        ALTER TABLE sold_parts ADD CONSTRAINT chk_sold_quantity_positive CHECK (quantity > 0);
    END IF;
END $$;

-- ===========================================
-- ПОЛЕЗНЫЕ ФУНКЦИИ/ПРЕДСТАВЛЕНИЯ (опционально)
-- ===========================================

-- Представление для получения сводки по продажам
CREATE OR REPLACE VIEW sales_summary AS
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
-- КОНЕЦ СКРИПТА
-- ===========================================