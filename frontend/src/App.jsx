import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import WorkshopsPage from './pages/WorkshopsPage';
import RegistrationsPage from './pages/RegistrationsPage';
import UsersPage from './pages/UsersPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Component to dynamically route root path based on user role
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/users" replace />;
  return <Navigate to="/workshops" replace />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className={`app-layout ${isAuthenticated ? 'has-sidebar' : ''}`}>
      <Sidebar />
      <main className="main-content-wrapper">
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Workshops View (Strictly Manager and Staff only) */}
          <Route
            path="/workshops"
            element={
              <ProtectedRoute allowedRoles={['manager', 'staff']}>
                <WorkshopsPage />
              </ProtectedRoute>
            }
          />

          {/* Registrations View (Strictly Manager and Staff only) */}
          <Route
            path="/registrations"
            element={
              <ProtectedRoute allowedRoles={['manager', 'staff']}>
                <RegistrationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin User Management (Strictly Admin only) */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* 403 Forbidden Route */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Default Role-Based Fallback Redirects */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;