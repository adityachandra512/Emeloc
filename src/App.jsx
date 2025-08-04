import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignInPage from './components/SignInPage';
import OperatorDashboard from './components/OperatorDashboard';
import AdminDashboard from './components/AdminDashboard';
import LocationSharing from './components/LocationSharing';
import OperatorAmbulance from './components/OperatorAmbulance';
import AmbulanceTracker from './components/AmbulanceTracker';
import AmbulanceMap from './components/AmbulanceMap';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 text-white px-4 py-2 rounded-md"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    userRole: null
  });

  useEffect(() => {
    // Check authentication status once on mount
    const userEmail = localStorage.getItem('userEmail');
    const userToken = localStorage.getItem('userToken');
    const userRole = localStorage.getItem('userRole');
    
    // Validate all required auth data exists and role is valid
    const validRoles = ['admin', 'operator'];
    if (userEmail && userToken && userRole && validRoles.includes(userRole)) {
      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        userRole: userRole
      });
    } else {
      // Clear invalid/incomplete auth data
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        userRole: null
      });
    }
  }, []);

  // Clear any module cache issues
  useEffect(() => {
    // Force clear any cached modules that might be causing conflicts
    if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE = function() {};
    }
  }, []);

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signInPage" element={<SignInPage />} />
            <Route 
              path="/dashboard/*" 
              element={
                authState.isAuthenticated && authState.userRole === 'operator' ? (
                  <OperatorDashboard />
                ) : (
                  <Navigate to="/signin" replace />
                )
              } 
            />
            <Route 
              path="/admin-dashboard/*" 
              element={
                authState.isAuthenticated && authState.userRole === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/signin" replace />
                )
              } 
            />
            <Route path="/location/:caseId" element={<LocationSharing />} />
            <Route path="/track/:ambulanceId" element={<AmbulanceTracker />} />
            
            {/* Protected routes - require authentication */}
            <Route
              path="/manage-ambulances"
              element={
                authState.isAuthenticated ? (
                  <OperatorAmbulance />
                ) : (
                  <Navigate to="/signin" replace />
                )
              }
            />

            <Route
              path="/ambulance-map"
              element={
                authState.isAuthenticated ? (
                  <AmbulanceMap />
                ) : (
                  <Navigate to="/signin" replace />
                )
              }
            />

            {/* Catch-all route - redirect to appropriate page based on auth status */}
            <Route
              path="*"
              element={
                <Navigate to="/" replace />
              }
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;