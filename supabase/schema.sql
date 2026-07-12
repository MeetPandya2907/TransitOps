-- Enable UUID extensions
create extension if not exists "uuid-ossp";

-- Drop types if they exist to prevent errors on re-run
drop type if exists public.user_role cascade;
drop type if exists public.vehicle_status cascade;
drop type if exists public.driver_status cascade;
drop type if exists public.trip_status cascade;

-- Drop tables if they exist to start fresh
drop table if exists public.expenses cascade;
drop table if exists public.fuel_logs cascade;
drop table if exists public.maintenance_logs cascade;
drop table if exists public.trips cascade;
drop table if exists public.drivers cascade;
drop table if exists public.vehicles cascade;
drop table if exists public.profiles cascade;

-- Create Role Enums
create type public.user_role as enum ('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst');

-- Create Status Enums
create type public.vehicle_status as enum ('Available', 'On Trip', 'In Shop', 'Retired');
create type public.driver_status as enum ('Available', 'On Trip', 'Off Duty', 'Suspended');
create type public.trip_status as enum ('Draft', 'Dispatched', 'Completed', 'Cancelled');

-- Profiles Table (holds users and their roles)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role user_role not null default 'Driver',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vehicles Table
create table public.vehicles (
  id uuid default gen_random_uuid() primary key,
  registration_number text unique not null,
  name text not null,
  type text not null,
  max_load_capacity numeric not null, -- in kg
  odometer numeric not null default 0, -- in km
  acquisition_cost numeric not null default 0,
  status vehicle_status not null default 'Available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Drivers Table
create table public.drivers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  license_number text not null,
  license_category text not null,
  license_expiry_date date not null,
  contact_number text not null,
  safety_score numeric not null default 100 check (safety_score >= 0 and safety_score <= 100),
  status driver_status not null default 'Available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trips Table
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  source text not null,
  destination text not null,
  vehicle_id uuid references public.vehicles(id) on delete restrict not null,
  driver_id uuid references public.drivers(id) on delete restrict not null,
  cargo_weight numeric not null,
  planned_distance numeric not null,
  status trip_status not null default 'Draft',
  actual_odometer_start numeric,
  actual_odometer_end numeric,
  fuel_consumed numeric, -- in liters
  revenue numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Maintenance Logs Table
create table public.maintenance_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete cascade not null,
  description text not null,
  cost numeric not null default 0,
  start_date date not null default current_date,
  end_date date,
  status text not null check (status in ('Active', 'Closed')) default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fuel Logs Table
create table public.fuel_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete set null,
  liters numeric not null,
  cost numeric not null,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- General Expenses Table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete set null,
  type text not null, -- 'Toll', 'Fuel', 'Maintenance', 'Insurance', 'Other'
  cost numeric not null,
  date date not null default current_date,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.trips enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.fuel_logs enable row level security;
alter table public.expenses enable row level security;

-- Function to get the role of the current user
create or replace function public.get_user_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer set search_path = public;

-- Profiles Policies
create policy "Allow users to read profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Allow users to update their own profile" on public.profiles for update using (auth.uid() = id);

-- Vehicles Policies
create policy "Allow authenticated users to view vehicles" on public.vehicles for select using (auth.role() = 'authenticated');
create policy "Allow Fleet Managers to manage vehicles" on public.vehicles for all using (public.get_user_role() = 'Fleet Manager');
create policy "Allow Drivers to update vehicle status and odometer" on public.vehicles for update using (public.get_user_role() = 'Driver');

-- Drivers Policies
create policy "Allow authenticated users to view drivers" on public.drivers for select using (auth.role() = 'authenticated');
create policy "Allow Fleet Managers to manage drivers" on public.drivers for all using (public.get_user_role() = 'Fleet Manager');
create policy "Allow Safety Officers to manage drivers" on public.drivers for all using (public.get_user_role() = 'Safety Officer');
create policy "Allow Drivers to update their status" on public.drivers for update using (public.get_user_role() = 'Driver');

-- Trips Policies
create policy "Allow authenticated users to view trips" on public.trips for select using (auth.role() = 'authenticated');
create policy "Allow Drivers to manage trips" on public.trips for all using (public.get_user_role() = 'Driver');
create policy "Allow Fleet Managers to manage trips" on public.trips for all using (public.get_user_role() = 'Fleet Manager');

-- Maintenance Logs Policies
create policy "Allow authenticated users to view maintenance" on public.maintenance_logs for select using (auth.role() = 'authenticated');
create policy "Allow Fleet Managers to manage maintenance" on public.maintenance_logs for all using (public.get_user_role() = 'Fleet Manager');

-- Fuel Logs Policies
create policy "Allow authenticated users to view fuel logs" on public.fuel_logs for select using (auth.role() = 'authenticated');
create policy "Allow Drivers to add fuel logs" on public.fuel_logs for insert with check (public.get_user_role() = 'Driver');
create policy "Allow Fleet Managers to manage fuel logs" on public.fuel_logs for all using (public.get_user_role() = 'Fleet Manager');
create policy "Allow Financial Analysts to view fuel logs" on public.fuel_logs for select using (public.get_user_role() = 'Financial Analyst');

-- Expenses Policies
create policy "Allow authenticated users to view expenses" on public.expenses for select using (auth.role() = 'authenticated');
create policy "Allow Fleet Managers to manage expenses" on public.expenses for all using (public.get_user_role() = 'Fleet Manager');
create policy "Allow Financial Analysts to manage expenses" on public.expenses for all using (public.get_user_role() = 'Financial Analyst');
create policy "Allow Drivers to insert expenses" on public.expenses for insert with check (public.get_user_role() = 'Driver');

-- Trigger to automatically create profile record when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'Driver'::public.user_role)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --- SEED DATA FOR TESTING ---
-- Insert Vehicles
INSERT INTO public.vehicles (id, registration_number, name, type, max_load_capacity, odometer, acquisition_cost, status) VALUES
('10000000-0000-0000-0000-000000000001', 'VAN-05', 'Ford Transit Van-05', 'Van', 500, 12500, 32000, 'Available'),
('10000000-0000-0000-0000-000000000002', 'TRK-12', 'Freightliner Heavy Truck', 'Truck', 5000, 85000, 110000, 'Available'),
('10000000-0000-0000-0000-000000000003', 'SUV-09', 'Chevrolet Suburban', 'SUV', 900, 43000, 58000, 'In Shop')
ON CONFLICT (registration_number) DO NOTHING;

