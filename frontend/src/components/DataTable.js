import React, { useState, useMemo } from 'react';
import { HiOutlineSearch, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  searchPlaceholder = 'Search...',
  renderActions,
  emptyIcon = '📋',
  emptyTitle = 'No data found',
  emptyMessage = 'Get started by adding a new record.',
  addButton = null
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? row[col.accessor] : '';
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  return (
    <div>
      {/* Header row */}
      <div style={{
        background: '#1E1E1E',
        border: '1px solid #2D2D2D',
        borderBottom: '1px solid #2D2D2D',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        gap: 12,
        flexWrap: 'nowrap',
      }}>
        <div className="table-search">
          <HiOutlineSearch className="table-search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ color: '#57534E', fontSize: '11px', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif" }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
          {addButton}
        </div>
      </div>

      {/* Table body */}
      <div style={{
        background: '#1E1E1E',
        border: '1px solid #2D2D2D',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{emptyIcon}</div>
            <h3>{emptyTitle}</h3>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.accessor || col.header} style={col.style}>
                      {col.header}
                    </th>
                  ))}
                  {(onEdit || onDelete || renderActions) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr 
                    key={row.id || row[columns[0]?.accessor] || idx}
                    style={{
                      animation: `pageEnter 0.3s ease ${idx * 0.03}s both`,
                    }}
                  >
                    {columns.map(col => (
                      <td key={col.accessor || col.header} style={col.style}>
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                    {(onEdit || onDelete || renderActions) && (
                      <td>
                        <div className="table-actions">
                          {renderActions ? renderActions(row) : (
                            <>
                              {onEdit && (
                                <button
                                  className="btn btn-icon btn-sm"
                                  onClick={() => onEdit(row)}
                                  title="Edit"
                                >
                                  <HiOutlinePencil />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  className="btn btn-danger btn-icon btn-sm"
                                  onClick={() => onDelete(row)}
                                  title="Delete"
                                >
                                  <HiOutlineTrash />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
