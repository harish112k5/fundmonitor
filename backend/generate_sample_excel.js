const XLSX = require('xlsx');
const path = require('path');
const db = require('./db');

async function main() {
  const filePath = path.join(__dirname, '../frontend/public/BuildManager_Project_Import_Template.xlsx');
  const workbook = XLSX.readFile(filePath);

  // Helper to add data below row 3 (headers)
  function setSheetData(sheetName, dataRows) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;
    
    // Existing sheet data (headers)
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const headers1 = raw[0] || [];
    const headers2 = raw[1] || [];
    const headers3 = raw[2] || [];
    
    // Create new sheet data array
    const newData = [headers1, headers2, headers3, ...dataRows];
    
    // Create a new worksheet from the new data array
    const newWs = XLSX.utils.aoa_to_sheet(newData);
    workbook.Sheets[sheetName] = newWs;
  }

  // Fetch real data from DB
  const [materials] = await db.query('SELECT material_name FROM materials_master LIMIT 2');
  const [roles] = await db.query('SELECT role_name FROM worker_roles LIMIT 2');
  const [machines] = await db.query('SELECT machine_name FROM machines_master LIMIT 2');
  const [investors] = await db.query('SELECT name FROM investors LIMIT 1');
  const [financiers] = await db.query('SELECT name FROM financiers LIMIT 1');

  const mat1 = materials[0]?.material_name || 'Cement';
  const role1 = roles[0]?.role_name || 'Mason';
  const mach1 = machines[0]?.machine_name || 'Excavator';
  const inv1 = investors[0]?.name || 'Unknown Investor';
  const fin1 = financiers[0]?.name || 'Unknown Financier';

  // 1. Project Info
  setSheetData('🏗 Project Info', [
    ['PRJ-AUTO-02', 'Auto Generated Project 2', 'Chennai', 'BuildCorp', '2026-06-01', '2027-06-01', '100000', '150000', 'planned', 'Residential', 'Automated import test']
  ]);

  // 2. Materials
  setSheetData('🧱 Materials', [
    [mat1, '100', '500', '2026-06-02', 'Supplier A', 'INV-01', 'Test material usage']
  ]);

  // 3. Manpower
  setSheetData('👷 Manpower', [
    [role1, 'John Doe', '5', '800', '2026-06-02', 'daily', 'Test worker']
  ]);

  // 4. Machines
  setSheetData('⚙ Machines', [
    [mach1, '10', '1200', '2026-06-03', 'Operator Bob', 0, 'Test machine usage']
  ]);

  // 5. Expenses
  setSheetData('💰 Expenses', [
    ['Labor', 'Site Prep', 'Clearing land', '5000', '2026-06-04', 'Vendor X', 'VX-01', 'paid']
  ]);

  // 6. Billing
  setSheetData('🧾 Billing', [
    ['Phase 1', '50000', '50000', '25000', '2026-06-05', '2026-07-05', 'pending', 'BIL-01', 'Advance payment']
  ]);

  // 7. Progress
  setSheetData('📈 Progress', [
    ['6', '2026', '5', '4.5', '1', 'Site cleared', 'Rain delay']
  ]);

  // 8. Investments
  setSheetData('💼 Investments', [
    [inv1, '100000', '2026-06-01', '15', 'fixed', 'Initial Phase', 'Test investment']
  ]);

  // 9. Loans
  setSheetData('🏦 Loans', [
    [fin1, '200000', '10', 'monthly', '2026-06-01', '2030-06-01', '200000', 'Test loan']
  ]);

  XLSX.writeFile(workbook, filePath);
  console.log('Template filled successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
