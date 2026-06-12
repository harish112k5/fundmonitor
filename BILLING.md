# Billing

## Purpose
The Billing module provides a straightforward interface to manage project invoices. It allows administrators and managers to create new invoices, track their status (Draft, Sent, Paid, Overdue), and monitor due dates to ensure projects maintain healthy cash flow.

## Files Involved
- **Frontend Component**: `frontend/src/pages/Billing.js`
- **Backend Route**: Handled by the `billing` endpoints in the backend API.

## API Endpoints
- `GET /billing`: Fetches all billing/invoice records.
- `GET /projects`: Fetches projects to populate the project selection dropdown.
- `POST /billing`: Creates a new invoice record.
- `PUT /billing/:billing_id`: Updates an existing invoice.
- `DELETE /billing/:billing_id`: Deletes an invoice.

## Database Tables
- `billing`: The core table storing invoice details (invoice number, amount, status, billing date, due date).
- `projects`: Referenced to associate the invoice with a specific project.

## Workflow
1. The user navigates to the Billing page and sees a data table of all invoices.
2. The user clicks "+ Add Invoice" to open the creation modal.
3. The user inputs the Project, Invoice Number, Amount, Status, Billing Date, and Due Date.
4. On save, the backend creates the record and the table refreshes.
5. The user can click the edit icon to update the status of an invoice (e.g., changing from `sent` to `paid`) or update dates.
6. The user can delete an invoice using the trash icon.

## Business Rules
- **Invoice Statuses**: Restricted to predefined enumerations: `draft`, `sent`, `paid`, `overdue`.
- **Mandatory Fields**: Project, Invoice Number, Amount, and Billing Date are required to successfully create a billing record.

## UI Components
- **Data Table**: Displays invoices with custom rendering for the Invoice Number (monospace font) and Status (color-coded badges).
- **CRUD Modal**: A clean form containing two-column layout rows for data entry.
- **Delete Confirmation Modal**: Prevents accidental deletions by requiring explicit confirmation.

## Dependencies
- `react-hot-toast`: Provides popup notifications for CRUD actions.
- `DataTable` and `Modal` custom UI components.

## Future Improvements
- **PDF Generation & Emailing**: Add the ability to generate a PDF invoice and send it directly to the client/investor from the dashboard.
- **Auto-Overdue Status**: Run a nightly cron job on the backend that automatically changes statuses from `sent` to `overdue` if the `due_date` has passed.
- **Payment Gateway Integration**: Allow clients to pay an invoice via an online link, which automatically marks the status as `paid`.
