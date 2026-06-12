# Budget Analysis

## Purpose
The Budget Analysis module (accessed via the Budget Comparison page) provides executives and managers with a real-time financial health check of all projects. It aggregates expected budgets, actual accrued costs across all resource types, and total invoiced revenue to calculate net profit/loss and budget variance.

## Files Involved
- **Frontend Component**: `frontend/src/pages/BudgetComparison.js`
- **Backend Route**: Usually `backend/routes/dashboard.js` or a dedicated analytics controller mapping to `/dashboard/budget-comparison`.

## API Endpoints
- `GET /dashboard/budget-comparison`: Fetches the aggregated financial metrics for every project.

## Database Tables
Because this is an analytics dashboard, it touches numerous tables via aggregate queries:
- `projects`: Provides the base `billable` (budgeted amount) and `status`.
- `billing`: Aggregated to calculate `billed` (revenue).
- `expenses`: Aggregated to calculate overhead and miscellaneous actual costs.
- `material_usage`, `manpower_usage`, `machine_usage`: (Implied via cost calculations) Aggregated to compute direct operational actual costs.

## Workflow
1. The user navigates to the Budget Analysis page.
2. The system loads aggregated metrics from the backend.
3. Four main summary cards are displayed at the top:
   - **Total Billable**: The sum of all project budgets.
   - **Total Actual Cost**: The sum of all materials, manpower, machine usage, and recorded expenses.
   - **Total Billed**: The sum of all invoices generated.
   - **Net Profit/Loss**: Total Billed minus Total Actual Cost.
4. Below the summaries, a table breaks down these exact metrics on a per-project basis.
5. Users evaluate the "Health" progress bar to see how close a project is to exceeding its budget.

## Business Rules
- **Profit / Loss Calculation**: `Profit/Loss = Billed - Actual Cost`. If negative, the text turns red.
- **Budget Variance**: Calculated as `Billable (Budget) - Actual Cost`. Positive means under budget, negative means over budget.
- **Health Indicator**: Calculated as `(Actual Cost / Billable) * 100`. 
   - < 80%: Green (Healthy)
   - 80% - 100%: Yellow/Warning (Nearing budget)
   - \> 100%: Red (Over budget)

## UI Components
- **Stats Grid**: Four high-visibility cards showing overall financial posture.
- **Project Breakdown Table**: A detailed data table aligning the financial pillars (Budget, Cost, Revenue, Variance, Profit).
- **Health Progress Bar**: A visual indicator embedded within the table showing the percentage of the budget consumed.

## Dependencies
- Backend SQL aggregation queries (joining and summing across 4+ tables).
- `react-hot-toast` for loading error states.

## Future Improvements
- **Drill-down Functionality**: Allow clicking on a project row to open a modal that breaks down the "Actual Cost" into its specific components (e.g., 40% Materials, 30% Manpower, 30% Expenses).
- **Export to Excel/PDF**: Add a button to export this specific tabular view for stakeholder reporting.
- **Date Filtering**: Add a fiscal year or month date-range picker to filter the aggregates by specific timeframes.
