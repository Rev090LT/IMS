-- ============================================================================
-- IMS - Inventory Management System
-- Скрипт инициализации базы данных PostgreSQL
-- Версия: 2.0
-- Последнее обновление: 2026-04-08
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS (Расширения PostgreSQL)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- 2. TABLES - Без внешних ключей (создаются в порядке зависимостей)
-- ============================================================================

-- 2.1 Пользователи и аутентификация
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_registrations (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    confirmation_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS pending_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    confirmation_code VARCHAR(6),
    created_at TIMESTAMP DEFAULT NOW(),
    approved BOOLEAN DEFAULT FALSE
);

-- 2.2 Справочники (категории, производители, локации)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    contact_info TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.3 Автомобили
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    vin VARCHAR(255) UNIQUE NOT NULL,
    year INTEGER,
    arrival_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 Контрагенты и поставщики
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS counterparties (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10) DEFAULT 'physical',
    fio VARCHAR(255),
    company_name VARCHAR(255),
    inn VARCHAR(12),
    kpp VARCHAR(9),
    ogrn VARCHAR(13),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    legal_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(20),
    ogrn VARCHAR(20),
    kpp VARCHAR(20),
    legal_address TEXT,
    actual_address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 Товары (номенклатура)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    part_number VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'warehouse',
    location_id INTEGER,
    category_id INTEGER,
    manufacturer_id INTEGER,
    car_model VARCHAR(255),
    vin_number VARCHAR(255),
    created_by_user_id INTEGER,
    created_by_username VARCHAR(50),
    updated_by_user_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_quantity_positive CHECK (quantity >= 0)
);

-- 2.6 Фотографии товаров
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS item_photos (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    photo_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.7 Перемещения товаров
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    item_id INTEGER,
    from_location_id INTEGER,
    to_location_id INTEGER,
    quantity INTEGER NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    employee_id INTEGER,
    moved_by_user_id INTEGER,
    comment TEXT,
    moved_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_movement_quantity_positive CHECK (quantity > 0)
);

-- 2.8 Продажи
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sold_parts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    part_number VARCHAR(255),
    car_model VARCHAR(255),
    vin_number VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    selling_price DECIMAL(10, 2) NOT NULL,
    sale_date DATE DEFAULT CURRENT_DATE,
    counterparty_id INTEGER,
    supplier_id INTEGER,
    sold_by_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_selling_price_positive CHECK (selling_price > 0),
    CONSTRAINT chk_sold_quantity_positive CHECK (quantity > 0)
);

