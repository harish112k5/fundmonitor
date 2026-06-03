# BuildManager: End-to-End Workflow & Navigation Journey

This document provides a comprehensive step-by-step workflow for the **BuildManager** Construction Project Monitoring System. It describes the complete user journey, starting from the initial entry point, detailing the module hierarchy, available actions, and features on each screen.

---

## 1. Initial Entry Point: Authentication
The user journey begins at the login screen, ensuring secure access to the tool based on predefined roles.

### **Login & Registration Page (`/login`)**
- **Purpose:** Secure entry gateway.
- **Features & Actions:**
  - **Sign In:** Users enter their registered `Email` and `Password` to access the system.
  - **Password Visibility Toggle:** An eye icon to show/hide the password.
  - **Create Account (Registration):** New users can toggle to the registration form to provide their `Full Name`, `Email`, `Password`, and request a specific `Role` (Admin, Manager, Engineer, Viewer).
- **Redirection:** Upon successful authentication, the user is redirected to the **Dashboard (`/`)**.

---

## 2. Core Navigation (Sidebar)
Once authenticated, the user is presented with the main application layout. The primary navigation tool is the **Sidebar**, which dynamically adjusts based on the user's role (Admin, Manager, Engineer, Viewer).

The Sidebar is divided into logically grouped functional areas:
1. **Overview**
2. **Projects**
3. **Resources (3M)**
4. **Usage Tracking**
5. **Finance**
6. **Billing & Expenses**
7. **System**

---

## 3. Section Breakdown & Screen Flow

### 3.1 Overview Section
This section provides a high-level summary of the construction business and immediate notifications.

- **Dashboard (`/`)**
  - **Audience:** All Users.
  - **Features:** Displays key performance indicators (KPIs), active project counts, recent alerts, and summary charts. Acts as the command center.
- **Alerts (`/alerts`)**
  - **Audience:** All Users.
  - **Features:** A dedicated feed for system notifications, budget warnings, or missing usage logs.
- **Recycle Bin (`/recycle-bin`)**
  - **Audience:** Admins & Managers.
  - **Features:** A safe-delete mechanism. Users can view soft-deleted records (e.g., deleted projects or materials) and choose to **Restore** them or **Permanently Delete** them.

### 3.2 Projects Section
This is the core operational area for managing construction sites and teams.

- **Projects Catalog (`/projects`)**
  - **Features:** Lists all active and past projects. 
  - **Actions:** Users can *Create*, *Edit*, *Delete*, or *Search* for projects. Clicking on a specific project redirects to the **Project Detail** page.
- **Project Detail (`/projects/:id`)**
  - **Features:** A deep-dive screen for a single project. Contains sub-tabs or sections summarizing specific resources, financials, and team members assigned exclusively to this project.
- **Progress (`/project-progress`)**
  - **Features:** Gantt charts or milestone tracking detailing completion percentages of different project phases.
- **Team (`/project-team`)**
  - **Audience:** Admins & Managers.
  - **Features:** Assigns registered users to specific projects, managing who has operational oversight over which site.
- **Import Project (`/import`)**
  - **Audience:** Admins & Managers.
  - **Features:** A bulk-upload module. Users can upload `.xlsx` (Excel) files to ingest large volumes of historical data. The module previews errors and prevents duplicate data entries before saving.

### 3.3 Resources (3M) Section
Manages the foundational catalogs of the three M's of construction: Materials, Machines, and Manpower.

- **Materials (`/materials`)**
  - **Features:** A master catalog of all physical materials (e.g., Cement, Steel).
  - **Actions:** Add new items, update unit types (kg, tons), and set baseline costs.
- **Machines (`/machines`)**
  - **Features:** Equipment inventory (e.g., Excavators, Cranes). 
  - **Actions:** Track equipment ownership, rental status, and operational capacity.
- **Workers (`/workers`)**
  - **Features:** A database of laborers and site staff.
  - **Actions:** Define worker trades/skills and daily wage rates.

### 3.4 Usage Tracking Section
The daily operational logbook for engineers and site managers.

- **Material Usage (`/material-usage`)**
  - **Features:** Logs daily consumption of materials on specific sites.
  - **Actions:** Select a project, select a material, enter quantity consumed, and log the date.
- **Manpower Usage (`/manpower-usage`)**
  - **Features:** Daily attendance and labor allocation.
  - **Actions:** Log how many workers (or specific teams) were present at a site and calculate daily labor costs.
- **Machine Usage (`/machine-usage`)**
  - **Features:** Equipment utilization tracking.
  - **Actions:** Record the hours logged by specific machinery on a project to calculate fuel consumption and wear-and-tear costs.

### 3.5 Finance Section
Restricted to higher-level management to track capital inflow and debt.

- **Investors (`/investors`) & Financiers (`/financiers`)**
  - **Features:** CRM-style profiles for entities providing capital or loans.
  - **Actions:** Add contact details and track relationship history.
- **Investments (`/investments`)**
  - **Features:** Records of equity capital infused into the business or specific projects.
- **Loans (`/loans`)**
  - **Features:** Tracking borrowed capital, interest rates, and principal amounts.
- **Interest Payments (`/interest-payments`)**
  - **Features:** A ledger for scheduling and recording interest payouts against active loans.

### 3.6 Billing & Expenses Section
Manages the outflow of cash and client invoicing.

- **Expenses (`/expenses`)**
  - **Features:** Day-to-day operational expenditures (e.g., fuel, petty cash, permit fees).
  - **Actions:** Log expense amounts, categorize them, and attach them to specific projects.
- **Billing (`/billing`)**
  - **Features:** Client invoice generation and tracking.
  - **Actions:** Create bills based on project milestones, track payment statuses (Pending, Paid).
- **Budget Analysis (`/budget-comparison`)**
  - **Features:** A reporting dashboard.
  - **Actions:** Visually compares the estimated budget of a project against actual expenses and resource usage to identify cost overruns.

### 3.7 System Section
Strictly restricted to Administrators for platform maintenance.

- **Users (`/users`)**
  - **Features:** Complete user management.
  - **Actions:** Approve new registrations, change user roles, reset passwords, or deactivate accounts.
- **Audit Log (`/audit-log`)**
  - **Features:** A security and compliance trail.
  - **Actions:** View a chronological list of all system actions (e.g., "User X deleted Project Y"), including timestamps and IP tracking.

---

## 4. Example Step-by-Step User Journey

**Scenario: A Project Manager setting up a new construction site.**

1. **Authentication:** The manager logs in via `/login`.
2. **Dashboard Review:** Lands on the Dashboard (`/`) to review current active projects and alerts.
3. **Project Creation:** Navigates to **Projects** (`/projects`), clicks "Add New Project", and fills out the site details.
4. **Team Assignment:** Navigates to **Team** (`/project-team`) and assigns a Site Engineer to the newly created project.
5. **Resource Verification:** Checks the **Materials** (`/materials`) catalog to ensure the necessary resources (e.g., specific grade concrete) are available in the system.
6. **Usage Monitoring:** Over the next week, the assigned Engineer logs into the system and uses the **Usage Tracking** section (`/material-usage`, `/manpower-usage`) to log daily consumption.
7. **Financial Review:** The Manager navigates to **Budget Analysis** (`/budget-comparison`) to review if the Engineer's daily usage logs are keeping the project within the estimated financial limits.
