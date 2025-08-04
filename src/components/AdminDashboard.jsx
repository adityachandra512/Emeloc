import React, { useEffect, useState } from 'react';
import { Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiUsers, FiFolder, FiTruck, FiUser, FiLogOut, FiMoon, FiSun, FiMenu } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.svg';

// Import the separate component files
import ManageOperators from './ManageOperators';
import AllCases from './AllCases';
import ManageAmbulances from './ManageAmbulances';
import Profile from './Profile';
import AdminOverview from './AdminOverview';  // Updated import

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar is initially open
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    // Strict validation - all must exist and role must be exactly 'admin'
    if (!token || !userEmail || userRole !== 'admin') {
      // Clear potentially invalid data
      localStorage.removeItem('userToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      
      navigate('/signin');
      return;
    }
    
    setUserData({
      email: userEmail,
      role: userRole,
      name: localStorage.getItem('userName') || userEmail
    });
  }, [navigate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/signin');
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-800 to-indigo-900 dark:from-gray-800 dark:to-gray-900 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0"
          >
            {/* Header */}
            <div className="flex items-center justify-center h-20 shadow-lg border-b border-indigo-700 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <img src={logo} alt="Logo" className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-8 px-4 flex-1">
              <div className="space-y-2">
                <Link
                  to="/admin-dashboard"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/admin-dashboard' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiHome className="h-5 w-5 mr-3" />
                  <span className="font-medium">Overview</span>
                  {location.pathname === '/admin-dashboard' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>

                <Link
                  to="/admin-dashboard/operators"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/admin-dashboard/operators' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiUsers className="h-5 w-5 mr-3" />
                  <span className="font-medium">Manage Operators</span>
                  {location.pathname === '/admin-dashboard/operators' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>

                <Link
                  to="/admin-dashboard/cases"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/admin-dashboard/cases' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiFolder className="h-5 w-5 mr-3" />
                  <span className="font-medium">All Cases</span>
                  {location.pathname === '/admin-dashboard/cases' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>

                <Link
                  to="/admin-dashboard/ambulances"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/admin-dashboard/ambulances' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiTruck className="h-5 w-5 mr-3" />
                  <span className="font-medium">Manage Ambulances</span>
                  {location.pathname === '/admin-dashboard/ambulances' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </div>
            </nav>

            {/* Profile Section at Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-4 border-t border-indigo-700 dark:border-gray-700">
              <Link
                to="/admin-dashboard/profile"
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 w-full ${
                  location.pathname === '/admin-dashboard/profile' 
                    ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                    : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center w-full">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                    <FiUser className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs opacity-75">View Profile</p>
                  </div>
                  {location.pathname === '/admin-dashboard/profile' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="flex justify-between items-center py-4 px-6 bg-white dark:bg-gray-800 border-b-4 border-indigo-600">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className={`text-gray-500 focus:outline-none z-50 ${isSidebarOpen ? 'sidebar-open' : ''}`}
            >
              <FiMenu className="h-11 w-11" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="operators" element={<ManageOperators />} />
              <Route path="cases" element={<AllCases />} />
              <Route path="ambulances" element={<ManageAmbulances />} />
            </Routes>
          </div>
        </main>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default AdminDashboard;
