-- 1. FIX TRIP LIFECYCLE TRIGGER
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
