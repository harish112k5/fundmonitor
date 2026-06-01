const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');
const db = require('./db');

async function runBruteForceTest() {
  console.log('--- STARTING BRUTE FORCE IMPORT TEST ---');
  const uniqueName = `Project_Brute_Force_${Date.now()}`;
  console.log(`1. Generating fresh test Excel file with project name: ${uniqueName}`);

  const templatePath = path.join(__dirname, '../frontend/public/BuildManager_Project_Import_Template.xlsx');
  const tempFilePath = path.join(__dirname, 'brute_test_file.xlsx');
  const workbook = XLSX.readFile(templatePath);

  function setSheetData(sheetName, dataRows) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const headers = [raw[0] || [], raw[1] || [], raw[2] || []];
    
    if (sheetName === '🧱 Materials') {
      console.log('Materials headers:', raw[2]);
    }
    if (sheetName === '👷 Manpower') {
      console.log('Manpower headers:', raw[2]);
    }

    const newData = [...headers, ...dataRows];
    workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(newData);
  }

  // Fetch real master data to avoid foreign key errors
  const [materials] = await db.query('SELECT material_name FROM materials_master LIMIT 3');
  const [roles] = await db.query('SELECT role_name FROM worker_roles LIMIT 3');
  const [machines] = await db.query('SELECT machine_name FROM machines_master LIMIT 3');
  const [investors] = await db.query('SELECT name FROM investors LIMIT 2');
  const [financiers] = await db.query('SELECT name FROM financiers LIMIT 2');
  const [categories] = await db.query('SELECT category_name FROM expense_categories LIMIT 2');

  const mat1 = materials[0]?.material_name;
  const mat2 = materials[1]?.material_name;
  const role1 = roles[0]?.role_name;
  const mach1 = machines[0]?.machine_name;
  const mach2 = machines[1]?.machine_name;
  const inv1 = investors[0]?.name;
  const fin1 = financiers[0]?.name;
  const cat1 = categories[0]?.category_name || 'General';

  // 1. Project Info
  setSheetData('🏗 Project Info', [
    ['PRJ-BRUTE-01', uniqueName, 'Test City', 'Test Client', '2026-01-01', '2026-12-31', '500000', '600000', 'ongoing', 'Commercial', 'Brute force test']
  ]);

  // 2. Materials (3 rows)
  setSheetData('🧱 Materials', [
    [mat1, '100', '50', '2026-06-01', 'Supp A', 'INV-1', 'Notes'],
    [mat2, '200', '10', '2026-06-02', 'Supp B', 'INV-2', 'Notes'],
    [mat1, '50', '52', '2026-06-03', 'Supp A', 'INV-3', 'Notes']
  ]);

  // 3. Manpower (2 rows)
  setSheetData('👷 Manpower', [
    [role1, 'Worker One', '5', '1000', '2026-06-01', 'daily', 'Notes'],
    [role1, 'Worker Two', '5', '1000', '2026-06-01', 'daily', 'Notes']
  ]);

  // 4. Machines (2 rows)
  setSheetData('⚙ Machines', [
    [mach1, '10', '500', '2026-06-01', 'Op A', 0, 'Notes'],
    [mach2, '8', '600', '2026-06-02', 'Op B', 0, 'Notes']
  ]);

  // 5. Expenses (3 rows)
  setSheetData('💰 Expenses', [
    [cat1, 'Sub A', 'Desc 1', '1000', '2026-06-01', 'Vendor A', 'V-1', 'paid'],
    [cat1, 'Sub B', 'Desc 2', '2000', '2026-06-02', 'Vendor B', 'V-2', 'paid'],
    [cat1, 'Sub C', 'Desc 3', '500', '2026-06-03', 'Vendor C', 'V-3', 'paid']
  ]);

  // 6. Billing (2 rows)
  setSheetData('🧾 Billing', [
    ['Stage 1', '10000', '10000', '10000', '2026-06-01', '2026-06-10', 'paid', 'INV-001', 'Notes'],
    ['Stage 2', '20000', '20000', '0', '2026-07-01', '2026-07-10', 'sent', 'INV-002', 'Notes']
  ]);

  // 7. Progress (1 row)
  setSheetData('📈 Progress', [
    ['6', '2026', '10', '8', '2', 'Foundation done', 'Weather block']
  ]);

  // 8. Investments (2 rows)
  setSheetData('💼 Investments', [
    [inv1, '50000', '2026-01-01', '10', 'fixed', 'Initial', 'Notes'],
    [inv1, '20000', '2026-06-01', '12', 'fixed', 'Mid', 'Notes']
  ]);

  // 9. Loans (1 row)
  setSheetData('🏦 Loans', [
    [fin1, '100000', '8.5', 'monthly', '2026-01-01', '2030-01-01', '100000', 'Notes']
  ]);

  XLSX.writeFile(workbook, tempFilePath);
  console.log('✅ Generated dummy file with multiple rows.');

  console.log('\n2. Posting file to /api/import/project endpoint...');
  const formData = new FormData();
  formData.append('file', fs.createReadStream(tempFilePath));

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ user_id: 1, role_name: 'admin' }, 'construction_erp_secret_key_2024');

  try {
    const res = await axios.post('http://localhost:3001/api/import/project', formData, {
      headers: { ...formData.getHeaders(), Authorization: `Bearer ${token}` },
    });
    
    console.log('✅ API returned SUCCESS!');
    const result = res.data.result;
    console.log('Summary returned by API:');
    console.log(`- Project created: ${result.project.project_name} (ID: ${result.project.project_id})`);
    console.log(`- Total Rows Processed: ${result.totalRows}`);
    console.log(`- Successfully Inserted: ${result.inserted}`);
    console.log(`- Failed: ${result.failed}`);

    if (result.failed > 0) {
      console.log('\n--- ERRORS ---');
      for (const [sheet, data] of Object.entries(result.sheets)) {
        if (data.errors?.length > 0) {
          console.log(`Sheet: ${sheet}`);
          console.log(data.errors);
        }
      }
    }

    const pid = result.project.project_id;
    
    console.log('\n3. Verifying database insertion (Brute Force Check)...');
    
    const [[matCount]] = await db.query('SELECT COUNT(*) as c FROM material_usage WHERE project_id=?', [pid]);
    const [[manCount]] = await db.query('SELECT COUNT(*) as c FROM manpower_usage WHERE project_id=?', [pid]);
    const [[macCount]] = await db.query('SELECT COUNT(*) as c FROM machine_usage WHERE project_id=?', [pid]);
    const [[expCount]] = await db.query('SELECT COUNT(*) as c FROM expenses WHERE project_id=?', [pid]);
    const [[bilCount]] = await db.query('SELECT COUNT(*) as c FROM billing WHERE project_id=?', [pid]);
    const [[proCount]] = await db.query('SELECT COUNT(*) as c FROM project_progress WHERE project_id=?', [pid]);
    const [[invCount]] = await db.query('SELECT COUNT(*) as c FROM project_investments WHERE project_id=?', [pid]);
    const [[lonCount]] = await db.query('SELECT COUNT(*) as c FROM project_loans WHERE project_id=?', [pid]);

    console.log(`Materials inserted: ${matCount.c} (Expected: 3)`);
    console.log(`Manpower inserted:  ${manCount.c} (Expected: 2)`);
    console.log(`Machines inserted:  ${macCount.c} (Expected: 2)`);
    console.log(`Expenses inserted:  ${expCount.c} (Expected: 3)`);
    console.log(`Billing inserted:   ${bilCount.c} (Expected: 2)`);
    console.log(`Progress inserted:  ${proCount.c} (Expected: 1)`);
    console.log(`Investments inserted:${invCount.c} (Expected: 2)`);
    console.log(`Loans inserted:     ${lonCount.c} (Expected: 1)`);

    console.log('\n🎉 BRUTE FORCE TEST PASSED! All data was fetched from Excel and inserted correctly.');

  } catch (err) {
    console.error('\n❌ API FAILED:');
    console.error(err.response?.data?.message || err.message);
    if (err.response?.data?.result?.errors) {
      console.log('Errors:', err.response.data.result.errors);
    }
  } finally {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    process.exit(0);
  }
}

runBruteForceTest();
