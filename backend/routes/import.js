const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const XLSX     = require('xlsx');
const path     = require('path');
const fs       = require('fs');
const db       = require('../db');

// ── multer config ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/excel');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `import_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx') return cb(new Error('Only .xlsx files allowed'));
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── helper: parse sheet to row array ──────────────────────────────
function parseSheet(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (raw.length < 4) return [];

  const headers = raw[2].map(h => String(h).toLowerCase().replace(/\n/g, ' ').replace(/\*/g, '').trim().replace(/\s+/g, ' '));
  const rows = [];
  for (let i = 3; i < raw.length; i++) {
    const rowArr = raw[i];
    if (rowArr.every(v => v === '' || v === null || v === undefined)) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = rowArr[idx] ?? ''; });
    obj._rowNum = i + 1;
    if (sheetName === '🧱 Materials' && i === 3) console.log('Parsed Materials Row:', obj);
    rows.push(obj);
  }
  return rows;
}

// ── helpers ───────────────────────────────────────────────────────
const str  = v => (v === null || v === undefined) ? '' : String(v).trim();
const num  = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const date = v => {
  if (!v) return null;
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = new Date(s);
  if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];
  return null;
};

// ── lookup helpers ─────────────────────────────────────────────────
async function lookupMaterial(conn, name) {
  const [r] = await conn.execute('SELECT material_id FROM materials_master WHERE material_name = ? LIMIT 1', [name]);
  return r[0]?.material_id ?? null;
}
async function lookupWorkerRole(conn, roleName) {
  const [r] = await conn.execute('SELECT worker_role_id FROM worker_roles WHERE role_name = ? LIMIT 1', [roleName]);
  return r[0]?.worker_role_id ?? null;
}
async function getOrCreateWorker(conn, name, roleId) {
  const [existing] = await conn.execute('SELECT worker_id FROM workers WHERE name = ? LIMIT 1', [name]);
  if (existing.length > 0) return existing[0].worker_id;
  const [res] = await conn.execute('INSERT INTO workers (name, worker_role_id, daily_rate) VALUES (?, ?, ?)', [name, roleId, 0]);
  return res.insertId;
}
async function lookupMachine(conn, name) {
  const [r] = await conn.execute('SELECT machine_id FROM machines_master WHERE machine_name = ? LIMIT 1', [name]);
  return r[0]?.machine_id ?? null;
}
async function getOrCreateExpenseCategory(conn, name) {
  const [r] = await conn.execute('SELECT category_id FROM expense_categories WHERE category_name = ? LIMIT 1', [name]);
  if (r.length > 0) return r[0].category_id;
  const [res] = await conn.execute('INSERT INTO expense_categories (category_name) VALUES (?)', [name]);
  return res.insertId;
}
async function lookupInvestor(conn, name) {
  const [r] = await conn.execute('SELECT investor_id FROM investors WHERE name = ? LIMIT 1', [name]);
  return r[0]?.investor_id ?? null;
}
async function lookupFinancier(conn, name) {
  const [r] = await conn.execute('SELECT financier_id FROM financiers WHERE name = ? LIMIT 1', [name]);
  return r[0]?.financier_id ?? null;
}

