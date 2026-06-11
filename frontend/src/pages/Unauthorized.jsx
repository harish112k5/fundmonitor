import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', textAlign: 'center', padding: 40
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Access Denied
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
            You do not have permission to view this page. Contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'var(--text-accent)', color: '#000', border: 'none',
              borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </AnimatedItem>
    </PageWrapper>
  );
}
