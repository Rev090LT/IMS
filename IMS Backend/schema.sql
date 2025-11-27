-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
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
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Перемещения
CREATE TABLE movements (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    employee_id INT,
    action_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    comment TEXT,
    date TIMESTAMP DEFAULT NOW()
);