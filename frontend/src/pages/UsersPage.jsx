import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  ShieldIcon,
  ManagerIcon,
  UserIcon,
  PlusIcon,
  MailIcon,
  LockIcon,
  SearchIcon,
  RefreshIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  XCircleIcon
} from '../components/Icons';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // New user modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { addToast } = useToast();

  const fetchUsers = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await authService.getAllUsers();
      setUsers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      if (!isBackground) {
        addToast('Failed to load users list.', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchUsers(false);

    // Auto-refresh background polling every 3.5 seconds
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 3500);

    // Instant refresh when user returns to the tab
    const handleFocus = () => {
      fetchUsers(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUsers(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchUsers]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff'
    });
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Live password validation checks
  const pwd = formData.password;
  const hasMinLength = pwd.length >= 6;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const passwordsMatch = pwd.length > 0 && confirmPassword.length > 0 && pwd === confirmPassword;

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Please fill in all required user fields');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(
        'Password does not meet the complexity requirements (at least 6 characters with uppercase, lowercase, number, and symbol).'
      );
      return;
    }

    if (formData.password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match');
      return;
    }

    try {
      setFormLoading(true);
      await authService.register(formData);
      addToast(`User '${formData.name}' (${formData.role}) created successfully!`, 'success');
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create user account';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Filter users by search query and role
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query));

    const matchesRole = !roleFilter || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const staffCount = users.filter((u) => u.role === 'staff').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">User Directory & Role Access</h1>
            <div className="live-sync-indicator" title="Data automatically syncs in real-time">
              <span className="live-pulse-dot"></span>
              <span>Live Sync</span>
            </div>
          </div>
          <p className="page-subtitle">
            Admin console for managing system users, role permissions, and access credentials.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <PlusIcon size={16} />
          <span>Create New User</span>
        </button>
      </div>

      {/* User Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon rose">
            <ShieldIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{adminCount}</span>
            <span className="stat-label">Administrators</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon indigo">
            <ManagerIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{managerCount}</span>
            <span className="stat-label">Workshop Managers</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon emerald">
            <UserIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{staffCount}</span>
            <span className="stat-label">Frontdesk Staff</span>
          </div>
        </div>
      </div>

      {/* Search and Role Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-grid" style={{ gridTemplateColumns: '2fr 1fr auto' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="userSearch">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <SearchIcon size={13} /> Search by Name or Email
              </span>
            </label>
            <input
              id="userSearch"
              type="text"
              className="form-control"
              placeholder="Type user name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="roleFilterSelect">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldIcon size={13} /> Filter by Role
              </span>
            </label>
            <select
              id="roleFilterSelect"
              className="form-control"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles (Admin, Manager, Staff)</option>
              <option value="admin">Admin Only</option>
              <option value="manager">Manager Only</option>
              <option value="staff">Staff Only</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ width: '100%', height: '42px' }}
              title="Reset search and filters"
            >
              <RefreshIcon size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users directory...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <h3>No Users Found</h3>
          <p>
            {users.length === 0
              ? 'No user accounts found in the database.'
              : 'No users match your current search or role filter criteria.'}
          </p>
          {(searchQuery || roleFilter) && (
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email</th>
                <th>Account Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px' }}>
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span style={{ fontWeight: '700', color: '#fff' }}>{u.name}</span>
                    </div>
                  </td>

                  <td>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>

                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>

                  <td style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <PlusIcon size={20} />
            <span>Create User Account</span>
          </div>
        }
        maxWidth="580px"
      >
        {errorMessage && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fb7185',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleCreateUser}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="name">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserIcon size={14} /> Full Name *
              </span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-control"
              placeholder="e.g. Alex Rivera"
              value={formData.name}
              onChange={handleFormChange}
              required
              disabled={formLoading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="email">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <MailIcon size={14} /> Email Address *
              </span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="e.g. alex@workshop.com"
              value={formData.email}
              onChange={handleFormChange}
              required
              disabled={formLoading}
            />
          </div>

          {/* Password Input */}
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label" htmlFor="password">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <LockIcon size={14} /> Password *
              </span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter strong password"
                value={formData.password}
                onChange={handleFormChange}
                required
                disabled={formLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          {/* Live Password Validation Checklist */}
          {formData.password.length > 0 && (
            <div className="password-checklist" style={{ marginBottom: '1rem' }}>
              <div className="checklist-title">Password Requirements</div>
              <div className="checklist-grid">
                <div className={`checklist-item ${hasMinLength ? 'valid' : ''}`}>
                  <span className="checklist-dot"></span>
                  <span>Minimum 6 characters</span>
                </div>

                <div className={`checklist-item ${hasUppercase ? 'valid' : ''}`}>
                  <span className="checklist-dot"></span>
                  <span>1 Capital letter (A-Z)</span>
                </div>

                <div className={`checklist-item ${hasLowercase ? 'valid' : ''}`}>
                  <span className="checklist-dot"></span>
                  <span>1 Simple letter (a-z)</span>
                </div>

                <div className={`checklist-item ${hasNumber ? 'valid' : ''}`}>
                  <span className="checklist-dot"></span>
                  <span>1 Number (0-9)</span>
                </div>

                <div className={`checklist-item ${hasSpecial ? 'valid' : ''}`} style={{ gridColumn: 'span 2' }}>
                  <span className="checklist-dot"></span>
                  <span>1 Special symbol (@, #, $, %, etc.)</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password Input */}
          <div className="form-group" style={{ marginBottom: '1rem', marginTop: formData.password.length === 0 ? '0.5rem' : '0' }}>
            <label className="form-label" htmlFor="confirmPassword">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <LockIcon size={14} /> Confirm Password *
              </span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={formLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>

            {/* Live Match Feedback */}
            {confirmPassword.length > 0 && (
              <div
                className={`password-match-status ${
                  passwordsMatch ? 'match' : 'mismatch'
                }`}
              >
                {passwordsMatch ? (
                  <>
                    <CheckCircleIcon size={14} color="#34d399" />
                    <span>Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon size={14} color="#fb7185" />
                    <span>Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="role">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldIcon size={14} /> Assigned Role *
              </span>
            </label>
            <select
              id="role"
              name="role"
              className="form-control"
              value={formData.role}
              onChange={handleFormChange}
              disabled={formLoading}
            >
              <option value="staff">Staff (Register & Cancel Attendees)</option>
              <option value="manager">Manager (Create, Edit & Cancel Workshops)</option>
              <option value="admin">Admin (Full System & User Control)</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading || !isPasswordValid || !passwordsMatch}
            >
              {formLoading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create User</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
