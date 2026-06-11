import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/audit-log?limit=200')
      .then(r => setData(r.data.data || r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'ID', accessor: 'log_id', style: { width: 60 } },
    { header: 'Table', accessor: 'table_name', render: r => (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.table_name}</span>
    )},
    { header: 'Record ID', accessor: 'record_id' },
    { header: 'Action', accessor: 'action', render: r => {
      const colors = { INSERT: 'badge-active', UPDATE: 'badge-draft', DELETE: 'badge-overdue' };
      return <span className={`badge ${colors[r.action] || ''}`}>{r.action}</span>;
    }},
    { header: 'Changed By', accessor: 'changed_by_name', render: r => r.changed_by_name || '—' },
    { header: 'Changed At', accessor: 'changed_at', render: r => new Date(r.changed_at).toLocaleString() },
    { header: 'Old Values', accessor: 'old_values', render: r => {
      if (!r.old_values) return '—';
      const str = typeof r.old_values === 'string' ? r.old_values : JSON.stringify(r.old_values);
      return <span title={str} style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{str.substring(0, 50)}{str.length > 50 ? '...' : ''}</span>;
    }},
    { header: 'New Values', accessor: 'new_values', render: r => {
      if (!r.new_values) return '—';
      const str = typeof r.new_values === 'string' ? r.new_values : JSON.stringify(r.new_values);
      return <span title={str} style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{str.substring(0, 50)}{str.length > 50 ? '...' : ''}</span>;
    }},
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Audit Log</h1>
          <p>System change history (read-only)</p>
        </div>
      </div>
      <DataTable
        columns={columns} data={data}
        searchPlaceholder="Search audit log..."
        emptyIcon="🔒" emptyTitle="No audit records"
        emptyMessage="Audit records will appear here when triggers are configured."
      />
    </AnimatedItem>
    </PageWrapper>
  );
}
