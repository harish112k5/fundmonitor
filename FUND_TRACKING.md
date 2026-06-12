# Fund Tracking

## Purpose
The Fund Tracking module allows administrators to record incoming funds from an investor and dynamically apply those funds to pending installment obligations. The module acts as an accounts receivable interface where the physical receipt of funds is matched against expected schedules using automated or manual allocation strategies.

## Files Involved
- **Frontend Component**: `frontend/src/pages/FundTracking.js`
- **Backend Route**: `backend/routes/investors.js` (fund-receipt and allocation logic)

## API Endpoints
- `GET /investors`: Fetches the list of all investors to populate the dropdown.
- `GET /investors/:investor_id/projects`: Fetches the projects that the selected investor is assigned to.
- `POST /investors/fund-receipt/record`: Records the fund receipt and executes the allocation logic.

## Database Tables
- `investor_basic_info`: Queried to list investors.
- `projects` / `investor_project_assignment`: Queried to list valid projects for the investor.
- `investor_fund_receipt`: A new row is inserted to log the physical transaction (Amount, Date, Payment Method).
- `fund_allocation`: A linking table where rows are created to map a specific receipt to a specific schedule.
- `investor_funding_schedule`: Status is updated (to `Partially Received` or `Fully Received`) as funds are allocated.

## Workflow
1. The user selects an Investor from the dropdown.
2. Based on the selected investor, the Projects dropdown populates with their assigned projects.
3. The user inputs the Received Amount, Date, Payment Method, and Transaction Reference.
4. The user selects an Allocation Method (FIFO, Manual, Priority).
5. On form submission, the backend:
   - Creates a new `investor_fund_receipt` record.
   - Fetches all pending schedules for the investor/project pair.
   - Iterates through the schedules applying funds until the `received_amount` is exhausted.
   - Updates the status of the schedules accordingly.
   - Creates `fund_allocation` entries indicating how much of the receipt went to which schedule.

## Business Rules
- **FIFO Allocation**: Applies funds to the oldest pending installment first (`ORDER BY scheduled_due_date ASC`). If the received amount exceeds the first installment, the remainder cascades to the next pending installment.
- **Partial Payments**: If an allocated amount doesn't cover a schedule entirely, the schedule status becomes `Partially Received`.
- **Manual/Priority Allocation**: The frontend provides the options, though Manual logic expects a specific payload shape (`manual_allocations` array) which may need a custom UI built out in the future.

## UI Components
- **Dynamic Dropdowns**: The Project dropdown remains disabled until an Investor is selected.
- **Form Row Groupings**: Clean form layout capturing financial specifics.
- **Helper Text**: Inline explanations describing how the FIFO logic will apply the funds.

## Dependencies
- `react-hot-toast`: Status notifications.
- `axios` (via custom `API` module): Handles backend communication.
- Extensive Transactional Database Logic (handled in `investors.js`) using `await connection.beginTransaction()` to ensure safe rollbacks if allocation fails.

## Future Improvements
- **Manual Allocation UI**: Build a dynamic table displaying pending schedules, allowing users to manually type in exactly how much of the received amount applies to each row if "Manual" allocation is selected.
- **Receipt PDF Generation**: Generate a downloadable PDF receipt/acknowledgment for the investor once the record is saved.
