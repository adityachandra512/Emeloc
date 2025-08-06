import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiFolder, FiTruck, FiActivity, FiCalendar, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminOverview = () => {
  const [dashboardData, setDashboardData] = useState({
    totalOperators: 0,
    totalCases: 0,
    activeCases: 0,
    totalAmbulances: 0,
    availableAmbulances: 0,
    busyAmbulances: 0,
    recentCases: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');

      // Fetch operators (using the same endpoint as ManageOperators)
      const operatorsResponse = await fetch('https://emeloc-backend-azure.vercel.app/api/users/operators', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch cases
      const casesResponse = await fetch('https://emeloc-backend-azure.vercel.app/api/cases', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch ambulances
      const ambulancesResponse = await fetch('https://emeloc-backend-azure.vercel.app/api/ambulances', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle responses with better error checking
      let operatorsData = { operators: [] };
      let casesData = { cases: [] };
      let ambulancesData = { ambulances: [] };

      if (operatorsResponse.ok) {
        operatorsData = await operatorsResponse.json();
      } else {
        console.warn('Operators endpoint not available:', operatorsResponse.status);
        toast.warn('Could not load operators data');
      }

      if (casesResponse.ok) {
        casesData = await casesResponse.json();
      } else {
        console.warn('Cases endpoint error:', casesResponse.status);
        toast.warn('Could not load cases data');
      }

      if (ambulancesResponse.ok) {
        ambulancesData = await ambulancesResponse.json();
      } else {
        console.warn('Ambulances endpoint error:', ambulancesResponse.status);
        toast.warn('Could not load ambulances data');
      }

      // Use operators directly from the API response (no need to filter)
      const operators = operatorsData.operators || [];
      const cases = casesData.cases || [];
      const ambulances = ambulancesData.ambulances || [];

      console.log('Operators from API:', operators);

      setDashboardData({
        totalOperators: operators.length,
        totalCases: cases.length,
        activeCases: cases.filter(c => c.status === 'active').length,
        totalAmbulances: ambulances.length,
        availableAmbulances: ambulances.filter(a => a.status === 'available').length,
        busyAmbulances: ambulances.filter(a => a.status === 'busy').length,
        recentCases: cases.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Set default values on error
      setDashboardData({
        totalOperators: 0,
        totalCases: 0,
        activeCases: 0,
        totalAmbulances: 0,
        availableAmbulances: 0,
        busyAmbulances: 0,
        recentCases: []
      });
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
      {/* Welcome Header */}
      <div className="bg-blue-500 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-blue-100">Manage your emergency response system</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Operators</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.totalOperators}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FiUsers className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Active Cases</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.activeCases}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FiActivity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Available Ambulances</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.availableAmbulances}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FiTruck className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Busy Ambulances</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.busyAmbulances}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FiTruck className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Cases</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.totalCases}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FiFolder className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Fleet Utilization</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {dashboardData.totalAmbulances > 0 
                  ? Math.round((dashboardData.busyAmbulances / dashboardData.totalAmbulances) * 100)
                  : 0}%
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FiMapPin className="h-8 w-8 text-blue-600" />
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
              to="/admin-dashboard/operators"
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <FiUsers className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <span className="font-medium text-gray-800 dark:text-gray-200">Manage Operators</span>
            </Link>
            <Link
              to="/admin-dashboard/ambulances"
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <FiTruck className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <span className="font-medium text-gray-800 dark:text-gray-200">Manage Ambulances</span>
            </Link>
            <Link
              to="/admin-dashboard/cases"
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <FiFolder className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <span className="font-medium text-gray-800 dark:text-gray-200">View All Cases</span>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Recent Cases</h3>
          <div className="space-y-3">
            {dashboardData.recentCases.length > 0 ? (
              dashboardData.recentCases.map((case_, index) => (
                <div key={case_.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {case_.patientName || case_.patient_name || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {case_.description || 'Emergency'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      case_.status === 'active' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    }`}>
                      {case_.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent cases</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;