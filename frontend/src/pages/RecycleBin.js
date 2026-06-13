import { SkeletonTable } from '../components/SkeletonCard';
import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import { HiOutlineTrash, HiOutlineRefresh, HiOutlineXCircle } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function RecycleBin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showPermDeleteModal, setShowPermDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { isAdmin } = useAuth();

  const fetchBin = async () => {
    try {
      const res = await API.get('/recycle-bin');
      setItems(res.data);
    } catch (err) {
      setError('Failed to fetch recycle bin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBin();
  }, []);

  const handleRestore = async () => {
    if (!selectedItem) return;
    try {
      await API.post(`/recycle-bin/${selectedItem.project_id}/restore`);
      setItems(items.filter(i => i.project_id !== selectedItem.project_id));
      setShowRestoreModal(false);
      setSelectedItem(null);
    } catch (err) {
      alert('Restore failed');
    }
  };

  const handlePermDelete = async () => {
    if (!selectedItem || deleteConfirmText !== 'DELETE') return;
    try {
      await API.delete(`/recycle-bin/${selectedItem.project_id}/permanent`);
      setItems(items.filter(i => i.project_id !== selectedItem.project_id));
      setShowPermDeleteModal(false);
      setSelectedItem(null);
      setDeleteConfirmText('');
    } catch (err) {
      alert('Permanent delete failed');
    }
  };

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiOutlineTrash style={{ color: 'rgba(239, 68, 68, 0.7)' }} /> Recycle Bin
          </h1>
          <p>Deleted projects are stored here. Restore or permanently delete.</p>
        </div>
      </div>

      <div style={{
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        color: '#fcd34d',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        ⚠️ Permanently deleted projects cannot be recovered.
      </div>

      {error && <div className="badge badge-draft" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="card">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <HiOutlineTrash size={48} style={{ opacity: 0.5, marginBottom: 10 }} />
            <h3 style={{ margin: 0, fontWeight: 500 }}>Recycle Bin is empty</h3>
            <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>Deleted projects will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Budget</th>
                  <th>Deleted By</th>
                  <th>Deleted On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.project_name}</strong>
                    </td>
                    <td>{item.location || '—'}</td>
                    <td>{item.estimated_budget ? `₹${Number(item.estimated_budget).toLocaleString()}` : '—'}</td>
                    <td>{item.deleted_by_name}</td>
                    <td>
                      {new Date(item.deleted_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'rgba(34,197,94,0.15)',
                              border: '1px solid rgba(34,197,94,0.3)',
                              color: '#4ade80',
                              padding: '6px 10px'
                            }}
                            onClick={() => { setSelectedItem(item); setShowRestoreModal(true); }}
                            title="Restore Project"
                          >
                            <HiOutlineRefresh size={16} /> Restore
                          </button>
                          
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'rgba(239,68,68,0.15)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              color: '#ef4444',
                              padding: '6px 10px'
                            }}
                            onClick={() => { setSelectedItem(item); setShowPermDeleteModal(true); }}
                            title="Permanent Delete"
                          >
                            <HiOutlineXCircle size={16} /> Delete
                          </button>
                        </div>
                      )}
                      {!isAdmin && <span style={{ color: 'var(--text-muted)' }}>No access</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Modal */}
      {showRestoreModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Restore Project</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
              Restore <strong>{selectedItem.project_name}</strong>? It will reappear in Projects with all its data intact.
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRestoreModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ background: '#10b981' }} 
                onClick={handleRestore}
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {showPermDeleteModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ color: 'var(--danger)' }}>Permanent Delete</h2>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '12px', borderRadius: '8px', marginBottom: '20px'
            }}>
              <p style={{ margin: 0, color: '#fca5a5', lineHeight: 1.5, fontSize: '0.9rem' }}>
                <strong>PERMANENT DELETE</strong> — This cannot be undone. All materials, manpower, machines, billing, expenses, and financial data for <strong>{selectedItem.project_name}</strong> will be erased forever.
              </p>
            </div>
            <p style={{ marginBottom: 10, fontSize: '0.9rem' }}>Type <strong>DELETE</strong> to confirm:</p>
            <input
              className="input-field"
              type="text"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              style={{ width: '100%', marginBottom: 20 }}
            />
            <div className="modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowPermDeleteModal(false); setDeleteConfirmText(''); }}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--danger)', opacity: deleteConfirmText === 'DELETE' ? 1 : 0.5 }} 
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={handlePermDelete}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedItem>
    </PageWrapper>
  );
}
