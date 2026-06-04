const express = require('express');
const router = express.Router();
const db = require('../db');

// ==========================================
// 1. INVESTOR ONBOARDING & BASIC INFO
// ==========================================

// Register new investor (Step 1)
router.post('/register', async (req, res) => {
  try {
    const { investor_type, name, email, phone, alt_contact, category, pan_id, address, bank_details, kyc_status } = req.body;
    const [result] = await db.query(
      `INSERT INTO investor_basic_info 
      (investor_type, name, email, phone, alt_contact, category, pan_id, address, bank_details, kyc_status, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [investor_type, name, email, phone || null, alt_contact || null, category || 'Other', pan_id || null, address || null, bank_details || null, kyc_status || 'Pending', req.user?.id || null]
    );
    res.status(201).json({ investor_id: result.insertId, message: 'Investor registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all investors
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM investor_basic_info ORDER BY investor_id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single investor
router.get('/:investor_id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM investor_basic_info WHERE investor_id = ?', [req.params.investor_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Investor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update investor
router.put('/:investor_id', async (req, res) => {
  try {
    const { name, phone, email, alt_contact, category, pan_id, address, bank_details, kyc_status } = req.body;
    await db.query(
      `UPDATE investor_basic_info 
       SET name=?, phone=?, email=?, alt_contact=?, category=?, pan_id=?, address=?, bank_details=?, kyc_status=? 
       WHERE investor_id=?`,
      [name, phone, email, alt_contact, category, pan_id, address, bank_details, kyc_status, req.params.investor_id]
    );
    res.json({ message: 'Investor updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PROJECT ASSIGNMENT (Step 2)
// ==========================================

router.post('/:investor_id/assign-project', async (req, res) => {
  try {
    const { project_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO investor_project_assignment (investor_id, project_id, assigned_by) VALUES (?, ?, ?)',
      [req.params.investor_id, project_id, req.user?.id || null]
    );
    res.status(201).json({ assignment_id: result.insertId, message: 'Project assigned successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Investor is already assigned to this project' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/:investor_id/projects', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, a.assigned_at 
      FROM investor_project_assignment a
      JOIN projects p ON a.project_id = p.project_id
      WHERE a.investor_id = ?
    `, [req.params.investor_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get investors for a specific project
router.get('/project/:project_id/list', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.*, a.assigned_at
      FROM investor_project_assignment a
      JOIN investor_basic_info i ON a.investor_id = i.investor_id
      WHERE a.project_id = ?
    `, [req.params.project_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. INVESTMENT PROPOSALS (Step 3)
// ==========================================

router.post('/proposals/create', async (req, res) => {
  try {
    const { investor_id, project_id, proposed_amount, expected_roi_percent, investment_duration_months, risk_level, expiry_date } = req.body;
    const [result] = await db.query(
      `INSERT INTO investment_proposal 
      (investor_id, project_id, proposed_amount, expected_roi_percent, investment_duration_months, risk_level, expiry_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [investor_id, project_id, proposed_amount, expected_roi_percent || 15.00, investment_duration_months || 36, risk_level || 'Medium', expiry_date, req.user?.id || null]
    );
    res.status(201).json({ proposal_id: result.insertId, message: 'Proposal created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/proposals/:proposal_id/response', async (req, res) => {
  try {
    const { response_action, counter_amount, reason } = req.body;
    const proposal_id = req.params.proposal_id;

    await db.query(
      'INSERT INTO proposal_response (proposal_id, response_action, counter_amount, reason) VALUES (?, ?, ?, ?)',
      [proposal_id, response_action, counter_amount || null, reason || null]
    );

    // Update proposal status
    await db.query('UPDATE investment_proposal SET status = ? WHERE proposal_id = ?', [response_action, proposal_id]);

    // If accepted, automatically create commitment
    if (response_action === 'Accept') {
      const [proposal] = await db.query('SELECT * FROM investment_proposal WHERE proposal_id = ?', [proposal_id]);
      if (proposal.length > 0) {
        const p = proposal[0];
        await db.query(
          'INSERT INTO investor_commitment (investor_id, project_id, proposal_id, total_committed_amount, created_by) VALUES (?, ?, ?, ?, ?)',
          [p.investor_id, p.project_id, p.proposal_id, p.proposed_amount, req.user?.id || null]
        );
      }
    }

    res.json({ message: 'Response recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/proposals/investor/:investor_id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM investment_proposal WHERE investor_id = ? ORDER BY created_at DESC', [req.params.investor_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. COMMITMENTS & SCHEDULES (Step 4)
// ==========================================

router.post('/commitments/create', async (req, res) => {
  try {
    const { investor_id, project_id, total_committed_amount } = req.body;
    const [result] = await db.query(
      'INSERT INTO investor_commitment (investor_id, project_id, total_committed_amount, created_by) VALUES (?, ?, ?, ?)',
      [investor_id, project_id, total_committed_amount, req.user?.id || null]
    );
    res.status(201).json({ commitment_id: result.insertId, message: 'Commitment created manually' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/commitments/:commitment_id/schedule', async (req, res) => {
  try {
    const { schedules } = req.body; // Array of { installment_number, scheduled_amount, scheduled_due_date, payment_method_preference, notes }
    const commitment_id = req.params.commitment_id;
    
    // Insert multiple schedules
    for (const sched of schedules) {
      await db.query(
        `INSERT INTO investor_funding_schedule 
        (commitment_id, installment_number, scheduled_amount, scheduled_due_date, payment_method_preference, notes)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [commitment_id, sched.installment_number, sched.scheduled_amount, sched.scheduled_due_date, sched.payment_method_preference || null, sched.notes || null]
      );
    }
    
    res.status(201).json({ message: 'Schedule created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/commitments/investor/:investor_id', async (req, res) => {
  try {
    const [commitments] = await db.query(`
      SELECT c.*, p.project_name 
      FROM investor_commitment c
      JOIN projects p ON c.project_id = p.project_id
      WHERE c.investor_id = ?
    `, [req.params.investor_id]);
    
    for (let c of commitments) {
      const [schedules] = await db.query('SELECT * FROM investor_funding_schedule WHERE commitment_id = ? ORDER BY installment_number', [c.commitment_id]);
      c.schedules = schedules;
    }
    
    res.json(commitments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 5. FUND RECEIPTS & ALLOCATION LOGIC
// ==========================================

router.post('/fund-receipt/record', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { investor_id, project_id, received_amount, received_date, payment_method, transaction_reference, allocation_method, manual_allocations } = req.body;
    
    // 1. Create Receipt
    const [receiptResult] = await connection.query(
      `INSERT INTO investor_fund_receipt 
      (investor_id, project_id, received_amount, received_date, payment_method, transaction_reference, allocation_method, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [investor_id, project_id, received_amount, received_date, payment_method, transaction_reference, allocation_method, req.user?.id || null]
    );
    const receipt_id = receiptResult.insertId;

    let remainingAmountToAllocate = parseFloat(received_amount);

    // Get all pending/partial schedules for this investor & project
    const [schedules] = await connection.query(`
      SELECT s.*, c.project_id 
      FROM investor_funding_schedule s
      JOIN investor_commitment c ON s.commitment_id = c.commitment_id
      WHERE c.investor_id = ? AND c.project_id = ? AND s.status IN ('Pending', 'Partially Received')
      ORDER BY s.scheduled_due_date ASC
    `, [investor_id, project_id]);

    if (allocation_method === 'FIFO') {
      // Allocate to earliest due date first
      for (const schedule of schedules) {
        if (remainingAmountToAllocate <= 0) break;

        // Calculate how much is already allocated to this schedule to find outstanding
        const [allocatedRows] = await connection.query('SELECT SUM(allocated_amount) as total FROM fund_allocation WHERE schedule_id = ?', [schedule.schedule_id]);
        const alreadyAllocated = parseFloat(allocatedRows[0].total || 0);
        const outstanding = parseFloat(schedule.scheduled_amount) - alreadyAllocated;

        if (outstanding > 0) {
          const amountToAllocateHere = Math.min(outstanding, remainingAmountToAllocate);
          
          await connection.query(
            'INSERT INTO fund_allocation (receipt_id, schedule_id, allocated_amount) VALUES (?, ?, ?)',
            [receipt_id, schedule.schedule_id, amountToAllocateHere]
          );

          remainingAmountToAllocate -= amountToAllocateHere;

          // Update schedule status
          const newTotalAllocated = alreadyAllocated + amountToAllocateHere;
          const newStatus = newTotalAllocated >= parseFloat(schedule.scheduled_amount) ? 'Fully Received' : 'Partially Received';
          await connection.query('UPDATE investor_funding_schedule SET status = ? WHERE schedule_id = ?', [newStatus, schedule.schedule_id]);
        }
      }
    } else if (allocation_method === 'Manual') {
      // Expects manual_allocations array: [{schedule_id, amount}]
      if (manual_allocations && manual_allocations.length > 0) {
        for (const alloc of manual_allocations) {
          if (remainingAmountToAllocate >= alloc.amount) {
            await connection.query(
              'INSERT INTO fund_allocation (receipt_id, schedule_id, allocated_amount) VALUES (?, ?, ?)',
              [receipt_id, alloc.schedule_id, alloc.amount]
            );
            remainingAmountToAllocate -= alloc.amount;

            // Update status
            const [scheduleRows] = await connection.query('SELECT scheduled_amount FROM investor_funding_schedule WHERE schedule_id = ?', [alloc.schedule_id]);
            const [allocatedRows] = await connection.query('SELECT SUM(allocated_amount) as total FROM fund_allocation WHERE schedule_id = ?', [alloc.schedule_id]);
            
            const scheduled = parseFloat(scheduleRows[0].scheduled_amount);
            const totalAllocated = parseFloat(allocatedRows[0].total || 0);
            
            const newStatus = totalAllocated >= scheduled ? 'Fully Received' : 'Partially Received';
            await connection.query('UPDATE investor_funding_schedule SET status = ? WHERE schedule_id = ?', [newStatus, alloc.schedule_id]);
          }
        }
      }
    } else if (allocation_method === 'Priority') {
      // (Optional: Priority logic)
      // Similar to FIFO but ordered by investor priority or schedule priority
      // Assuming FIFO for now if Priority is selected but no specific priority fields exist on schedule.
    }

    await connection.commit();
    res.status(201).json({ message: 'Fund receipt recorded and allocated successfully', receipt_id });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// ==========================================
// 6. DASHBOARDS AND METRICS
// ==========================================

router.post('/returns/record', async (req, res) => {
  try {
    const { investor_id, project_id, amount, return_date, notes } = req.body;
    const [result] = await db.query(
      `INSERT INTO investor_returns (investor_id, project_id, amount, return_date, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [investor_id, project_id, amount, return_date, notes || null]
    );
    res.status(201).json({ return_id: result.insertId, message: 'Return recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:investor_id/dashboard', async (req, res) => {
  try {
    const investor_id = req.params.investor_id;
    
    // 1. Portfolio Overview
    const [commitments] = await db.query('SELECT SUM(total_committed_amount) as total_committed FROM investor_commitment WHERE investor_id = ?', [investor_id]);
    const [receipts] = await db.query('SELECT SUM(received_amount) as total_received FROM investor_fund_receipt WHERE investor_id = ?', [investor_id]);
    const [returns] = await db.query('SELECT SUM(amount) as total_returned FROM investor_returns WHERE investor_id = ?', [investor_id]);
    
    const total_committed = parseFloat(commitments[0].total_committed || 0);
    const total_received = parseFloat(receipts[0].total_received || 0);
    const total_returned = parseFloat(returns[0].total_returned || 0);
    const outstanding_balance = total_committed - total_received;

    // 2. Project Specific Details
    const [projectDetails] = await db.query(`
      SELECT c.project_id, p.project_name, c.total_committed_amount,
             (SELECT SUM(received_amount) FROM investor_fund_receipt WHERE investor_id = c.investor_id AND project_id = c.project_id) as project_received
      FROM investor_commitment c
      JOIN projects p ON c.project_id = p.project_id
      WHERE c.investor_id = ?
    `, [investor_id]);

    // 3. Upcoming Obligations
    const [upcoming] = await db.query(`
      SELECT s.*, p.project_name, c.project_id
      FROM investor_funding_schedule s
      JOIN investor_commitment c ON s.commitment_id = c.commitment_id
      JOIN projects p ON c.project_id = p.project_id
      WHERE c.investor_id = ? AND s.status IN ('Pending', 'Partially Received')
      ORDER BY s.scheduled_due_date ASC
      LIMIT 5
    `, [investor_id]);

    res.json({
      overview: {
        total_committed,
        total_received,
        total_returned,
        outstanding_balance,
        funding_progress: total_committed > 0 ? (total_received / total_committed) * 100 : 0
      },
      projects: projectDetails.map(p => ({
        ...p,
        project_received: parseFloat(p.project_received || 0),
        remaining_balance: parseFloat(p.total_committed_amount) - parseFloat(p.project_received || 0),
        progress: parseFloat(p.total_committed_amount) > 0 ? (parseFloat(p.project_received || 0) / parseFloat(p.total_committed_amount)) * 100 : 0
      })),
      upcoming_obligations: upcoming
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin tracking: List all investors with summary metrics
router.get('/admin/tracking', async (req, res) => {
  try {
    const [investors] = await db.query(`
      SELECT i.investor_id, i.name, i.email, i.phone, i.investor_type, i.kyc_status,
        (SELECT SUM(total_committed_amount) FROM investor_commitment WHERE investor_id = i.investor_id) as total_committed,
        (SELECT SUM(received_amount) FROM investor_fund_receipt WHERE investor_id = i.investor_id) as total_received
      FROM investor_basic_info i
    `);
    
    res.json(investors.map(i => ({
      ...i,
      total_committed: parseFloat(i.total_committed || 0),
      total_received: parseFloat(i.total_received || 0),
      progress: parseFloat(i.total_committed || 0) > 0 ? (parseFloat(i.total_received || 0) / parseFloat(i.total_committed || 0)) * 100 : 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. ALERTS (Simple implementation)
// ==========================================

router.get('/alerts/investor/:investor_id', async (req, res) => {
  try {
    const [alerts] = await db.query('SELECT * FROM investor_alerts WHERE investor_id = ? AND is_resolved = FALSE ORDER BY created_at DESC', [req.params.investor_id]);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
