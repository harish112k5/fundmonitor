# Investor Onboarding

## Purpose
The Investor Onboarding module provides a streamlined, 4-step wizard for administrators or managers to add a new investor to the system. It handles the initial KYC/basic information capture, assigns the investor to a specific construction project, creates and auto-accepts an investment proposal (creating a commitment), and finally generates a monthly funding schedule for the committed amount.

## Files Involved
- **Frontend Component**: `frontend/src/pages/InvestorOnboarding.js`
- **Backend Route**: `backend/routes/investors.js`

## API Endpoints
- `POST /investors/register`: Registers the investor's basic information (Step 1).
- `GET /projects`: Fetches available projects for assignment.
- `POST /investors/:investor_id/assign-project`: Assigns the investor to the selected project (Step 2).
- `POST /investors/proposals/create`: Creates an investment proposal (Step 3).
- `POST /investors/proposals/:proposal_id/response`: Auto-accepts the proposal, which internally creates an `investor_commitment`.
- `GET /investors/commitments/investor/:investor_id`: Retrieves the generated commitment ID.
- `POST /investors/commitments/:commitment_id/schedule`: Generates the monthly installment schedule (Step 4).

## Database Tables
- `investor_basic_info`: Stores name, email, phone, PAN ID, and KYC status.
- `investor_project_assignment`: Maps an investor to a project.
- `investment_proposal`: Records the proposed investment amount and expected ROI.
- `proposal_response`: Records the acceptance of the proposal.
- `investor_commitment`: Created automatically upon proposal acceptance to lock in the commitment.
- `investor_funding_schedule`: Stores the generated installment dates and amounts.

## Workflow
1. **Step 1 (Basic Info)**: Admin enters investor details (Name, Email, Phone, PAN ID, Type).
2. **Step 2 (Project Assignment)**: Admin selects an active project from the dropdown.
3. **Step 3 (Investment Proposal)**: Admin inputs the proposed investment amount and expected ROI. The system creates the proposal and immediately auto-accepts it (for demo/streamlining purposes) to generate a firm commitment.
4. **Step 4 (Funding Schedule)**: Admin specifies the number of monthly installments. The system divides the total committed amount equally and creates a schedule of due dates starting from the next month.
5. **Step 5 (Complete)**: Displays a success screen and redirects to the dashboard.

## Business Rules
- **Auto-Acceptance**: Currently, proposals are automatically accepted during onboarding to reduce friction.
- **Equal Installments**: The schedule logic divides the `proposed_amount` equally by the `installments` count and spaces them exactly one month apart.
- **Mandatory Fields**: Name, Email, Project ID, and Proposed Amount are strictly required to proceed through the steps.

## UI Components
- **Wizard Stepper**: A visual indicator showing steps 1 to 4.
- **Form Inputs**: Standard HTML forms for data entry.
- **Navigation Buttons**: Next Step / Finish Onboarding buttons with loading states.

## Dependencies
- `react-hot-toast`: Used for step-by-step success/error feedback.
- Backend transactional logic in `investors.js` to ensure the proposal-to-commitment pipeline functions correctly.

## Future Improvements
- **Draft Mode**: Allow saving the onboarding progress as a draft without immediately creating commitments.
- **Custom Schedules**: Instead of forced equal monthly installments, allow the admin to manually define varying amounts or custom dates for each installment.
- **Document Upload**: Add a step to upload physical KYC documents (PAN card, Bank statements) during Step 1.
