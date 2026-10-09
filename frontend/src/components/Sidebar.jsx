import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  LogoIcon,
  CalendarIcon,
  TicketIcon,
  UsersIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon
} from './Icons';

const Sidebar = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    addToast('You have been logged out successfully', 'info');
    navigate('/login', { replace: true, state: null });
  };

  if (!isAuthenticated) {
    return null;
  }

  const defaultHomeLink = user?.role === 'admin' ? '/users' : '/workshops';

  return (
    <>
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <NavLink to={defaultHomeLink} className="brand-logo">
          <div className="brand-icon">
            <LogoIcon size={22} color="#fff" />
          </div>
          <span>WorkshopFlow</span>
        </NavLink>
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <NavLink to={defaultHomeLink} className="brand-logo">
            <div className="brand-icon">
              <LogoIcon size={22} color="#fff" />
            </div>
            <div className="brand-text">
              <span className="brand-title">WorkshopFlow</span>
              <span className="brand-subtitle">
                {user?.role === 'admin' ? 'Admin Management' : 'Capacity & Registration'}
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Links */}
        <div className="sidebar-nav-container">
          <div className="sidebar-section-title">MAIN MENU</div>
          <nav className="sidebar-nav">
            {/* Manager and Staff navigation */}
            {hasRole('manager', 'staff') && (
              <>
                <NavLink
                  to="/workshops"
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="sidebar-icon">
                    <CalendarIcon size={18} />
                  </span>
                  <span className="sidebar-label">Workshops</span>
                </NavLink>

                <NavLink
                  to="/registrations"
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="sidebar-icon">
                    <TicketIcon size={18} />
                  </span>
                  <span className="sidebar-label">Registrations</span>
                </NavLink>
              </>
            )}

            {/* Admin exclusive navigation */}
            {hasRole('admin') && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-icon">
                  <UsersIcon size={18} />
                </span>
                <span className="sidebar-label">Users & Access</span>
              </NavLink>
            )}
          </nav>

          {/* Role Status Card */}
          <div className="sidebar-info-card">
            <div className="sidebar-info-header">
              <span className="sidebar-status-dot"></span>
              <span>{user?.role === 'admin' ? 'Admin Mode' : 'System Live'}</span>
            </div>
            <p className="sidebar-info-text">
              {user?.role === 'admin'
                ? 'User account management & role provisioning access.'
                : 'Real-time seat tracking & concurrent capacity control.'}
            </p>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name" title={user?.name}>
                {user?.name || 'User'}
              </span>
              <div className="sidebar-user-meta">
                <span className={`badge badge-${user?.role}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Sign out of account"
          >
            <LogoutIcon size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
