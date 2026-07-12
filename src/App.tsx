import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import MaintenancePage from '@/features/maintenance/MaintenancePage';
import FuelPage from '@/features/fuel/FuelPage';
import TripsPage from '@/features/trips/TripsPage';
import DriversPage from '@/features/drivers/DriversPage';
import VehiclesPage from '@/features/vehicles/VehiclesPage';
import ReportsPage from '@/features/reports/ReportsPage';
import PerformancePage from '@/features/reports/PerformancePage';
import FuelAnalyticsPage from '@/features/reports/FuelAnalyticsPage';
import SettingsPage from '@/features/settings/SettingsPage';
import AuthPage from '@/features/auth/AuthPage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="trips" element={<TripsPage />} />
                  <Route path="drivers" element={<DriversPage />} />
                  <Route path="vehicles" element={<VehiclesPage />} />
                  <Route path="maintenance" element={<MaintenancePage />} />
                  <Route path="fuel" element={<FuelPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="performance" element={<PerformancePage />} />
                  <Route path="fuel-analytics" element={<FuelAnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Routes>
          </Router>
          <Toaster richColors closeButton position="top-right" />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
