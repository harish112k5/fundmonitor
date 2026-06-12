# Expenses

## Purpose
The Expenses module tracks all operational and project-specific expenditures. It provides a visual dashboard analyzing where money is being spent across categories and across time, along with a full CRUD (Create, Read, Update, Delete) interface to manage individual expense records.

## Files Involved
- **Frontend Component**: `frontend/src/pages/Expenses.js`
- **Backend Route**: Usually handled in `backend/routes/expenses.js` or main server API mapping to the `expenses` endpoints.

## API Endpoints
- `GET /expenses`: Fetches all recorded expenses across projects.
- `GET /projects`: Fetches active projects for the assignment dropdown.
- `GET /expense-categories`: Fetches the available expense categories (e.g., Labor, Materials, Office).
- `GET /users`: Fetches system users to assign who recorded the expense.
- `POST /expenses`: Records a new expense.
- `PUT /expenses/:id`: Updates an existing expense record.
- `DELETE /expenses/:id`: Deletes an expense.

## Database Tables
- `expenses`: The core table storing amount, date, description, project ID, category ID, and recorder ID.
- `projects`: Referenced to map expenses to specific constructions.
- `expense_categories`: Referenced to group expenses.
- `users`: Referenced to track which employee recorded the expense.

## Workflow
1. The user opens the Expenses page and sees a high-level summary: Total Expenses, This Month's Expenses, and Total Categories.
2. Two charts are displayed: a Pie Chart breaking down expenses by category, and a Bar Chart showing the trailing 6-month trend.
3. Below the charts is a data table listing all expenses.
4. The user can click "Add Expense" to open a modal and fill out Project, Category, Amount, Date, Description, and Recorded By.
5. The user can click the edit icon on any row to modify an expense, or the delete icon to remove it.

## Business Rules
- **Charting Logic**: The pie chart aggregates amounts strictly by the `category_name`. The bar chart groups all expenses by their `YYYY-MM` month string and sorts them chronologically to show the last 6 months of data.
- **Mandatory Fields**: Amount, Date, Project, and Category are strictly required to save an expense.

## UI Components
- **Summary Cards**: Quick statistics (Total amount, This month's amount, etc.)
- **Recharts Library**: Used for `PieChart` and `BarChart` visualizations.
- **DataTable Component**: Custom reusable table component for tabular data.
- **Modals**: Used for the Add/Edit form and Delete confirmation to keep the user in the context of the page.

## Dependencies
- `recharts`: For rendering the dashboard visualizations.
- `react-hot-toast`: For success/error feedback on CRUD operations.

## Future Improvements
- **Receipt Attachment**: Allow users to upload an image or PDF of the physical receipt when recording an expense.
- **Approval Workflow**: Expenses above a certain threshold could require Manager approval before hitting the general ledger.
- **Advanced Filtering**: Add date range pickers and project filters directly to the charts and datatable.
