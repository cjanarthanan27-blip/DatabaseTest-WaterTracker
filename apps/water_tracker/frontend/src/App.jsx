import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';
import logo from './assets/logo.png';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DailyMovement from './components/DailyMovement';
import DailyYield from './components/DailyYieldReport';
import YearlyTrend from './components/YearlyTrend';
import DailyNormalConsumption from './components/DailyNormalConsumptionReport';
import WaterTypeConsumption from './components/WaterTypeConsumption';
import VendorUsage from './components/VendorUsage';
import VehicleUtilization from './components/VehicleUtilization';
import CostComparison from './components/CostComparison';
import CapacityUtilization from './components/CapacityUtilization';
import SiteConsumption from './components/SiteConsumption';
import CategoryMonthlyBreakdown from './components/CategoryMonthlyBreakdown';
import StudentCountTable from './components/StudentCountTable';
import Slideshow from './components/Slideshow';

import ProcurementTracker from './components/ProcurementTracker';
import ProcurementReport from './components/ProcurementReport';
import BudgetTracking from './components/BudgetTracking';
import UserManagement from './components/UserManagement';
import { AuthProvider, useAuth } from './context/AuthContext';

// Restore Real Components
import Entries from './components/Entries';
import YieldEntries from './components/YieldEntries';
import ConsumptionEntries from './components/ConsumptionEntries';
import AddEntry from './components/AddEntry';
import Locations from './components/Locations';
import Sources from './components/Sources';
import Vehicles from './components/Vehicles';
import Rates from './components/Rates';
import Reports from './components/Reports';
import SiteDetail from './components/SiteDetail';
import VendorDetail from './components/VendorDetail';
import BulkYieldEntry from './components/BulkYieldEntry';
import BulkConsumptionEntry from './components/BulkConsumptionEntry';
// Private Route Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Access Route Component
const AccessRoute = ({ children, permission }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || user[permission] !== true) return <Navigate to="/" replace />;
  return children;
};


