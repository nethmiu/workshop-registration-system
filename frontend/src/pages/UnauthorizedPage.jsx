import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldIcon } from '../components/Icons';

const UnauthorizedPage = () => {
  const { user } = useAuth();
  const returnPath = user?.role === 'admin' ? '/users' : '/workshops';
  const returnLabel = user?.role === 'admin' ? 'Return to User Directory' : 'Return to Workshops';

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#fb7185'
          }}
        >
          <ShieldIcon size={36} color="#fb7185" />
        </div>
        <h1 style={{ color: '#fb7185', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
          You do not have the required permissions to access this section based on your role ({user?.role || 'Guest'}).
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to={returnPath} className="btn btn-primary">
            {returnLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