-- Insert Drivers
INSERT INTO public.drivers (id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES
('20000000-0000-0000-0000-000000000001', 'Alex Johnson', 'CDL-A-89421', 'Class A CDL', '2027-10-15', '+1 (555) 019-2834', 95, 'Available'),
('20000000-0000-0000-0000-000000000002', 'Marcus Brody', 'CDL-B-43211', 'Class B CDL', '2026-08-30', '+1 (555) 021-9876', 88, 'Available'),
('20000000-0000-0000-0000-000000000003', 'Sarah Connor', 'DL-90812', 'Standard Class D', '2025-05-12', '+1 (555) 098-1122', 64, 'Suspended')
ON CONFLICT DO NOTHING;

-- Insert completed Trip
INSERT INTO public.trips (id, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, actual_odometer_start, actual_odometer_end, fuel_consumed, revenue) VALUES
('30000000-0000-0000-0000-000000000001', 'Chicago Hub', 'Detroit Terminal', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 4200, 450, 'Completed', 84550, 85000, 120, 2800)
ON CONFLICT DO NOTHING;

-- Insert Expense for Fuel
INSERT INTO public.expenses (id, vehicle_id, trip_id, type, cost, date, description) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Fuel', 160, CURRENT_DATE, 'Fuel consumption log for completed trip Chicago Hub to Detroit Terminal')
ON CONFLICT DO NOTHING;

-- Insert Maintenance Log
INSERT INTO public.maintenance_logs (id, vehicle_id, description, cost, start_date, status) VALUES
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Brake pad replacement and rotor turning', 450, CURRENT_DATE, 'Active')
ON CONFLICT DO NOTHING;
