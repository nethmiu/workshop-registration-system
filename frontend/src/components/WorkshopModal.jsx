import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { workshopService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { EditIcon, PlusIcon } from './Icons';

const WorkshopModal = ({ isOpen, onClose, workshop, onSuccess }) => {
  const isEditing = Boolean(workshop && workshop._id);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    instructor: '',
    dateTime: '',
    capacity: 20,
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (workshop && workshop._id) {
        let dateStr = '';
        if (workshop.dateTime) {
          const d = new Date(workshop.dateTime);
          const offset = d.getTimezoneOffset() * 60000;
          dateStr = new Date(d.getTime() - offset).toISOString().slice(0, 16);
        }

        setFormData({
          code: workshop.code || '',
          title: workshop.title || '',
          instructor: workshop.instructor || '',
          dateTime: dateStr,
          capacity: workshop.capacity || 20,
          status: workshop.status || 'active'
        });
      } else {
        const defaultDate = new Date(Date.now() + 86400000 * 3);
        const offset = defaultDate.getTimezoneOffset() * 60000;
        const dateStr = new Date(defaultDate.getTime() - offset).toISOString().slice(0, 16);

        setFormData({
          code: '',
          title: '',
          instructor: '',
          dateTime: dateStr,
          capacity: 25,
          status: 'active'
        });
      }
    }
  }, [isOpen, workshop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase().replace(/\s+/g, '-') : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.code.trim() || !formData.title.trim() || !formData.instructor.trim() || !formData.dateTime) {
      setErrorMessage('Please fill in all required workshop fields');
      return;
    }

    if (Number(formData.capacity) < 1) {
      setErrorMessage('Workshop capacity must be at least 1');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        capacity: Number(formData.capacity)
      };

      if (isEditing) {
        await workshopService.updateWorkshop(workshop._id, payload);
        addToast(`Workshop '${formData.title}' updated successfully!`, 'success');
      } else {
        await workshopService.createWorkshop(payload);
        addToast(`Workshop '${formData.title}' created successfully!`, 'success');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Failed to save workshop. Please verify details and uniqueness.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isEditing ? <EditIcon size={20} /> : <PlusIcon size={20} />}
          <span>{isEditing ? 'Edit Workshop' : 'Create New Workshop'}</span>
        </div>
      }
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

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="code">Workshop Code *</label>
          <input
            id="code"
            name="code"
            type="text"
            className="form-control"
            placeholder="e.g. REACT-2026, CLOUD-101"
            value={formData.code}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="title">Workshop Title *</label>
          <input
            id="title"
            name="title"
            type="text"
            className="form-control"
            placeholder="e.g. Masterclass on Distributed Systems"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="instructor">Instructor Name *</label>
          <input
            id="instructor"
            name="instructor"
            type="text"
            className="form-control"
            placeholder="e.g. Dr. Sarah Connor"
            value={formData.instructor}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="dateTime">Date & Time *</label>
            <input
              id="dateTime"
              name="dateTime"
              type="datetime-local"
              className="form-control"
              value={formData.dateTime}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="capacity">Seat Capacity *</label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              className="form-control"
              value={formData.capacity}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        {isEditing && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="status">Workshop Status</label>
            <select
              id="status"
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

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
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Create Workshop'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkshopModal;
