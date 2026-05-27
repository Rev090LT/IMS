-- ============================================================================
-- IMS - Inventory Management System + CRM + Сервис
-- Скрипт инициализации базы данных PostgreSQL
-- Версия: 4.0 (Полная версия с исправлениями)
-- Последнее обновление: 2026-05-27
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS (Расширения PostgreSQL)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- 2. TABLES - Создаются в порядке зависимостей
-- ============================================================================

-- 2.1 Пользователи и аутентификация
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- admin, manager, master, user
    phone VARCHAR(20),
    full_name VARCHAR(255),
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

-- 2.3 Платформы автомобилей
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vehicle_platforms (
    id SERIAL PRIMARY KEY,
    platform_code VARCHAR(50) UNIQUE NOT NULL,
    platform_name VARCHAR(100),
    manufacturer VARCHAR(50),
    years_active INTEGER[],
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS car_platforms (
    id SERIAL PRIMARY KEY,
    car_id INTEGER,
    platform_code VARCHAR(50),
    platform_confidence VARCHAR(20) DEFAULT 'unknown',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.4 Автомобили в разборе
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(255) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    generation VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    engine_type VARCHAR(100),
    engine_volume DECIMAL(4,1),
    transmission VARCHAR(50),
    drive_type VARCHAR(50),
    body_type VARCHAR(50),
    mileage INTEGER,
    arrival_date DATE NOT NULL,
    purchase_price DECIMAL(10,2),
    status VARCHAR(30) DEFAULT 'active',
    location_id INTEGER,
    photos JSONB,
    documents JSONB,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS car_compatibility (
    id SERIAL PRIMARY KEY,
    source_car_id INTEGER NOT NULL,
    compatible_brand VARCHAR(100) NOT NULL,
    compatible_model VARCHAR(100) NOT NULL,
    compatible_generation VARCHAR(100),
    compatibility_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_car_id, compatible_brand, compatible_model, compatible_generation)
);

CREATE TABLE IF NOT EXISTS car_legal_info (
    id SERIAL PRIMARY KEY,
    car_id INTEGER UNIQUE NOT NULL,
    pts_number VARCHAR(50),
    sts_number VARCHAR(50),
    registration_number VARCHAR(20),
    owner_name VARCHAR(255),
    owner_inn VARCHAR(20),
    purchase_contract_number VARCHAR(50),
    purchase_contract_date DATE,
    customs_declaration VARCHAR(50),
    write_off_reason TEXT,
    write_off_date DATE,
    is_arrested BOOLEAN DEFAULT FALSE,
    is_zalogoviy BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 Контрагенты и поставщики (ОСНОВНАЯ таблица для клиентов)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS counterparties (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10) DEFAULT 'physical', -- physical, legal
    fio VARCHAR(255),
    company_name VARCHAR(255),
    inn VARCHAR(12),
    kpp VARCHAR(9),
    ogrn VARCHAR(13),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    legal_address TEXT,
    loyalty_level VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
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

-- 2.6 CRM - Клиенты (расширенная информация, опционально)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS crm_customers (
    id SERIAL PRIMARY KEY,
    counterparty_id INTEGER REFERENCES counterparties(id) ON DELETE SET NULL,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    loyalty_level VARCHAR(20) DEFAULT 'bronze',
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_visit_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.7 Товары (номенклатура)
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

-- 2.8 Фотографии товаров
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

-- 2.9 Перемещения товаров
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

-- 2.10 Продажи
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

-- 2.11 Записи в гараж
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

-- 2.12 CRM - Услуги и прайс-лист
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    labor_hours_standard DECIMAL(6,2),
    labor_hours DECIMAL(6,2),
    complexity_level VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    comment TEXT,
    additional TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.13 CRM - Заказ-наряды (ОСНОВНАЯ таблица сервиса)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES counterparties(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
    vehicle_info JSONB,
    status VARCHAR(30) DEFAULT 'draft',
    priority VARCHAR(20) DEFAULT 'normal',
    complaint TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    diagnostics TEXT,
    recommendations TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    promised_at TIMESTAMP,
    accepted_at TIMESTAMP,
    actual_ready_at TIMESTAMP,
    date_from TIMESTAMP,
    date_to TIMESTAMP,
    created_by INTEGER,
    accepted_by INTEGER,
    assigned_master INTEGER,
    assigned_bay INTEGER,
    master_id INTEGER,
    estimate_total DECIMAL(12,2),
    final_total DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    discount_type VARCHAR(20) DEFAULT 'none',
    discount_value DECIMAL(10,2) DEFAULT 0,
    discount_reason TEXT,
    warranty_months INTEGER DEFAULT 0,
    labor_hours_total DECIMAL(6,2) DEFAULT 0,
    parts_cost_total DECIMAL(12,2) DEFAULT 0,
    profit_margin DECIMAL(5,2)
);

-- 2.14 CRM - Позиции заказ-наряда (работы + запчасти)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS work_order_items (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    item_type VARCHAR(20),
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    part_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    quantity DECIMAL(10,3) DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'шт',
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    labor_hours DECIMAL(6,2),
    hourly_rate DECIMAL(10,2),
    part_number VARCHAR(255),
    manufacturer VARCHAR(255),
    part_source VARCHAR(20),
    part_status VARCHAR(20) DEFAULT 'pending',
    supplier_id INTEGER,
    purchase_price DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    performed_by INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.15 CRM - История изменений статусов заказ-наряда
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS work_order_status_history (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    notes TEXT,
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- 2.16 CRM - История изменений (детальная)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS work_order_history (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT NOW(),
    comment TEXT,
    attachment_url VARCHAR(500),
    attachment_type VARCHAR(20)
);

-- 2.17 CRM - Вложения (фото, документы)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS work_order_attachments (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    item_id INTEGER,
    attachment_type VARCHAR(30) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    taken_at TIMESTAMP,
    taken_by INTEGER,
    is_customer_visible BOOLEAN DEFAULT TRUE,
    is_internal BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 2.18 CRM - Оплаты и счета
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) UNIQUE,
    payment_method VARCHAR(30) NOT NULL,
    payment_date TIMESTAMP DEFAULT NOW(),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    transaction_id VARCHAR(100),
    card_mask VARCHAR(20),
    receipt_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'completed',
    processed_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.19 CRM - Уведомления клиентам
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_notifications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
    work_order_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
    notification_type VARCHAR(30) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    template_code VARCHAR(50),
    subject VARCHAR(255),
    message_body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    scheduled_for TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.20 Шаблоны услуг
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    default_labor_hours DECIMAL(6,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity_override DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(template_id, service_id)
);

-- 2.21 Логи и аудит
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
-- 3. INDEXES (Индексы для производительности)
-- ============================================================================

-- 3.1 Автомобили
CREATE INDEX IF NOT EXISTS idx_cars_vin ON cars(vin);
CREATE INDEX IF NOT EXISTS idx_cars_brand_model ON cars(brand, model);
CREATE INDEX IF NOT EXISTS idx_cars_arrival_date ON cars(arrival_date DESC);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_location ON cars(location_id);

-- 3.2 Товары
CREATE INDEX IF NOT EXISTS idx_items_qr_code ON items(qr_code);
CREATE INDEX IF NOT EXISTS idx_items_part_number ON items(part_number);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_location_id ON items(location_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- 3.3 Контрагенты
CREATE INDEX IF NOT EXISTS idx_counterparties_type ON counterparties(type);
CREATE INDEX IF NOT EXISTS idx_counterparties_phone ON counterparties(phone);
CREATE INDEX IF NOT EXISTS idx_counterparties_inn ON counterparties(inn);
CREATE INDEX IF NOT EXISTS idx_counterparties_loyalty ON counterparties(loyalty_level);

-- 3.4 Услуги
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_code ON services(service_code);

-- 3.5 Заказ-наряды
CREATE INDEX IF NOT EXISTS idx_wo_number ON work_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_wo_customer ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_wo_dates ON work_orders(created_at, completed_at);
CREATE INDEX IF NOT EXISTS idx_wo_master ON work_orders(assigned_master);
CREATE INDEX IF NOT EXISTS idx_wo_payment_status ON work_orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_woi_work_order ON work_order_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_woi_type ON work_order_items(item_type);
CREATE INDEX IF NOT EXISTS idx_woi_status ON work_order_items(status);
CREATE INDEX IF NOT EXISTS idx_woi_service ON work_order_items(service_id);
CREATE INDEX IF NOT EXISTS idx_woi_part ON work_order_items(part_id);

CREATE INDEX IF NOT EXISTS idx_wosh_work_order ON work_order_status_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wosh_date ON work_order_status_history(changed_at);

-- 3.6 Логи
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON user_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);


-- ============================================================================
-- 4. CONSTRAINTS (Проверочные ограничения)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_arrival_date_past') THEN
        ALTER TABLE cars ADD CONSTRAINT chk_arrival_date_past 
            CHECK (arrival_date <= CURRENT_DATE);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_item_status') THEN
        ALTER TABLE items ADD CONSTRAINT chk_item_status 
            CHECK (status IN ('warehouse', 'available', 'reserved', 'sold', 'disposed', 'active', 'inactive'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_counterparty_type') THEN
        ALTER TABLE counterparties ADD CONSTRAINT chk_counterparty_type 
            CHECK (type IN ('physical', 'legal'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_wo_status') THEN
        ALTER TABLE work_orders ADD CONSTRAINT chk_wo_status 
            CHECK (status IN ('draft', 'accepted', 'in_progress', 'waiting_parts', 'ready', 'completed', 'cancelled', 'archived'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_wo_priority') THEN
        ALTER TABLE work_orders ADD CONSTRAINT chk_wo_priority 
            CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_loyalty_level') THEN
        ALTER TABLE counterparties ADD CONSTRAINT chk_loyalty_level 
            CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum'));
    END IF;
END $$;


-- ============================================================================
-- 5. FUNCTIONS (Функции)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- 6. TRIGGERS (Триггеры)
-- ============================================================================

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

CREATE TRIGGER trg_work_orders_updated_at 
    BEFORE UPDATE ON work_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_work_order_items_updated_at 
    BEFORE UPDATE ON work_order_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 7. DEFAULT DATA (Стартовые данные)
-- ============================================================================

-- Администратор (пароль: admin123 - замените хэш на свой)
INSERT INTO users (username, email, password_hash, role, full_name) VALUES 
('admin', 'admin@ims.local', '$2b$10$YourHashedPasswordHere', 'admin', 'Администратор Системы')
ON CONFLICT (email) DO NOTHING;

-- Локации
INSERT INTO locations (name, description) VALUES 
('Основной склад', 'Главный склад компании'),
('Резервный склад', 'Дополнительное хранилище'),
('Зона приёма', 'Временное хранение новых поступлений'),
('Бокс №1', 'Пост для ремонта'),
('Бокс №2', 'Пост для диагностики')
ON CONFLICT (name) DO NOTHING;

-- Категории услуг
INSERT INTO categories (name, description) VALUES 
('Двигатель', 'Детали двигателя и системы'),
('Трансмиссия', 'КПП, сцепление, приводы'),
('Ходовая часть', 'Подвеска, рулевое управление'),
('Тормозная система', 'Тормоза и компоненты'),
('Электрика', 'Аккумуляторы, генераторы, стартеры'),
('Кузов', 'Детали кузова и остекление'),
('Расходные материалы', 'Масла, фильтры, жидкости')
ON CONFLICT (name) DO NOTHING;

-- Платформы автомобилей
INSERT INTO vehicle_platforms (platform_code, platform_name, manufacturer, years_active, description) VALUES
('FF-L', 'Nissan FF-L', 'Nissan', ARRAY[1994,2003], 'Cefiro A32, Maxima A32, Laurel'),
('MC', 'Toyota MC Platform', 'Toyota', ARRAY[1996,2006], 'Camry XV20, Avalon, Lexus ES300'),
('E39', 'BMW E39', 'BMW', ARRAY[1995,2003], 'BMW 5 Series (E39)'),
('W210', 'Mercedes W210', 'Mercedes-Benz', ARRAY[1995,2002], 'Mercedes E-Class W210'),
('PQ34', 'VW Group PQ34', 'Volkswagen', ARRAY[1997,2005], 'Golf IV, Audi A3, Octavia I')
ON CONFLICT (platform_code) DO NOTHING;

-- Услуги (прайс-лист)
INSERT INTO services (service_code, name, full_name, category, base_price, labor_hours_standard, is_active) VALUES
('DIAGNOSTICS', 'Диагностика', 'Диагностика автомобиля', 'Диагностика', 1500.00, 1.0, TRUE),
('TO-15000', 'ТО-15000', 'Техническое обслуживание 15000 км', 'Техническое обслуживание', 5000.00, 2.0, TRUE),
('OIL-CHANGE', 'Замена масла', 'Замена масла ДВС', 'Техническое обслуживание', 800.00, 0.5, TRUE),
('BRAKE-FRONT', 'Тормоза перед', 'Замена тормозных колодок (перед)', 'Тормозная система', 1200.00, 1.0, TRUE),
('SUSPENSION-REV', 'Ревизия подвески', 'Полная ревизия подвески', 'Ходовая часть', 2000.00, 2.0, TRUE)
ON CONFLICT (service_code) DO NOTHING;

-- Тестовый контрагент
INSERT INTO counterparties (type, fio, company_name, phone, email, loyalty_level) VALUES
('physical', 'Иванов Иван Иванович', NULL, '+79001234567', 'ivan@test.ru', 'bronze'),
('legal', NULL, 'ООО "АвтоСервис"', '+79009876543', 'info@avtoservice.ru', 'silver')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 8. COMMENTS (Комментарии к таблицам)
-- ============================================================================

COMMENT ON TABLE users IS 'Пользователи системы';
COMMENT ON TABLE items IS 'Номенклатура товаров/запчастей';
COMMENT ON TABLE movements IS 'Журнал перемещений товаров';
COMMENT ON TABLE sold_parts IS 'Проданные запчасти';
COMMENT ON TABLE garage_appointments IS 'Записи на обслуживание в гараж';
COMMENT ON TABLE work_orders IS 'Заказ-наряды на ремонт/обслуживание';
COMMENT ON TABLE work_order_items IS 'Позиции заказ-наряда (работы и запчасти)';
COMMENT ON TABLE work_order_status_history IS 'История изменений статусов заказ-нарядов';
COMMENT ON TABLE counterparties IS 'Контрагенты (физ. и юр. лица) - основная таблица клиентов';
COMMENT ON TABLE services IS 'Справочник услуг и прайс-лист';

COMMENT ON COLUMN counterparties.type IS 'physical=Физ. лицо, legal=Юр. лицо';
COMMENT ON COLUMN counterparties.loyalty_level IS 'bronze=Базовый, silver=Серебро, gold=Золото, platinum=Платина';
COMMENT ON COLUMN items.status IS 'warehouse=На складе, available=Доступно, reserved=Зарезервировано, sold=Продано, disposed=Списано';
COMMENT ON COLUMN work_orders.status IS 'draft=Черновик, accepted=Принят, in_progress=В работе, waiting_parts=Ждём запчасти, ready=Готов, completed=Завершён, cancelled=Отменён';
COMMENT ON COLUMN work_order_items.total_price IS 'Вычисляемое поле: quantity * unit_price';
COMMENT ON COLUMN work_order_items.item_type IS 'labor=Работа, part=Запчасть, material=Материал, service=Услуга';


-- ============================================================================
-- 9. ВИЗУАЛИЗАЦИЯ (Проверка успешного создания)
-- ============================================================================

SELECT '✅ Database initialization completed successfully!' AS status,
       NOW() AS completed_at,
       (SELECT COUNT(*) FROM users) as users_count,
       (SELECT COUNT(*) FROM items) as items_count,
       (SELECT COUNT(*) FROM cars) as cars_count,
       (SELECT COUNT(*) FROM work_orders) as work_orders_count,
       (SELECT COUNT(*) FROM counterparties) as counterparties_count,
       (SELECT COUNT(*) FROM services) as services_count,
       (SELECT COUNT(*) FROM locations) as locations_count;