import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NewCase = () => {
    const [caseType, setCaseType] = useState('');
    const [description, setDescription] = useState('');
    const [selectedAmbulance, setSelectedAmbulance] = useState('');
    const [ambulances, setAmbulances] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [patientName, setPatientName] = useState('');
    const [email, setEmail] = useState('');
    const [locationShareLink, setLocationShareLink] = useState('');

    useEffect(() => {
        fetchAvailableAmbulances();
    }, []);

    const fetchAvailableAmbulances = async () => {
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
                const availableAmbulances = data.ambulances.filter(amb => 
                    amb.status === 'available'
                );
                setAmbulances(availableAmbulances);
            } else {
                toast.error('Failed to fetch ambulances');
            }
        } catch (error) {
            console.error('Error fetching ambulances:', error);
            toast.error('Failed to fetch available ambulances');
        }
    };

    // Add this function before handleSubmit
    const generateUniqueId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `case-${timestamp}-${random}`;
    };

    // Fetch operator ID from backend using email
    const getOperatorIdByEmail = async (email) => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`https://emeloc-backend-azure.vercel.app/api/users/by-email?email=${encodeURIComponent(email)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                return data.id || '';
            }
        } catch (error) {
            console.error('Error fetching operator ID:', error);
        }
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate required fields before API call
        if (
            !patientName.trim() ||
            !email.trim() ||
            !caseType.trim() ||
            !selectedAmbulance.trim()
        ) {
            toast.error('Please fill all required fields.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            setIsLoading(false);
            return;
        }

        try {
            // Get operator email from localStorage
            const operatorEmail = localStorage.getItem('userEmail') || '';
            // Fetch operator ID from backend
            const operator_id = await getOperatorIdByEmail(operatorEmail);

            const caseData = {
                operator_id: operator_id,
                to: email,
                status: "active",
                patientName,
                description: caseType === "Other" ? description : caseType,
                license_plate: selectedAmbulance
            };

            console.log('Submitting caseData:', caseData);

            // First, update ambulance status to 'busy'
            const token = localStorage.getItem('userToken');
            const updateAmbulanceResponse = await fetch(`https://emeloc-backend-azure.vercel.app/api/ambulances/${selectedAmbulance}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'busy' })
            });

            if (!updateAmbulanceResponse.ok) {
                console.error('Failed to update ambulance status');
                // Continue with case creation even if ambulance update fails
            }

            const response = await fetch('https://send-email-bay.vercel.app/live-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(caseData)
            });

            if (response.ok) {
                const result = await response.json();
                const caseId = result.caseId;
                const shareUrl = `https://send-email-bay.vercel.app/share-location/${caseId}`;
                setLocationShareLink(shareUrl);

                toast.success('Emergency case created and ambulance assigned successfully!', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });

                // Reset form
                setCaseType('');
                setDescription('');
                setSelectedAmbulance('');
                setPatientName('');
                setEmail('');
                fetchAvailableAmbulances(); // Refresh available ambulances
            } else {
                // If case creation fails, revert ambulance status back to available
                if (updateAmbulanceResponse.ok) {
                    await fetch(`https://emeloc-backend-azure.vercel.app/api/ambulances/${selectedAmbulance}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: 'available' })
                    });
                }

                let errorMsg = 'Failed to create case or send email';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch {
                    if (response.status === 500) {
                        errorMsg = 'Server error (500). Please check your input or try again later.';
                    }
                }
                toast.error(errorMsg, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            }
        } catch (error) {
            console.error('Error creating case:', error);
            
            // Revert ambulance status if there was an error
            try {
                const token = localStorage.getItem('userToken');
                await fetch(`https://emeloc-backend-azure.vercel.app/api/ambulances/${selectedAmbulance}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'available' })
                });
            } catch (revertError) {
                console.error('Failed to revert ambulance status:', revertError);
            }

            toast.error('Network or server error. Please try again later.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "form-input block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-all duration-200 text-base px-4 py-3";
    const selectClass = "form-select block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-all duration-200 text-base px-4 py-3";
    const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1";

    return (
        <div className="max-w-6xl mx-auto p-6">
            <ToastContainer 
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="grid md:grid-cols-2 min-h-[600px]">
                    {/* Left Side - Logo and Description */}
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-8 flex flex-col justify-center items-center text-white">
                        <div className="text-center">
                            <div className="bg-white p-4 rounded-full mb-6 inline-block">
                                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-bold mb-4">Emergency Response</h1>
                            <p className="text-red-100 text-lg leading-relaxed mb-6">
                                Quick and efficient emergency case registration system. 
                                Fill in the patient details to dispatch emergency services immediately.
                            </p>
                            <div className="space-y-3 text-left">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>24/7 Emergency Support</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Real-time Ambulance Tracking</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Professional Medical Team</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">New Emergency Case</h2>
                            <p className="text-gray-600 dark:text-gray-300">Patient will receive an email to share their location</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Patient Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Patient Name *
                                </label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Enter patient name"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Enter email address"
                                />
                            </div>

                            {/* Case Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Emergency Type *
                                </label>
                                <select
                                    value={caseType}
                                    onChange={(e) => setCaseType(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Select emergency type</option>
                                    <option value="Medical Emergency">Medical Emergency</option>
                                    <option value="Accident">Accident</option>
                                    <option value="Heart Attack">Heart Attack</option>
                                    <option value="Stroke">Stroke</option>
                                    <option value="Injury">Injury</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Description (only show if "Other" is selected) */}
                            {caseType === "Other" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Describe the emergency"
                                    />
                                </div>
                            )}

                            {/* Ambulance Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Assign Ambulance *
                                </label>
                                <select
                                    value={selectedAmbulance}
                                    onChange={(e) => setSelectedAmbulance(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Select an ambulance</option>
                                    {ambulances.map((ambulance) => (
                                        <option key={ambulance.id} value={ambulance.id}>
                                            {ambulance.license_plate}
                                        </option>
                                    ))}
                                </select>
                                {ambulances.length === 0 && (
                                    <p className="text-sm text-yellow-600 mt-1">No ambulances available</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || ambulances.length === 0}
                                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center mt-6"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Case...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Dispatch Emergency
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewCase;