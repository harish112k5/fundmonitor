import React from 'react';

/**
 * FormField — reusable labeled input/select/textarea with inline error
 * Usage:
 *   <FormField label="Full Name *" error={errors.name}>
 *     <input ... />
 *   </FormField>
 */
export function FormField({ label, error, children, style }) {
  return (
    <div style={{ marginBottom: '16px', ...style }}>
      <label style={{
        display: 'block', marginBottom: '6px',
        color: 'var(--text-label)', fontSize: '13px', fontWeight: '500'
      }}>
        {label}
      </label>
      {children}
      {error && (
        <div style={{
          marginTop: '4px', color: '#EF4444',
          fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

// Shared input style — use this everywhere
export const inputStyle = (hasError) => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-input, var(--glass-bg))',
  border: `1px solid ${hasError ? '#EF4444' : 'var(--border-input, var(--border-subtle))'}`,
  color: 'var(--text-primary)',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s',
});
