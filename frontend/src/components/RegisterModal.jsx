import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { registrationService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TicketIcon, UserIcon, MailIcon } from './Icons';

const RegisterModal = ({ isOpen, onClose, workshop, onSuccess }) => {
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setAttendeeName('');
      setAttendeeEmail('');
      setErrorMessage('');
    }
  }, [isOpen, workshop]);

  if (!workshop) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      setErrorMessage('Please enter both attendee name and email');
      return;
    }

    try {
      setLoading(true);
      await registrationService.registerAttendee({
        workshopId: workshop._id,
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim()
      });

      addToast(`Successfully registered ${attendeeName} for ${workshop.title}!`, 'success');
      onSuccess();
      onClose();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Registration failed. Please check workshop capacity and details.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const availableSeats = workshop.availableSeats ?? (workshop.capacity - (workshop.activeRegistrationsCount || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <TicketIcon size={22} color="var(--primary-400)" />
          <span>Register Attendee</span>
        </div>
      }
    >
      <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--primary-400)', fontWeight: '700' }}>
          {workshop.code}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: '0.2rem 0' }}>
          {workshop.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          <span>Instructor: {workshop.instructor}</span>
          <span style={{ color: availableSeats > 0 ? '#34d399' : '#fb7185', fontWeight: '700' }}>
            {availableSeats} seats remaining
          </span>
        </div>
      </div>

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

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="attendeeName">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserIcon size={14} /> Attendee Full Name *
            </span>
          </label>
          <input
            id="attendeeName"
            type="text"
            className="form-control"
            placeholder="e.g. Jane Doe"
            value={attendeeName}
            onChange={(e) => setAttendeeName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="attendeeEmail">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <MailIcon size={14} /> Attendee Email Address *
            </span>
          </label>
          <input
            id="attendeeEmail"
            type="email"
            className="form-control"
            placeholder="e.g. jane.doe@example.com"
            value={attendeeEmail}
            onChange={(e) => setAttendeeEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || availableSeats <= 0}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Registering...</span>
              </>
            ) : (
              <span>Confirm Registration</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RegisterModal;
