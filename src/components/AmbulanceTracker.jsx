import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';

// Update icon paths to use actual images
const ambulanceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const AmbulanceTracker = () => {
    const { ambulanceId } = useParams();
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState(null);
    const [ambulanceLocation, setAmbulanceLocation] = useState(null);
    const [progress, setProgress] = useState(0);
    const defaultCenter = [17.4, 78.5];
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const mapRef = useRef(null);
    const progressIntervalRef = useRef(null);

    useEffect(() => {
        let intervalId;

        const startTracking = async () => {
            setIsTracking(true);
            await updateLocation();
            intervalId = setInterval(updateLocation, 5000);
            
            // Start progress bar
            progressIntervalRef.current = setInterval(() => {
                setProgress(prev => (prev + 1) % 100);
            }, 50);
        };

        const stopTracking = () => {
            setIsTracking(false);
            if (intervalId) clearInterval(intervalId);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };

        if (ambulanceId) {
            startTracking();
        }

        return () => {
            stopTracking();
        };
    }, [ambulanceId]);

    const updateLocation = async () => {
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
            setAmbulanceLocation({ latitude, longitude });
            
            // Update map center if location changes significantly
            if (mapRef.current) {
                mapRef.current.setView([latitude, longitude], 13);
            }

        } catch (error) {
            console.error('Error updating location:', error);
            setError(error.message);
            toast.error(error.message || 'Failed to update location');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer />
            <h1 className="text-2xl font-bold mb-4">Ambulance Tracking</h1>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Status Badge */}
            <div className="mb-4">
                {isTracking ? (
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-4 py-2 rounded-full">
                        Live Tracking Active
                    </span>
                ) : (
                    <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-4 py-2 rounded-full">
                        Tracking Inactive
                    </span>
                )}
            </div>

            <div className="mb-4 h-[600px] relative rounded-lg overflow-hidden shadow-lg">
                <MapContainer 
                    center={mapCenter} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {ambulanceLocation && (
                        <Marker 
                            position={[ambulanceLocation.latitude, ambulanceLocation.longitude]}
                            icon={ambulanceIcon}
                        >
                            <Popup>
                                <div className="font-semibold">
                                    Ambulance #{ambulanceId}
                                    <br />
                                    Last Updated: {new Date().toLocaleTimeString()}
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
        </div>
    );
};

export default AmbulanceTracker;