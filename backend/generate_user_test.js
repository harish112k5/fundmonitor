const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('./db');

async function main() {
  const baseFilePath = 'C:\\Users\\Ssan2\\Downloads\\BuildManager_Project_Import_Template.xlsx';
  
  if (!fs.existsSync(baseFilePath)) {
    console.error('Base file not found at:', baseFilePath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(baseFilePath);

  function setSheetData(sheetName, dataRows) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const headers = [raw[0] || [], raw[1] || [], raw[2] || []];
    const newData = [...headers, ...dataRows];
    workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(newData);
  }

  // Fetch real master data
  const [materials] = await db.query('SELECT material_name FROM materials_master LIMIT 3');
  const [roles] = await db.query('SELECT role_name FROM worker_roles LIMIT 3');
  const [machines] = await db.query('SELECT machine_name FROM machines_master LIMIT 3');
  const [investors] = await db.query('SELECT name FROM investors LIMIT 2');
  const [financiers] = await db.query('SELECT name FROM financiers LIMIT 2');
  const [categories] = await db.query('SELECT category_name FROM expense_categories LIMIT 2');

  const mat1 = materials[0]?.material_name;
  const mat2 = materials[1]?.material_name;
  const role1 = roles[0]?.role_name;
  const role2 = roles[1]?.role_name || role1;
  const mach1 = machines[0]?.machine_name;
  const inv1 = investors[0]?.name;
  const fin1 = financiers[0]?.name;
  const cat1 = categories[0]?.category_name || 'General';
  const cat2 = categories[1]?.category_name || cat1;

  // Data Definition
  const projectName = `Skyline Tower Project`;
  const estimatedBudget = 2000000;

  // Materials: Qty * Unit Price = Total
  // 500 * 20 = 10000
  // 250 * 50 = 12500
  const materialCost = (500 * 20) + (250 * 50); // 22,500

  // Manpower: Work Days * Daily Rate = Total
  // 10 * 800 = 8000
  // 15 * 600 = 9000
  const manpowerCost = (10 * 800) + (15 * 600); // 17,000

  // Machines: Hours * Hourly Rate = Total
  // 40 * 150 = 6000
  const machineCost = 40 * 150; // 6,000

  // Expenses: Amount
  // 5000 + 2500 = 7500
  const expenseCost = 5000 + 2500; // 7,500

  const actualCost = materialCost + manpowerCost + machineCost + expenseCost; // 53,000

  // Investments: 500000
  const totalInvestments = 500000;

  // Loans: 1000000
  const totalLoans = 1000000;

  // Billing: 150000 (100k paid, 50k sent)
  const billedAmount = 150000;
  const paidAmount = 100000;

  // 1. Project Info
  setSheetData('🏗 Project Info', [
    ['PRJ-SKY-02', projectName + ' 2', 'Mumbai', 'Skyline Builders', '2026-07-01', '2028-07-01', String(estimatedBudget), '3000000', 'ongoing', 'Commercial', 'Test Data']
  ]);

  // 2. Materials
  setSheetData('🧱 Materials', [
    [mat1, '500', '20', '2026-07-10', 'Supplier A', 'INV-101', 'Foundation cement'],
    [mat2, '250', '50', '2026-07-12', 'Supplier B', 'INV-102', 'Steel bars']
  ]);

  // 3. Manpower (Note: actual template has worker_name first then role, we must match)
  setSheetData('👷 Manpower', [
    ['Arun Kumar', role1, '10', '800', '2026-07-15', 'daily', 'Lead mason'],
    ['Ravi Raj', role2, '15', '600', '2026-07-16', 'daily', 'Helper']
  ]);

  // 4. Machines
  setSheetData('⚙ Machines', [
    [mach1, '40', '150', '2026-07-18', 'Operator John', 0, 'Excavation work']
  ]);

  // 5. Expenses
  setSheetData('💰 Expenses', [
    [cat1, 'Site Setup', 'Fencing and boards', '5000', '2026-07-05', 'Vendor X', 'VX-01', 'paid'],
    [cat2, 'Transport', 'Material delivery', '2500', '2026-07-11', 'Vendor Y', 'VY-01', 'paid']
  ]);

  // 6. Billing - Correct headers: billing_stage, billable_amount, billed_amount, received_amount, billing_date, due_date, invoice_number, status
  setSheetData('🧾 Billing', [
    ['Phase 1 Advance', '100000', '100000', '0', '2026-07-01', '2026-07-10', 'INV-SKY-001', 'paid'],
    ['Phase 1 Progress', '50000', '50000', '50000', '2026-07-20', '2026-07-30', 'INV-SKY-002', 'sent']
  ]);

  // 7. Progress
  setSheetData('📈 Progress', [
    ['7', '2026', '5', '5', '0', 'Foundation started', 'On track']
  ]);

  // 8. Investments
  setSheetData('💼 Investments', [
    [inv1, '500000', '2026-06-15', '12', 'fixed', 'Seed capital', 'Approved']
  ]);

  // 9. Loans
  setSheetData('🏦 Loans', [
    [fin1, '1000000', '9.5', 'monthly', '2026-06-20', '2036-06-20', '1000000', 'Term loan']
  ]);

  const outputFilePath = 'C:\\Users\\Ssan2\\Downloads\\Skyline_Tower_Test_Data_V2.xlsx';
  XLSX.writeFile(workbook, outputFilePath);
  
  console.log('SUCCESS!');
  console.log('--- REPORT DATA ---');
  console.log(`File: ${outputFilePath}`);
  console.log(`Total Budget: ${estimatedBudget}`);
  console.log(`Material Cost: ${materialCost}`);
  console.log(`Manpower Cost: ${manpowerCost}`);
  console.log(`Machine Cost: ${machineCost}`);
  console.log(`Expense Cost: ${expenseCost}`);
  console.log(`Actual Cost: ${actualCost}`);
  console.log(`Total Billed: ${billedAmount}`);
  console.log(`Total Paid: ${paidAmount}`);
  console.log(`Net Profit: ${billedAmount - actualCost}`);
  console.log(`Total Investments: ${totalInvestments}`);
  
  process.exit(0);
}

main();
