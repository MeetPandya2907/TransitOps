-- TransitOps Unified Database Schema

-- Enums
CREATE TYPE vehicle_status AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE driver_status AS ENUM ('available', 'on_trip', 'off_duty', 'suspended');
CREATE TYPE trip_status AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('pending', 'active', 'completed');

-- Profiles (Member 1)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Vehicles & Drivers (Member 3)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    name_model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    max_load_capacity NUMERIC NOT NULL CHECK (max_load_capacity > 0),
    odometer NUMERIC NOT NULL DEFAULT 0,
    acquisition_cost NUMERIC,
    region VARCHAR(100),
    status vehicle_status DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_category VARCHAR(10),
    license_expiry_date DATE NOT NULL,
    contact_number VARCHAR(50),
    safety_score NUMERIC DEFAULT 100,
    status driver_status DEFAULT 'available',
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips (Member 1)
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
    cargo_weight NUMERIC NOT NULL,
    planned_distance NUMERIC NOT NULL,
    final_odometer NUMERIC,
    fuel_consumed NUMERIC,
    revenue NUMERIC,
    status trip_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    dispatched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

CREATE TABLE trip_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    previous_status trip_status,
    new_status trip_status NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Maintenance & Logs (Member 4)
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0,
    status maintenance_status DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    liters NUMERIC NOT NULL,
    cost NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_maintenance_vehicle_id ON maintenance_logs(vehicle_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users Update Own Profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Drivers RLS
CREATE POLICY "Manage Drivers" ON drivers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Fleet Manager', 'FleetManager', 'Dispatcher')
  )
);
CREATE POLICY "Driver Read Own Data" ON drivers FOR SELECT USING (user_id = auth.uid());

-- Trips RLS
CREATE POLICY "Manage Trips" ON trips FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name IN ('Fleet Manager', 'FleetManager', 'Dispatcher')
  )
);
CREATE POLICY "Driver Read Own Trips" ON trips FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM drivers d WHERE d.id = trips.driver_id AND d.user_id = auth.uid()
  )
);

-- Triggers for Business Rules
CREATE OR REPLACE FUNCTION handle_trip_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'dispatched' AND OLD.status = 'draft' THEN
        UPDATE vehicles SET status = 'on_trip' WHERE id = NEW.vehicle_id;
        UPDATE drivers SET status = 'on_trip' WHERE id = NEW.driver_id;
        NEW.dispatched_at = NOW();
    ELSIF NEW.status = 'completed' AND OLD.status = 'dispatched' THEN
        UPDATE vehicles SET status = 'available', odometer = NEW.final_odometer WHERE id = NEW.vehicle_id;
        UPDATE drivers SET status = 'available' WHERE id = NEW.driver_id;
        NEW.completed_at = NOW();
    ELSIF NEW.status = 'cancelled' AND OLD.status = 'dispatched' THEN
        UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
        UPDATE drivers SET status = 'available' WHERE id = NEW.driver_id;
    END IF;

    INSERT INTO trip_history (trip_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trip_status
BEFORE UPDATE ON trips
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION handle_trip_status_change();

-- 2. MAINTENANCE LIFECYCLE TRIGGERS
CREATE OR REPLACE FUNCTION handle_maintenance_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE vehicles SET status = 'in_shop' WHERE id = NEW.vehicle_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.end_date IS NOT NULL AND OLD.end_date IS NULL THEN
        UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maintenance_status ON maintenance_logs;
CREATE TRIGGER trg_maintenance_status
AFTER INSERT OR UPDATE ON maintenance_logs
FOR EACH ROW EXECUTE FUNCTION handle_maintenance_status_change();

-- 3. PRE-DISPATCH VALIDATION TRIGGER
CREATE OR REPLACE FUNCTION validate_trip_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_max_capacity NUMERIC;
    v_vehicle_status VARCHAR;
    d_status VARCHAR;
    d_license_expiry DATE;
BEGIN
    -- Check Vehicle
    SELECT max_load_capacity, status INTO v_max_capacity, v_vehicle_status FROM vehicles WHERE id = NEW.vehicle_id;
    IF NEW.cargo_weight > v_max_capacity THEN
        RAISE EXCEPTION 'Cargo weight (%) exceeds vehicle maximum capacity (%)', NEW.cargo_weight, v_max_capacity;
    END IF;
    
    -- When moving to Dispatched, strictly check Availability
    IF NEW.status = 'dispatched' AND OLD.status = 'draft' THEN
        IF v_vehicle_status != 'available' THEN
            RAISE EXCEPTION 'Vehicle is not available for dispatch. Current status: %', v_vehicle_status;
        END IF;

        SELECT status, license_expiry_date INTO d_status, d_license_expiry FROM drivers WHERE id = NEW.driver_id;
        IF d_status != 'available' THEN
            RAISE EXCEPTION 'Driver is not available for dispatch. Current status: %', d_status;
        END IF;
        IF d_license_expiry < CURRENT_DATE THEN
            RAISE EXCEPTION 'Driver license is expired.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_trip ON trips;
CREATE TRIGGER trg_validate_trip
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION validate_trip_rules();

-- Auto-create profile and assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  role_id UUID;
  requested_role TEXT;
BEGIN
  -- Extract requested role from user metadata, default to Driver
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Driver');

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  -- Get the role ID
  SELECT id INTO role_id FROM public.roles WHERE name = requested_role;
  
  -- If role exists, assign it
  IF role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id) VALUES (NEW.id, role_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vehicle Analytics View
CREATE OR REPLACE VIEW vehicle_analytics AS
SELECT 
    v.*,
    COALESCE(t.total_revenue, 0) AS total_revenue,
    COALESCE(m.total_maintenance_cost, 0) AS total_maintenance_cost,
    COALESCE(f.total_fuel_cost, 0) AS total_fuel_cost,
    (COALESCE(m.total_maintenance_cost, 0) + COALESCE(f.total_fuel_cost, 0)) AS operational_cost,
    CASE 
        WHEN v.acquisition_cost > 0 THEN 
            (COALESCE(t.total_revenue, 0) - (COALESCE(m.total_maintenance_cost, 0) + COALESCE(f.total_fuel_cost, 0))) / v.acquisition_cost
        ELSE 0 
    END AS roi,
    COALESCE(t.total_distance, 0) AS total_distance,
    COALESCE(f.total_liters, 0) AS total_liters,
    CASE 
        WHEN COALESCE(f.total_liters, 0) > 0 THEN COALESCE(t.total_distance, 0) / f.total_liters
        ELSE 0 
    END AS fuel_efficiency
FROM vehicles v
LEFT JOIN (
    SELECT vehicle_id, SUM(revenue) as total_revenue, SUM(planned_distance) as total_distance 
    FROM trips WHERE status = 'completed' GROUP BY vehicle_id
) t ON v.id = t.vehicle_id
LEFT JOIN (
    SELECT vehicle_id, SUM(cost) as total_maintenance_cost 
    FROM maintenance_logs GROUP BY vehicle_id
) m ON v.id = m.vehicle_id
LEFT JOIN (
    SELECT vehicle_id, SUM(cost) as total_fuel_cost, SUM(liters) as total_liters
    FROM fuel_logs GROUP BY vehicle_id
) f ON v.id = f.vehicle_id;
