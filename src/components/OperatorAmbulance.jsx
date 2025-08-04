import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OperatorAmbulance = () => {
    const [ambulances, setAmbulances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingTracker, setSendingTracker] = useState(null);
    const [cases, setCases] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all'); // New state for filtering

    // Fetch ambulances from database
    useEffect(() => {
        const fetchAmbulances = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch('https://emeloc-backend.vercel.app/api/ambulances', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Received ambulance data:', data.ambulances);
                    setAmbulances(data.ambulances);
                } else {
                    toast.error('Failed to fetch ambulances');
                }
            } catch (error) {
                console.error('Error fetching ambulances:', error);
                toast.error('Error loading ambulance data');
            }
        };

        fetchAmbulances();
        const interval = setInterval(fetchAmbulances, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch cases from database
    useEffect(() => {
        const fetchCases = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch('https://emeloc-backend.vercel.app/api/cases', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Received cases data:', data.cases);
                    // Filter only active cases
                    const activeCases = data.cases.filter(case_ => case_.status === 'active');
                    setCases(activeCases);
                } else {
                    toast.error('Failed to fetch cases');
                }
            } catch (error) {
                console.error('Error fetching cases:', error);
                toast.error('Error loading cases data');
            } finally {
                setLoading(false);
            }
        };

        fetchCases();
        const interval = setInterval(fetchCases, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const handleSendTracker = async (ambulanceId, recipientEmail) => {
        setSendingTracker(ambulanceId);
        
        try {
            // Find the assigned case for this ambulance
            const assignedCase = getAssignedCase(ambulanceId);
            
            if (!assignedCase) {
                toast.error('No active case assigned to this ambulance');
                setSendingTracker(null);
                return;
            }

            // Find the ambulance details
            const ambulance = ambulances.find(amb => amb.id === ambulanceId);
            
            if (!ambulance) {
                toast.error('Ambulance details not found');
                setSendingTracker(null);
                return;
            }

            // Prepare tracking initiation data
            const trackingData = {
                caseId: assignedCase.id,
                ambulanceId: ambulanceId,
                patientEmail: assignedCase.email,
                driverEmail: ambulance.email || 'adityachandra419@gmail.com' // fallback email
            };

            console.log('Sending tracking data:', trackingData);

            // Call the tracking system API
            const response = await fetch('https://tracker-system-kappa.vercel.app/api/tracking/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(trackingData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Tracking initiated:', result);
                
                toast.success(`Tracking emails sent successfully! 
                    Patient: ${assignedCase.patient_name || 'Unknown'}
                    Ambulance: ${ambulance.license_plate}`, {
                    autoClose: 5000
                });
            } else {
                const errorData = await response.json();
                console.error('Tracking initiation failed:', errorData);
                toast.error(`Failed to send tracking emails: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error sending tracker:', error);
            toast.error('Network error: Failed to connect to tracking system');
        } finally {
            setSendingTracker(null);
        }
    };

    // Function to find assigned case for an ambulance - Updated to use ambulance ID
    const getAssignedCase = (ambulanceId) => {
        return cases.find(case_ => 
            case_.ambulance_id === ambulanceId || 
            case_.ambulance_id === ambulanceId.toString() ||
            case_.license_plate === ambulanceId // fallback for license plate matching
        );
    };

    // Filter ambulances based on status
    const filteredAmbulances = ambulances.filter(ambulance => {
        const assignedCase = getAssignedCase(ambulance.id);
        
        if (filterStatus === 'emergency') {
            return assignedCase; // Only show ambulances with active cases
        } else if (filterStatus === 'available') {
            return !assignedCase && ambulance.status === 'available';
        } else if (filterStatus === 'busy') {
            return ambulance.status === 'busy' && !assignedCase;
        }
        return true; // Show all for 'all' filter
    });

    // Count ambulances by status
    const statusCounts = {
        emergency: ambulances.filter(amb => getAssignedCase(amb.id)).length,
        available: ambulances.filter(amb => !getAssignedCase(amb.id) && amb.status === 'available').length,
        busy: ambulances.filter(amb => amb.status === 'busy' && !getAssignedCase(amb.id)).length,
        total: ambulances.length
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 dark:text-white">
            <ToastContainer position="top-right" autoClose={3000} />
            
            {/* Header with Statistics */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-6 text-center">Ambulance Fleet Status</h2>
                
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.emergency}</div>
                            <div className="text-sm text-blue-800 dark:text-blue-300">🚨 ON EMERGENCY</div>
                        </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{statusCounts.available}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">✅ AVAILABLE</div>
                        </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{statusCounts.busy}</div>
                            <div className="text-sm text-blue-600 dark:text-blue-300">🔄 BUSY</div>
                        </div>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            filterStatus === 'all'
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        All Ambulances ({statusCounts.total})
                    </button>
                    <button
                        onClick={() => setFilterStatus('emergency')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            filterStatus === 'emergency'
                                ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        🚨 On Emergency ({statusCounts.emergency})
                    </button>
                    <button
                        onClick={() => setFilterStatus('available')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            filterStatus === 'available'
                                ? 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        ✅ Available ({statusCounts.available})
                    </button>
                    <button
                        onClick={() => setFilterStatus('busy')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            filterStatus === 'busy'
                                ? 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        🔄 Busy ({statusCounts.busy})
                    </button>
                </div>
            </div>

            {/* Ambulance List */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Tracker Link</th>
                            <th className="py-3 px-6 text-left">License Plate</th>
                            <th className="py-3 px-6 text-left">Status</th>
                            <th className="py-3 px-6 text-left">Location</th>
                            <th className="py-3 px-6 text-left">Current Emergency</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-300 text-sm font-light">
                        {filteredAmbulances.length > 0 ? (
                            filteredAmbulances.map((ambulance) => {
                                const assignedCase = getAssignedCase(ambulance.id);
                                
                                return (
                                    <tr key={ambulance.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 ${
                                        assignedCase ? 'bg-red-50 dark:bg-red-900/20' : ''
                                    }`}>
                                        <td className="py-3 px-6 text-left">
                                            <button
                                                onClick={() => handleSendTracker(ambulance.id, ambulance.email)}
                                                disabled={sendingTracker === ambulance.id || !assignedCase}
                                                className={`py-2 px-4 rounded-md font-medium transition-colors ${
                                                    !assignedCase 
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                        : sendingTracker === ambulance.id
                                                            ? 'bg-blue-300 text-white cursor-not-allowed'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                                }`}
                                                title={!assignedCase ? 'No active case assigned' : 'Send tracking emails to patient and driver'}
                                            >
                                                {sendingTracker === ambulance.id ? (
                                                    <div className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Sending Emails...
                                                    </div>
                                                ) : (
                                                    <>
                                                        {assignedCase ? '📧 Send Tracker' : ''}
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-3 px-6 text-left font-semibold">{ambulance.license_plate}</td>
                                        <td className="py-3 px-6 text-left">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                assignedCase ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                                ambulance.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                                ambulance.status === 'busy' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            }`}>
                                                {assignedCase ? 'ON EMERGENCY' : ambulance.status?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            {ambulance.location ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        📍 {ambulance.location.placeName || 'Unknown Location'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {ambulance.location.latitude && ambulance.location.longitude ? 
                                                            `${ambulance.location.latitude.toFixed(4)}, ${ambulance.location.longitude.toFixed(4)}` :
                                                            'Coordinates unavailable'
                                                        }
                                                    </div>
                                                    {ambulance.location.latitude && ambulance.location.longitude && (
                                                        <a 
                                                            href={`https://www.openstreetmap.org/?mlat=${ambulance.location.latitude}&mlon=${ambulance.location.longitude}&zoom=15`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-500 hover:text-blue-700 underline"
                                                        >
                                                            View on Map
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">Location not set</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            {assignedCase ? (
                                                <div className="space-y-1">
                                                    <p className="font-medium text-red-600 dark:text-red-400 flex items-center">
                                                        🚑 <span className="ml-1">{assignedCase.description || 'Medical Emergency'}</span>
                                                    </p>
                                                    <p className="text-sm text-white font-bold">
                                                        <strong>Patient:</strong> {assignedCase.patientName || assignedCase.patient_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-white font-bold">
                                                        <strong>Case ID:</strong> {assignedCase.id}
                                                    </p>
                                                    <p className="text-sm text-white font-bold">
                                                        <strong>Started:</strong> {new Date(assignedCase.created_at).toLocaleTimeString()}
                                                    </p>
                                                    <p className="text-sm text-white font-bold">
                                                        <strong>Contact:</strong> {assignedCase.email || 'Not provided'}
                                                    </p>
                                                    <p className="text-sm text-green-400 font-bold">
                                                        <strong>Driver Email:</strong> {ambulance.email || 'adityachandra419@gmail.com'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 italic">No active emergency</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="py-8 text-center">
                                    <div className="text-gray-500 dark:text-gray-400">
                                        <div className="text-4xl mb-2">🚑</div>
                                        <div className="text-lg font-medium">No ambulances found</div>
                                        <div className="text-sm">
                                            {filterStatus === 'emergency' && 'No ambulances are currently on emergency calls'}
                                            {filterStatus === 'available' && 'No ambulances are currently available'}
                                            {filterStatus === 'busy' && 'No ambulances are currently busy'}
                                            {filterStatus === 'all' && 'No ambulances in the system'}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OperatorAmbulance;