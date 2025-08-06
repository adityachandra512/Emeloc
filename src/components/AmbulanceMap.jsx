import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Available ambulance icon (green)
const availableAmbulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Busy ambulance icon (red)
const busyAmbulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Maintenance ambulance icon (orange)
const maintenanceAmbulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Function to get icon based on ambulance status
const getAmbulanceIcon = (status) => {
  switch(status) {
    case 'available':
      return availableAmbulanceIcon;
    case 'busy':
      return busyAmbulanceIcon;
    case 'maintenance':
      return maintenanceAmbulanceIcon;
    default:
      return busyAmbulanceIcon; // Default to red if status is unknown
  }
};

// Component to handle map centering
const MapController = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  
  return null;
};

const AmbulanceMap = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loadingAmbulances, setLoadingAmbulances] = useState(true);
  const [error, setError] = useState(null);

  // Default center (India)
  const defaultCenter = { lat: 20.5937, lng: 78.9629 };

  // Calculate map center based on ambulance locations
  const getMapCenter = () => {
    if (ambulances.length === 0) return defaultCenter;
    
    // Find center of all ambulances
    const validAmbulances = ambulances.filter(ambulance => 
      ambulance.location && ambulance.location.latitude && ambulance.location.longitude
    );
    
    if (validAmbulances.length === 0) return defaultCenter;
    
    const avgLat = validAmbulances.reduce((sum, ambulance) => 
      sum + ambulance.location.latitude, 0) / validAmbulances.length;
    const avgLng = validAmbulances.reduce((sum, ambulance) => 
      sum + ambulance.location.longitude, 0) / validAmbulances.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  // Fetch ambulances from backend
  useEffect(() => {
    const fetchAmbulances = async () => {
      setLoadingAmbulances(true);
      setError(null);
      try {
        const token = localStorage.getItem('userToken');
        const response = await fetch('https://emeloc-backend-azure.vercel.app/api/ambulances', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched ambulances:', data.ambulances);
          
          // Backend already processes WKB and returns location data
          const ambulancesWithLocation = data.ambulances.filter(ambulance => 
            ambulance.location && 
            ambulance.location.latitude && 
            ambulance.location.longitude
          );
          
          setAmbulances(ambulancesWithLocation);
        } else {
          setError('Failed to fetch ambulances');
          console.error('Failed to fetch ambulances');
        }
      } catch (error) {
        setError('Error fetching ambulances');
        console.error('Error fetching ambulances:', error);
      } finally {
        setLoadingAmbulances(false);
      }
    };

    fetchAmbulances();
    
    // Refresh ambulance locations every 30 seconds
    const interval = setInterval(fetchAmbulances, 30000);
    return () => clearInterval(interval);
  }, []);

  const mapCenter = getMapCenter();
  const mapZoom = ambulances.length > 0 ? 10 : 6;

  return (
    <div className="h-screen w-full relative">
      {/* Loading indicators */}
      {loadingAmbulances && (
        <div className="absolute top-0 left-0 w-full bg-green-500 text-white p-2 text-center z-[1000]">
          Loading ambulances...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-0 left-0 w-full bg-red-500 text-white p-2 text-center z-[1000]">
          {error}
        </div>
      )}

      {/* Enhanced Info panel with color legend */}
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-xs">
        <h3 className="font-bold mb-3 text-lg">Ambulance Tracker</h3>
        
        {/* Status Legend */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Status Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Available ({ambulances.filter(a => a.status === 'available').length})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Busy ({ambulances.filter(a => a.status === 'busy').length})</span>
            </div>
          </div>
        </div>
        
        {/* Ambulance List */}
        <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
          <h4 className="font-semibold text-sm">Ambulances on Map:</h4>
          {ambulances.map((ambulance) => (
            <div key={ambulance.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  ambulance.status === 'available' ? 'bg-green-500' :
                  ambulance.status === 'busy' ? 'bg-red-500' :
                  ambulance.status === 'maintenance' ? 'bg-orange-500' : 'bg-gray-500'
                }`}></div>
                <span className="font-medium text-xs">{ambulance.license_plate}</span>
              </div>
              <span className={`text-xs px-1 py-0.5 rounded ${
                ambulance.status === 'available' ? 'bg-green-100 text-green-800' :
                ambulance.status === 'busy' ? 'bg-red-100 text-red-800' :
                ambulance.status === 'maintenance' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {ambulance.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          ))}
        </div>
        
        {ambulances.length === 0 && !loadingAmbulances && (
          <p className="text-gray-500 text-sm mt-2">No ambulances with location data found.</p>
        )}
      </div>

      {/* Refresh button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
          disabled={loadingAmbulances}
        >
          {loadingAmbulances ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Map */}
      <MapContainer 
        center={[mapCenter.lat, mapCenter.lng]} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} />

        {/* Ambulances with status-based icons */}
        {ambulances.map((ambulance) => (
          <Marker
            key={ambulance.id}
            position={[ambulance.location.latitude, ambulance.location.longitude]}
            icon={getAmbulanceIcon(ambulance.status)}
          >
            <Popup>
              <div className="min-w-[250px]">
                <h3 className="font-bold text-lg mb-2 flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    ambulance.status === 'available' ? 'bg-green-500' :
                    ambulance.status === 'busy' ? 'bg-red-500' :
                    ambulance.status === 'maintenance' ? 'bg-orange-500' : 'bg-gray-500'
                  }`}></div>
                  {ambulance.license_plate}
                </h3>
                <div className="space-y-2">
                  <div>
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      ambulance.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : ambulance.status === 'busy'
                        ? 'bg-red-100 text-red-800'
                        : ambulance.status === 'maintenance'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ambulance.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div>
                    <strong>Current Location:</strong>
                    <div className="text-sm text-gray-600 mt-1">
                      {ambulance.location.placeName || 'Location name not available'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Lat: {ambulance.location.latitude.toFixed(6)}<br/>
                      Lng: {ambulance.location.longitude.toFixed(6)}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Show message when no ambulances */}
        {ambulances.length === 0 && !loadingAmbulances && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg z-[1000]">
            <p className="text-gray-600">No ambulances with location data found.</p>
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default AmbulanceMap;