# FundMonitor - Comprehensive Project Documentation

This document serves as a complete, detailed guide to the **FundMonitor** (also referred to as Construction ERP) application. It is designed to be fed into a low-level LLM to provide it with absolute context regarding the application's architecture, modules, security aspects, and database design.

---

## 1. High-Level Architecture

The project follows a standard decoupled Client-Server architecture:
- **Backend:** Node.js with Express.js. Serves RESTful APIs.
- **Frontend:** React.js (Single Page Application).
- **Database:** MySQL relational database.
- **Communication:** Frontend communicates with the backend via HTTP/REST using `axios`. Responses are formatted in JSON.
- **Documentation:** Swagger/OpenAPI is integrated into the backend (available at `/api/docs`).

---

## 2. Security Architecture

### Authentication & Authorization
- **JWT (JSON Web Tokens):** The application uses JWT for stateless authentication. 
- **Login Flow:** Users send credentials to `POST /api/auth/login`. On success, the backend returns a JWT.
- **Token Storage:** The frontend stores the JWT in `localStorage` (`localStorage.getItem('token')`).
- **Request Interception:** The frontend uses an Axios interceptor (`src/api/axios.js`) to attach the JWT as a Bearer token in the `Authorization` header for all outgoing requests.
- **Route Protection (`authMiddleware`):** In `backend/server.js`, all routes under `/api` (except `/api/auth/*` and `/api/health`) are protected by `authMiddleware`. If a valid token is not present, the server rejects the request with a `401 Unauthorized`.

### Network Security
- **CORS (Cross-Origin Resource Sharing):** Configured strictly in `server.js` to only allow specific origins (e.g., `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173`, and `*.vercel.app`).
- **Input Validation:** Most routes perform basic body validation to ensure required fields (like `project_id`, `amount`, `name`) are present before executing SQL queries.

---

## 3. Backend Overview (`/backend`)

The backend is structured around modular Express routers. It connects to a MySQL database using a connection pool (`backend/db.js`).

### Key Files:
- **`server.js`**: The entry point. Initializes Express, sets up CORS, registers Swagger UI, attaches `authMiddleware`, and maps all route files to their respective `/api/*` endpoints.
- **`db.js`**: Configures the `mysql2` promise-based connection pool using environment variables (Host, User, Password, DB Name).

### API Modules (Routes):
1. **Auth (`/api/auth`)**: Registration (`/register`), Login (`/login`), and Profile fetch (`/me`).
2. **Users & Roles (`/api/users`, `/api/roles`)**: CRUD operations for system users and role definitions (e.g., Admin, Manager, Viewer).
3. **Projects (`/api/projects`)**: CRUD for construction projects. Features a `/details` endpoint that aggregates a project's full details (financials, usage, team, etc.) in a single call. Includes soft-delete functionality (moves to Recycle Bin).
4. **Resource Management**:
   - **Materials (`/api/materials`, `/api/material-usage`)**: Master list of materials and consumption logs.
   - **Machines (`/api/machines`, `/api/machine-usage`)**: Equipment master list and usage tracking.
   - **Manpower (`/api/workers`, `/api/worker-roles`, `/api/manpower-usage`)**: Worker profiles, wage definitions, and labor logs.
5. **Finance & Accounting**:
   - **Expenses (`/api/expenses`, `/api/expense-categories`)**: Tracking outgoing costs.
   - **Billing (`/api/billing`)**: Invoice generation and tracking.
   - **Finance Aggregation (`/api/finance`)**: Dedicated routes that calculate complex financial metrics (e.g., Gross Profit, Current Ratios, P&L Statements, Cash Flow, IRR).
6. **Investment & Loans**:
   - **Investors (`/api/investors`)**: Investor profiles. The GET route aggregates total invested, repaid, and pending returns per investor via SQL joins.
   - **Investments (`/api/investments`)**: Maps investors to specific projects (`project_investments` table).
   - **Financiers & Loans (`/api/financiers`, `/api/loans`, `/api/interest-payments`)**: Tracks lenders, principal amounts, interest rates, and actual interest repayments.
7. **Dashboard & Analytics (`/api/dashboard`)**: Provides system-wide statistics (`/stats`), alerts for overdue payments or budget overruns (`/alerts`), and recent activity logs (`/recent`).