-- 2.9 Записи в гараж
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS garage_appointments (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(100),
    car_model VARCHAR(255),
    car_vin VARCHAR(50),
    car_license_plate VARCHAR(20),
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.10 Логи и аудит
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- 3. FOREIGN KEYS (Внешние ключи)
-- ============================================================================

-- 3.1 Товары
-- ----------------------------------------------------------------------------

ALTER TABLE items 
    ADD CONSTRAINT fk_items_location 
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE items 
    ADD CONSTRAINT fk_items_category 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE items 
    ADD CONSTRAINT fk_items_manufacturer 
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE SET NULL;

ALTER TABLE items 
    ADD CONSTRAINT fk_items_created_by 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE items 
    ADD CONSTRAINT fk_items_updated_by 
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3.2 Фотографии товаров
-- ----------------------------------------------------------------------------

ALTER TABLE item_photos 
    ADD CONSTRAINT fk_item_photos_item 
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE item_photos 
    ADD CONSTRAINT fk_item_photos_uploaded_by 
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- 3.3 Перемещения
-- ----------------------------------------------------------------------------

ALTER TABLE movements 
    ADD CONSTRAINT fk_movements_item 
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE movements 
    ADD CONSTRAINT fk_movements_from_location 
    FOREIGN KEY (from_location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE movements 
    ADD CONSTRAINT fk_movements_to_location 
    FOREIGN KEY (to_location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE movements 
    ADD CONSTRAINT fk_movements_employee 
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE movements 
    ADD CONSTRAINT fk_movements_moved_by 
    FOREIGN KEY (moved_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3.4 Продажи
-- ----------------------------------------------------------------------------

ALTER TABLE sold_parts 
    ADD CONSTRAINT fk_sold_parts_item 
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

ALTER TABLE sold_parts 
    ADD CONSTRAINT fk_sold_parts_counterparty 
    FOREIGN KEY (counterparty_id) REFERENCES counterparties(id) ON DELETE SET NULL;

ALTER TABLE sold_parts 
    ADD CONSTRAINT fk_sold_parts_supplier 
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE sold_parts 
    ADD CONSTRAINT fk_sold_parts_sold_by 
    FOREIGN KEY (sold_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3.5 Записи в гараж
-- ----------------------------------------------------------------------------

ALTER TABLE garage_appointments 
    ADD CONSTRAINT fk_appointments_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 3.6 Логи
-- ----------------------------------------------------------------------------

ALTER TABLE user_activity_logs 
    ADD CONSTRAINT fk_logs_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


-- ============================================================================
-- 4. INDEXES (Индексы для производительности)
-- ============================================================================

-- 4.1 Товары
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_items_qr_code ON items(qr_code);
CREATE INDEX IF NOT EXISTS idx_items_part_number ON items(part_number);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_location_id ON items(location_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_manufacturer_id ON items(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_vin ON items(vin_number);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- 4.2 Фотографии
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_item_photos_item_id ON item_photos(item_id);
CREATE INDEX IF NOT EXISTS idx_item_photos_primary ON item_photos(item_id, is_primary) WHERE is_primary = TRUE;

-- 4.3 Перемещения
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_movements_item_id ON movements(item_id);
CREATE INDEX IF NOT EXISTS idx_movements_from_location ON movements(from_location_id);
CREATE INDEX IF NOT EXISTS idx_movements_to_location ON movements(to_location_id);
CREATE INDEX IF NOT EXISTS idx_movements_moved_at ON movements(moved_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_action_type ON movements(action_type);

-- 4.4 Продажи
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sold_parts_sale_date ON sold_parts(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sold_parts_item_id ON sold_parts(item_id);
CREATE INDEX IF NOT EXISTS idx_sold_parts_counterparty ON sold_parts(counterparty_id);

-- 4.5 Автомобили
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_cars_vin ON cars(vin);
CREATE INDEX IF NOT EXISTS idx_cars_brand_model ON cars(brand, model);
CREATE INDEX IF NOT EXISTS idx_cars_arrival_date ON cars(arrival_date DESC);

-- 4.6 Записи в гараж
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_appointments_date ON garage_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON garage_appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON garage_appointments(customer_name);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON garage_appointments(appointment_date, status);

-- 4.7 Логи
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON user_activity_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- 4.8 Контрагенты и поставщики
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_counterparties_type ON counterparties(type);
CREATE INDEX IF NOT EXISTS idx_counterparties_inn ON counterparties(inn);
CREATE INDEX IF NOT EXISTS idx_suppliers_inn ON suppliers(inn);


-- ============================================================================
-- 5. CONSTRAINTS (Проверочные ограничения)
-- ============================================================================

-- 5.1 Автомобили
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_arrival_date_past') THEN
        ALTER TABLE cars ADD CONSTRAINT chk_arrival_date_past 
            CHECK (arrival_date <= CURRENT_DATE);
    END IF;
END $$;

-- 5.2 Статусы (допустимые значения)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_item_status') THEN
        ALTER TABLE items ADD CONSTRAINT chk_item_status 
            CHECK (status IN ('warehouse', 'available', 'reserved', 'sold', 'disposed', 'active', 'inactive'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_appointment_status') THEN
        ALTER TABLE garage_appointments ADD CONSTRAINT chk_appointment_status 
            CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_counterparty_type') THEN
        ALTER TABLE counterparties ADD CONSTRAINT chk_counterparty_type 
            CHECK (type IN ('physical', 'legal'));
    END IF;
END $$;


-- ============================================================================
-- 6. VIEWS (Представления)
-- ============================================================================

-- 6.1 Сводка по продажам
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    sp.sale_date,
    COUNT(*) AS daily_sales,
    SUM(sp.selling_price * sp.quantity) AS daily_income,
    JSON_AGG(JSON_BUILD_OBJECT(
        'item_name', sp.item_name,
        'quantity', sp.quantity,
        'selling_price', sp.selling_price,
        'counterparty_name', COALESCE(cp.company_name, cp.fio),
        'supplier_name', s.name
    )) AS details
FROM sold_parts sp
LEFT JOIN counterparties cp ON sp.counterparty_id = cp.id
LEFT JOIN suppliers s ON sp.supplier_id = s.id
GROUP BY sp.sale_date
ORDER BY sp.sale_date DESC;

-- 6.2 Остатки по складам
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW inventory_by_location AS
SELECT 
    l.id AS location_id,
    l.name AS location_name,
    COUNT(i.id) AS total_items,
    SUM(i.quantity) AS total_quantity,
    SUM(CASE WHEN i.status = 'available' THEN i.quantity ELSE 0 END) AS available_quantity,
    SUM(CASE WHEN i.status = 'reserved' THEN i.quantity ELSE 0 END) AS reserved_quantity
FROM locations l
LEFT JOIN items i ON l.id = i.location_id
GROUP BY l.id, l.name
ORDER BY l.name;

-- 6.3 Активные записи в гараж
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW active_appointments AS
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.customer_name,
    a.customer_phone,
    a.car_model,
    a.car_vin,
    a.car_license_plate,
    a.reason,
    a.status,
    u.username AS created_by_username
FROM garage_appointments a
LEFT JOIN users u ON a.created_by = u.id
WHERE a.status IN ('scheduled', 'completed')
ORDER BY a.appointment_date, a.appointment_time;


-- ============================================================================
-- 7. FUNCTIONS (Функции)
-- ============================================================================

-- 7.1 Автоматическое обновление updated_at
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7.2 Генерация уникального QR-кода
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_unique_qr()
RETURNS VARCHAR AS $$
DECLARE
    new_qr VARCHAR;
    exists_flag BOOLEAN;
BEGIN
    LOOP
        new_qr := '2000000' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
        SELECT EXISTS(SELECT 1 FROM items WHERE qr_code = new_qr) INTO exists_flag;
        EXIT WHEN NOT exists_flag;
    END LOOP;
    RETURN new_qr;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 8. TRIGGERS (Триггеры)
-- ============================================================================

-- 8.1 Автообновление updated_at для таблиц
-- ----------------------------------------------------------------------------

CREATE TRIGGER trg_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_cars_updated_at 
    BEFORE UPDATE ON cars 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_counterparties_updated_at 
    BEFORE UPDATE ON counterparties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_suppliers_updated_at 
    BEFORE UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_appointments_updated_at 
    BEFORE UPDATE ON garage_appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 9. DEFAULT DATA (Тестовые/стартовые данные)
-- ============================================================================

-- 9.1 Администратор по умолчанию (пароль: admin123)
-- ----------------------------------------------------------------------------

INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@ims.local', '$2b$10$YourHashedPasswordHere', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 9.2 Базовые локации
-- ----------------------------------------------------------------------------

INSERT INTO locations (name, description) VALUES 
('Основной склад', 'Главный склад компании'),
('Резервный склад', 'Дополнительное хранилище'),
('Зона приёма', 'Временное хранение новых поступлений')
ON CONFLICT (name) DO NOTHING;

-- 9.3 Базовые категории
-- ----------------------------------------------------------------------------

INSERT INTO categories (name, description) VALUES 
('Двигатель', 'Детали двигателя и системы'),
('Трансмиссия', 'КПП, сцепление, приводы'),
('Ходовая часть', 'Подвеска, рулевое управление'),
('Тормозная система', 'Тормоза и компоненты'),
('Электрика', 'Аккумуляторы, генераторы, стартеры'),
('Кузов', 'Детали кузова и остекление'),
('Расходные материалы', 'Масла, фильтры, жидкости')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 10. COMMENTS (Комментарии к таблицам и колонкам)
-- ============================================================================

COMMENT ON TABLE users IS 'Пользователи системы';
COMMENT ON TABLE items IS 'Номенклатура товаров/запчастей';
COMMENT ON TABLE movements IS 'Журнал перемещений товаров';
COMMENT ON TABLE sold_parts IS 'Проданные запчасти';
COMMENT ON TABLE garage_appointments IS 'Записи на обслуживание в гараж';
COMMENT ON TABLE item_photos IS 'Фотографии товаров';
COMMENT ON TABLE user_activity_logs IS 'Лог действий пользователей';
COMMENT ON TABLE system_logs IS 'Системные логи приложения';

COMMENT ON COLUMN garage_appointments.status IS 'scheduled=Запланирована, completed=Выполнена, cancelled=Отменена, no-show=Не явился';
COMMENT ON COLUMN counterparties.type IS 'physical=Физ. лицо, legal=Юр. лицо';
COMMENT ON COLUMN items.status IS 'warehouse=На складе, available=Доступно, reserved=Зарезервировано, sold=Продано, disposed=Списано';


-- ============================================================================
-- 11. GRANTS (Права доступа - опционально)
-- ============================================================================

-- Пример настройки прав (раскомментировать при необходимости)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ims_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ims_app;


-- ============================================================================
-- КОНЕЦ СКРИПТА
-- ============================================================================

-- Проверка успешного выполнения
SELECT 'Database initialization completed successfully!' AS status,
       NOW() AS completed_at;