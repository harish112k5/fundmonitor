const express  = require('express');
const router   = express.Router();
const ExcelJS  = require('exceljs');
const db       = require('../db');

// GET /api/template/download
router.get('/download', async (req, res) => {
  try {
    // ── Fetch live data from DB for dropdowns ──────────────────────
    const [projects]    = await db.execute(`SELECT project_id, project_name FROM projects WHERE is_deleted=0 ORDER BY project_name`);
    const [materials]   = await db.execute(`SELECT material_id, material_name, unit FROM materials_master WHERE is_deleted=0 ORDER BY material_name`);
    const [machines]    = await db.execute(`SELECT machine_id, machine_name FROM machines_master ORDER BY machine_name`);
    const [workerRoles] = await db.execute(`SELECT worker_role_id, role_name, daily_rate FROM worker_roles ORDER BY role_name`);
    const [investors]   = await db.execute(`SELECT investor_id, name FROM investors ORDER BY name`);
    const [financiers]  = await db.execute(`SELECT financier_id, name FROM financiers ORDER BY name`);

    // ── Create workbook ─────────────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator    = 'BillX CPMS';
    wb.created    = new Date();
    wb.properties.date1904 = false;

    // ── COLOUR CONSTANTS ────────────────────────────────────────────
    const COL_HEADER_BG  = '1A1A2E';
    const COL_HEADER_FG  = 'FFFFFF';
    const COL_TITLE_BG   = '7C3AED';
    const COL_TITLE_FG   = 'FFFFFF';
    const COL_ALT_ROW    = 'F8F7FF';
    const COL_WHITE      = 'FFFFFF';

    // ── HELPER: add title + subtitle + header row to a sheet ────────
    function setupSheet(ws, title, subtitle, headers) {
      const numCols = headers.length;

      ws.mergeCells(1, 1, 1, numCols);
      const titleCell = ws.getCell('A1');
      titleCell.value = title;
      titleCell.font  = { name: 'Arial', size: 14, bold: true, color: { argb: COL_TITLE_FG } };
      titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_TITLE_BG } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 36;

      ws.mergeCells(2, 1, 2, numCols);
      const subCell = ws.getCell('A2');
      subCell.value = subtitle;
      subCell.font  = { name: 'Arial', size: 10, color: { argb: '64748B' } };
      subCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_WHITE } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(2).height = 20;

      headers.forEach((h, i) => {
        const cell = ws.getCell(3, i + 1);
        cell.value = h.label;
        cell.font  = { name: 'Arial', size: 10, bold: true, color: { argb: COL_HEADER_FG } };
        cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_HEADER_BG } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
          left: { style: 'thin', color: { argb: 'CBD5E1' } },
          right: { style: 'thin', color: { argb: 'CBD5E1' } },
        };
        ws.getColumn(i + 1).width = h.width || 20;
      });
      ws.getRow(3).height = 30;

      ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 3, topLeftCell: 'A4' }];
      return ws;
    }

    // ── HELPER: add sample data rows ────────────────────────────────
    function addSampleRow(ws, rowNum, values, isAlt) {
      const bg = isAlt ? COL_ALT_ROW : COL_WHITE;
      values.forEach((v, i) => {
        const cell = ws.getCell(rowNum, i + 1);
        cell.value = v;
        cell.font  = { name: 'Arial', size: 10, color: { argb: '1E1B4B' } };
        cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
        ws.getRow(rowNum).height = 22;
      });
    }

    // ── HELPER: add dropdown validation ─────────────────────────────
    function addDropdown(ws, col, startRow, endRow, options) {
      if (!options || options.length === 0) return;
      const safeOptions = options.map(o => String(o).replace(/,/g, ' '));
      const formulaStr = safeOptions.join(',');
      
      // Excel limits data validation lists to 255 characters.
      // If it exceeds this, it corrupts the workbook. So we skip dropdowns for huge lists.
      if (formulaStr.length > 250) return;

      const formula = '"' + formulaStr + '"';
      for (let r = startRow; r <= endRow; r++) {
        ws.getCell(r, col).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [formula],
          showErrorMessage: true,
          errorTitle: 'Invalid value',
          error: `Please select from the valid list`,
        };
      }
    }

    // ════════════════════════════════════════════════════════════════
    // SHEET 1 — INSTRUCTIONS
    const wsInstr = wb.addWorksheet('📋 Instructions', { tabColor: { argb: '7C3AED' } });
    wsInstr.mergeCells('A1:D1');
    const instrTitle = wsInstr.getCell('A1');
    instrTitle.value = 'BillX — Project Import Template';
    instrTitle.font  = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    instrTitle.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7C3AED' } };
    instrTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    wsInstr.getRow(1).height = 42;

    wsInstr.mergeCells('A2:D2');
    wsInstr.getCell('A2').value = 'BillX | Fill this file to import a complete project with all data';
    wsInstr.getCell('A2').font  = { name: 'Arial', size: 10, color: { argb: '64748B' } };
    wsInstr.getCell('A2').alignment = { horizontal: 'center' };

    const instrHeaders = ['Sheet', 'Purpose', 'Required', 'Notes'];
    instrHeaders.forEach((h, i) => {
      const c = wsInstr.getCell(4, i + 1);
      c.value = h; c.font = { bold: true, color: { argb: 'FFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };
    });
    wsInstr.getRow(4).height = 28;

    const instrData = [
      ['🏗 Project Info',   'Core project — creates the project record',          'YES',      'Fill exactly ONE data row'],
      ['🧱 Materials',      'Material usage entries',                              'Optional', 'One row per material. Name must match master.'],
      ['👷 Manpower',       'Worker labour usage',                                 'Optional', 'Role must match worker_roles table.'],
      ['⚙ Machines',        'Machine/equipment usage',                             'Optional', 'Machine name must match machines_master.'],
      ['💰 Expenses',       'Miscellaneous project expenses',                      'Optional', 'Category: Equipment/Labor/Overhead/Transport/Miscellaneous'],
      ['🧾 Billing',        'Client invoices and payments',                        'Optional', 'Status: draft/sent/paid/overdue'],
      ['📈 Progress',       'Monthly planned vs actual %',                         'Optional', 'Month 1–12, Year 4-digit'],
      ['💼 Investments',    'Investor contributions',                              'Optional', 'Investor name must exist in system'],
      ['🏦 Loans',          'Loan records from financiers',                        'Optional', 'Financier name must exist in system'],
    ];
    instrData.forEach((row, i) => {
      const r = 5 + i;
      row.forEach((v, j) => {
        const c = wsInstr.getCell(r, j + 1);
        c.value = v;
        c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? COL_WHITE : COL_ALT_ROW } };
        c.font  = { name: 'Arial', size: 10 };
        wsInstr.getRow(r).height = 22;
      });
    });

    const rules = [
      '', 'IMPORTANT RULES:',
      '1.  Dates must be in YYYY-MM-DD format  e.g.  2026-01-15',
      '2.  Amounts must be plain numbers — NO ₹ symbol, NO commas  e.g.  450000',
      '3.  Do NOT change column headers or sheet names',
      '4.  Do NOT delete any sheet — leave empty sheets blank',
      '5.  Material names must EXACTLY match what is in the Materials Master list',
      '6.  Worker Roles must EXACTLY match: ' + workerRoles.map(r=>r.role_name).join(', '),
      '7.  Machine names must EXACTLY match what is in the Machines Master list',
      '8.  Investor names must EXACTLY match existing investors in the system',
      '9.  Financier names must EXACTLY match existing financiers in the system',
      '10. Save as .xlsx before uploading',
    ];
    rules.forEach((rule, i) => {
      const r = 15 + i;
      wsInstr.mergeCells(r, 1, r, 4);
      const c = wsInstr.getCell(r, 1);
      c.value = rule;
      c.font = rule.startsWith('IMPORTANT')
        ? { name: 'Arial', size: 11, bold: true, color: { argb: '7C3AED' } }
        : { name: 'Arial', size: 10, color: { argb: '1E1B4B' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? COL_WHITE : COL_ALT_ROW } };
      wsInstr.getRow(r).height = 20;
    });

    wsInstr.getColumn(1).width = 24;
    wsInstr.getColumn(2).width = 44;
    wsInstr.getColumn(3).width = 12;
    wsInstr.getColumn(4).width = 42;

    // ════════════════════════════════════════════════════════════════
    // SHEET 2 — PROJECT INFO
    const wsProj = wb.addWorksheet('🏗 Project Info', { tabColor: { argb: '1A1A2E' } });
    setupSheet(wsProj, '🏗 Project Info', 'Fill exactly ONE row. This creates the project record.', [
      { label: 'project_name *',              width: 34 },
      { label: 'location',                    width: 26 },
      { label: 'start_date * (YYYY-MM-DD)',    width: 22 },
      { label: 'end_date (YYYY-MM-DD)',        width: 22 },
      { label: 'estimated_budget',            width: 20 },
      { label: 'status *',                    width: 16 }
    ]);
    addDropdown(wsProj, 6, 4, 100, ['ongoing','completed','on_hold']);
    addSampleRow(wsProj, 4, [
      'Sample Construction Project', 'Chennai, Tamil Nadu',
      '2026-01-01', '2027-06-30', 5000000, 'ongoing'
    ], false);

    // ════════════════════════════════════════════════════════════════
    // SHEET 3 — MATERIALS
    const wsMat = wb.addWorksheet('🧱 Materials', { tabColor: { argb: '7C3AED' } });
    setupSheet(wsMat, '🧱 Material Usage', 'One row per material entry. material_name must exactly match Materials Master.', [
      { label: 'material_name *',            width: 34 },
      { label: 'quantity *',                 width: 14 },
      { label: 'unit_price *',               width: 16 },
      { label: 'usage_date * (YYYY-MM-DD)',   width: 22 },
      { label: 'supplier_name',              width: 26 }
    ]);
    if (materials.length > 0) {
      addDropdown(wsMat, 1, 4, 200, materials.map(m => m.material_name).slice(0, 30));
    }
    const matSamples = [
      ['Ordinary Portland Cement (OPC 53)', 250, 420, '2026-01-20', 'Ramco Cements Ltd'],
      ['TMT Steel Bar (Fe-500)', 3500, 72, '2026-01-22', 'Vizag Steel Depot'],
    ];
    matSamples.forEach((row, i) => addSampleRow(wsMat, 4 + i, row, i % 2 === 1));

    // ════════════════════════════════════════════════════════════════
    // SHEET 4 — MANPOWER
    const wsMan = wb.addWorksheet('👷 Manpower', { tabColor: { argb: '10B981' } });
    setupSheet(wsMan, '👷 Manpower Usage', 'One row per worker entry. worker_role must exactly match worker_roles table.', [
      { label: 'worker_name *',              width: 24 },
      { label: 'worker_role *',              width: 24 },
      { label: 'work_days *',                width: 14 },
      { label: 'daily_rate *',               width: 16 },
      { label: 'work_date * (YYYY-MM-DD)',    width: 22 }
    ]);
    if (workerRoles.length > 0) {
      addDropdown(wsMan, 2, 4, 200, workerRoles.map(r => r.role_name));
    }
    const manSamples = [
      ['Murugan K',   'Mason',              26, 800,  '2026-01-31'],
      ['Selvam R',    'Mason',              22, 800,  '2026-01-31'],
    ];
    manSamples.forEach((row, i) => addSampleRow(wsMan, 4 + i, row, i % 2 === 1));

    // ════════════════════════════════════════════════════════════════
    // SHEET 5 — MACHINES
    const wsMach = wb.addWorksheet('⚙ Machines', { tabColor: { argb: '3B82F6' } });
    setupSheet(wsMach, '⚙ Machine Usage', 'One row per machine entry. machine_name must exactly match Machines Master.', [
      { label: 'machine_name *',              width: 32 },
      { label: 'usage_hours *',               width: 16 },
      { label: 'rate_per_hour *',             width: 18 },
      { label: 'usage_date * (YYYY-MM-DD)',    width: 22 },
      { label: 'operator_name',               width: 24 }
    ]);
    if (machines.length > 0) {
      addDropdown(wsMach, 1, 4, 200, machines.map(m => m.machine_name).slice(0, 30));
    }
    const machSamples = [
      ['JCB 3DX Backhoe Loader',  56, 1800, '2026-01-12', 'Balu Operator'],
      ['Transit Mixer (6 CuM)',   42, 1200, '2026-01-28', 'Selvam Driver'],
    ];
    machSamples.forEach((row, i) => addSampleRow(wsMach, 4 + i, row, i % 2 === 1));

    // ════════════════════════════════════════════════════════════════
    // SHEET 6 — EXPENSES
    const wsExp = wb.addWorksheet('💰 Expenses', { tabColor: { argb: 'F59E0B' } });
    setupSheet(wsExp, '💰 Expenses', 'One row per expense. All amounts as plain numbers.', [
      { label: 'category *',                  width: 20 },
      { label: 'description',                 width: 36 },
      { label: 'amount *',                    width: 16 },
      { label: 'expense_date * (YYYY-MM-DD)', width: 22 }
    ]);
    addDropdown(wsExp, 1, 4, 200, ['Equipment','Labor','Overhead','Transport','Miscellaneous']);
    const expSamples = [
      ['Overhead',    'Site office setup and furniture',     42000,  '2026-01-12'],
      ['Transport',   'Cement and steel transport',          24000,  '2026-01-22'],
    ];
    expSamples.forEach((row, i) => addSampleRow(wsExp, 4 + i, row, i % 2 === 1));

    // ════════════════════════════════════════════════════════════════
    // SHEET 7 — BILLING
    const wsBill = wb.addWorksheet('🧾 Billing', { tabColor: { argb: 'EC4899' } });
    setupSheet(wsBill, '🧾 Billing & Invoices', 'One row per billing record. All amounts as plain numbers.', [
      { label: 'invoice_number *',            width: 20 },
      { label: 'amount *',                    width: 18 },
      { label: 'status *',                    width: 16 },
      { label: 'billing_date * (YYYY-MM-DD)', width: 22 },
      { label: 'due_date (YYYY-MM-DD)',        width: 22 }
    ]);
    addDropdown(wsBill, 3, 4, 200, ['draft','sent','paid','overdue']);
    const billSamples = [
      ['BILL-001',  2000000, 'paid', '2026-01-05', '2026-01-20'],
      ['BILL-002',   3500000, 'paid', '2026-02-15', '2026-03-15'],
    ];
    billSamples.forEach((row, i) => addSampleRow(wsBill, 4 + i, row, i % 2 === 1));

    // ════════════════════════════════════════════════════════════════
    // SHEET 8 — PROGRESS
    const wsProg = wb.addWorksheet('📈 Progress', { tabColor: { argb: '8B5CF6' } });
    setupSheet(wsProg, '📈 Monthly Progress', 'One row per month. Percentages 0.00–100.00', [
      { label: 'month * (1–12)',              width: 18 },
      { label: 'year *',                      width: 12 },
      { label: 'actual_progress * (%)',       width: 24 },
      { label: 'work_done',                   width: 40 }
    ]);
    const progSamples = [
      [1, 2026, 7.50,  'Site clearing, excavation 70% done'],
      [2, 2026, 16.00, 'Foundation poured, GF columns started'],
    ];
    progSamples.forEach((row, i) => addSampleRow(wsProg, 4 + i, row, i % 2 === 1));

    // ════════════════════════════════════════════════════════════════
    // SHEET 9 — INVESTMENTS
    const wsInv = wb.addWorksheet('💼 Investments', { tabColor: { argb: 'D97706' } });
    setupSheet(wsInv, '💼 Project Investments', 'One row per investor. investor_name must match an existing investor.', [
      { label: 'investor_name *',              width: 32 },
      { label: 'amount *',                     width: 18 },
      { label: 'investment_date * (YYYY-MM-DD)',width: 26 },
      { label: 'notes',                        width: 36 }
    ]);
    if (investors.length > 0) {
      addDropdown(wsInv, 1, 4, 200, investors.map(i => i.name).slice(0, 30));
      const invSamples = investors.slice(0, 2).map((inv, i) => [
        inv.name, 1000000 * (i + 1), '2026-01-0' + (i + 1), 'Sample investment'
      ]);
      invSamples.forEach((row, i) => addSampleRow(wsInv, 4 + i, row, i % 2 === 1));
    } else {
      addSampleRow(wsInv, 4, ['Investor Name Here', 1500000, '2026-01-05', 'Notes'], false);
    }

    // ════════════════════════════════════════════════════════════════
    // SHEET 10 — LOANS
    const wsLoan = wb.addWorksheet('🏦 Loans', { tabColor: { argb: '9D174D' } });
    setupSheet(wsLoan, '🏦 Project Loans', 'One row per loan. financier_name must match an existing financier.', [
      { label: 'financier_name *',              width: 34 },
      { label: 'principal *',                   width: 18 },
      { label: 'interest_rate * (%)',            width: 20 },
      { label: 'start_date * (YYYY-MM-DD)',      width: 24 },
      { label: 'end_date (YYYY-MM-DD)',          width: 22 }
    ]);
    if (financiers.length > 0) {
      addDropdown(wsLoan, 1, 4, 200, financiers.map(f => f.name).slice(0, 20));
      const loanSamples = financiers.slice(0, 2).map((fin, i) => [
        fin.name, 5000000 * (i + 1), 11.5 + i, '2026-01-15', '2027-06-30'
      ]);
      loanSamples.forEach((row, i) => addSampleRow(wsLoan, 4 + i, row, i % 2 === 1));
    } else {
      addSampleRow(wsLoan, 4, ['Bank Name Here', 5000000, 11.5, '2026-01-15', '2027-06-30'], false);
    }

    // ── SET ACTIVE SHEET TO INSTRUCTIONS ─────────────────────────────
    wb.views = [{ activeTab: 0 }];

    // ── SEND FILE ────────────────────────────────────────────────────
    res.setHeader('Content-Type',        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="BillX_Import_Template.xlsx"');
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Template generation error:', err);
    res.status(500).json({ success: false, message: 'Template generation failed: ' + err.message });
  }
});

module.exports = router;
