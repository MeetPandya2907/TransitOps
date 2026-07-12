import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import VehiclesPage from '@/pages/Vehicles';
import DriversPage from '@/pages/Drivers';
import TripsPage from '@/pages/Trips';
import MaintenancePage from '@/pages/Maintenance';
import ReportsPage from '@/pages/Reports';
import LiveTrackingPage from '@/pages/LiveTracking';
import FuelExpensesPage from '@/pages/FuelExpenses';
import AlertsEventsPage from '@/pages/AlertsEvents';
import GeofencesPage from '@/pages/Geofences';
import DocumentsPage from '@/pages/Documents';
import SettingsPage from '@/pages/Settings';
import UsersRolesPage from '@/pages/UsersRoles';
import ComingSoon from '@/pages/ComingSoon'; // Keeping as fallback for completely unknown routes

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Operations */}
          <Route path="tracking" element={<LiveTrackingPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          
          {/* Management */}
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="fuel" element={<FuelExpensesPage />} />
          <Route path="alerts" element={<AlertsEventsPage />} />
          <Route path="geofences" element={<GeofencesPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          
          {/* Analytics */}
          <Route path="reports" element={<ReportsPage />} />
          
          {/* System */}
          <Route path="users" element={<UsersRolesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
