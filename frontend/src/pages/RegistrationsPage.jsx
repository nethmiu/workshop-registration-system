import React, { useState, useEffect, useCallback } from 'react';
import { registrationService, workshopService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RegisterModal from '../components/RegisterModal';
import CancelConfirmationModal from '../components/CancelConfirmationModal';
import {
  CheckCircleIcon,
  RefreshIcon,
  ChartIcon,
  PlusIcon
} from '../components/Icons';

const RegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchAttendee, setSearchAttendee] = useState('');

  // New Registration Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedWorkshopForReg, setSelectedWorkshopForReg] = useState(null);

  // Cancel Confirmation Modal state
  const [registrationToCancel, setRegistrationToCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { hasRole } = useAuth();
  const { addToast } = useToast();

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const params = {};
      if (selectedWorkshopId) params.workshopId = selectedWorkshopId;
      if (statusFilter) params.status = statusFilter;
      if (searchAttendee.trim()) params.attendeeEmail = searchAttendee.trim();

      const [regRes, wsRes] = await Promise.all([
        registrationService.getRegistrations(params),
        workshopService.getWorkshops({ status: 'active' })
      ]);

      setRegistrations(regRes.data || []);
      setWorkshops(wsRes.data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      if (!isBackground) {
        addToast('Failed to load registrations. Please retry.', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [selectedWorkshopId, statusFilter, searchAttendee, addToast]);

  useEffect(() => {
    fetchData(false);

    // Auto-refresh background polling every 3.5 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 3500);

    // Instant refresh when user returns to the tab
    const handleFocus = () => {
      fetchData(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchData]);

  const handleOpenCancelModal = (registration) => {
    setRegistrationToCancel(registration);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelRegistration = async (reason) => {
    if (!registrationToCancel) return;
    try {
      await registrationService.cancelRegistration(registrationToCancel._id, reason);
      addToast(
        `Registration for ${registrationToCancel.attendeeName} cancelled. Seat has been released!`,
        'success'
      );
      fetchData(false);
    } catch (error) {
      addToast(
        error.response?.data?.message || 'Failed to cancel registration',
        'error'
      );
      throw error;
    }
  };

  const handleOpenNewRegistration = () => {
    if (workshops.length === 0) {
      addToast('No active workshops available to register.', 'warning');
      return;
    }
    setSelectedWorkshopForReg(workshops[0]);
    setIsRegisterOpen(true);
  };

  // Stats
  const activeCount = registrations.filter((r) => r.status === 'active').length;
  const cancelledCount = registrations.filter((r) => r.status === 'cancelled').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">Registration History & Seats</h1>
            <div className="live-sync-indicator" title="Data automatically syncs in real-time">
              <span className="live-pulse-dot"></span>
              <span>Live Sync</span>
            </div>
          </div>
          <p className="page-subtitle">
            Track all active and cancelled registrations with complete audit trail.
          </p>
        </div>

        {hasRole('staff', 'manager') && (
          <button
            onClick={handleOpenNewRegistration}
            className="btn btn-primary"
          >
            <PlusIcon size={16} />
            <span>New Attendee Registration</span>
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon emerald">
            <CheckCircleIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{activeCount}</span>
            <span className="stat-label">Active Booked Seats</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rose">
            <RefreshIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{cancelledCount}</span>
            <span className="stat-label">Cancelled Registrations (History)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon indigo">
            <ChartIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{registrations.length}</span>
            <span className="stat-label">Total Registration Records</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-toolbar">
        <div className="filter-grid">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" htmlFor="wsSelect">Filter by Workshop</label>
            <select
              id="wsSelect"
              className="form-control"
              value={selectedWorkshopId}
              onChange={(e) => setSelectedWorkshopId(e.target.value)}
            >
              <option value="">All Workshops</option>
              {workshops.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.code} - {w.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="statusSelect">Registration Status</label>
            <select
              id="statusSelect"
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All (Active & Cancelled)</option>
              <option value="active">Active Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="attendeeSearch">Attendee Email</label>
            <input
              id="attendeeSearch"
              type="text"
              className="form-control"
              placeholder="Search by email..."
              value={searchAttendee}
              onChange={(e) => setSearchAttendee(e.target.value)}
            />
          </div>

          <div>
            <button
              onClick={() => {
                setSelectedWorkshopId('');
                setStatusFilter('');
                setSearchAttendee('');
              }}
              className="btn btn-secondary"
              style={{ width: '100%', height: '42px' }}
            >
              <RefreshIcon size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading registrations and audit records...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="empty-state">
          <h3>No Registration Records Found</h3>
          <p>There are no registrations matching the current criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Attendee Info</th>
                <th>Workshop</th>
                <th>Registered By</th>
                <th>Cancellation Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => {
                const isActive = reg.status === 'active';
                const regDate = new Date(reg.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const cancelDate = reg.updatedAt
                  ? new Date(reg.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : null;

                return (
                  <tr key={reg._id}>
                    <td>
                      <span
                        className={`badge ${
                          isActive ? 'badge-active' : 'badge-cancelled'
                        }`}
                      >
                        {isActive ? 'Active' : 'Cancelled'}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: '#fff' }}>
                        {reg.attendeeName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {reg.attendeeEmail}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-400)' }}>
                        {reg.workshopId?.code || 'N/A'}
                      </div>
                      <div style={{ fontWeight: '600' }}>
                        {reg.workshopId?.title || 'Unknown Workshop'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                        {reg.registeredBy?.name || 'System User'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {regDate}
                      </div>
                    </td>

                    <td>
                      {reg.status === 'cancelled' ? (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: '600' }}>
                            By {reg.cancelledBy?.name || 'Authorized Staff'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                            {cancelDate}
                          </div>
                          <div className="reason-pill-wrapper">
                            <span className="cancellation-reason-badge" title="Hover to view full reason">
                              Reason: {reg.cancelReason || 'Attendee requested cancellation'}
                            </span>
                            <div className="reason-tooltip-popup">
                              <div style={{ fontWeight: '700', marginBottom: '0.25rem', color: '#fb7185' }}>
                                Cancellation Reason:
                              </div>
                              <div>"{reg.cancelReason || 'Attendee requested cancellation'}"</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
                                Attendee: {reg.attendeeName} ({reg.attendeeEmail})
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                          —
                        </span>
                      )}
                    </td>

                    <td>
                      {isActive && hasRole('staff', 'manager') && (
                        <button
                          onClick={() => handleOpenCancelModal(reg)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                          title="Cancel registration and release seat"
                        >
                          <span>Cancel Seat</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Quick New Registration with workshop selection */}
      {selectedWorkshopForReg && (
        <RegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          workshop={selectedWorkshopForReg}
          onSuccess={fetchData}
        />
      )}

      {/* Red Themed Cancel Registration Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setRegistrationToCancel(null);
        }}
        onConfirm={handleConfirmCancelRegistration}
        itemType="registration"
        itemData={registrationToCancel}
      />
    </div>
  );
};

export default RegistrationsPage;
