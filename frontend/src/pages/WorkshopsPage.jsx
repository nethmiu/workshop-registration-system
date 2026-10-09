import React, { useState, useEffect, useCallback } from 'react';
import { workshopService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import WorkshopCard from '../components/WorkshopCard';
import RegisterModal from '../components/RegisterModal';
import WorkshopModal from '../components/WorkshopModal';
import CancelConfirmationModal from '../components/CancelConfirmationModal';
import {
  CalendarIcon,
  TicketIcon,
  SeatIcon,
  PlusIcon,
  SearchIcon,
  RefreshIcon
} from '../components/Icons';

const WorkshopsPage = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Modals state
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isWorkshopModalOpen, setIsWorkshopModalOpen] = useState(false);
  const [workshopToEdit, setWorkshopToEdit] = useState(null);
  const [workshopToCancel, setWorkshopToCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { hasRole } = useAuth();
  const { addToast } = useToast();

  const fetchWorkshops = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (onlyAvailable) params.onlyAvailable = true;

      const response = await workshopService.getWorkshops(params);
      setWorkshops(response.data || []);
    } catch (error) {
      console.error('Failed to fetch workshops:', error);
      if (!isBackground) {
        addToast('Failed to load workshops. Please retry.', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [search, status, startDate, endDate, onlyAvailable, addToast]);

  useEffect(() => {
    fetchWorkshops(false);

    // Auto-refresh background polling every 3.5 seconds
    const interval = setInterval(() => {
      fetchWorkshops(true);
    }, 3500);

    // Instant refresh when user returns to the tab
    const handleFocus = () => {
      fetchWorkshops(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchWorkshops(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchWorkshops]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setOnlyAvailable(false);
  };

  const handleRegisterClick = (workshop) => {
    setSelectedWorkshop(workshop);
    setIsRegisterOpen(true);
  };

  const handleAddWorkshopClick = () => {
    setWorkshopToEdit(null);
    setIsWorkshopModalOpen(true);
  };

  const handleEditClick = (workshop) => {
    setWorkshopToEdit(workshop);
    setIsWorkshopModalOpen(true);
  };

  const handleCancelWorkshop = (workshop) => {
    setWorkshopToCancel(workshop);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelWorkshop = async (reason) => {
    if (!workshopToCancel) return;
    try {
      await workshopService.cancelWorkshop(workshopToCancel._id, reason);
      addToast(`Workshop '${workshopToCancel.title}' has been cancelled.`, 'warning');
      fetchWorkshops(false);
    } catch (error) {
      addToast(
        error.response?.data?.message || 'Failed to cancel workshop',
        'error'
      );
      throw error;
    }
  };

  // Compute Overall Stats
  const totalWorkshops = workshops.length;
  const activeWorkshops = workshops.filter((w) => w.status === 'active').length;
  const totalCapacity = workshops.reduce((acc, w) => acc + (w.capacity || 0), 0);
  const totalBooked = workshops.reduce(
    (acc, w) => acc + (w.activeRegistrationsCount || 0),
    0
  );
  const totalAvailable = Math.max(0, totalCapacity - totalBooked);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">Workshops & Capacity</h1>
            <div className="live-sync-indicator" title="Data automatically syncs in real-time">
              <span className="live-pulse-dot"></span>
              <span>Live Sync</span>
            </div>
          </div>
          <p className="page-subtitle">
            Browse available workshops, monitor real-time seat capacities, and register attendees.
          </p>
        </div>

        {hasRole('manager') && (
          <button
            onClick={handleAddWorkshopClick}
            className="btn btn-primary"
          >
            <PlusIcon size={16} />
            <span>Add New Workshop</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon indigo">
            <CalendarIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{activeWorkshops}</span>
            <span className="stat-label">Active Workshops ({totalWorkshops} total)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon emerald">
            <TicketIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalBooked}</span>
            <span className="stat-label">Active Registrations</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <SeatIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalAvailable}</span>
            <span className="stat-label">Seats Remaining ({totalCapacity} Total)</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-toolbar">
        <div className="filter-grid">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" htmlFor="search">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <SearchIcon size={13} /> Search Workshops
              </span>
            </label>
            <input
              id="search"
              type="text"
              className="form-control"
              placeholder="Search by code, title, instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="startDate">From Date</label>
            <input
              id="startDate"
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="endDate">To Date</label>
            <input
              id="endDate"
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="filter-toggle-group">
            <input
              type="checkbox"
              id="onlyAvailableCheck"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            <label htmlFor="onlyAvailableCheck" className="filter-toggle-label">
              Available Seats Only
            </label>
          </div>

          <div>
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ width: '100%', height: '42px' }}
            >
              <RefreshIcon size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workshop List Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading workshops and real-time seat availability...</p>
        </div>
      ) : workshops.length === 0 ? (
        <div className="empty-state">
          <h3>No Workshops Found</h3>
          <p>Try adjusting your search criteria or date filters.</p>
          <button
            onClick={handleResetFilters}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '1rem' }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="workshops-grid">
          {workshops.map((workshop) => (
            <WorkshopCard
              key={workshop._id}
              workshop={workshop}
              onRegisterClick={handleRegisterClick}
              onEditClick={handleEditClick}
              onCancelClick={handleCancelWorkshop}
            />
          ))}
        </div>
      )}

      {/* Register Attendee Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        workshop={selectedWorkshop}
        onSuccess={fetchWorkshops}
      />

      {/* Create / Edit Workshop Modal */}
      <WorkshopModal
        isOpen={isWorkshopModalOpen}
        onClose={() => setIsWorkshopModalOpen(false)}
        workshop={workshopToEdit}
        onSuccess={fetchWorkshops}
      />

      {/* Red Themed Workshop Cancel Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setWorkshopToCancel(null);
        }}
        onConfirm={handleConfirmCancelWorkshop}
        itemType="workshop"
        itemData={workshopToCancel}
      />
    </div>
  );
};

export default WorkshopsPage;
