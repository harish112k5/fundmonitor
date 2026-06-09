const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const XLSX     = require('xlsx');
const path     = require('path');
const fs       = require('fs');
const db       = require('../db');

// ── MULTER SETUP ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/excel');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `import_${Date.now()}.xlsx`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.xlsx$/i))
      return cb(new Error('Only .xlsx files allowed'));
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── PARSE SHEET → ROW OBJECTS ────────────────────────────────────
function parseSheet(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (raw.length < 4) return [];

  const headers = raw[2].map(h =>
    String(h).trim()
      .replace(/\n/g, ' ')
      .replace(/\s*\*\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );

  const rows = [];
  for (let i = 3; i < raw.length; i++) {
    const rowArr = raw[i];
    if (!rowArr || rowArr.every(v => v === '' || v == null)) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = rowArr[idx] ?? ''; });
    obj._rowNum = i + 1;
    rows.push(obj);
  }
  return rows;
}

// ── SAFE TYPE HELPERS ─────────────────────────────────────────────
const str  = v => (v == null) ? '' : String(v).trim();
const num  = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const int  = v => { const n = parseInt(v); return isNaN(n) ? 0 : n; };
const toDate = v => {
  if (!v) return null;
  if (typeof v === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(v);
      return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    } catch { return null; }
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const p = new Date(s);
  if (!isNaN(p)) return p.toISOString().split('T')[0];
  return null;
};

// ── LOOKUP HELPERS ───────────────────────────────────────────────
async function findMaterial(conn, name) {
  const nm = str(name);
  if (!nm) return null;
  const [r] = await conn.execute(
    `SELECT material_id FROM materials_master WHERE material_name = ? LIMIT 1`,
    [nm]
  );
  return r[0]?.material_id ?? null;
}

async function findWorkerRole(conn, roleName) {
  const rn = str(roleName);
  if (!rn) return null;
  const [r] = await conn.execute(
    `SELECT worker_role_id, daily_rate FROM worker_roles WHERE role_name = ? LIMIT 1`,
    [rn]
  );
  return r[0] ?? null;
}

async function getOrCreateWorker(conn, name, roleId) {
  const [existing] = await conn.execute('SELECT worker_id FROM workers WHERE name = ? LIMIT 1', [name]);
  if (existing.length > 0) return existing[0].worker_id;
  const [res] = await conn.execute('INSERT INTO workers (name, worker_role_id, daily_rate) VALUES (?, ?, ?)', [name, roleId, 0]);
  return res.insertId;
}

async function findMachine(conn, name) {
  const nm = str(name);
  if (!nm) return null;
  const [r] = await conn.execute(
    `SELECT machine_id FROM machines_master WHERE machine_name = ? LIMIT 1`,
    [nm]
  );
  return r[0]?.machine_id ?? null;
}

async function getOrCreateExpenseCategory(conn, name) {
  const [r] = await conn.execute('SELECT category_id FROM expense_categories WHERE category_name = ? LIMIT 1', [name]);
  if (r.length > 0) return r[0].category_id;
  const [res] = await conn.execute('INSERT INTO expense_categories (category_name) VALUES (?)', [name]);
  return res.insertId;
}

async function findInvestor(conn, name) {
  const nm = str(name);
  if (!nm) return null;
  const [r] = await conn.execute(
    `SELECT investor_id FROM investors WHERE name = ? LIMIT 1`, [nm]
  );
  return r[0]?.investor_id ?? null;
}

async function findFinancier(conn, name) {
  const nm = str(name);
  if (!nm) return null;
  const [r] = await conn.execute(
    `SELECT financier_id FROM financiers WHERE name = ? LIMIT 1`, [nm]
  );
  return r[0]?.financier_id ?? null;
}

