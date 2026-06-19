import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ActivateAccount from './pages/auth/ActivateAccount';
import InspectionFlow from './pages/inspector/InspectionFlow';

// New Roles Views
import SuperAdminDashboard from './pages/super_admin/Dashboard';
import BranchAdminDashboard from './pages/branch_admin/Dashboard';
import BranchTrainsManager from './pages/branch_admin/BranchTrainsManager';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorEngineers from './pages/supervisor/SupervisorEngineers';
import SupervisorAssignments from './pages/supervisor/SupervisorAssignments';
import EngineerDashboard from './pages/ground_engineer/Dashboard';
import EngineerHistory from './pages/ground_engineer/History';

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
    let homeUrl = '/login';
    if (user.role === 'super_admin') homeUrl = '/super-admin/dashboard';
    else if (user.role === 'branch_admin') homeUrl = '/branch-admin/dashboard';
    else if (user.role === 'supervisor') homeUrl = '/supervisor/dashboard';
    else if (user.role === 'ground_engineer') homeUrl = '/ground-engineer/dashboard';
    return <Navigate to={homeUrl} replace />;
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
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/activate-account/:token" element={<ActivateAccount />} />

            {/* Super Admin Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            </Route>

            {/* Branch Admin Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['branch_admin']} />}>
              <Route path="/branch-admin/dashboard" element={<BranchAdminDashboard />} />
              <Route path="/branch-admin/trains" element={<BranchTrainsManager />} />
            </Route>

            {/* Supervisor Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
              <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
              <Route path="/supervisor/ground-engineers" element={<SupervisorEngineers />} />
              <Route path="/supervisor/assignments" element={<SupervisorAssignments />} />
              <Route path="/supervisor/trains" element={<BranchTrainsManager />} />
            </Route>

            {/* Ground Engineer Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ground_engineer']} />}>
              <Route path="/ground-engineer/dashboard" element={<EngineerDashboard />} />
              <Route path="/ground-engineer/history" element={<EngineerHistory />} />
              <Route path="/ground-engineer/inspection/:sessionId" element={<InspectionFlow />} />
            </Route>

            {/* Default Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
}
