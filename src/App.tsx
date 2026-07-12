import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import MaintenancePage from '@/features/maintenance/MaintenancePage';
import FuelPage from '@/features/fuel/FuelPage';

import VehiclesPage from '@/features/vehicles/VehiclesPage';

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="fuel" element={<FuelPage />} />
            </Route>
          </Routes>
        </Router>
        <Toaster richColors closeButton position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
