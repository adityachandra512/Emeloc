import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LocationSharing = () => {
    const { caseId } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkLocationStatus();
    }, [caseId]);

    const checkLocationStatus = async () => {
        try {
            const storedLocation = JSON.parse(localStorage.getItem(`location_${caseId}`));
            if (storedLocation && storedLocation.latitude && storedLocation.longitude) {
                setIsShared(true);
            }
        } catch (error) {
            console.error('Error checking location status:', error);
            setError('Failed to check location status. Please try again.');
        }
    };

    const shareLocation = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;

            localStorage.setItem(`location_${caseId}`, JSON.stringify({
                latitude: parseFloat(latitude.toFixed(8)),
                longitude: parseFloat(longitude.toFixed(8)),
                updated_at: new Date().toISOString()
            }));

            toast.success('Location shared successfully');
            setIsShared(true);
        } catch (error) {
            console.error('Error sharing location:', error);
            setError(error.message || 'Failed to share location. Please try again.');
            toast.error(error.message || 'Failed to share location');
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="bg-red-700 border border-red-900 shadow-xl rounded-lg p-6 max-w-md text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Critical Error</h1>
                    <p className="text-gray-200">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-800 to-black p-6">
            <ToastContainer />
            <div className="bg-gray-900 shadow-2xl border border-gray-700 rounded-xl p-8 max-w-lg w-full text-center text-white">
                <h1 className="text-3xl font-extrabold text-red-500 mb-6">Emergency Location Sharing</h1>
                {isShared ? (
                    <p className="text-lg font-semibold text-green-400">Your location has been shared successfully.</p>
                ) : (
                    <>
                        <p className="mb-6 text-gray-300">Click the button below to share your location with emergency services:</p>
                        <button
                            onClick={shareLocation}
                            disabled={isLoading}
                            className={`w-full py-3 text-lg font-semibold text-white rounded-lg transition-all duration-300 ease-in-out ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-lg transform hover:scale-105 active:bg-red-800'}`}
                        >
                            {isLoading ? 'Sharing...' : 'Share My Location'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LocationSharing;
