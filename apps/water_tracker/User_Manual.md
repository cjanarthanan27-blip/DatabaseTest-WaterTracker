# Water Tracker - User Manual

## 1. Introduction
Welcome to the **Water Tracker** application. This system is designed to seamlessly manage and track end-to-end water operations. It tracks water procurement, daily yields from internal sources, consumption across various locations, associated costs, vendor payments, and vehicle utilization.

---

## 2. User Roles and Access
The application features role-based access control to ensure data security and operational integrity:
*   **Admin:** Full access to all modules including User Administration, Master Data creation, Operations, and Reports.
*   **Data Entry:** Access primarily focused on daily Operations (Entering Water Purchase, Yield, Consumption, and Procurement data) and Master Data.
*   **Viewer:** Read-only access restricted primarily to the Dashboard and Reports.

User permissions are granular; depending on your account setup, you may have specific access granted or restricted for operations, master data, reports, or user management.

---

## 3. Getting Started
*   **Login:** Access the application via your web browser. Enter your provided username and password to log in.
*   **Navigation:** Use the top navigation bar to access the different modules: Dashboard, Operations, Master Data, Reports, and Admin Access.
*   **Theme Toggle:** You can switch between Light and Dark mode using the toggle icon in the top right corner.

---

## 4. Master Data Setup
Before recording daily transactions, the foundational "Master Data" must be established. This module is found under the **Master Data** dropdown.
*   **Locations:** Define the physical locations where water is loaded or unloaded (consumed).
*   **Sources:** Configure the origins of water, categorizing them as Internal Bore, Internal Well, Pipeline, or Vendor.
*   **Vehicles:** Register internal transport vehicles along with their predefined capacities (in liters).
*   **Rates:** Set and manage the historical and current tariffs for internal vehicles, vendor supplies (by load/liter), and pipeline water.
*   **Student Counts:** Record the headcount of students/people across consumption categories (used for calculating per-capita consumption metrics).
*   **Budgets:** Enter the approved monthly budget for water procurement to enable cost tracking against limits.

---

## 5. Operations (Daily Data Entry)
The **Operations** menu is where daily activities and measurements are recorded.

### 5.1 Water Purchase Entry
Use this to log daily water deliveries and purchases.
*   **Details:** Select the Date, Shift (Morning/Evening/Night), Source, Loading/Unloading Locations, and Water Type (Drinking / Normal).
*   **Quantity & Cost:** Specify the vehicle used, number of loads, or enter meter readings directly. The system automatically calculates total liters and applies the effective rate to generate the total cost.

### 5.2 Yield Tracking
Used to record the daily water drawn directly from your internal sources (Borewells and Wells).
*   **Details:** Enter the date, select the Yield Location, and input the current meter reading. The system will retrieve the previous reading to automatically calculate the yield in liters. (Bulk entry functionality is also available).

### 5.3 Consumption Tracking
Used to track water usage at specific facility locations.
*   **Details:** Select the date, choose the Consumption Location, and input the current meter reading. The consumption volume is automatically calculated based on the difference from the previous reading. (Bulk entry functionality is also available).

### 5.4 Procurement Tracker
Tracks the administrative and financial side of water purchases.
*   **Details:** Record Purchase Requests (PR), Purchase Orders (PO), and operational expenditure (OPEX) bills.
*   **Payment Status:** Monitor bills by updating their status (e.g., 'In Process' or 'Paid'), and associate them with specific vendors and budget months.

---

## 6. Dashboard & Reports
The application offers robust analytics to visualize consumption trends, costs, and utilization.

### 6.1 Dashboard
Provides an immediate, high-level overview of key metrics, recent activities, budget utilization, and quick statistics upon logging in.

### 6.2 Reports
Accessible via the **Reports** dropdown, this section provides detailed tabular and graphical data:
*   **Daily & Monthly Water Purchase:** Breakdown of costs and volumes over time.
*   **Daily Yield & Normal Consumption:** Track internal production vs. usage.
*   **Yearly Trend:** Long-term historical data visualizations.
*   **Water Type Purchase:** Compare Drinking vs. Normal water metrics.
*   **Vendor Usage & Vehicle Utilization:** Monitor reliance on specific external vendors and operational efficiency of internal transport.
*   **Cost Comparison & Site Wise Purchase:** Analyze expenses and distribution across different campus sites or facilities.
*   **Category Monthly Breakdown:** Detailed consumption analysis sliced by categories (e.g., Hostels, Academic Blocks). Includes slide show and export functionalities.
*   **Procurement Report & Budget Tracking:** Financial overview mapping actual expenditure against approved budgets.

---

## 7. Admin Access (User Management)
If you hold Admin privileges, you can access the **Admin Access** area from the top navigation bar.
*   **Manage Users:** Create new user accounts, reset passwords, and assign specific operational roles (Admin, Data Entry, Viewer).
*   **Permissions:** Toggle granular access switches (e.g., `can_access_operations`, `can_access_master_data`) for individual users.

---

## Need Help?
If you encounter any issues or require a password reset, utilize the "Forgot Password" feature on the login screen, which sends a secure reset request to your System Administrator.
