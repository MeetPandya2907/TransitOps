import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import { Trips } from './pages/Trips';
import { Maintenance } from './pages/Maintenance';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login path */}
          <Route path="/login" element={<Login />} />

          {/* Secure application paths */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard View (available to all roles) */}
            <Route index element={<Dashboard />} />

            {/* Vehicles View (available to all roles) */}
            <Route path="vehicles" element={<Vehicles />} />

            {/* Drivers View (Fleet Manager and Safety Officer) */}
            <Route
              path="drivers"
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Safety Officer']}>
                  <Drivers />
                </ProtectedRoute>
              }
            />

            {/* Trips View (Fleet Manager and Driver) */}
            <Route
              path="trips"
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Driver']}>
                  <Trips />
                </ProtectedRoute>
              }
            />

            {/* Maintenance View (Fleet Manager only) */}
            <Route
              path="maintenance"
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager']}>
                  <Maintenance />
                </ProtectedRoute>
              }
            />

            {/* Expenses View (Fleet Manager, Driver, Financial Analyst) */}
            <Route
              path="expenses"
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Driver', 'Financial Analyst']}>
                  <Expenses />
                </ProtectedRoute>
              }
            />

            {/* Reports View (Fleet Manager and Financial Analyst) */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect undefined routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
