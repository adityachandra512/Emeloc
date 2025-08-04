import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiEdit2, FiTrash2, FiPlus, FiTruck, FiMail } from 'react-icons/fi';

const ManageAmbulances = () => {
    const [ambulances, setAmbulances] = useState([]);
    const [newAmbulance, setNewAmbulance] = useState({ 
        license_plate: '', 
        status: 'available' 
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAmbulance, setEditingAmbulance] = useState(null);

    useEffect(() => {
        fetchAmbulances();
    }, []);

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
                setAmbulances(data.ambulances || []);
            } else {
                toast.error('Failed to fetch ambulances');
            }
        } catch (error) {
            console.error('Error fetching ambulances:', error);
            toast.error('Failed to fetch ambulances');
        }
    };

    const handleInputChange = (e) => {
        setNewAmbulance({ ...newAmbulance, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('userToken');
            const url = editingAmbulance 
                ? `https://emeloc-backend.vercel.app/api/ambulances/${editingAmbulance.id}`
                : 'https://emeloc-backend.vercel.app/api/ambulances';
            
            const method = editingAmbulance ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAmbulance)
            });

            if (response.ok) {
                toast.success(editingAmbulance ? 'Ambulance updated successfully' : 'Ambulance added successfully');
                setNewAmbulance({ license_plate: '', status: 'available' });
                setIsModalOpen(false);
                setEditingAmbulance(null);
                fetchAmbulances();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to save ambulance');
            }
        } catch (error) {
            console.error('Error saving ambulance:', error);
            toast.error('Failed to save ambulance');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (ambulance) => {
        setEditingAmbulance(ambulance);
        setNewAmbulance({ 
            license_plate: ambulance.license_plate, 
            status: ambulance.status 
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (ambulanceId) => {
        if (!window.confirm('Are you sure you want to delete this ambulance?')) {
            return;
        }

        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`https://emeloc-backend.vercel.app/api/ambulances/${ambulanceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                toast.success('Ambulance deleted successfully');
                fetchAmbulances();
            } else {
                toast.error('Failed to delete ambulance');
            }
        } catch (error) {
            console.error('Error deleting ambulance:', error);
            toast.error('Failed to delete ambulance');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAmbulance(null);
        setNewAmbulance({ license_plate: '', status: 'available' });
    };

    const openAddModal = () => {
        setEditingAmbulance(null);
        setNewAmbulance({ license_plate: '', status: 'available' });
        setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer />
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 mb-8 shadow-lg">
                <h1 className="text-3xl font-bold text-white mb-2">Manage Ambulances</h1>
                <p className="text-blue-100">Add, edit, and manage your ambulance fleet</p>
            </div>

            {/* Add Button */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ambulance Fleet</h2>
                    <p className="text-gray-600 dark:text-gray-400">Total: {ambulances.length} ambulances</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition-transform duration-200 hover:scale-105 flex items-center"
                >
                    <FiPlus className="mr-2 h-5 w-5" />
                    Add New Ambulance
                </button>
            </div>

            {/* Ambulances Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                                <th className="py-4 px-6 text-left font-semibold">ID</th>
                                <th className="py-4 px-6 text-left font-semibold">License Plate</th>
                                <th className="py-4 px-6 text-center font-semibold">Status</th>
                                <th className="py-4 px-6 text-left font-semibold">Location</th>
                                <th className="py-4 px-6 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                            {ambulances.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center">
                                        <div className="flex flex-col items-center">
                                            <FiTruck className="h-12 w-12 text-gray-400 mb-4" />
                                            <p className="text-gray-500">No ambulances found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                ambulances.map((ambulance) => (
                                    <tr key={ambulance.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
                                        <td className="py-4 px-6 text-left">
                                            <div className="font-medium">{ambulance.id}</div>
                                        </td>
                                        <td className="py-4 px-6 text-left">
                                            <div className="flex items-center">
                                                <FiTruck className="mr-2 text-blue-500" />
                                                <span className="font-semibold">{ambulance.license_plate}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                ambulance.status === 'available' 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                    : ambulance.status === 'busy'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            }`}>
                                                {ambulance.status?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-left">
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
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">Location not set</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center space-x-3">
                                                <button
                                                    onClick={() => handleEdit(ambulance)}
                                                    className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                                                    title="Edit ambulance"
                                                >
                                                    <FiEdit2 className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ambulance.id)}
                                                    className="text-red-500 hover:text-red-600 transition-colors duration-200"
                                                    title="Delete ambulance"
                                                >
                                                    <FiTrash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingAmbulance ? 'Edit Ambulance' : 'Add New Ambulance'}
                            </h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    License Plate *
                                </label>
                                <input
                                    type="text"
                                    name="license_plate"
                                    value={newAmbulance.license_plate}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter license plate"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={newAmbulance.status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="available">Available</option>
                                    <option value="busy">Busy</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-3 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {editingAmbulance ? 'Updating...' : 'Adding...'}
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus className="mr-2 h-4 w-4" />
                                            {editingAmbulance ? 'Update Ambulance' : 'Add Ambulance'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAmbulances;
