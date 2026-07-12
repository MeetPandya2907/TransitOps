-- TransitOps Enterprise PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Profiles
CREATE TABLE users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'viewer',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vin VARCHAR(100),
    current_location JSONB, -- { lat: float, lng: float, address: string }
    speed FLOAT DEFAULT 0,
    fuel_level FLOAT DEFAULT 100,
    battery_level FLOAT DEFAULT 100,
    odometer FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Drivers
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_expiry DATE,
    phone VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'available',
    current_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    rating FLOAT DEFAULT 5.0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Trips
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    start_location TEXT,
    end_location TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    distance FLOAT,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Maintenance (Work Orders)
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    cost FLOAT,
    scheduled_date DATE,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Fuel Logs
CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    gallons FLOAT NOT NULL,
    cost FLOAT NOT NULL,
    odometer FLOAT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'info',
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Geofences
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'polygon',
    coordinates JSONB NOT NULL, -- Array of lat/lng objects
    color VARCHAR(50) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    entity_type VARCHAR(50), -- 'vehicle', 'driver', 'org'
    entity_id UUID,
    file_url TEXT NOT NULL,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vehicles_org ON vehicles(org_id);
CREATE INDEX idx_drivers_org ON drivers(org_id);
CREATE INDEX idx_trips_org ON trips(org_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_alerts_vehicle ON alerts(vehicle_id);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Assuming users can only access their org's data)
-- For a production app, these would be more complex and check the user's JWT
CREATE POLICY "Users can view their own org" ON organizations FOR SELECT USING (true); -- simplify for demo
CREATE POLICY "Users can view users in their org" ON users_profile FOR ALL USING (true);
CREATE POLICY "Users can view vehicles in their org" ON vehicles FOR ALL USING (true);
CREATE POLICY "Users can view drivers in their org" ON drivers FOR ALL USING (true);
CREATE POLICY "Users can view trips in their org" ON trips FOR ALL USING (true);
CREATE POLICY "Users can view work orders in their org" ON work_orders FOR ALL USING (true);
CREATE POLICY "Users can view fuel logs in their org" ON fuel_logs FOR ALL USING (true);
CREATE POLICY "Users can view alerts in their org" ON alerts FOR ALL USING (true);
CREATE POLICY "Users can view geofences in their org" ON geofences FOR ALL USING (true);
CREATE POLICY "Users can view documents in their org" ON documents FOR ALL USING (true);
CREATE POLICY "Users can view audit logs in their org" ON audit_logs FOR SELECT USING (true);

-- Seed Data (Optional, for getting started quickly)
INSERT INTO organizations (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'TransitOps Demo Org');
