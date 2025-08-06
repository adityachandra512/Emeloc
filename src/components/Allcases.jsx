import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiCalendar, FiPhone, FiFileText } from 'react-icons/fi';

const AllCases = () => {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCase, setCurrentCase] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('https://emeloc-backend-azure.vercel.app/api/cases', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      // handle error
    }
    setIsLoading(false);
  };

  const handleAddCase = () => {
    setCurrentCase(null);
    setIsModalOpen(true);
  };

  const handleEditCase = (caseItem) => {
    setCurrentCase(caseItem);
    setIsModalOpen(true);
  };

  const handleDeleteCase = async (id) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`https://emeloc-backend-azure.vercel.app/api/cases/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          fetchCases();
        }
      } catch (error) {
        // handle error
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  const handleSaveCase = async (formData) => {
    try {
      const token = localStorage.getItem('userToken');
      const method = currentCase ? 'PUT' : 'POST';
      const url = currentCase
        ? `https://emeloc-backend-azure.vercel.app/api/cases/${currentCase.id}`
        : 'https://emeloc-backend-azure.vercel.app/api/cases';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchCases();
        setIsModalOpen(false);
      }
    } catch (error) {
      // handle error
    }
  };

  return (
    <div className="container mx-auto px-4 dark:text-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 mb-8 shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-2">Case Management</h1>
        <p className="text-blue-100">Track and manage all cases in one place</p>
      </div>
      
      <div className="flex justify-between mb-6">
        {/* Remove the "Create New Case" button since only operators can create cases */}
        <div></div> {/* Empty div to maintain flex layout */}
        <button
          onClick={handleSortByDate}
          className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition-transform duration-200 hover:scale-105 flex items-center"
        >
          <FiCalendar className="mr-2 h-5 w-5" />
          Sort by Date ({sortOrder === 'asc' ? 'Ascending' : 'Descending'})
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                <th className="py-4 px-6 text-left font-semibold">ID</th>
                <th className="py-4 px-6 text-left font-semibold">Description</th>
                <th className="py-4 px-6 text-left font-semibold">Patient Name</th>
                <th className="py-4 px-6 text-left font-semibold">Email</th>
                <th className="py-4 px-6 text-center font-semibold">Status</th>
                <th className="py-4 px-6 text-center font-semibold">Created At</th>
                <th className="py-4 px-6 text-center font-semibold">Updated At</th>
                <th className="py-4 px-6 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center">Loading...</td>
                </tr>
              ) : cases.map((caseItem) => (
                <tr key={caseItem.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
                  <td className="py-4 px-6 text-left">
                    <div className="font-medium">{caseItem.id}</div>
                  </td>
                  <td className="py-4 px-6 text-left">
                    <div className="flex items-center">
                      <FiFileText className="mr-2 text-gray-400" />
                      <span>{caseItem.description}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-left">
                    <span>
                      {caseItem.patientName 
                        ? caseItem.patientName 
                        : (caseItem.patient_name || caseItem.full_name || '-')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-left">
                    <span>{caseItem.email || caseItem.patient_email || '-'}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      caseItem.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {caseItem.status ? caseItem.status.toUpperCase() : '-'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-gray-500 dark:text-gray-400">{formatDate(caseItem.created_at)}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-gray-500 dark:text-gray-400">{formatDate(caseItem.updated_at)}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => handleEditCase(caseItem)}
                        className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCase(caseItem.id)}
                        className="text-red-500 hover:text-red-600 transition-colors duration-200"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isModalOpen && (
        <CaseModal
          caseItem={currentCase}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCase}
        />
      )}
    </div>
  );
};

const CaseModal = ({ caseItem, onClose, onSave }) => {
  // Since we're only editing existing cases, make sure caseItem is used properly
  const [formData, setFormData] = useState(() => ({
    ...caseItem,
    patientName: caseItem.patientName || caseItem.patient_name || '',
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ambulances, setAmbulances] = useState([]);
  
  useEffect(() => {
    // Fetch available ambulances for the dropdown
    const fetchAmbulances = async () => {
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
          setAmbulances(data.ambulances || []);
          
          // After fetching ambulances, ensure the form data has the correct ambulance ID
          if (caseItem && caseItem.ambulance_id) {
            setFormData(prev => ({
              ...prev,
              ambulance_id: caseItem.ambulance_id
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch ambulances:', error);
      }
    };
    
    fetchAmbulances();
  }, [caseItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left Side - Information and Graphics */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 flex flex-col justify-center items-center text-white">
            <div className="text-center">
              <div className="bg-white p-4 rounded-full mb-6 inline-block">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-4">Update Case</h1>
              <p className="text-blue-100 text-lg leading-relaxed mb-6">
                Update the emergency case details to keep records accurate and up-to-date.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>24/7 Emergency Response</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time Case Tracking</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure Patient Information</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="p-8 overflow-y-auto" style={{maxHeight: "80vh"}}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Edit Case Information
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Form fields for viewing/editing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    id="patientName"
                    name="patientName"
                    value={formData.patientName || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter patient name"
                    readOnly={false} // Allow editing
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Email for communication"
                  readOnly={false} // Allow editing
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Emergency description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Case Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || 'active'}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              
              {/* Ambulance Selection - Add this */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Ambulance
                </label>
                <select
                  id="ambulance_id"
                  name="ambulance_id"
                  value={formData.ambulance_id || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select an ambulance</option>
                  {ambulances.map(ambulance => (
                    <option key={ambulance.id} value={ambulance.id}>
                      {ambulance.license_plate} {caseItem.ambulance_id === ambulance.id ? '(Currently assigned)' : ''}
                    </option>
                  ))}
                </select>
                {caseItem.ambulance_id && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Currently assigned ambulance: <strong className="ml-1">
                        {ambulances.find(a => a.id === caseItem.ambulance_id)?.license_plate || 
                         'Loading...'}
                      </strong>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-lg shadow transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Case
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllCases;