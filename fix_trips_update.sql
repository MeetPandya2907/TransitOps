-- ============================================================
-- SQL SCRIPT: FIX UPDATE RLS POLICY FOR TRIPS
-- ============================================================

-- This policy allows your dashboard to successfully update a trip's status
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public update trips" ON trips;
CREATE POLICY "Allow public update trips" ON trips FOR UPDATE USING (true);