// ══════════════════════════════════════════════════════════════════
// POST /project
router.post('/project', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const uploadedBy = req.user?.user_id || null;
  const filePath   = req.file.path;
  const result = { project: null, sheets: {}, errors: [], totalRows: 0, inserted: 0, failed: 0 };
  let conn;

  try {
    const workbook = XLSX.readFile(filePath);
    conn = await db.getConnection();
    await conn.beginTransaction();

    // ── 1. PROJECT INFO ──
    const projRows = parseSheet(workbook, '🏗 Project Info');
    if (projRows.length === 0) throw new Error("Sheet '🏗 Project Info' has no data.");
    const p = projRows[0];
    
    // Fallback: Excel template has "project_code", we map it to project_name if name is missing
    const projectName = str(p['project_name']) || str(p['project_code']);
    if (!projectName) throw new Error('project_name is required in Project Info sheet.');

    const [existing] = await conn.execute('SELECT project_id FROM projects WHERE project_name = ?', [projectName]);
    if (existing.length > 0) throw new Error(`Project "${projectName}" already exists.`);

    const pStatus = str(p['status']) === 'planned' ? 'ongoing' : (str(p['status']) || 'ongoing');
    const safeStatus = ['ongoing','completed','on_hold'].includes(pStatus) ? pStatus : 'ongoing';

    const [projInsert] = await conn.execute(
      `INSERT INTO projects (project_name, location, start_date, end_date, estimated_budget, status, created_by) VALUES (?,?,?,?,?,?,?)`,
      [
        projectName,
        str(p['location']) || null,
        date(p['start_date (yyyy-mm-dd)']) || date(p['start_date']) || null,
        date(p['end_date (yyyy-mm-dd)']) || date(p['end_date']) || null,
        num(p['estimated_budget']) || 0,
        safeStatus,
        uploadedBy
      ]
    );
    const projectId = projInsert.insertId;
    result.project = { project_id: projectId, project_code: projectName, project_name: projectName };

    // ── 2. MATERIALS ──
    const matRows = parseSheet(workbook, '🧱 Materials');
    const matSheet = { total: matRows.length, inserted: 0, failed: 0, errors: [] };
    for (const row of matRows) {
      result.totalRows++;
      const mName = str(row['material_name']);
      if (!mName) { matSheet.failed++; matSheet.errors.push({ row: row._rowNum, error: 'material_name required' }); continue; }
      const mId = await lookupMaterial(conn, mName);
      if (!mId) { matSheet.failed++; matSheet.errors.push({ row: row._rowNum, error: `Material not found: ${mName}` }); continue; }
      
      const qty = num(row['quantity']);
      const price = num(row['unit_price']);
      const uDate = date(row['usage_date (yyyy-mm-dd)']) || date(row['usage_date']);
      if (!uDate) { matSheet.failed++; matSheet.errors.push({ row: row._rowNum, error: 'usage_date required' }); continue; }

      await conn.execute(
        `INSERT INTO material_usage (project_id, material_id, quantity, unit_price, usage_date, supplier_name, recorded_by) VALUES (?,?,?,?,?,?,?)`,
        [projectId, mId, qty, price, uDate, str(row['supplier_name']) || null, uploadedBy]
      );
      matSheet.inserted++; result.inserted++;
    }
    result.sheets['Materials'] = matSheet;

    // ── 3. MANPOWER ──
    const manRows = parseSheet(workbook, '👷 Manpower');
    const manSheet = { total: manRows.length, inserted: 0, failed: 0, errors: [] };
    for (const row of manRows) {
      result.totalRows++;
      const wName = str(row['worker_name']);
      const rName = str(row['worker_role']);
      if (!rName || !wName) { manSheet.failed++; manSheet.errors.push({ row: row._rowNum, error: 'worker_name and worker_role required' }); continue; }
      
      const rId = await lookupWorkerRole(conn, rName);
      if (!rId) { manSheet.failed++; manSheet.errors.push({ row: row._rowNum, error: `Role not found: ${rName}` }); continue; }
      
      const wId = await getOrCreateWorker(conn, wName, rId);
      const wDays = num(row['work_days']);
      const wDate = date(row['work_date (yyyy-mm-dd)']) || date(row['work_date']);
      if (!wDate) { manSheet.failed++; manSheet.errors.push({ row: row._rowNum, error: 'work_date required' }); continue; }

      await conn.execute(
        `INSERT INTO manpower_usage (project_id, worker_id, work_days, daily_rate, work_date, recorded_by) VALUES (?,?,?,?,?,?)`,
        [projectId, wId, wDays, num(row['daily_rate']), wDate, uploadedBy]
      );
      manSheet.inserted++; result.inserted++;
    }
    result.sheets['Manpower'] = manSheet;

    // ── 4. MACHINES ──
    const machRows = parseSheet(workbook, '⚙ Machines');
    const machSheet = { total: machRows.length, inserted: 0, failed: 0, errors: [] };
    for (const row of machRows) {
      result.totalRows++;
      const mName = str(row['machine_name']);
      if (!mName) { machSheet.failed++; machSheet.errors.push({ row: row._rowNum, error: 'machine_name required' }); continue; }
      const mId = await lookupMachine(conn, mName);
      if (!mId) { machSheet.failed++; machSheet.errors.push({ row: row._rowNum, error: `Machine not found: ${mName}` }); continue; }
      
      const uDate = date(row['usage_date (yyyy-mm-dd)']) || date(row['usage_date']);
      if (!uDate) { machSheet.failed++; machSheet.errors.push({ row: row._rowNum, error: 'usage_date required' }); continue; }

      await conn.execute(
        `INSERT INTO machine_usage (project_id, machine_id, usage_hours, hourly_rate, usage_date, operator_name, recorded_by) VALUES (?,?,?,?,?,?,?)`,
        [projectId, mId, num(row['usage_hours']), num(row['rate_per_hour']), uDate, str(row['operator_name']) || null, uploadedBy]
      );
      machSheet.inserted++; result.inserted++;
    }
    result.sheets['Machines'] = machSheet;

    // ── 5. EXPENSES ──
    const expRows = parseSheet(workbook, '💰 Expenses');
    const expSheet = { total: expRows.length, inserted: 0, failed: 0, errors: [] };
    for (const row of expRows) {
      result.totalRows++;
      const catName = str(row['category']);
      if (!catName) { expSheet.failed++; expSheet.errors.push({ row: row._rowNum, error: 'category required' }); continue; }
      const catId = await getOrCreateExpenseCategory(conn, catName);
      
      const eDate = date(row['expense_date (yyyy-mm-dd)']) || date(row['expense_date']);
      if (!eDate) { expSheet.failed++; expSheet.errors.push({ row: row._rowNum, error: 'expense_date required' }); continue; }

      await conn.execute(
        `INSERT INTO expenses (project_id, category_id, amount, description, expense_date, recorded_by) VALUES (?,?,?,?,?,?)`,
        [projectId, catId, num(row['amount']), str(row['description']) || null, eDate, uploadedBy]
      );
      expSheet.inserted++; result.inserted++;
    }
    result.sheets['Expenses'] = expSheet;

    // ── 6. BILLING ──
    const billRows = parseSheet(workbook, '🧾 Billing');
    const billSheet = { total: billRows.length, inserted: 0, failed: 0, errors: [] };
    for (const row of billRows) {
      result.totalRows++;
      const bDate = date(row['billing_date (yyyy-mm-dd)']) || date(row['billing_date']);
      const invNo = str(row['invoice_number']);
      if (!bDate || !invNo) { billSheet.failed++; billSheet.errors.push({ row: row._rowNum, error: 'billing_date and invoice_number required' }); continue; }

      const bStat = ['draft','sent','paid','overdue'].includes(str(row['status'])) ? str(row['status']) : 'draft';

      await conn.execute(
        `INSERT INTO billing (project_id, invoice_number, amount, status, billing_date, due_date, created_by) VALUES (?,?,?,?,?,?,?)`,
        [projectId, invNo, num(row['billable_amount']), bStat, bDate, date(row['due_date (yyyy-mm-dd)']) || date(row['due_date']) || null, uploadedBy]
      );
      billSheet.inserted++; result.inserted++;
    }
    result.sheets['Billing'] = billSheet;

    // ── 7. PROGRESS ──
    const progRows = parseSheet(workbook, '📈 Progress');
    const progSheet = { total: progRows.length, inserted: 0, failed: 0, errors: [] };
    for (const row of progRows) {
      result.totalRows++;
      const month = parseInt(row['month (1–12)'] || row['month'] || 0);
      const year = parseInt(row['year'] || 0);
      if (month < 1 || month > 12) { progSheet.failed++; progSheet.errors.push({ row: row._rowNum, error: 'month must be 1-12' }); continue; }
      
      await conn.execute(
        `INSERT INTO project_progress (project_id, month, year, progress_percentage, remarks, recorded_by) VALUES (?,?,?,?,?,?)`,
        [projectId, month, year, num(row['actual_progress (%)']), str(row['work_done']) || null, uploadedBy]
      );
      progSheet.inserted++; result.inserted++;
    }
    result.sheets['Progress'] = progSheet;

    // ── 8. INVESTMENTS ──
    const invRows = parseSheet(workbook, '💼 Investments');
    const invSheet = { total: invRows.length, inserted: 0, failed: 0, errors: [] };
    for (const row of invRows) {
      result.totalRows++;
      const invName = str(row['investor_name']);
      if (!invName) { invSheet.failed++; invSheet.errors.push({ row: row._rowNum, error: 'investor_name required' }); continue; }
      const invId = await lookupInvestor(conn, invName);
      if (!invId) { invSheet.failed++; invSheet.errors.push({ row: row._rowNum, error: `Investor not found: ${invName}` }); continue; }

      const iDate = date(row['investment_date (yyyy-mm-dd)']) || date(row['investment_date']);
      if (!iDate) { invSheet.failed++; invSheet.errors.push({ row: row._rowNum, error: 'investment_date required' }); continue; }

      await conn.execute(
        `INSERT INTO project_investments (project_id, investor_id, amount, investment_date, notes, created_by) VALUES (?,?,?,?,?,?)`,
        [projectId, invId, num(row['amount']), iDate, str(row['notes']) || null, uploadedBy]
      );
      invSheet.inserted++; result.inserted++;
    }
    result.sheets['Investments'] = invSheet;

    // ── 9. LOANS ──
    const loanRows = parseSheet(workbook, '🏦 Loans');
    const loanSheet = { total: loanRows.length, inserted: 0, failed: 0, errors: [] };
    for (const row of loanRows) {
      result.totalRows++;
      const fName = str(row['financier_name']);
      if (!fName) { loanSheet.failed++; loanSheet.errors.push({ row: row._rowNum, error: 'financier_name required' }); continue; }
      const fId = await lookupFinancier(conn, fName);
      if (!fId) { loanSheet.failed++; loanSheet.errors.push({ row: row._rowNum, error: `Financier not found: ${fName}` }); continue; }

      const sDate = date(row['start_date (yyyy-mm-dd)']) || date(row['start_date']);
      if (!sDate) { loanSheet.failed++; loanSheet.errors.push({ row: row._rowNum, error: 'start_date required' }); continue; }

      await conn.execute(
        `INSERT INTO project_loans (project_id, financier_id, principal, interest_rate, start_date, end_date, created_by) VALUES (?,?,?,?,?,?,?)`,
        [projectId, fId, num(row['principal']), num(row['interest_rate (% / period)'] || row['interest_rate']), sDate, date(row['end_date (yyyy-mm-dd)']) || date(row['end_date']) || null, uploadedBy]
      );
      loanSheet.inserted++; result.inserted++;
    }
    result.sheets['Loans'] = loanSheet;

    await conn.commit();
    result.failed = result.totalRows - result.inserted;
    fs.unlink(filePath, () => {});
    res.json({ success: true, result });

  } catch (err) {
    if (conn) await conn.rollback();
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    res.status(500).json({ success: false, message: err.message, result });
  } finally {
    if (conn) conn.release();
  }
});

router.get('/template-info', async (req, res) => {
  try {
    const [[{ materials }]] = await db.execute('SELECT COUNT(*) AS materials FROM materials_master');
    const [[{ machines  }]] = await db.execute('SELECT COUNT(*) AS machines  FROM machines_master');
    const [[{ roles     }]] = await db.execute('SELECT COUNT(*) AS roles     FROM worker_roles');
    const [[{ investors }]] = await db.execute('SELECT COUNT(*) AS investors FROM investors');
    const [[{ financiers}]] = await db.execute('SELECT COUNT(*) AS financiers FROM financiers');
    res.json({ success: true, data: { materials, machines, roles, investors, financiers } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
