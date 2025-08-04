import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LocationShare = () => {
    const { caseId } = useParams();
    const [isSharing, setIsSharing] = useState(false);
    const [locationShared, setLocationShared] = useState(false);

    useEffect(() => {
        // Check if location was already shared for this case
        const sharedCases = JSON.parse(localStorage.getItem('sharedLocations') || '[]');
        if (sharedCases.includes(caseId)) {
            setLocationShared(true);
        }
    }, [caseId]);

    const shareLocation = async () => {
        setIsSharing(true);
        
        try {
            // Get current location
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve, 
                    reject,
                    { 
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            });

            const { latitude, longitude } = position.coords;

            // Send location to backend
            const response = await fetch(`https://emeloc-backend.vercel.app/api/cases/${caseId}/location`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ latitude, longitude })
            });

            if (response.ok) {
                // Mark as shared in localStorage
                const sharedCases = JSON.parse(localStorage.getItem('sharedLocations') || '[]');
                sharedCases.push(caseId);
                localStorage.setItem('sharedLocations', JSON.stringify(sharedCases));
                
                setLocationShared(true);
                toast.success('Location shared successfully! Emergency services have been notified.');
            } else {
                toast.error('Failed to share location. Please try again.');
            }
        } catch (error) {
            if (error.code === 1) {
                toast.error('Location access denied. Please enable location services and try again.');
            } else {
                console.error('Error sharing location:', error);
                toast.error('Failed to get your location. Please try again.');
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
            <ToastContainer />
            
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-red-600 text-white p-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold">🚑 Emergency Location Request</h1>
                    <p className="text-red-100 mt-2">Case ID: #{caseId?.substring(0, 8)}...</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {locationShared ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Location Already Shared</h2>
                            <p className="text-gray-600 mb-4">
                                Your location has been successfully shared with our emergency services team. 
                                Help is on the way!
                            </p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800 text-sm">
                                    ✅ Emergency services have been notified<br/>
                                    ✅ Ambulance is being dispatched<br/>
                                    ✅ Please stay calm and wait for assistance
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Share Your Current Location</h2>
                            <p className="text-gray-600 mb-6">
                                We need your current location to dispatch the nearest ambulance to you. 
                                This is for an active emergency case.
                            </p>
                            
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-yellow-800 text-sm">
                                    ⚠️ This is an urgent medical emergency request. 
                                    Please share your location immediately so we can provide assistance.
                                </p>
                            </div>

                            <button
                                onClick={shareLocation}
                                disabled={isSharing}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center"
                            >
                                {isSharing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sharing Location...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        📍 Share My Current Location
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 mt-4">
                                Your location will only be used for emergency services dispatch and will be kept confidential.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationShare;
