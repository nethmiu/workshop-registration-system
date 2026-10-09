import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  ShieldIcon
} from '../components/Icons';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type}`}
            onClick={() => removeToast(toast.id)}
            role="alert"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {toast.type === 'success' && <CheckCircleIcon size={18} color="#34d399" />}
              {toast.type === 'error' && <XCircleIcon size={18} color="#fb7185" />}
              {toast.type === 'warning' && <AlertTriangleIcon size={18} color="#fbbf24" />}
              {toast.type === 'info' && <ShieldIcon size={18} color="#818cf8" />}
              <span>{toast.message}</span>
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
