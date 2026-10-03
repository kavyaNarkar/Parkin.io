-- SmartPark Database Schema Migration V1
-- H2 & PostgreSQL Compatible ANSI SQL

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'DRIVER', -- DRIVER, OPERATOR, ADMIN
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISABLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (email);

-- 2. Parking Lots / Facilities Table
CREATE TABLE IF NOT EXISTS parking_lots (
    id UUID DEFAULT random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    opening_time VARCHAR(10) DEFAULT '00:00',
    closing_time VARCHAR(10) DEFAULT '23:59',
    time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Zones Table
CREATE TABLE IF NOT EXISTS zones (
    id UUID DEFAULT random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    floor_label VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Parking Slots Table
CREATE TABLE IF NOT EXISTS parking_slots (
    id UUID DEFAULT random_uuid() PRIMARY KEY,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    facility_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    slot_code VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL DEFAULT 'CAR', -- CAR, BIKE, EV, ACCESSIBLE
    operational_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, OUT_OF_SERVICE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_facility_slot_code UNIQUE (facility_id, slot_code)
);

CREATE INDEX IF NOT EXISTS idx_slots_facility_status ON parking_slots (facility_id, operational_status);

-- 5. Rates / Pricing Rules Table
CREATE TABLE IF NOT EXISTS rates (
    id UUID DEFAULT random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    unit VARCHAR(20) DEFAULT 'HOURLY', -- HOURLY, DAILY, FIXED
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE
);

-- 6. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    slot_id UUID NOT NULL REFERENCES parking_slots(id) ON DELETE RESTRICT,
    facility_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE RESTRICT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'HELD', -- HELD, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, EXPIRED, NO_SHOW
    hold_expires_at TIMESTAMP WITH TIME ZONE,
    total_amount DECIMAL(10, 2),
    idempotency_key VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reservation_time CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_reservations_slot_times ON reservations (slot_id, start_at, end_at, status);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations (user_id, created_at);

-- 7. Payments Table (Optional Integration)
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT random_uuid() PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
    provider_ref VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, REFUNDED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT random_uuid() PRIMARY KEY,
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    metadata TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
