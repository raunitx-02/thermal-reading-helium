import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAlerts from './pages/admin/Alerts';
import AdminTrains from './pages/admin/Trains';
import AdminUsers from './pages/admin/Users';
import AdminKpis from './pages/admin/Kpis';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminAuditLogs from './pages/admin/AuditLogs';

import InspectorDashboard from './pages/inspector/Dashboard';
import InspectionFlow from './pages/inspector/InspectionFlow';
import InspectorHistory from './pages/inspector/History';
import InspectorKpi from './pages/inspector/Kpi';

// Route Guards
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        <span>Authenticating...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/inspector/dashboard'} replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/alerts" element={<AdminAlerts />} />
            <Route path="/admin/trains" element={<AdminTrains />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/kpis" element={<AdminKpis />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* Inspector Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['inspector']} />}>
            <Route path="/inspector/dashboard" element={<InspectorDashboard />} />
            <Route path="/inspector/inspection/:sessionId" element={<InspectionFlow />} />
            <Route path="/inspector/history" element={<InspectorHistory />} />
            <Route path="/inspector/kpi" element={<InspectorKpi />} />
            {/* Redirect /inspector/new-inspection directly to dashboard to pick a train */}
            <Route path="/inspector/new-inspection" element={<Navigate to="/inspector/dashboard" replace />} />
          </Route>

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
