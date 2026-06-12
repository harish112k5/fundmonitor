# Investor Dashboard

## Purpose
The Investor Dashboard provides a comprehensive, high-level overview of an investor's portfolio. It aggregates the total committed funds, actual received funds, and returned funds across all projects the investor is participating in. It also highlights the outstanding balance, visualizes funding progress, details individual project commitments, and lists upcoming funding obligations.

## Files Involved
- **Frontend Component**: `frontend/src/pages/InvestorDashboard.js`
- **Backend Route**: `backend/routes/investors.js`

## API Endpoints
- `GET /investors/:investor_id/dashboard`: Fetches the aggregated dashboard metrics, project-specific details, and upcoming installment obligations.
- `POST /investors/fund-receipt/record`: Records a fund receipt and allocates it either manually or via FIFO to pending schedules.
- `POST /investors/returns/record`: Records the return of funds (ROI or principal) back to the investor.

## Database Tables
- `investor_commitment`: Tracks total amounts pledged by investors per project.
- `investor_fund_receipt`: Logs individual receipts of funds from the investor.
- `investor_returns`: Logs amounts returned to the investor.
- `projects`: Contains the project names and metadata.
- `investor_funding_schedule`: Defines the expected installment dates and amounts.
- `fund_allocation`: Maps actual receipts (`investor_fund_receipt`) to expected schedules (`investor_funding_schedule`).

## Workflow
1. The user navigates to the Investor Dashboard (typically specifying an investor ID).
2. The system loads aggregated metrics: Total Committed, Total Funded, Total Returned, and Outstanding Balance.
3. The dashboard displays a breakdown of funding per project.
4. The dashboard lists upcoming obligations (pending funding schedules).
5. The user can manually mark an upcoming installment as "Received," prompting them for a received date and hitting the fund receipt API.
6. The user can also use the "Return Funds to Investor" feature to log capital returned to the investor.

## Business Rules
- **Outstanding Balance**: Calculated as `Total Committed` - `Total Received`.
- **Funding Progress**: Calculated as `(Total Received / Total Committed) * 100`.
- **Fund Allocation**: Marking an installment as received triggers a `Manual` allocation mapping the exact amount to the selected `schedule_id`. If the allocated amount meets the scheduled amount, the schedule status becomes `Fully Received`, otherwise `Partially Received`.

## UI Components
- **Summary Cards**: Displays key metrics (Committed, Funded, Returned, Outstanding).
- **Progress Bars**: Visual progress indicators for total funding and per-project funding.
- **Project Specific View**: Cards listing individual projects the investor is assigned to.
- **Upcoming Installments Table**: Table listing pending obligations with an action button to "Mark Received."

## Dependencies
- `react-router-dom`: Used for routing and reading `investor_id` parameters.
- `react-hot-toast`: Used for success/error notifications.
- `axios` (via custom `API` module): Used for HTTP requests to the backend.

## Future Improvements
- **Dynamic Project Selection for Returns**: The "Return Funds" dialog currently defaults to the first project in the list; it should allow the user to select the specific project the funds are being returned for.
- **Payment Method Integration**: Expand the "Mark Received" action to capture payment method details (e.g., Bank Transfer, Check) instead of defaulting to `Online`.
- **Pagination/Filtering**: Add pagination or filtering for the upcoming obligations table if the list grows large.
