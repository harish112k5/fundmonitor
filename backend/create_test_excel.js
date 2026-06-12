const ExcelJS = require('exceljs');
const path = require('path');
const db = require('./db');

async function run() {
  console.log('Fetching master data for test file...');
  const [materials]   = await db.execute(`SELECT material_name FROM materials_master LIMIT 2`);
  const [machines]    = await db.execute(`SELECT machine_name FROM machines_master LIMIT 2`);
  const [workerRoles] = await db.execute(`SELECT role_name FROM worker_roles LIMIT 2`);
  const [investors]   = await db.execute(`SELECT name FROM investors LIMIT 2`);
  const [financiers]  = await db.execute(`SELECT name FROM financiers LIMIT 2`);

  const wb = new ExcelJS.Workbook();
  const COL_HEADER_BG = '1A1A2E';
  const COL_HEADER_FG = 'FFFFFF';

  function setupSheet(ws, headers) {
    ws.getRow(2).height = 20; // dummy row for spacing to match template structure if needed. Actually our parser looks at row 3 for headers.
    
    // In our parser: it looks at row 3 (index 2) for headers, row 4+ for data
    headers.forEach((h, i) => {
      const cell = ws.getCell(3, i + 1);
      cell.value = h;
    });
    return ws;
  }

  function addRow(ws, rowNum, values) {
    values.forEach((v, i) => {
      ws.getCell(rowNum, i + 1).value = v;
    });
  }

  // 1. Project
  const wsProj = wb.addWorksheet('🏗 Project Info');
  setupSheet(wsProj, ['project_name *', 'location', 'start_date * (YYYY-MM-DD)', 'end_date (YYYY-MM-DD)', 'estimated_budget', 'status *']);
  const uniqueProj = 'Mega Tower ' + Math.floor(Math.random() * 10000);
  addRow(wsProj, 4, [uniqueProj, 'New York', '2026-01-01', '2027-12-31', 15000000, 'ongoing']);

  // 2. Materials
  const wsMat = wb.addWorksheet('🧱 Materials');
  setupSheet(wsMat, ['material_name *', 'quantity *', 'unit_price *', 'usage_date * (YYYY-MM-DD)', 'supplier_name']);
  if (materials.length > 0) {
    addRow(wsMat, 4, [materials[0].material_name, 500, 350, '2026-02-15', 'Acme Supplies']);
  }

  // 3. Manpower
  const wsMan = wb.addWorksheet('👷 Manpower');
  setupSheet(wsMan, ['worker_name *', 'worker_role *', 'work_days *', 'daily_rate *', 'work_date * (YYYY-MM-DD)']);
  if (workerRoles.length > 0) {
    addRow(wsMan, 4, ['John Doe', workerRoles[0].role_name, 20, 800, '2026-02-28']);
  }

  // 4. Machines
  const wsMach = wb.addWorksheet('⚙ Machines');
  setupSheet(wsMach, ['machine_name *', 'usage_hours *', 'rate_per_hour *', 'usage_date * (YYYY-MM-DD)', 'operator_name']);
  if (machines.length > 0) {
    addRow(wsMach, 4, [machines[0].machine_name, 120, 1500, '2026-03-01', 'Mike Operator']);
  }

  // 5. Expenses
  const wsExp = wb.addWorksheet('💰 Expenses');
  setupSheet(wsExp, ['category *', 'description', 'amount *', 'expense_date * (YYYY-MM-DD)']);
  addRow(wsExp, 4, ['Overhead', 'Site Office Setup', 45000, '2026-01-15']);
  addRow(wsExp, 5, ['Transport', 'Material delivery fees', 12000, '2026-02-20']);

  // 6. Billing
  const wsBill = wb.addWorksheet('🧾 Billing');
  setupSheet(wsBill, ['invoice_number *', 'amount *', 'status *', 'billing_date * (YYYY-MM-DD)', 'due_date (YYYY-MM-DD)']);
  addRow(wsBill, 4, ['INV-001', 2500000, 'sent', '2026-04-01', '2026-04-15']);

  // 7. Progress
  const wsProg = wb.addWorksheet('📈 Progress');
  setupSheet(wsProg, ['month * (1–12)', 'year *', 'actual_progress * (%)', 'work_done']);
  addRow(wsProg, 4, [1, 2026, 5, 'Site cleared and foundations dug']);
  addRow(wsProg, 5, [2, 2026, 12, 'Foundation poured']);

  // 8. Investments
  const wsInv = wb.addWorksheet('💼 Investments');
  setupSheet(wsInv, ['investor_name *', 'amount *', 'investment_date * (YYYY-MM-DD)', 'notes']);
  if (investors.length > 0) {
    addRow(wsInv, 4, [investors[0].name, 5000000, '2026-01-10', 'Seed capital']);
  }

  // 9. Loans
  const wsLoan = wb.addWorksheet('🏦 Loans');
  setupSheet(wsLoan, ['financier_name *', 'principal *', 'interest_rate * (%)', 'start_date * (YYYY-MM-DD)', 'end_date (YYYY-MM-DD)']);
  if (financiers.length > 0) {
    addRow(wsLoan, 4, [financiers[0].name, 10000000, 10.5, '2026-01-20', '2030-01-20']);
  }

  const outPath = 'C:\\Users\\Ssan2\\Downloads\\Test_Project_Import.xlsx';
  await wb.xlsx.writeBuffer().then(buffer => {
    require('fs').writeFileSync(outPath, buffer);
  });
  console.log('✅ Test Excel file created at:', outPath);
  process.exit(0);
}

run().catch(console.error);
