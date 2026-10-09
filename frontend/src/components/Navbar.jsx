import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  LogoIcon,
  CalendarIcon,
  TicketIcon,
  UsersIcon,
  LogoutIcon
} from './Icons';

const Navbar = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('You have been logged out successfully', 'info');
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/workshops" className="brand-logo">
          <div className="brand-icon">
            <LogoIcon size={22} color="#fff" />
          </div>
          <span>WorkshopFlow</span>
        </NavLink>

        <nav>
          <ul className="nav-links">
            <li>
              <NavLink
                to="/workshops"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <CalendarIcon size={16} />
                <span>Workshops</span>
              </NavLink>
            </li>

            {(hasRole('staff', 'manager', 'admin')) && (
              <li>
                <NavLink
                  to="/registrations"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <TicketIcon size={16} />
                  <span>Registrations</span>
                </NavLink>
              </li>
            )}

            {hasRole('admin') && (
              <li>
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <UsersIcon size={16} />
                  <span>Users & Access</span>
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="user-nav-section">
          <div className="user-badge">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="user-name">{user?.name}</span>
            <span className={`badge badge-${user?.role}`}>
              {user?.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            title="Sign out of system"
          >
            <LogoutIcon size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
