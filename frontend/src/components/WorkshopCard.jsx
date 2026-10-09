import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  InstructorIcon,
  CalendarIcon,
  TicketIcon,
  EditIcon,
  BanIcon
} from './Icons';

const WorkshopCard = ({
  workshop,
  onRegisterClick,
  onEditClick,
  onCancelClick
}) => {
  const { hasRole } = useAuth();

  const formattedDate = new Date(workshop.dateTime).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = new Date(workshop.dateTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const activeCount = workshop.activeRegistrationsCount ?? 0;
  const totalCapacity = workshop.capacity ?? 1;
  const availableSeats = workshop.availableSeats ?? Math.max(0, totalCapacity - activeCount);
  const isFull = availableSeats <= 0;
  const isCancelled = workshop.status === 'cancelled';

  const fillPercentage = Math.min(100, Math.round((activeCount / totalCapacity) * 100));

  let progressColor = 'safe';
  if (fillPercentage >= 90) {
    progressColor = 'danger';
  } else if (fillPercentage >= 65) {
    progressColor = 'warning';
  }

  return (
    <div className={`workshop-card ${isCancelled ? 'cancelled' : ''}`}>
      <div>
        <div className="workshop-card-header">
          <span className="workshop-code">{workshop.code}</span>
          <span className={`badge ${isCancelled ? 'badge-cancelled' : isFull ? 'badge-full' : 'badge-active'}`}>
            {isCancelled ? 'Cancelled' : isFull ? 'Full' : 'Active'}
          </span>
        </div>

        <h3 className="workshop-title">{workshop.title}</h3>

        <div className="workshop-meta" style={{ marginTop: '0.85rem' }}>
          <div className="workshop-meta-item">
            <InstructorIcon size={16} color="var(--primary-400)" />
            <span>Instructor: <strong>{workshop.instructor}</strong></span>
          </div>

          <div className="workshop-meta-item">
            <CalendarIcon size={16} color="var(--primary-400)" />
            <span>{formattedDate} at {formattedTime}</span>
          </div>
        </div>

        {isCancelled && (
          <div className="workshop-cancellation-notice" title={`Reason: ${workshop.cancelReason || 'Cancelled by manager'}`}>
            <div className="cancellation-notice-header">
              <BanIcon size={14} color="#fb7185" />
              <span>Cancelled by Manager</span>
            </div>
            <p className="cancellation-reason-text">
              <strong>Reason:</strong> {workshop.cancelReason || 'Administrative cancellation'}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Capacity Meter */}
        <div className="capacity-box">
          <div className="capacity-header">
            <span style={{ color: 'var(--text-muted)' }}>Seat Allocation</span>
            <span style={{ color: isFull ? '#fbbf24' : '#34d399', fontWeight: '700' }}>
              {isFull ? '0 Seats Left' : `${availableSeats} Seats Available`}
            </span>
          </div>

          <div className="progress-bar-bg">
            <div
              className={`progress-bar-fill ${progressColor}`}
              style={{ width: `${fillPercentage}%` }}
            ></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--text-subtle)' }}>
            <span>{activeCount} Booked</span>
            <span>Max Capacity: {totalCapacity}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="workshop-card-actions">
          {hasRole('staff', 'manager') && !isCancelled && (
            <button
              onClick={() => onRegisterClick(workshop)}
              className="btn btn-primary btn-sm"
              disabled={isFull}
              style={{ flex: 1 }}
            >
              <TicketIcon size={15} />
              <span>{isFull ? 'Sold Out' : 'Register Attendee'}</span>
            </button>
          )}

          {hasRole('manager') && (
            <>
              <button
                onClick={() => onEditClick(workshop)}
                className="btn btn-secondary btn-sm"
                title="Edit workshop details"
              >
                <EditIcon size={14} />
                <span>Edit</span>
              </button>

              {!isCancelled && (
                <button
                  onClick={() => onCancelClick(workshop)}
                  className="btn btn-secondary btn-sm"
                  title="Cancel this workshop"
                  style={{ color: '#fb7185' }}
                >
                  <BanIcon size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopCard;
