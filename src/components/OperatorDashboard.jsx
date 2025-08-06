import React, { useEffect, useState } from 'react';
import { Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiUser, FiFolder, FiPlusCircle, FiTruck, FiLogOut, FiMoon, FiSun, FiMenu, FiMap } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/banner.svg';
import Profile from './Profile';
import Cases from './Cases';
import NewCase from './NewCase';
import OperatorAmbulance from './OperatorAmbulance';
import AmbulanceMap from './AmbulanceMap';

const OperatorDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      navigate('/signin');
      return;
    }
    
    // Fetch user data from API
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('https://emeloc-backend-azure.vercel.app/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const { user } = await response.json();
        setUserData(user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

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
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    navigate('/signin');
  };

  const MainDashboard = () => {
    const [activeCases, setActiveCases] = useState(0);
    const [availableAmbulances, setAvailableAmbulances] = useState(0);
    const [totalAmbulances, setTotalAmbulances] = useState(0);
    const [busyAmbulances, setBusyAmbulances] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('userToken');

        // Fetch cases data
        const casesResponse = await fetch('https://emeloc-backend-azure.vercel.app/api/cases', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (casesResponse.ok) {
          const casesData = await casesResponse.json();
          const activeCount = casesData.cases.filter(case_ => case_.status === 'active').length;
          setActiveCases(activeCount);
        }

        // Fetch ambulances data
        const ambulancesResponse = await fetch('https://emeloc-backend-azure.vercel.app/api/ambulances', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (ambulancesResponse.ok) {
          const ambulancesData = await ambulancesResponse.json();
          const total = ambulancesData.ambulances.length;
          const available = ambulancesData.ambulances.filter(amb => amb.status === 'available').length;
          const busy = ambulancesData.ambulances.filter(amb => amb.status === 'busy').length;
          
          setTotalAmbulances(total);
          setAvailableAmbulances(available);
          setBusyAmbulances(busy);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-500 dark:bg-blue-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Active Cases</h3>
                <p className="text-3xl font-bold mt-2">{activeCases}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500 dark:bg-blue-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Available Ambulances</h3>
                <p className="text-3xl font-bold mt-2">{availableAmbulances}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500 dark:bg-blue-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Busy Ambulances</h3>
                <p className="text-3xl font-bold mt-2">{busyAmbulances}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500 dark:bg-blue-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Total Fleet</h3>
                <p className="text-3xl font-bold mt-2">{totalAmbulances}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/dashboard/new-case"
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FiPlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Create New Emergency Case</span>
              </Link>
              <Link
                to="/dashboard/ambulance-map"
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FiMap className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="font-medium text-gray-800 dark:text-gray-200">View Ambulance Map</span>
              </Link>
              <Link
                to="/dashboard/ambulance-tracking"
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FiTruck className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Track Ambulances</span>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Fleet Status Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Fleet Utilization</span>
                <span className="font-semibold dark:text-white">
                  {totalAmbulances > 0 ? Math.round((busyAmbulances / totalAmbulances) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalAmbulances > 0 ? (busyAmbulances / totalAmbulances) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{availableAmbulances}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{busyAmbulances}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Service</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                  <img src={logo} alt="Logo" className="h-40 w-40" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-8 px-4 flex-1">
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/dashboard' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiHome className="h-5 w-5 mr-3" />
                  <span className="font-medium">Dashboard</span>
                  {location.pathname === '/dashboard' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>

                <Link
                  to="/dashboard/cases"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/dashboard/cases' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiFolder className="h-5 w-5 mr-3" />
                  <span className="font-medium">Cases</span>
                  {location.pathname === '/dashboard/cases' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>

                <Link
                  to="/dashboard/new-case"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/dashboard/new-case' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiPlusCircle className="h-5 w-5 mr-3" />
                  <span className="font-medium">New Case</span>
                  {location.pathname === '/dashboard/new-case' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>

                <Link
                  to="/dashboard/ambulance-tracking"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/dashboard/ambulance-tracking' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiTruck className="h-5 w-5 mr-3" />
                  <span className="font-medium">Ambulance Tracking</span>
                  {location.pathname === '/dashboard/ambulance-tracking' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>

                <Link
                  to="/dashboard/ambulance-map"
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === '/dashboard/ambulance-map' 
                      ? 'bg-indigo-700 dark:bg-gray-700 text-white shadow-lg' 
                      : 'text-indigo-200 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 hover:text-white hover:shadow-md'
                  }`}
                >
                  <FiMap className="h-5 w-5 mr-3" />
                  <span className="font-medium">Ambulance Map</span>
                  {location.pathname === '/dashboard/ambulance-map' && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </div>
            </nav>

            {/* Profile Section at Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-4 border-t border-indigo-700 dark:border-gray-700">
              <Link
                to="/dashboard/profile"
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 w-full ${
                  location.pathname === '/dashboard/profile' 
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
                  {location.pathname === '/dashboard/profile' && (
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
              <FiMenu className="h-11 w-6" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route index element={<MainDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="cases" element={<Cases />} />
              <Route path="new-case" element={<NewCase />} />
              <Route path="ambulance-tracking" element={<OperatorAmbulance />} />
              <Route path="ambulance-map" element={<AmbulanceMap />} />
            </Routes>
          </div>
        </main>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default OperatorDashboard;