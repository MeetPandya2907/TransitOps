-- Seed Mock Data for Member 1 Testing

-- Clean existing mock data safely
DELETE FROM vehicles WHERE registration_number LIKE 'MOCK-%';
DELETE FROM drivers WHERE license_number LIKE 'MOCK-LIC-%';

-- Insert Mock Vehicles
INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, region, status) VALUES
('MOCK-1001', 'Ford Transit 350', 'Van', 2000, 15000, 45000, 'North', 'available'),
('MOCK-1002', 'Mercedes Sprinter', 'Van', 2200, 42000, 52000, 'South', 'available'),
('MOCK-2001', 'Volvo FH16', 'Heavy Truck', 25000, 120000, 150000, 'East', 'available'),
('MOCK-2002', 'Scania R500', 'Heavy Truck', 24000, 85000, 145000, 'West', 'available'),
('MOCK-3001', 'Isuzu NRR', 'Box Truck', 8000, 32000, 65000, 'Central', 'available');

-- Insert Mock Drivers
INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES
('John Smith', 'MOCK-LIC-001', 'CDL-A', '2028-05-15', '+1-555-0101', 98, 'available'),
('Sarah Connor', 'MOCK-LIC-002', 'CDL-B', '2027-11-20', '+1-555-0102', 100, 'available'),
('Marcus Johnson', 'MOCK-LIC-003', 'CDL-A', '2029-01-10', '+1-555-0103', 95, 'available'),
('Elena Rodriguez', 'MOCK-LIC-004', 'CDL-C', '2026-08-05', '+1-555-0104', 92, 'available'),
('David Chen', 'MOCK-LIC-005', 'CDL-A', '2030-03-22', '+1-555-0105', 99, 'available');
