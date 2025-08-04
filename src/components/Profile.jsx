import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Briefcase, 
  MapPin, 
  Clock, 
  User, 
  Building,
  ChevronRight,
  Phone,
  Edit2,
  Save,
  X,
  LogOut
} from 'lucide-react';
import { toast } from 'react-toastify';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('userToken');
        
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch user data from API
        const response = await fetch('https://emeloc-backend.vercel.app/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const { user } = await response.json();
          setUser(user);
          setEditData(user);
        } else {
          setError('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userEmail');
      navigate('/signin');
      toast.success('Logged out successfully');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(user);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(user);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('https://emeloc-backend.vercel.app/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 font-semibold">No profile data available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header Section */}
      <div className="bg-gray-800 shadow-sm border border-gray-600 rounded-lg mb-6">
        <div className="border-b border-gray-600 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
              <p className="text-gray-300 mt-1">ID :- {user.id}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileSection title="Personal Information">
              <ProfileField 
                icon={<User className="w-5 h-5" />}
                label="Full Name"
                value={user.name}
              />
              <ProfileField 
                icon={<Mail className="w-5 h-5" />}
                label="Email Address"
                value={user.email}
              />
              <ProfileField 
                icon={<Phone className="w-5 h-5" />}
                label="Phone Number"
                value={user.phone || 'Not provided'}
              />
              <ProfileField 
                icon={<MapPin className="w-5 h-5" />}
                label="Address"
                value={user.address || 'Not provided'}
              />
            </ProfileSection>

            <ProfileSection title="Employment Details">
              <ProfileField 
                icon={<Briefcase className="w-5 h-5" />}
                label="Role"
                value={user.role}
              />
              <ProfileField 
                icon={<Clock className="w-5 h-5" />}
                label="Shift"
                value={`Shift ${user.shift}`}
              />
              <ProfileField 
                icon={<Building className="w-5 h-5" />}
                label="Location"
                value={user.location}
              />
              <ProfileField 
                icon={<User className="w-5 h-5" />}
                label="Gender"
                value={user.gender === 0 ? 'Male' : user.gender === 1 ? 'Female' : 'Not specified'}
              />
            </ProfileSection>
          </div>
        </div>
      </div>

      
      <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-lg transition-colors flex items-center justify-center font-medium text-lg"
        >
          <LogOut className="h-6 w-6 mr-3" />
          Logout
        </button>
    </div>
  );
};

const ProfileSection = ({ title, children }) => (
  <div>
    <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const ProfileField = ({ icon, label, value }) => (
  <div className="flex items-center py-2 border-b border-gray-600 last:border-0">
    <div className="text-white w-8">{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-gray-300">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-white" />
  </div>
);

export default Profile;