// ════════════════════════════════════════════════════════════════
// POST /api/import/project
// ════════════════════════════════════════════════════════════════
router.post('/project', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const uploadedBy = req.user?.user_id ?? null;
  const filePath   = req.file.path;

  const result = {
    project  : null,
    sheets   : {},
    totalRows: 0,
    inserted : 0,
    failed   : 0,
    errors   : [],
  };

  let conn;
  try {
    const workbook = XLSX.readFile(filePath);
    conn = await db.getConnection();
    await conn.beginTransaction();

    // ──────────────────────────────────────────────────────────────
    // 1. PROJECT INFO (required)
    // ──────────────────────────────────────────────────────────────
    const projRows = parseSheet(workbook, '🏗 Project Info');
    if (!projRows.length) throw new Error("Sheet '🏗 Project Info' has no data. Fill at least one project row.");

    const p = projRows[0];
    const projectName = str(p['project_name']) || str(p['project name']);
    if (!projectName) throw new Error('project_name is required in Project Info sheet');

    const validStatuses = ['planned','ongoing','on_hold','completed','cancelled'];
    let pStatus = str(p['status']).toLowerCase().replace(' ','_');
    if (!validStatuses.includes(pStatus)) pStatus = 'ongoing';

    // Check duplicate
    const [dupCheck] = await conn.execute(
      'SELECT project_id FROM projects WHERE project_name = ?', [projectName]
    );
    if (dupCheck.length > 0) {
      throw new Error(`Project name "${projectName}" already exists. Use a unique name.`);
    }

    const [projInsert] = await conn.execute(
      `INSERT INTO projects
       (project_name, location, start_date, end_date, estimated_budget, status, created_by)
       VALUES (?,?,?,?,?,?,?)`,
      [
        projectName,
        str(p['location']) || null,
        toDate(p['start_date (YYYY-MM-DD)']) || toDate(p['start_date']) || null,
        toDate(p['end_date (YYYY-MM-DD)']) || toDate(p['end_date']) || null,
        num(p['estimated_budget']) || 0,
        pStatus,
        uploadedBy,
      ]
    );
    const projectId = projInsert.insertId;
    result.project = { project_id: projectId, project_code: projectName, project_name: projectName };

    // ──────────────────────────────────────────────────────────────
    // 2. MATERIALS
    // ──────────────────────────────────────────────────────────────
    const matRows = parseSheet(workbook, '🧱 Materials');
    const matSheet = { total: matRows.length, inserted: 0, failed: 0, errors: [] };

    for (const row of matRows) {
      result.totalRows++;
      const mName = str(row['material_name']);
      if (!mName) {
        matSheet.failed++;
        matSheet.errors.push({ row: row._rowNum, error: 'material_name is required' });
        continue;
      }
      const matId = await findMaterial(conn, mName);
      if (!matId) {
        matSheet.failed++;
        matSheet.errors.push({ row: row._rowNum, error: `Material "${mName}" not found in materials_master. Add it first.` });
        continue;
      }
      const qty   = num(row['quantity']);
      const price = num(row['unit_price']);
      const uDate = toDate(row['usage_date (YYYY-MM-DD)']) || toDate(row['usage_date']);
      if (qty <= 0) { matSheet.failed++; matSheet.errors.push({ row: row._rowNum, error: 'quantity must be > 0' }); continue; }
      if (!uDate)   { matSheet.failed++; matSheet.errors.push({ row: row._rowNum, error: 'usage_date required (YYYY-MM-DD)' }); continue; }

      await conn.execute(
        `INSERT INTO material_usage
         (project_id, material_id, quantity, unit_price, usage_date, supplier_name, recorded_by)
         VALUES (?,?,?,?,?,?,?)`,
        [projectId, matId, qty, price, uDate,
         str(row['supplier_name'])||null,
         uploadedBy]
      );
      matSheet.inserted++;
      result.inserted++;
    }
    result.sheets['Materials'] = matSheet;

    // ──────────────────────────────────────────────────────────────
    // 3. MANPOWER
    // ──────────────────────────────────────────────────────────────
    const manRows  = parseSheet(workbook, '👷 Manpower');
    const manSheet = { total: manRows.length, inserted: 0, failed: 0, errors: [] };

    for (const row of manRows) {
      result.totalRows++;
      const wName = str(row['worker_name']);
      const roleName = str(row['worker_role']);
      if (!roleName || !wName) { manSheet.failed++; manSheet.errors.push({ row: row._rowNum, error: 'worker_name and worker_role required' }); continue; }
      const roleData = await findWorkerRole(conn, roleName);
      if (!roleData) { manSheet.failed++; manSheet.errors.push({ row: row._rowNum, error: `Role "${roleName}" not found in worker_roles` }); continue; }

      const workerId = await getOrCreateWorker(conn, wName, roleData.worker_role_id);
      const workDays  = num(row['work_days']);
      const dailyRate = num(row['daily_rate']) || roleData.daily_rate;
      const wDate     = toDate(row['work_date (YYYY-MM-DD)']) || toDate(row['work_date']);

      if (workDays <= 0) { manSheet.failed++; manSheet.errors.push({ row: row._rowNum, error: 'work_days must be > 0' }); continue; }
      if (!wDate)        { manSheet.failed++; manSheet.errors.push({ row: row._rowNum, error: 'work_date required' }); continue; }

      await conn.execute(
        `INSERT INTO manpower_usage
         (project_id, worker_id, work_days, daily_rate, work_date, recorded_by)
         VALUES (?,?,?,?,?,?)`,
        [projectId, workerId, workDays, dailyRate, wDate, uploadedBy]
      );
      manSheet.inserted++;
      result.inserted++;
    }
    result.sheets['Manpower'] = manSheet;

    // ──────────────────────────────────────────────────────────────
    // 4. MACHINES
    // ──────────────────────────────────────────────────────────────
    const machRows  = parseSheet(workbook, '⚙ Machines');
    const machSheet = { total: machRows.length, inserted: 0, failed: 0, errors: [] };

    for (const row of machRows) {
      result.totalRows++;
      const mName = str(row['machine_name']);
      if (!mName) { machSheet.failed++; machSheet.errors.push({ row: row._rowNum, error: 'machine_name required' }); continue; }
      const machId = await findMachine(conn, mName);
      if (!machId) { machSheet.failed++; machSheet.errors.push({ row: row._rowNum, error: `Machine "${mName}" not found in machines_master` }); continue; }

      const hours = num(row['usage_hours']);
      const rate  = num(row['rate_per_hour']);
      const uDate = toDate(row['usage_date (YYYY-MM-DD)']) || toDate(row['usage_date']);
      if (hours <= 0) { machSheet.failed++; machSheet.errors.push({ row: row._rowNum, error: 'usage_hours must be > 0' }); continue; }
      if (!uDate)     { machSheet.failed++; machSheet.errors.push({ row: row._rowNum, error: 'usage_date required' }); continue; }

      await conn.execute(
        `INSERT INTO machine_usage
         (project_id, machine_id, usage_hours, hourly_rate, usage_date, operator_name, recorded_by)
         VALUES (?,?,?,?,?,?,?)`,
        [projectId, machId, hours, rate, uDate,
         str(row['operator_name'])||null, uploadedBy]
      );
      machSheet.inserted++;
      result.inserted++;
    }
    result.sheets['Machines'] = machSheet;

    // ──────────────────────────────────────────────────────────────
    // 5. EXPENSES
    // ──────────────────────────────────────────────────────────────
    const expRows  = parseSheet(workbook, '💰 Expenses');
    const expSheet = { total: expRows.length, inserted: 0, failed: 0, errors: [] };

    for (const row of expRows) {
      result.totalRows++;
      const catName = str(row['category']);
      const amount = num(row['amount']);
      const eDate  = toDate(row['expense_date (YYYY-MM-DD)']) || toDate(row['expense_date']);
      if (!catName) { expSheet.failed++; expSheet.errors.push({ row: row._rowNum, error: `category required` }); continue; }
      if (amount <= 0) { expSheet.failed++; expSheet.errors.push({ row: row._rowNum, error: 'amount must be > 0' }); continue; }
      if (!eDate)      { expSheet.failed++; expSheet.errors.push({ row: row._rowNum, error: 'expense_date required' }); continue; }

      const catId = await getOrCreateExpenseCategory(conn, catName);

      await conn.execute(
        `INSERT INTO expenses
         (project_id, category_id, description, amount, expense_date, recorded_by)
         VALUES (?,?,?,?,?,?)`,
        [projectId, catId,
         str(row['description'])||null,
         amount, eDate, uploadedBy]
      );
      expSheet.inserted++;
      result.inserted++;
    }
    result.sheets['Expenses'] = expSheet;

    // ──────────────────────────────────────────────────────────────
    // 6. BILLING
    // ──────────────────────────────────────────────────────────────
    const billRows  = parseSheet(workbook, '🧾 Billing');
    const billSheet = { total: billRows.length, inserted: 0, failed: 0, errors: [] };

    for (const row of billRows) {
      result.totalRows++;
      const bDate = toDate(row['billing_date (YYYY-MM-DD)']) || toDate(row['billing_date']);
      const invNo = str(row['invoice_number']);
      if (!bDate || !invNo) { billSheet.failed++; billSheet.errors.push({ row: row._rowNum, error: 'billing_date and invoice_number required' }); continue; }

      const bStat = str(row['status']);
      const safeStat = ['draft','sent','paid','overdue'].includes(bStat) ? bStat : 'draft';

      await conn.execute(
        `INSERT INTO billing
         (project_id, amount, billing_date, due_date, status, invoice_number, created_by)
         VALUES (?,?,?,?,?,?,?)`,
        [projectId,
         num(row['amount']),
         bDate,
         toDate(row['due_date (YYYY-MM-DD)']) || toDate(row['due_date']) || null,
         safeStat,
         invNo,
         uploadedBy]
      );
      billSheet.inserted++;
      result.inserted++;
    }
    result.sheets['Billing'] = billSheet;

    // ──────────────────────────────────────────────────────────────
    // 7. PROGRESS
    // ──────────────────────────────────────────────────────────────
    const progRows  = parseSheet(workbook, '📈 Progress');
    const progSheet = { total: progRows.length, inserted: 0, failed: 0, errors: [] };

    for (const row of progRows) {
      result.totalRows++;
      const month = int(row['month (1–12)'] || row['month']);
      const year  = int(row['year']);
      if (month < 1 || month > 12) { progSheet.failed++; progSheet.errors.push({ row: row._rowNum, error: 'month must be 1–12' }); continue; }
      if (year < 2000)              { progSheet.failed++; progSheet.errors.push({ row: row._rowNum, error: 'year must be 4-digit e.g. 2026' }); continue; }

      await conn.execute(
        `INSERT INTO project_progress
         (project_id, month, year, progress_percentage, remarks, recorded_by)
         VALUES (?,?,?,?,?,?)`,
        [projectId, month, year,
         num(row['actual_progress (%)']),
         str(row['work_done'])||null,
         uploadedBy]
      );
      progSheet.inserted++;
      result.inserted++;
    }
    result.sheets['Progress'] = progSheet;

    // ──────────────────────────────────────────────────────────────
    // 8. INVESTMENTS
    // ──────────────────────────────────────────────────────────────
    const invRows  = parseSheet(workbook, '💼 Investments');
    const invSheet = { total: invRows.length, inserted: 0, failed: 0, errors: [] };

    for (const row of invRows) {
      result.totalRows++;
      const invName = str(row['investor_name']);
      if (!invName) { invSheet.failed++; invSheet.errors.push({ row: row._rowNum, error: 'investor_name required' }); continue; }
      const investorId = await findInvestor(conn, invName);
      if (!investorId) { invSheet.failed++; invSheet.errors.push({ row: row._rowNum, error: `Investor "${invName}" not found. Add them in Financials > Investors first.` }); continue; }

      const amount  = num(row['amount']);
      const iDate   = toDate(row['investment_date (YYYY-MM-DD)']) || toDate(row['investment_date']);
      if (amount <= 0) { invSheet.failed++; invSheet.errors.push({ row: row._rowNum, error: 'amount must be > 0' }); continue; }
      if (!iDate)      { invSheet.failed++; invSheet.errors.push({ row: row._rowNum, error: 'investment_date required' }); continue; }

      await conn.execute(
        `INSERT INTO project_investments
         (project_id, investor_id, amount, investment_date, notes, created_by)
         VALUES (?,?,?,?,?,?)`,
        [projectId, investorId, amount, iDate,
         str(row['notes'])||null,
         uploadedBy]
      );
      invSheet.inserted++;
      result.inserted++;
    }
    result.sheets['Investments'] = invSheet;

    // ──────────────────────────────────────────────────────────────
    // 9. LOANS
    // ──────────────────────────────────────────────────────────────
    const loanRows  = parseSheet(workbook, '🏦 Loans');
    const loanSheet = { total: loanRows.length, inserted: 0, failed: 0, errors: [] };

    for (const row of loanRows) {
      result.totalRows++;
      const finName = str(row['financier_name']);
      if (!finName) { loanSheet.failed++; loanSheet.errors.push({ row: row._rowNum, error: 'financier_name required' }); continue; }
      const financierId = await findFinancier(conn, finName);
      if (!financierId) { loanSheet.failed++; loanSheet.errors.push({ row: row._rowNum, error: `Financier "${finName}" not found. Add them in Financials > Financiers first.` }); continue; }

      const principal = num(row['principal']);
      const intRate   = num(row['interest_rate (%)'] || row['interest_rate']);
      const sDate     = toDate(row['start_date (YYYY-MM-DD)']) || toDate(row['start_date']);
      if (principal <= 0) { loanSheet.failed++; loanSheet.errors.push({ row: row._rowNum, error: 'principal must be > 0' }); continue; }
      if (!sDate)         { loanSheet.failed++; loanSheet.errors.push({ row: row._rowNum, error: 'start_date required' }); continue; }

      await conn.execute(
        `INSERT INTO project_loans
         (project_id, financier_id, principal, interest_rate, start_date, end_date, created_by)
         VALUES (?,?,?,?,?,?,?)`,
        [projectId, financierId, principal, intRate,
         sDate,
         toDate(row['end_date (YYYY-MM-DD)']) || toDate(row['end_date']) || null,
         uploadedBy]
      );
      loanSheet.inserted++;
      result.inserted++;
    }
    result.sheets['Loans'] = loanSheet;

    // ──────────────────────────────────────────────────────────────
    // COMMIT ALL
    // ──────────────────────────────────────────────────────────────
    await conn.commit();
    result.failed = result.totalRows - result.inserted;

    // Cleanup file
    try { fs.unlinkSync(filePath); } catch {}

    res.json({ success: true, result });

  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch {} }
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    console.error('Import error:', err);
    res.status(500).json({ success: false, message: err.message, result });
  } finally {
    if (conn) { try { conn.release(); } catch {} }
  }
});

// GET /api/import/template-info — prerequisite check
router.get('/template-info', async (req, res) => {
  try {
    const [[{ materials }]]  = await db.execute(`SELECT COUNT(*) AS materials  FROM materials_master`);
    const [[{ machines  }]]  = await db.execute(`SELECT COUNT(*) AS machines   FROM machines_master`);
    const [[{ roles     }]]  = await db.execute(`SELECT COUNT(*) AS roles      FROM worker_roles`);
    const [[{ investors }]]  = await db.execute(`SELECT COUNT(*) AS investors  FROM investors`);
    const [[{ financiers}]]  = await db.execute(`SELECT COUNT(*) AS financiers FROM financiers`);
    res.json({ success: true, data: { materials, machines, roles, investors, financiers } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