---

## 4. Frontend Overview (`/frontend`)

The frontend is a React SPA styled heavily with custom CSS variables to support a premium dark-mode aesthetic. 

### Key Technologies:
- **Routing:** `react-router-dom` for client-side navigation.
- **State Management:** React Hooks (`useState`, `useEffect`).
- **Data Fetching:** `axios` with interceptors.
- **Visualizations:** `recharts` for rendering complex data (Pie charts, Line charts, Bar charts, Radial Gauges).
- **Notifications:** `react-hot-toast` for UI success/error popups.

### Core UI Modules:
The frontend was recently overhauled into 10 distinct, highly polished modules:

1. **Financial Dashboard (`FinancialDashboard.js`)**: 
   - Displays aggregated KPI cards (Total Revenue, Total Cost, Net Profit, ROI).
   - Visualizes Monthly Revenue vs. Costs (BarChart) and Cost Breakdown (PieChart).
2. **Budgeting (`Budgeting.js`)**: 
   - Compares estimated budgets vs. actual spending.
   - Features progress bars indicating budget utilization and a comparative BarChart.
3. **Financial Forecast (`FinancialForecast.js`)**: 
   - Calculates "Burn Rate" and projects timeline completions.
   - Uses a LineChart to show Cumulative Actual vs. Projected spending over time.
4. **Financial Planning (`FinancialPlanning.js`)**: 
   - Tracks funding sources (Equity, Debt, Investor capital).
   - Visualizes the proportion of capital sourcing via PieCharts and Stacked BarCharts.
5. **Financial Ratios (`FinancialRatios.js`)**: 
   - Calculates and displays accounting metrics (Current Ratio, Quick Ratio, ROA, ROE).
   - Uses custom CSS-based animated gauge components.
6. **Financial Statements (`FinancialStatements.js`)**: 
   - Provides a tabbed interface for traditional accounting reports: Income Statement (P&L), Balance Sheet, and Statement of Cash Flows.
7. **Tax Compliance (`TaxCompliance.js`)**: 
   - Left pane: Form to add tax records (GST, TDS). 
   - Right pane: Table showing compliance status (Pending, Paid, Overdue).
8. **Investor Dashboard (`InvestorDashboard.js`)**: 
   - Comprehensive overview of all investors.
   - KPIs for Total Deployed, Total Repaid, and Pending Returns.
   - Displays a table calculating the ROI for each investor based on backend data.
9. **Investor Onboarding (`InvestorOnboarding.js`)**: 
   - A 4-step wizard: Basic Info → Project Assignment → Proposal → Schedule Generation.
10. **Fund Tracking (`FundTracking.js`)**: 
    - Form to record incoming funds and assign them to specific projects via specific allocation methods (FIFO, Manual, Priority).

---

## 5. Database Schema Structure (MySQL)

While the exact schema includes many tables, the critical relationships are:
- **`users` / `roles`**: Core authentication and RBAC (Role-Based Access Control).
- **`projects`**: The central entity. Almost all costs, investments, and usages tie back to `project_id`.
- **Resource Tables**: `materials`, `machines`, `workers` act as master tables. Their respective `*_usage` tables map them to a `project_id` along with dates, quantities, and costs.
- **Financial Tables**: 
  - `expenses`: Outgoing money tied to `project_id` and `category_id`.
  - `investors` & `project_investments`: Tracks equity funding. `project_investments` includes fields like `amount`, `repaid_amount`, and `status`.
  - `financiers` & `loans`: Tracks debt funding. `interest_payments` links to `loan_id`.

---

## 6. Development & Coding Standards Implemented

- **Currency Formatting:** `en-IN` locale is strictly used across the frontend to format money in Indian Rupees (e.g., `₹10,00,000`).
- **Styling Paradigm:** TailwindCSS was deliberately avoided in favor of strict Vanilla CSS using CSS Variables (`var(--bg-page)`, `var(--text-primary)`, `var(--primary-color)`).
- **Responsive Design:** Tables use `overflow-x: auto` and Grid layouts use `repeat(auto-fit, minmax(...))` to ensure mobile responsiveness.
- **Graceful Error Handling:** API errors are caught, logged to the console, and displayed to the user via `toast.error()`. Empty states are explicitly handled (e.g., "No data available").
