import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Cases = ({ isSidebarVisible }) => {
    const [cases, setCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('emergency');

    // Utility to decode WKB and get location name using Nominatim
    const [locationNames, setLocationNames] = useState({});

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        setIsLoading(true);
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
                console.log('Fetched cases from database:', data.cases);
                
                // Format cases to match the expected structure
                const formattedCases = data.cases.map(c => {
                    // Parse description to extract case details
                    const description = c.description || '';
                    const patientMatch = description.match(/Patient: ([^,]+)/);
                    const typeMatch = description.match(/Type: ([^,]+)/);

                    // Use latitude, longitude, and wkb directly from the case object
                    const latitude = c.latitude;
                    const longitude = c.longitude;
                    const wkb = c.wkb || null;

                    // OpenStreetMap link
                    const osmUrl = (latitude && longitude)
                        ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`
                        : null;

                    return {
                        id: c.id,
                        patientName: patientMatch ? patientMatch[1] : (c.patient_name || 'Unknown Patient'),
                        description: description,
                        status: c.status,
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                        email: c.email,
                        operator_id: c.operator_id,
                        latitude,
                        longitude,
                        wkb,
                        osmUrl
                    };
                });
                
                setCases(formattedCases);
            } else {
                toast.error('Failed to fetch cases from database');
            }
        } catch (error) {
            console.error('Error fetching cases:', error);
            toast.error('Failed to fetch cases');
        } finally {
            setIsLoading(false);
        }
    };

    // Decode WKB hex to coordinates (frontend version)
    function decodeWKB(wkbHex) {
        try {
            if (!wkbHex || typeof wkbHex !== 'string') return null;
            let coordsHex;
            if (wkbHex.startsWith('0101000020E6100000')) {
                coordsHex = wkbHex.substring(18);
            } else if (wkbHex.startsWith('0101000000')) {
                coordsHex = wkbHex.substring(10);
            } else {
                return null;
            }
            if (coordsHex.length < 32) return null;
            // Longitude
            const lonHex = coordsHex.substring(0, 16);
            const lonBuffer = new Uint8Array(lonHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            const longitude = new DataView(lonBuffer.buffer).getFloat64(0, true);
            // Latitude
            const latHex = coordsHex.substring(16, 32);
            const latBuffer = new Uint8Array(latHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            const latitude = new DataView(latBuffer.buffer).getFloat64(0, true);
            if (isNaN(latitude) || isNaN(longitude)) return null;
            return { latitude, longitude };
        } catch {
            return null;
        }
    }

    // Fetch location names for cases with WKB
    useEffect(() => {
        const fetchLocationNames = async () => {
            const promises = cases.map(async (c) => {
                let coords = null;
                if (c.wkb) {
                    coords = decodeWKB(c.wkb);
                } else if (c.latitude && c.longitude) {
                    coords = { latitude: c.latitude, longitude: c.longitude };
                }
                if (coords && coords.latitude && coords.longitude) {
                    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`;
                    try {
                        const res = await fetch(url);
                        if (res.ok) {
                            const data = await res.json();
                            return { id: c.id, name: data.display_name || `${coords.latitude}, ${coords.longitude}` };
                        }
                    } catch (err) {}
                    return { id: c.id, name: `${coords.latitude}, ${coords.longitude}` };
                }
                return { id: c.id, name: 'Location not specified' };
            });

            const results = await Promise.all(promises);
            const namesMap = {};
            results.forEach(({ id, name }) => {
                namesMap[id] = name;
            });
            setLocationNames(namesMap);
        };
        if (cases.length > 0) {
            fetchLocationNames();
        }
    }, [cases]);

    const showLocationOnMap = (latitude, longitude) => {
        if (latitude && longitude) {
            const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
            window.open(osmUrl, '_blank');
        } else {
            toast.warn('Location not available for this case');
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return dateString ? new Date(dateString).toLocaleDateString(undefined, options) : "Not Available";
    };

    const handleSortByDate = () => {
        const sortedCases = [...cases].sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        setCases(sortedCases);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredCases = cases.filter(c => {
        const searchString = `${c.id} ${c.description} ${c.status} ${c.patientName || ''} ${c.email || ''} ${c.location || ''}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const getEmergencyTypeStyle = (caseType) => {
        switch(caseType) {
            case 'Fire':
                return 'bg-red-100 text-red-800 border border-red-300';
            case 'Hospitalization':
                return 'bg-blue-100 text-blue-800 border border-blue-300';
            case 'Fighting':
                return 'bg-orange-100 text-orange-800 border border-orange-300';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-300';
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'active':
                return 'bg-green-100 text-green-800 border border-green-300';
            case 'closed':
                return 'bg-red-100 text-red-800 border border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-300';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <svg className="animate-spin mx-auto h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading emergency cases...</p>
                </div>
            </div>
        );
    }

    const activeEmergencyCases = filteredCases.filter(c => c.status === 'active');
    
    return (
        <div className={`container mx-auto px-4 py-8 dark:text-white ${isSidebarVisible ? 'with-sidebar' : 'without-sidebar'}`}>
            <ToastContainer />
            
            {/* Page Header */}
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-3xl font-bold">Emergency Response Dashboard</h2>
                        <p className="text-blue-100 mt-2">Monitoring and managing active cases</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-blue-900 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                            <span className="h-2 w-2 bg-green-400 rounded-full inline-block mr-2"></span>
                            {activeEmergencyCases.length} Active Cases
                        </span>
                        <span className="bg-blue-900 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                            <span className="h-2 w-2 bg-blue-400 rounded-full inline-block mr-2"></span>
                            {cases.length} Total Cases
                        </span>
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="relative flex-1 max-w-lg">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by patient, email, description..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleSortByDate}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                            </svg>
                            Sort {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <button
                            onClick={fetchCases}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('emergency')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'emergency'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            Emergency Cases
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'all'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            All Cases
                        </button>
                    </nav>
                </div>
            </div>

            {/* Emergency Cases Cards */}
            {activeTab === 'emergency' && (
                <div className="mb-8">
                    {activeEmergencyCases.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No active emergency cases</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All clear! There are currently no active emergency cases.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeEmergencyCases.map((c) => (
                                <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-102 hover:shadow-xl border border-gray-200 dark:border-gray-700">
                                    <div className={`h-2 ${c.caseType === 'Fire' ? 'bg-red-500' : c.caseType === 'Hospitalization' ? 'bg-blue-500' : c.caseType === 'Fighting' ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        
                                        <h4 className="text-xl font-bold mb-3 flex items-center">
                                            {c.patientName || 'Unknown Patient'}
                                            <span className="ml-2 text-xs font-normal text-gray-500">#{c.id.substring(0, 8)}...</span>
                                        </h4>
                                        
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-start">
                                                <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                                <span className="text-gray-700 dark:text-gray-300 text-sm">Patient Email :- {c.email}</span>
                                            </div>
                                            
                                            <div className="flex items-start">
                                                <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-gray-700 dark:text-gray-300 text-sm">
                                                    {locationNames[c.id] || 'Location not specified'}
                                                </span>
                                            </div>
                                            

                                            <div className="flex items-start">
                                                <svg className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-gray-700 dark:text-gray-300 text-sm">{formatDate(c.created_at)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 mb-4">
                                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Details:</h5>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">{c.description || 'No description provided'}</p>
                                        </div>
                                        
                                        <button
                                            onClick={() => showLocationOnMap(c.latitude, c.longitude)}
                                            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-300"
                                        >
                                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                            View on Map
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* All Cases Table */}
            {activeTab === 'all' && (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Case Info</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Emergency Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                {filteredCases.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No cases found matching your search criteria
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCases.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {c.patientName || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            ID: {c.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">{c.email}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {locationNames[c.id] || 'Location not specified'}
                                                </div>
                                                {c.wkb && (
                                                    <div className="text-xs text-gray-400">WKB: {c.wkb}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white line-clamp-2">{c.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(c.status)}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(c.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => showLocationOnMap(c.latitude, c.longitude)}
                                                    className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 hover:bg-blue-200 dark:hover:bg-opacity-50 px-3 py-1 rounded-full text-sm transition-colors duration-150"
                                                >
                                                    Map
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredCases.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow mt-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No cases found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            )}
        </div>
    );
};

export default Cases;