function App() {
  const { isAuthenticated, user, logout } = useAuth(); // Use useAuth hook
  const [trackEntriesOpen, setTrackEntriesOpen] = useState(false);
  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  // Dropdown Timeout Reference
  const dropdownTimeout = React.useRef(null);

  // Close dropdowns with a slight delay so they don't disappear immediately
  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setTrackEntriesOpen(false);
      setMasterDataOpen(false);
      setReportsOpen(false);
    }, 150); // 150ms delay gives enough grace period
  };

  const handleMouseEnter = (setter) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setTrackEntriesOpen(false);
    setMasterDataOpen(false);
    setReportsOpen(false);
    setter(true);
  };

  const closeAllDropdownsClick = () => {
    setTrackEntriesOpen(false);
    setMasterDataOpen(false);
    setReportsOpen(false);
  };

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout(); // Use context logout
    // The context will handle setting isAuthenticated to false and removing local storage items.
  };

  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col font-sans transition-colors duration-200 dark:bg-slate-900">
        {/* Header / Navbar */}
        {isAuthenticated && (
          <header className="bg-white shadow relative z-50 dark:bg-slate-800 transition-colors duration-200">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

              {/* Logo & Brand */}
              <div className="flex items-center gap-4">
                <img src={logo} alt="Sri Krishna Institutions" className="h-10 w-auto" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mr-6">Water Tracker</h1>

                {/* Top Navigation Links */}
                <nav className="hidden md:flex space-x-1">
                  <Link to="/" onClick={closeAllDropdownsClick} className="text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm font-medium rounded-md dark:text-gray-300 dark:hover:bg-slate-700">
                    Dashboard
                  </Link>

                  {/* Operations Dropdown */}
                  {user?.can_access_operations && (
                    <div className="relative flex items-center" onMouseEnter={() => handleMouseEnter(setTrackEntriesOpen)} onMouseLeave={handleMouseLeave}>
                      <button onClick={() => setTrackEntriesOpen(!trackEntriesOpen)} className={`text-gray-900 hover:bg-gray-100 flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md dark:text-gray-300 dark:hover:bg-slate-700 ${trackEntriesOpen ? 'bg-gray-100 dark:bg-slate-700' : ''}`}>
                        <span>Operations</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      {trackEntriesOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 rounded-md shadow-xl bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 z-50">
                          <div className="py-1">
                            <Link to="/entries" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Water Purchase Entry</Link>
                            <Link to="/yield-entries" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Yield Tracking</Link>
                            <Link to="/consumption-entries" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Consumption Tracking</Link>
                            <Link to="/procurement" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Procurement Tracker</Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Master Data Dropdown */}
                  {user?.can_access_master_data && (
                    <div className="relative flex items-center" onMouseEnter={() => handleMouseEnter(setMasterDataOpen)} onMouseLeave={handleMouseLeave}>
                      <button onClick={() => setMasterDataOpen(!masterDataOpen)} className={`text-gray-900 hover:bg-gray-100 flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md dark:text-gray-300 dark:hover:bg-slate-700 ${masterDataOpen ? 'bg-gray-100 dark:bg-slate-700' : ''}`}>
                        <span>Master Data</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      {masterDataOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 rounded-md shadow-xl bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 z-50">
                          <div className="py-1">
                            <Link to="/locations" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Locations</Link>
                            <Link to="/sources" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Sources</Link>
                            <Link to="/vehicles" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Vehicles</Link>
                            <Link to="/rates" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Rates</Link>
                            <Link to="/student-counts" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Student Counts</Link>
                            <Link to="/budget-tracking" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Budgets</Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reports Dropdown */}
                  {user?.can_access_reports && (
                    <div className="relative flex items-center" onMouseEnter={() => handleMouseEnter(setReportsOpen)} onMouseLeave={handleMouseLeave}>
                      <button onClick={() => setReportsOpen(!reportsOpen)} className={`text-gray-900 hover:bg-gray-100 flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md dark:text-gray-300 dark:hover:bg-slate-700 ${reportsOpen ? 'bg-gray-100 dark:bg-slate-700' : ''}`}>
                        <span>Reports</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      {reportsOpen && (
                        <div className="absolute top-full left-0 mt-1 w-60 rounded-md shadow-xl bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 z-50 max-h-[80vh] overflow-y-auto">
                          <div className="py-1">
                            <Link to="/reports?tab=daily" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Daily Water Purchase</Link>
                            <Link to="/reports?tab=daily-yield" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Daily Yield Report</Link>
                            <Link to="/reports?tab=daily-normal-consumption" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Daily Normal Consumption</Link>
                            <Link to="/reports?tab=monthly" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Monthly Water Purchase</Link>
                            <Link to="/reports?tab=yearly" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Yearly Water Purchase</Link>
                            <Link to="/reports?tab=watertype" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Water Type Purchase</Link>
                            <Link to="/reports?tab=vendor" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Vendor Usage</Link>
                            <Link to="/reports?tab=vehicle" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Vehicle Util</Link>
                            <Link to="/reports?tab=comparison" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Cost Comparison</Link>
                            <Link to="/reports?tab=site" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Site Wise Purchase</Link>
                            <Link to="/reports?tab=capacity" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Capacity Util</Link>
                            <Link to="/reports?tab=category-breakdown" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Category Monthly</Link>
                            <Link to="/reports?tab=procurement" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Procurement Report</Link>
                            <Link to="/reports?tab=muthu-nagar" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">🏟️ Muthu Nagar Building Wise</Link>
                            <Link to="/reports?tab=bannari-building-wise" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">🏢 Bannari Building Wise</Link>
                            <Link to="/reports?tab=rates" onClick={closeAllDropdownsClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700/50">Rate Details</Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Area */}
                  {user?.can_manage_users && (
                    <div className="flex items-center ml-2 pl-2 border-l border-gray-300 dark:border-slate-700">
                      <Link to="/admin/users" onClick={closeAllDropdownsClick} className="text-blue-600 hover:bg-blue-50 px-3 py-2 text-sm font-medium rounded-md dark:text-blue-400 dark:hover:bg-blue-900/20">
                        Admin Access
                      </Link>
                    </div>
                  )}
                </nav>
              </div>

              {/* Right Side Tools */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors dark:text-gray-400"
                  title="Toggle Theme"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full bg-white dark:bg-slate-900 transition-colors duration-200 overflow-y-auto">

          <Routes>
            <Route path="/login" element={
              !isAuthenticated ? (
                <Login />
              ) : (
                <Navigate to="/" replace />
              )
            } />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route
              path="/"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/entries"
              element={
                <AccessRoute permission="can_access_operations">
                  <Entries />
                </AccessRoute>
              }
            />
            <Route
              path="/yield-entries"
              element={
                <AccessRoute permission="can_access_operations">
                  <YieldEntries />
                </AccessRoute>
              }
            />
            <Route
              path="/consumption-entries"
              element={
                <AccessRoute permission="can_access_operations">
                  <ConsumptionEntries />
                </AccessRoute>
              }
            />
            <Route
              path="/add-entry"
              element={
                <AccessRoute permission="can_access_operations">
                  <AddEntry />
                </AccessRoute>
              }
            />
            <Route
              path="/edit-entry/:id"
              element={
                <AccessRoute permission="can_access_operations">
                  <AddEntry />
                </AccessRoute>
              }
            />
            <Route
              path="/edit-yield-entry/:id"
              element={
                <AccessRoute permission="can_access_operations">
                  <AddEntry />
                </AccessRoute>
              }
            />
            <Route
              path="/add-consumption-entry"
              element={
                <AccessRoute permission="can_access_operations">
                  <AddEntry />
                </AccessRoute>
              }
            />
            <Route
              path="/edit-consumption-entry/:id"
              element={
                <AccessRoute permission="can_access_operations">
                  <AddEntry />
                </AccessRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <AccessRoute permission="can_access_master_data">
                  <Locations />
                </AccessRoute>
              }
            />
            <Route
              path="/sources"
              element={
                <AccessRoute permission="can_access_master_data">
                  <Sources />
                </AccessRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <AccessRoute permission="can_access_master_data">
                  <Vehicles />
                </AccessRoute>
              }
            />
            <Route
              path="/rates"
              element={
                <AccessRoute permission="can_access_master_data">
                  <Rates />
                </AccessRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <AccessRoute permission="can_access_reports">
                  <Reports />
                </AccessRoute>
              }
            />
            <Route
              path="/site-detail/:locationId"
              element={
                <AccessRoute permission="can_access_reports">
                  <SiteDetail />
                </AccessRoute>
              }
            />
            <Route
              path="/vendor-detail/:vendorId"
              element={
                <AccessRoute permission="can_access_reports">
                  <VendorDetail />
                </AccessRoute>
              }
            />
            <Route
              path="/bulk-yield-entry"
              element={
                <AccessRoute permission="can_access_operations">
                  <BulkYieldEntry />
                </AccessRoute>
              }
            />
            <Route
              path="/bulk-consumption-entry"
              element={
                <AccessRoute permission="can_access_operations">
                  <BulkConsumptionEntry />
                </AccessRoute>
              }
            />
            <Route
              path="/student-counts"
              element={
                <AccessRoute permission="can_access_master_data">
                  <StudentCountTable />
                </AccessRoute>
              }
            />
            <Route
              path="/procurement"
              element={
                <AccessRoute permission="can_access_operations">
                  <ProcurementTracker />
                </AccessRoute>
              }
            />
            <Route
              path="/procurement-report"
              element={
                <AccessRoute permission="can_access_reports">
                  <div className="max-w-7xl mx-auto px-4 py-6">
                    <ProcurementReport />
                  </div>
                </AccessRoute>
              }
            />
            <Route
              path="/budget-tracking"
              element={
                <AccessRoute permission="can_access_master_data">
                  <BudgetTracking />
                </AccessRoute>
              }
            />
            {/* Admin Routes */}
            <Route
              path="/admin/users"
              element={
                <AccessRoute permission="can_manage_users">
                  <UserManagement />
                </AccessRoute>
              }
            />
            <Route
              path="/reports/slideshow"
              element={
                <AccessRoute permission="can_access_reports">
                  <Slideshow />
                </AccessRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router >
  );
}

const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default RootApp;
