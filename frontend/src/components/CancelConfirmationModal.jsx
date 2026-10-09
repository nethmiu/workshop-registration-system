import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { AlertTriangleIcon, BanIcon, CalendarIcon, UserIcon } from './Icons';

const registrationPresets = [
  'Attendee schedule conflict',
  'Emergency personal request',
  'Duplicate booking error',
  'Attendee requested cancellation & refund',
  'Incorrect workshop selected'
];

const workshopPresets = [
  'Instructor unavailable due to emergency',
  'Scheduling conflict / Date rearrangement',
  'Low participant registration count',
  'Venue or technical infrastructure issue',
  'Curriculum update required'
];

const CancelConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemType = 'registration', // 'registration' | 'workshop'
  itemData = null
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const presets = itemType === 'registration' ? registrationPresets : workshopPresets;

  useEffect(() => {
    if (isOpen) {
      setReason(itemType === 'registration' ? registrationPresets[0] : workshopPresets[0]);
      setErrorMessage('');
      setLoading(false);
    }
  }, [isOpen, itemType]);

  if (!isOpen || !itemData) return null;

  const handlePresetClick = (presetText) => {
    setReason(presetText);
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!reason.trim()) {
      setErrorMessage('Please provide a cancellation reason');
      return;
    }

    try {
      setLoading(true);
      await onConfirm(reason.trim());
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to complete cancellation.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const isReg = itemType === 'registration';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#fb7185' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.18)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BanIcon size={18} color="#fb7185" />
          </div>
          <span style={{ color: '#fff', fontWeight: '700' }}>
            {isReg ? 'Cancel Seat Registration' : 'Cancel Workshop'}
          </span>
        </div>
      }
      maxWidth="540px"
    >
      <div className="danger-modal-container">
        {/* Warning Banner */}
        <div className="danger-warning-banner">
          <AlertTriangleIcon size={20} color="#fb7185" />
          <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
            {isReg ? (
              <span>
                Cancelling this seat will immediately free up capacity and record this action in the audit log.
              </span>
            ) : (
              <span>
                Cancelling this workshop will mark it as cancelled, deactivate new registrations, and display the reason to attendees.
              </span>
            )}
          </div>
        </div>

        {/* Item Summary Box */}
        <div className="danger-item-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            {isReg ? <UserIcon size={15} color="var(--primary-400)" /> : <CalendarIcon size={15} color="var(--primary-400)" />}
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-subtle)', fontWeight: '700' }}>
              {isReg ? 'Attendee Details' : 'Workshop Details'}
            </span>
          </div>

          {isReg ? (
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>
                {itemData.attendeeName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {itemData.attendeeEmail}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-400)', marginTop: '0.35rem', fontWeight: '600' }}>
                Workshop: {itemData.workshopId?.code} - {itemData.workshopId?.title}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary-400)' }}>
                {itemData.code}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>
                {itemData.title}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Instructor: {itemData.instructor} • Capacity: {itemData.capacity} Seats
              </div>
            </div>
          )}
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

        <form onSubmit={handleConfirmSubmit}>
          {/* Quick Preset Badges */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '0.45rem' }}>
              Select Common Reason or Type Below:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`reason-chip ${reason === preset ? 'active' : ''}`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="cancelReasonInput">
              Cancellation Reason *
            </label>
            <textarea
              id="cancelReasonInput"
              rows="3"
              className="form-control"
              placeholder="Provide a clear reason for cancellation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={loading}
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Keep
            </button>
            <button
              type="submit"
              className="btn btn-danger-confirm"
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <BanIcon size={16} />
                  <span>{isReg ? 'Confirm Seat Cancellation' : 'Confirm Workshop Cancellation'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CancelConfirmationModal;
