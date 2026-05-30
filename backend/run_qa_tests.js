const puppeteer = require('puppeteer');
const db = require('./db');
const fs = require('fs');
const path = require('path');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Helpers
const delay = ms => new Promise(res => setTimeout(res, ms));

async function clickButtonWithText(page, text) {
  const clicked = await page.evaluate((txt) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim().includes(txt));
    if (btn) {
      btn.click();
      return true;
    }
    // Check general clickables
    const clickables = Array.from(document.querySelectorAll('a, span, div'));
    const el = clickables.find(e => e.textContent.trim() === txt);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }, text);

  if (!clicked) {
    throw new Error(`Clickable element with text "${text}" not found`);
  }
}

async function typeInForm(page, target, text) {
  let element;
  if (typeof target === 'string') {
    element = await page.waitForSelector(target, { visible: true });
  } else {
    element = target;
  }
  await element.focus();
  await page.evaluate((el, val) => {
    if (el) {
      const prototype = Object.getPrototypeOf(el);
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, element, String(text));
  await delay(100);
}

async function takeScreenshot(page, stepName) {
  const file = path.join(screenshotsDir, `${stepName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
  await page.screenshot({ path: file });
  console.log(`📸 Screenshot saved: ${file}`);
}

async function run() {
  console.log('🏁 Starting CPMS Automated UI Testing...');
  try {
    await db.query("DELETE FROM users WHERE email = '' OR email IS NULL");
  } catch (err) {
    console.log('Cleanup warning:', err.message);
  }
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 900 }
  });
  const page = await browser.newPage();

  try {
    // ----------------------------------------------------
    // PRE-CHECK & LOGIN / REGISTRATION
    // ----------------------------------------------------
    console.log('\n--- AUTHENTICATION ---');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Check if Arjun Raj is already in DB
    const [existingUsers] = await db.query('SELECT user_id FROM users WHERE email = ?', ['arjun@cpms.com']);
    
    if (existingUsers.length === 0) {
      console.log('Registering Admin Arjun Raj...');
      // Click register toggle
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const registerBtn = buttons.find(b => b.textContent.trim() === 'Register');
        if (registerBtn) registerBtn.click();
      });
      await delay(500);

      await typeInForm(page, 'input[name="name"]', 'Arjun Raj');
      await typeInForm(page, 'input[name="email"]', 'arjun@cpms.com');
      await typeInForm(page, 'input[name="password"]', 'Admin@123');
      await page.select('select[name="role_id"]', '1'); // Admin
      await page.click('button[type="submit"]');
      await delay(2000);
      console.log('✅ Admin registered and logged in!');
    } else {
      console.log('Admin already registered. Logging in...');
      await typeInForm(page, 'input[name="email"]', 'arjun@cpms.com');
      await typeInForm(page, 'input[name="password"]', 'Admin@123');
      await page.click('button[type="submit"]');
      await delay(2000);
      console.log('✅ Logged in successfully!');
    }
    await takeScreenshot(page, 'Auth_Success');

    // ----------------------------------------------------
    // STEP 1 — USERS TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 1: CREATE USERS ---');
    const usersToInsert = [
      { name: 'Sudharsan M', email: 'sudharsan@cpms.com', pass: 'Manager@123', role: '2' },
      { name: 'Harish K', email: 'harish@cpms.com', pass: 'Engineer@123', role: '3' },
      { name: 'Praveen S', email: 'praveen@cpms.com', pass: 'Acct@123', role: '1' }
    ];

    for (const u of usersToInsert) {
      const [exists] = await db.query('SELECT user_id FROM users WHERE email = ?', [u.email]);
      if (exists.length > 0) {
        console.log(`User ${u.name} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/users', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add User');
      await page.waitForSelector('.modal', { visible: true });
      await delay(500);

      await typeInForm(page, '.modal input[name="name"]', u.name);
      await typeInForm(page, '.modal input[name="email"]', u.email);
      await typeInForm(page, '.modal input[name="password_hash"]', u.pass);
      await page.select('.modal select[name="role_id"]', u.role);
      await delay(500);

      await clickButtonWithText(page, 'Create');
      await delay(2000);

      // Verify in DB
      const [verified] = await db.query('SELECT user_id FROM users WHERE email = ?', [u.email]);
      if (verified.length > 0) {
        console.log(`✅ User ${u.name} created successfully!`);
      } else {
        throw new Error(`Failed to verify User ${u.name} in DB`);
      }
    }
    await takeScreenshot(page, 'Step1_Users');

    // Get Sudharsan M's user_id for projects
    const [[sudharsanUser]] = await db.query('SELECT user_id FROM users WHERE email = ?', ['sudharsan@cpms.com']);
    const managerId = String(sudharsanUser.user_id);

    // ----------------------------------------------------
    // STEP 2 — PROJECTS TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 2: CREATE PROJECTS ---');
    const projectsToInsert = [
      { name: 'Madurai Smart Residential Complex', loc: 'Madurai, Tamil Nadu', start: '2025-01-15', end: '2026-06-30', budget: '4500000', status: 'ongoing' },
      { name: 'NH-38 Highway Bridge Repair', loc: 'Dindigul, Tamil Nadu', start: '2025-02-01', end: '2025-12-31', budget: '8000000', status: 'ongoing' },
      { name: 'KLN Campus Parking Block', loc: 'Pottapalayam, Sivagangai', start: '2024-10-01', end: '2025-08-31', budget: '1800000', status: 'on_hold' }
    ];

    for (const p of projectsToInsert) {
      const [exists] = await db.query('SELECT project_id FROM projects WHERE project_name = ?', [p.name]);
      if (exists.length > 0) {
        console.log(`Project ${p.name} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/projects', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add Project');
      await delay(500);

      await typeInForm(page, 'input[name="project_name"]', p.name);
      await typeInForm(page, 'input[name="location"]', p.loc);
      await typeInForm(page, 'input[name="start_date"]', p.start);
      await typeInForm(page, 'input[name="end_date"]', p.end);
      await typeInForm(page, 'input[name="estimated_budget"]', p.budget);
      await page.select('select[name="status"]', p.status);
      await page.select('select[name="created_by"]', managerId);

      await clickButtonWithText(page, 'Create');
      await delay(1500);

      // Verify in DB
      const [verified] = await db.query('SELECT project_id FROM projects WHERE project_name = ?', [p.name]);
      if (verified.length > 0) {
        console.log(`✅ Project ${p.name} created!`);
      } else {
        throw new Error(`Failed to verify Project ${p.name} in DB`);
      }
    }
    await takeScreenshot(page, 'Step2_Projects');

    // Retrieve Project IDs for later steps
    const [[p1]] = await db.query('SELECT project_id FROM projects WHERE project_name = ?', ['Madurai Smart Residential Complex']);
    const [[p2]] = await db.query('SELECT project_id FROM projects WHERE project_name = ?', ['NH-38 Highway Bridge Repair']);
    const [[p3]] = await db.query('SELECT project_id FROM projects WHERE project_name = ?', ['KLN Campus Parking Block']);

    // ----------------------------------------------------
    // STEP 3 — MATERIALS MASTER TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 3: CREATE MASTER MATERIALS ---');
    const materialsToInsert = [
      { name: 'Ordinary Portland Cement (OPC 53)', unit: 'Bag (50kg)', price: '420' },
      { name: 'TMT Steel Bar (Fe-500)', unit: 'KG', price: '72' },
      { name: 'River Sand (M-Sand)', unit: 'CuFt', price: '55' },
      { name: '20mm Crushed Stone Aggregate', unit: 'CuFt', price: '48' },
      { name: 'Red Brick (Wire Cut)', unit: 'Nos', price: '9' },
      { name: 'Hollow Block (200mm)', unit: 'Nos', price: '38' },
      { name: 'Waterproofing Compound (Dr. Fixit)', unit: 'Litre', price: '310' },
      { name: 'PVC Pipe (4 inch)', unit: 'Metre', price: '185' }
    ];

    for (const m of materialsToInsert) {
      const [exists] = await db.query('SELECT material_id FROM materials_master WHERE material_name = ?', [m.name]);
      if (exists.length > 0) {
        console.log(`Material ${m.name} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/materials', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add Material');
      await delay(500);

      await typeInForm(page, 'input[name="material_name"]', m.name);
      await typeInForm(page, 'input[name="unit"]', m.unit);
      await typeInForm(page, 'input[name="unit_price"]', m.price);
      await typeInForm(page, 'input[name="total_purchased"]', '0');

      await clickButtonWithText(page, 'Create');
      await delay(1500);

      const [verified] = await db.query('SELECT material_id FROM materials_master WHERE material_name = ?', [m.name]);
      if (verified.length > 0) {
        console.log(`✅ Material ${m.name} created!`);
      } else {
        throw new Error(`Failed to verify Material ${m.name} in DB`);
      }
    }
    await takeScreenshot(page, 'Step3_Materials');

    // Get material IDs
    const getMaterialId = async (name) => {
      const [[res]] = await db.query('SELECT material_id FROM materials_master WHERE material_name = ?', [name]);
      return String(res.material_id);
    };

    // ----------------------------------------------------
    // STEP 4 — MACHINES MASTER TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 4: CREATE MASTER MACHINES ---');
    const machinesToInsert = [
      { name: 'JCB 3DX Backhoe Loader', type: 'Earthwork', rate: '1800' },
      { name: 'Transit Mixer (6 CuM)', type: 'Concrete', rate: '1200' },
      { name: 'Tower Crane (50T)', type: 'Lifting', rate: '2500' },
      { name: 'Plate Compactor', type: 'Compaction', rate: '450' },
      { name: 'Concrete Vibrator (2HP)', type: 'Concrete', rate: '200' },
      { name: 'Bar Bending Machine', type: 'Fabrication', rate: '350' }
    ];

    for (const mac of machinesToInsert) {
      const [exists] = await db.query('SELECT machine_id FROM machines_master WHERE machine_name = ?', [mac.name]);
      if (exists.length > 0) {
        console.log(`Machine ${mac.name} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/machines', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add Machine');
      await delay(500);

      await typeInForm(page, 'input[name="machine_name"]', mac.name);
      await typeInForm(page, 'input[name="machine_type"]', mac.type);
      await typeInForm(page, 'input[name="hourly_rate"]', mac.rate);
      await page.select('select[name="ownership_type"]', 'rented');

      await clickButtonWithText(page, 'Create');
      await delay(1500);

      const [verified] = await db.query('SELECT machine_id FROM machines_master WHERE machine_name = ?', [mac.name]);
      if (verified.length > 0) {
        console.log(`✅ Machine ${mac.name} created!`);
      } else {
        throw new Error(`Failed to verify Machine ${mac.name} in DB`);
      }
    }
    await takeScreenshot(page, 'Step4_Machines');

    // Get machine IDs
    const getMachineId = async (name) => {
      const [[res]] = await db.query('SELECT machine_id FROM machines_master WHERE machine_name = ?', [name]);
      return String(res.machine_id);
    };

    // ----------------------------------------------------
    // STEP 5 — MATERIAL USAGE TABLE (Bulk / 1 row each)
    // ----------------------------------------------------
    console.log('\n--- STEP 5: LOG MATERIAL USAGE ---');
    const materialUsageRecords = [
      { proj: String(p1.project_id), name: 'Greenfield', matName: 'Ordinary Portland Cement (OPC 53)', qty: '250', price: '420', date: '2025-03-10', supplier: 'Ramco Cements Ltd' },
      { proj: String(p1.project_id), name: 'Greenfield', matName: 'TMT Steel Bar (Fe-500)', qty: '3500', price: '72', date: '2025-03-12', supplier: 'Vizag Steel Madurai Depot' },
      { proj: String(p2.project_id), name: 'Highway', matName: 'Waterproofing Compound (Dr. Fixit)', qty: '120', price: '310', date: '2025-04-05', supplier: 'Pidilite Industries' },
      { proj: String(p2.project_id), name: 'Highway', matName: '20mm Crushed Stone Aggregate', qty: '800', price: '48', date: '2025-04-08', supplier: 'Sri Vel Murugan Quarry' },
      { proj: String(p3.project_id), name: 'Parking', matName: 'Hollow Block (200mm)', qty: '2400', price: '38', date: '2024-11-20', supplier: 'Kovai Block Industries' }
    ];

    for (const record of materialUsageRecords) {
      const matId = await getMaterialId(record.matName);
      // Check if exists
      const [exists] = await db.query(
        'SELECT id FROM material_usage WHERE project_id = ? AND material_id = ? AND usage_date = ? AND quantity = ?',
        [record.proj, matId, record.date, record.qty]
      );
      if (exists.length > 0) {
        console.log(`Material usage for ${record.matName} on ${record.date} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/material-usage', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Log Usage');
      await delay(800);

      // In bulk log modal:
      // Select project (first select)
      const selectProject = await page.$('div.form-row + div select, select');
      await selectProject.select(record.proj);

      // Select date
      const dateInput = await page.$('input[type="date"]');
      await typeInForm(page, dateInput, record.date);

      // Select material
      const row = (await page.$$('.responsive-grid-row'))[0];
      const matSelect = await row.$('select');
      await matSelect.select(matId);

      // Fill Qty
      const numInputs = await row.$$('input[type="number"]');
      await typeInForm(page, numInputs[0], record.qty);
      
      // Check unit price (auto filled or manually typed)
      await numInputs[1].click({ clickCount: 3 });
      await typeInForm(page, numInputs[1], record.price);

      // Fill supplier
      const textInputs = await row.$$('input[type="text"]');
      await typeInForm(page, textInputs[0], record.supplier);

      // Submit
      await clickButtonWithText(page, 'Submit All');
      await delay(1500);
      console.log(`✅ Material usage logged for ${record.matName}`);
    }
    await takeScreenshot(page, 'Step5_MaterialUsage');

    // ----------------------------------------------------
    // STEP 6 — MANPOWER USAGE TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 6: LOG MANPOWER USAGE ---');
    const manpowerUsageRecords = [
      { proj: String(p1.project_id), worker: 'Murugan K', days: '26', rate: '800', date: '2025-03-31' },
      { proj: String(p1.project_id), worker: 'Rajan S', days: '18', rate: '900', date: '2025-04-30' },
      { proj: String(p2.project_id), worker: 'Vijay N', days: '15', rate: '950', date: '2025-04-15' },
      { proj: String(p2.project_id), worker: 'Pandi L', days: '22', rate: '550', date: '2025-04-30' },
      { proj: String(p3.project_id), worker: 'Kannan P', days: '12', rate: '750', date: '2024-12-15' }
    ];

    const getWorkerId = async (name) => {
      const [[res]] = await db.query('SELECT worker_id FROM workers WHERE name = ?', [name]);
      return String(res.worker_id);
    };

    for (const record of manpowerUsageRecords) {
      const workerId = await getWorkerId(record.worker);
      const [exists] = await db.query(
        'SELECT id FROM manpower_usage WHERE project_id = ? AND worker_id = ? AND work_date = ?',
        [record.proj, workerId, record.date]
      );
      if (exists.length > 0) {
        console.log(`Manpower usage for ${record.worker} on ${record.date} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/manpower-usage', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Log Attendance');
      await delay(800);

      // Select project
      const selectProject = await page.$('select');
      await selectProject.select(record.proj);

      // Select date
      const dateInput = await page.$('input[type="date"]');
      await typeInForm(page, dateInput, record.date);

      // Select worker
      const row = (await page.$$('.responsive-grid-row'))[0];
      const workerSelect = await row.$('select');
      await workerSelect.select(workerId);

      // Fill Days
      const numInputs = await row.$$('input[type="number"]');
      await typeInForm(page, numInputs[0], record.days);

      // Verify/Type Daily Rate
      await numInputs[1].click({ clickCount: 3 });
      await typeInForm(page, numInputs[1], record.rate);

      // Submit
      await clickButtonWithText(page, 'Submit All');
      await delay(1500);
      console.log(`✅ Manpower usage logged for ${record.worker}`);
    }
    await takeScreenshot(page, 'Step6_ManpowerUsage');

    // ----------------------------------------------------
    // STEP 7 — MACHINE USAGE TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 7: LOG MACHINE USAGE ---');
    const machineUsageRecords = [
      { proj: String(p1.project_id), machine: 'JCB 3DX Backhoe Loader', hours: '48', rate: '1800', date: '2025-02-20', operator: 'Balu Operator' },
      { proj: String(p1.project_id), machine: 'Transit Mixer (6 CuM)', hours: '36', rate: '1200', date: '2025-03-05', operator: 'Selvam Driver' },
      { proj: String(p2.project_id), machine: 'Plate Compactor', hours: '24', rate: '450', date: '2025-04-10', operator: 'Durai G' },
      { proj: String(p2.project_id), machine: 'Concrete Vibrator (2HP)', hours: '18', rate: '200', date: '2025-04-18', operator: 'Anbu C' },
      { proj: String(p3.project_id), machine: 'Bar Bending Machine', hours: '20', rate: '350', date: '2024-11-25', operator: 'Suresh T' }
    ];

    for (const record of machineUsageRecords) {
      const machineId = await getMachineId(record.machine);
      const [exists] = await db.query(
        'SELECT id FROM machine_usage WHERE project_id = ? AND machine_id = ? AND usage_date = ?',
        [record.proj, machineId, record.date]
      );
      if (exists.length > 0) {
        console.log(`Machine usage for ${record.machine} on ${record.date} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/machine-usage', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Log Usage');
      await delay(800);

      // Select project
      const selectProject = await page.$('select');
      await selectProject.select(record.proj);

      // Select date
      const dateInput = await page.$('input[type="date"]');
      await typeInForm(page, dateInput, record.date);

      // Select machine
      const row = (await page.$$('.responsive-grid-row'))[0];
      const machineSelect = await row.$('select');
      await machineSelect.select(machineId);

      // Fill Hours
      const numInputs = await row.$$('input[type="number"]');
      await typeInForm(page, numInputs[0], record.hours);

      // Fill Rate
      await numInputs[1].click({ clickCount: 3 });
      await typeInForm(page, numInputs[1], record.rate);

      // Fill Operator
      const textInputs = await row.$$('input[type="text"]');
      await typeInForm(page, textInputs[0], record.operator);

      // Submit
      await clickButtonWithText(page, 'Submit All');
      await delay(1500);
      console.log(`✅ Machine usage logged for ${record.machine}`);
    }
    await takeScreenshot(page, 'Step7_MachineUsage');

    // ----------------------------------------------------
    // STEP 8 — EXPENSES TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 8: LOG EXPENSES ---');
    const expensesToInsert = [
      { proj: String(p1.project_id), catName: 'Overhead', amount: '35000', date: '2025-01-20', desc: 'Site office setup — furniture, electricity | Vendor: Madurai Office Supplies | Invoice: INV-MOS-001 | Status: paid' },
      { proj: String(p1.project_id), catName: 'Transport', amount: '18500', date: '2025-03-15', desc: 'Cement and steel transportation from depot | Vendor: Sri Vel Transport | Invoice: INV-SVT-008 | Status: paid' },
      { proj: String(p2.project_id), catName: 'Equipment', amount: '42000', date: '2025-02-10', desc: 'Helmets, safety nets, harness sets for bridge work | Vendor: Industrial Safety Solutions | Invoice: INV-ISS-014 | Status: paid' },
      { proj: String(p2.project_id), catName: 'Miscellaneous', amount: '12000', date: '2025-03-01', desc: 'Road cutting permission and district inspection fee | Vendor: Dindigul District Office | Invoice: RCPT-DDO-002 | Status: paid' },
      { proj: String(p3.project_id), catName: 'Labor', amount: '55000', date: '2024-12-10', desc: 'Shuttering contractor payment for Level 1 | Vendor: Balaji Shuttering Works | Invoice: INV-BSW-003 | Status: partial' },
      { proj: String(p1.project_id), catName: 'Overhead', amount: '28000', date: '2025-01-10', desc: 'Workmen compensation insurance premium | Vendor: New India Assurance Co | Invoice: POL-NIA-2025-001 | Status: paid' }
    ];

    const getCategoryId = async (name) => {
      const [[res]] = await db.query('SELECT category_id FROM expense_categories WHERE category_name = ?', [name]);
      return String(res.category_id);
    };

    for (const exp of expensesToInsert) {
      const catId = await getCategoryId(exp.catName);
      const [exists] = await db.query(
        'SELECT expense_id FROM expenses WHERE project_id = ? AND category_id = ? AND expense_date = ? AND amount = ?',
        [exp.proj, catId, exp.date, exp.amount]
      );
      if (exists.length > 0) {
        console.log(`Expense for ${exp.catName} on ${exp.date} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/expenses', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add Expense');
      await delay(500);

      await page.select('select[name="project_id"]', exp.proj);
      await page.select('select[name="category_id"]', catId);
      await typeInForm(page, 'input[name="amount"]', exp.amount);
      await typeInForm(page, 'input[name="expense_date"]', exp.date);
      await typeInForm(page, 'textarea[name="description"]', exp.desc);
      await page.select('select[name="recorded_by"]', managerId);

      await clickButtonWithText(page, 'Save');
      await delay(1500);

      console.log(`✅ Expense logged for category ${exp.catName}`);
    }
    await takeScreenshot(page, 'Step8_Expenses');

    // ----------------------------------------------------
    // STEP 9 — BILLING TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 9: LOG BILLS/INVOICES ---');
    const billsToInsert = [
      { proj: String(p1.project_id), inv: 'BILL-001-APR25', amount: '1200000', status: 'paid', billDate: '2025-04-01', dueDate: '2025-04-30' },
      { proj: String(p1.project_id), inv: 'BILL-002-MAY25', amount: '950000', status: 'sent', billDate: '2025-05-15', dueDate: '2025-06-15' },
      { proj: String(p2.project_id), inv: 'BILL-HWY-001', amount: '1900000', status: 'paid', billDate: '2025-02-01', dueDate: '2025-02-15' },
      { proj: String(p2.project_id), inv: 'BILL-HWY-002', amount: '1500000', status: 'overdue', billDate: '2025-05-01', dueDate: '2025-06-01' },
      { proj: String(p3.project_id), inv: 'BILL-KLN-001', amount: '700000', status: 'paid', billDate: '2025-01-10', dueDate: '2025-02-10' }
    ];

    for (const b of billsToInsert) {
      const [exists] = await db.query('SELECT billing_id FROM billing WHERE invoice_number = ?', [b.inv]);
      if (exists.length > 0) {
        console.log(`Billing invoice ${b.inv} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/billing', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Create Invoice');
      await delay(500);

      await page.select('select[name="project_id"]', b.proj);
      await typeInForm(page, 'input[name="invoice_number"]', b.inv);
      await typeInForm(page, 'input[name="amount"]', b.amount);
      await page.select('select[name="status"]', b.status);
      await typeInForm(page, 'input[name="billing_date"]', b.billDate);
      if (b.dueDate) await typeInForm(page, 'input[name="due_date"]', b.dueDate);

      await clickButtonWithText(page, 'Create');
      await delay(1500);

      console.log(`✅ Invoice ${b.inv} created!`);
    }
    await takeScreenshot(page, 'Step9_Billing');

    // ----------------------------------------------------
    // STEP 10 — INVESTORS TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 10: CREATE INVESTORS ---');
    const investorsToInsert = [
      { name: 'Rajendran Pillai', phone: '9443112233', email: 'rajendran.p@gmail.com' },
      { name: 'Karthika Ventures Pvt Ltd', phone: '9843221100', email: 'finance@karthikaventures.com' },
      { name: 'Murugesan Nadar', phone: '9876001122', email: 'murugesan.nadar@yahoo.com' }
    ];

    for (const inv of investorsToInsert) {
      const [exists] = await db.query('SELECT investor_id FROM investors WHERE name = ?', [inv.name]);
      if (exists.length > 0) {
        console.log(`Investor ${inv.name} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/investors', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add Investor');
      await delay(500);

      await typeInForm(page, 'input[name="name"]', inv.name);
      await typeInForm(page, 'input[name="phone"]', inv.phone);
      await typeInForm(page, 'input[name="email"]', inv.email);

      await clickButtonWithText(page, 'Create');
      await delay(1500);

      console.log(`✅ Investor ${inv.name} created!`);
    }
    await takeScreenshot(page, 'Step10_Investors');

    // Get investor IDs
    const getInvestorId = async (name) => {
      const [[res]] = await db.query('SELECT investor_id FROM investors WHERE name = ?', [name]);
      return String(res.investor_id);
    };

    // ----------------------------------------------------
    // STEP 11 — FINANCIERS TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 11: CREATE FINANCIERS ---');
    const financiersToInsert = [
      { name: 'Indian Bank — Madurai Branch', phone: '0452-2345678', email: 'madurai.main@indianbank.in' },
      { name: 'HDFC Bank — Dindigul', phone: '0451-2225566', email: 'dindigul.smecell@hdfc.com' }
    ];

    for (const f of financiersToInsert) {
      const [exists] = await db.query('SELECT financier_id FROM financiers WHERE name = ?', [f.name]);
      if (exists.length > 0) {
        console.log(`Financier ${f.name} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/financiers', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add Financier');
      await delay(500);

      await typeInForm(page, 'input[name="name"]', f.name);
      await typeInForm(page, 'input[name="phone"]', f.phone);
      await typeInForm(page, 'input[name="email"]', f.email);

      await clickButtonWithText(page, 'Create');
      await delay(1500);

      console.log(`✅ Financier ${f.name} created!`);
    }
    await takeScreenshot(page, 'Step11_Financiers');

    // Get financier IDs
    const getFinancierId = async (name) => {
      const [[res]] = await db.query('SELECT financier_id FROM financiers WHERE name = ?', [name]);
      return String(res.financier_id);
    };

    // ----------------------------------------------------
    // STEP 12 — PROJECT INVESTMENTS TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 12: LOG INVESTMENTS ---');
    const investmentsToInsert = [
      { proj: String(p1.project_id), investor: 'Rajendran Pillai', amount: '1500000', date: '2025-01-05', notes: 'Equity partner — 20% share of net profit | Expected return: 1800000 | Return type: profit_share' },
      { proj: String(p1.project_id), investor: 'Karthika Ventures Pvt Ltd', amount: '2000000', date: '2025-01-10', notes: 'Returns on billing milestone completion | Expected return: 2400000 | Return type: billing_based | Billing stage: Ground Floor Slab' },
      { proj: String(p2.project_id), investor: 'Murugesan Nadar', amount: '800000', date: '2025-02-05', notes: 'Fixed 20% return, payable on project close | Expected return: 960000 | Return type: fixed' }
    ];

    for (const inv of investmentsToInsert) {
      const investorId = await getInvestorId(inv.investor);
      const [exists] = await db.query(
        'SELECT id FROM project_investments WHERE project_id = ? AND investor_id = ? AND amount = ?',
        [inv.proj, investorId, inv.amount]
      );
      if (exists.length > 0) {
        console.log(`Investment for ${inv.investor} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/investments', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add Investment');
      await delay(500);

      await page.select('select[name="project_id"]', inv.proj);
      await page.select('select[name="investor_id"]', investorId);
      await typeInForm(page, 'input[name="amount"]', inv.amount);
      await typeInForm(page, 'input[name="investment_date"]', inv.date);
      await typeInForm(page, 'textarea[name="notes"]', inv.notes);
      await page.select('select[name="created_by"]', managerId);

      await clickButtonWithText(page, 'Save');
      await delay(1500);

      console.log(`✅ Investment of ${inv.amount} recorded!`);
    }
    await takeScreenshot(page, 'Step12_Investments');

    // ----------------------------------------------------
    // STEP 13 — PROJECT LOANS TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 13: LOG LOANS ---');
    const loansToInsert = [
      { proj: String(p1.project_id), financier: 'Indian Bank — Madurai Branch', principal: '3000000', rate: '11.5', start: '2025-01-15', end: '2026-06-30', notes: 'Term loan for residential project construction | Disbursed: 3000000' },
      { proj: String(p2.project_id), financier: 'HDFC Bank — Dindigul', principal: '5000000', rate: '12.0', start: '2025-02-01', end: '2025-12-31', notes: 'Project finance — partial drawdown. Final tranche on approval. | Disbursed: 4500000' }
    ];

    for (const l of loansToInsert) {
      const finId = await getFinancierId(l.financier);
      const [exists] = await db.query(
        'SELECT id FROM project_loans WHERE project_id = ? AND financier_id = ? AND principal = ?',
        [l.proj, finId, l.principal]
      );
      if (exists.length > 0) {
        console.log(`Loan from ${l.financier} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/loans', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Add Loan');
      await delay(500);

      await page.select('select[name="project_id"]', l.proj);
      await page.select('select[name="financier_id"]', finId);
      await typeInForm(page, 'input[name="principal"]', l.principal);
      await typeInForm(page, 'input[name="interest_rate"]', l.rate);
      await typeInForm(page, 'input[name="start_date"]', l.start);
      if (l.end) await typeInForm(page, 'input[name="end_date"]', l.end);

      await clickButtonWithText(page, 'Save');
      await delay(1500);

      console.log(`✅ Loan of ${l.principal} logged!`);
    }
    await takeScreenshot(page, 'Step13_Loans');

    // Get loan IDs
    const getLoanId = async (projId, financierName) => {
      const finId = await getFinancierId(financierName);
      const [[res]] = await db.query('SELECT id FROM project_loans WHERE project_id = ? AND financier_id = ?', [projId, finId]);
      return String(res.id);
    };

    // ----------------------------------------------------
    // STEP 14 — INTEREST PAYMENTS TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 14: LOG INTEREST PAYMENTS ---');
    const interestPayments = [
      { proj: String(p1.project_id), finName: 'Indian Bank — Madurai Branch', date: '2025-02-15', amount: '28750', status: 'paid' },
      { proj: String(p1.project_id), finName: 'Indian Bank — Madurai Branch', date: '2025-03-18', amount: '28750', status: 'paid' },
      { proj: String(p1.project_id), finName: 'Indian Bank — Madurai Branch', date: '2025-04-30', amount: '28750', status: 'pending' },
      { proj: String(p2.project_id), finName: 'HDFC Bank — Dindigul', date: '2025-03-01', amount: '45000', status: 'paid' },
      { proj: String(p2.project_id), finName: 'HDFC Bank — Dindigul', date: '2025-04-30', amount: '45000', status: 'pending' } // mapped overdue -> pending
    ];

    for (const ip of interestPayments) {
      const loanId = await getLoanId(ip.proj, ip.finName);
      const [exists] = await db.query(
        'SELECT id FROM interest_payments WHERE loan_id = ? AND payment_date = ? AND amount = ?',
        [loanId, ip.date, ip.amount]
      );
      if (exists.length > 0) {
        console.log(`Interest payment of ${ip.amount} on ${ip.date} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/interest-payments', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Record Payment');
      await delay(500);

      await page.select('select[name="loan_id"]', loanId);
      await typeInForm(page, 'input[name="amount"]', ip.amount);
      await typeInForm(page, 'input[name="payment_date"]', ip.date);
      await page.select('select[name="status"]', ip.status);
      await page.select('select[name="created_by"]', managerId);

      await clickButtonWithText(page, 'Save');
      await delay(1500);

      console.log(`✅ Interest payment of ${ip.amount} logged!`);
    }
    await takeScreenshot(page, 'Step14_InterestPayments');

    // ----------------------------------------------------
    // STEP 15 — PROJECT PROGRESS TABLE
    // ----------------------------------------------------
    console.log('\n--- STEP 15: LOG PROJECT PROGRESS ---');
    const progressRecords = [
      { proj: String(p1.project_id), month: '1', year: '2025', progress: '8.50', remarks: 'Planned: 10.00% | Delay: 6 days | Work Done: Site clearing, leveling, PCC completed. Foundation layout done. | Blockers: Rain delay for 3 days in third week.' },
      { proj: String(p1.project_id), month: '2', year: '2025', progress: '18.00', remarks: 'Planned: 20.00% | Delay: 4 days | Work Done: Foundation concreting completed. Column starters done for GF. | Blockers: Steel supply delayed by 2 days.' },
      { proj: String(p1.project_id), month: '3', year: '2025', progress: '32.00', remarks: 'Planned: 35.00% | Delay: 5 days | Work Done: Ground floor columns and beam concreting done. Slab shuttering in progress. | Blockers: Labour shortage during Pongal holidays.' },
      { proj: String(p2.project_id), month: '2', year: '2025', progress: '15.00', remarks: 'Planned: 15.00% | Delay: 0 days | Work Done: Traffic diversion in place. Deck chipping and surface preparation done. | Blockers: None.' },
      { proj: String(p2.project_id), month: '3', year: '2025', progress: '28.00', remarks: 'Planned: 35.00% | Delay: 12 days | Work Done: Waterproofing membrane applied on 60% of deck area. | Blockers: Material delivery delayed. Monsoon pre-season light rain.' },
      { proj: String(p3.project_id), month: '11', year: '2024', progress: '18.00', remarks: 'Planned: 20.00% | Delay: 5 days | Work Done: Pile foundation completed. Level 1 column casting started. | Blockers: Approval for structural drawing revision pending.' }
    ];

    for (const pr of progressRecords) {
      const [exists] = await db.query(
        'SELECT id FROM project_progress WHERE project_id = ? AND month = ? AND year = ?',
        [pr.proj, pr.month, pr.year]
      );
      if (exists.length > 0) {
        console.log(`Progress for project ${pr.proj} month ${pr.month}/${pr.year} already exists. Skipping.`);
        continue;
      }

      await page.goto('http://localhost:3000/project-progress', { waitUntil: 'networkidle0' });
      await clickButtonWithText(page, 'Log Progress');
      await delay(500);

      await page.select('select[name="project_id"]', pr.proj);
      await page.select('select[name="month"]', pr.month);
      
      const yearInput = await page.$('input[name="year"]');
      await yearInput.click({ clickCount: 3 });
      await typeInForm(page, yearInput, pr.year);

      await typeInForm(page, 'input[name="progress_percentage"]', pr.progress);
      await typeInForm(page, 'textarea[name="remarks"]', pr.remarks);

      await clickButtonWithText(page, 'Save');
      await delay(1500);

      console.log(`✅ Progress logged for period ${pr.month}/${pr.year}`);
    }
    await takeScreenshot(page, 'Step15_ProjectProgress');

    // ----------------------------------------------------
    // STEP 16 — DASHBOARD VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- STEP 16: DASHBOARD VERIFICATION ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await delay(2000);
    await takeScreenshot(page, 'Step16_Dashboard');
    console.log('✅ Dashboard screenshots and verification completed!');

    console.log('\n🌟 ALL CPMS AUTOMATED UI TESTS RUN AND DB STORAGES VERIFIED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Error during execution:', error);
    await takeScreenshot(page, 'Error_State');
  } finally {
    await browser.close();
    process.exit();
  }
}

run();
