import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';

const SHEET_ICONS = {
  'Materials':   { icon: '🧱', color: '#7c3aed' },
  'Manpower':    { icon: '👷', color: '#10b981' },
  'Machines':    { icon: '⚙️', color: '#3b82f6' },
  'Expenses':    { icon: '💰', color: '#f59e0b' },
  'Billing':     { icon: '🧾', color: '#ec4899' },
  'Progress':    { icon: '📈', color: '#8b5cf6' },
  'Investments': { icon: '💼', color: '#d97706' },
  'Loans':       { icon: '🏦', color: '#9d174d' },
};

export default function ImportProject() {
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [file,        setFile]        = useState(null);
  const [dragging,    setDragging]    = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');
  const [templateInfo,setTemplateInfo] = useState(null);

  // Fetch master counts on mount
  useState(() => {
    axios.get('/import/template-info')
      .then(r => setTemplateInfo(r.data.data))
      .catch(() => {});
  });

  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.xlsx')) { setFile(f); setError(''); setResult(null); }
    else setError('Only .xlsx files are accepted.');
  };

  const onFileChange = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); setError(''); setResult(null); }
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select an Excel file first.'); return; }
    setUploading(true); setError(''); setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post('/import/project', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setResult(res.data.result);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setError(msg);
      if (err.response?.data?.result) setResult(err.response.data.result);
    } finally {
      setUploading(false);
    }
  };

  const C = {
    page  : { background:'var(--bg-primary)', minHeight:'100vh', padding:'28px 36px', color:'var(--text-primary)' },
    card  : { background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:12, padding:'24px' },
    hdr   : { fontSize:24, fontWeight:700, margin:'0 0 4px' },
    sub   : { fontSize:13, color:'var(--text-muted)', margin:0 },
    back  : { background:'transparent', border:'1px solid var(--border-subtle)', borderRadius:8, color:'var(--text-secondary)', padding:'7px 16px', cursor:'pointer', fontSize:13, marginBottom:24 },
    btnPrimary: { padding:'12px 28px', background:'var(--accent-start)', border:'none', borderRadius:9, color:'white', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 2px 10px var(--accent-glow)' },
    btnSecondary: { padding:'11px 24px', background:'transparent', border:'1px solid var(--accent-start)', borderRadius:9, color:'var(--accent-start)', fontWeight:600, fontSize:14, cursor:'pointer' },
  };

  return (
    <div style={C.page}>
      <button onClick={() => navigate(-1)} style={C.back}>← Back</button>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={C.hdr}>📥 Import Project from Excel</h1>
        <p style={C.sub}>Upload the BuildManager template to create a project with all resources in one step.</p>
      </div>

      {/* Prerequisites */}
      {templateInfo && (
        <div style={{ ...C.card, marginBottom:20, display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {[
            { label:'Materials in Master', value:templateInfo.materials, ok:templateInfo.materials>0, warn:'Add materials first' },
            { label:'Machines in Master',  value:templateInfo.machines,  ok:templateInfo.machines>0,  warn:'Add machines first' },
            { label:'Worker Roles',        value:templateInfo.roles,     ok:templateInfo.roles>0,     warn:'Add roles first' },
            { label:'Investors',           value:templateInfo.investors, ok:true, warn:'' },
            { label:'Financiers',          value:templateInfo.financiers,ok:true, warn:'' },
          ].map(item => (
            <div key={item.label} style={{ textAlign:'center', padding:'12px 8px', background:item.ok?'var(--success-bg)':'var(--danger-bg)', borderRadius:8, border:`1px solid ${item.ok?'rgba(16, 185, 129, 0.2)':'rgba(239, 68, 68, 0.2)'}` }}>
              <p style={{ fontSize:22, fontWeight:700, margin:'0 0 4px', color:item.ok?'var(--success)':'var(--warning)' }}>{item.value}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{item.label}</p>
              {!item.ok && item.warn && <p style={{ fontSize:10, color:'var(--warning)', margin:'4px 0 0' }}>⚠ {item.warn}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div style={{ ...C.card, marginBottom:20 }}>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current.click()}
          style={{
            border:`2px dashed ${dragging?'var(--accent-start)':'var(--border-subtle)'}`,
            borderRadius:12, padding:'40px 20px', textAlign:'center',
            cursor:'pointer', transition:'all 0.2s',
            background: dragging ? 'var(--bg-input-focus)' : 'transparent',
          }}
        >
          <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
          {file ? (
            <>
              <p style={{ fontSize:15, fontWeight:600, color:'var(--success)', margin:'0 0 6px' }}>✅ {file.name}</p>
              <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>{(file.size/1024).toFixed(1)} KB — click to change</p>
            </>
          ) : (
            <>
              <p style={{ fontSize:15, fontWeight:600, margin:'0 0 8px' }}>Drop your Excel file here</p>
              <p style={{ fontSize:12, color:'var(--text-muted)', margin:'0 0 12px' }}>or click to browse — .xlsx only, max 10MB</p>
              <a
                href="/BuildManager_Project_Import_Template.xlsx"
                download
                onClick={e => e.stopPropagation()}
                style={{ fontSize:12, color:'#8b5cf6', textDecoration:'underline' }}
              >
                📥 Download Template
              </a>
            </>
          )}
          <input ref={fileRef} type="file" accept=".xlsx" style={{ display:'none' }} onChange={onFileChange} />
        </div>

        {error && (
          <div style={{ marginTop:14, padding:'12px 16px', background:'var(--danger-bg)', border:'1px solid var(--danger)', borderRadius:8, color:'var(--danger)', fontSize:13 }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display:'flex', gap:12, marginTop:16, justifyContent:'flex-end' }}>
          <button style={C.btnSecondary} onClick={() => { setFile(null); setResult(null); setError(''); }}>Clear</button>
          <button
            style={{ ...C.btnPrimary, opacity: (uploading||!file)?0.6:1, cursor:(uploading||!file)?'not-allowed':'pointer' }}
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading ? '⏳ Importing...' : '🚀 Import Project'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={C.card}>
          {/* Project created */}
          {result.project && (
            <div style={{ padding:'16px 20px', background:'var(--success-bg)', border:'1px solid var(--border-subtle)', borderRadius:10, marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ margin:'0 0 4px', fontWeight:700, color:'var(--success)', fontSize:16 }}>✅ Project Created Successfully</p>
                <p style={{ margin:0, fontSize:13, color:'var(--text-secondary)' }}>{result.project.project_code} — {result.project.project_name}</p>
              </div>
              <button
                onClick={() => navigate(`/projects/${result.project.project_id}`)}
                style={{ padding:'9px 18px', background:'#7c3aed', border:'none', borderRadius:8, color:'white', fontWeight:600, cursor:'pointer', fontSize:13 }}
              >
                View Project →
              </button>
            </div>
          )}

          {/* Summary row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            {[
              { label:'Total Rows Processed', value:result.totalRows, color:'var(--info)' },
              { label:'Successfully Inserted', value:result.inserted,  color:'var(--success)' },
              { label:'Failed / Skipped',      value:result.failed,    color: result.failed>0?'var(--danger)':'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'16px 20px', textAlign:'center', border:`1px solid var(--border-subtle)` }}>
                <p style={{ fontSize:28, fontWeight:700, margin:'0 0 4px', color:s.color }}>{s.value}</p>
                <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Per-sheet breakdown */}
          <h3 style={{ fontSize:15, fontWeight:700, margin:'0 0 12px' }}>Sheet-by-sheet Results</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
            {Object.entries(result.sheets || {}).map(([sheet, data]) => {
              const conf = SHEET_ICONS[sheet] || { icon:'📄', color:'var(--text-muted)' };
              return (
                <div key={sheet} style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'14px 16px', border:`1px solid var(--border-subtle)` }}>
                  <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:600 }}>{conf.icon} {sheet}</p>
                  <p style={{ margin:'0 0 2px', fontSize:12, color:'var(--success)' }}>✅ {data.inserted} inserted</p>
                  {data.failed > 0 && <p style={{ margin:0, fontSize:12, color:'var(--danger)' }}>❌ {data.failed} failed</p>}
                </div>
              );
            })}
          </div>

          {/* Error detail table */}
          {Object.entries(result.sheets || {}).some(([,d]) => d.errors?.length > 0) && (
            <>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--danger)', margin:'0 0 10px' }}>⚠ Row Errors</h3>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      {['Sheet','Excel Row','Error'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'8px 12px', borderBottom:'1px solid var(--border-subtle)', fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.sheets || {}).flatMap(([sheet, data]) =>
                      (data.errors || []).map((e, i) => (
                        <tr key={`${sheet}-${i}`}>
                          <td style={{ padding:'9px 12px', borderBottom:'1px solid var(--border-subtle)', color:'var(--text-secondary)' }}>{SHEET_ICONS[sheet]?.icon} {sheet}</td>
                          <td style={{ padding:'9px 12px', borderBottom:'1px solid var(--border-subtle)', fontFamily:'monospace', color:'var(--warning)' }}>Row {e.row}</td>
                          <td style={{ padding:'9px 12px', borderBottom:'1px solid var(--border-subtle)', color:'var(--danger)' }}>{e.error}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
