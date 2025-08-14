import { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import banner from '../assets/banner.svg';

const Bubble = ({ className }) => (
  <div className={`absolute rounded-full opacity-70 animate-rise ${className}`} />
);

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Sending data:', formData);
      
      const response = await fetch('https://emeloc-backend-azure.vercel.app/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userRole', data.user.role); // <-- Save userRole
        localStorage.setItem('userName', data.user.username); // optional: save username

        // Role-based redirect using backend-provided role if available
        let redirectUrl = '/dashboard'; // default for operator
        if (data.user.role === 'admin') {
          redirectUrl = '/admin-dashboard';
        }

        console.log('Redirecting to:', redirectUrl);
        navigate(redirectUrl, { replace: true });

        setTimeout(() => {
          if (window.location.pathname === '/signin' || window.location.pathname === '/') {
            window.location.href = redirectUrl;
          }
        }, 100);
      } else {
        console.error('Sign in failed:', data.error);
        alert(data.error || 'Sign in failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Animated Bubbles */}
      <div className="absolute w-full h-full z-0 overflow-hidden">
        <Bubble className="w-10 h-10 left-[10%] bottom-[-100px] bg-blue-200/40 animate-[rise_8s_ease-in_infinite]" />
        <Bubble className="w-5 h-5 left-[20%] bottom-[-100px] bg-pink-200/40 animate-[rise_5s_ease-in_1s_infinite]" />
        <Bubble className="w-12 h-12 left-[35%] bottom-[-100px] bg-green-200/40 animate-[rise_7s_ease-in_2s_infinite]" />
        <Bubble className="w-8 h-8 left-[50%] bottom-[-100px] bg-orange-200/40 animate-[rise_11s_ease-in_infinite]" />
        <Bubble className="w-11 h-11 left-[65%] bottom-[-100px] bg-purple-200/40 animate-[rise_6s_ease-in_1s_infinite]" />
        <Bubble className="w-6 h-6 left-[75%] bottom-[-100px] bg-yellow-200/40 animate-[rise_8s_ease-in_3s_infinite]" />
        <Bubble className="w-9 h-9 left-[85%] bottom-[-100px] bg-sky-200/40 animate-[rise_12s_ease-in_2s_infinite]" />
        <Bubble className="w-7 h-7 left-[90%] bottom-[-100px] bg-red-200/40 animate-[rise_6s_ease-in_4s_infinite]" />
        <Bubble className="w-10 h-10 left-[25%] bottom-[-100px] bg-lime-200/40 animate-[rise_9s_ease-in_2s_infinite]" />
        <Bubble className="w-9 h-9 left-[60%] bottom-[-100px] bg-rose-200/40 animate-[rise_10s_ease-in_4s_infinite]" />
      </div>

      <div className="w-full max-w-6xl mx-4 bg-white/85 rounded-3xl shadow-lg p-8 relative z-10 backdrop-blur-md">
        <div className="flex justify-between items-center">
          {/* Left Side - Sign In Form */}
          <div className="w-1/2 pr-8">
            <img 
              src={banner}
              alt="Logo" 
              className="w-1/2 pb-4 block mx-auto" 
            />
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col font-candal font-normal">
                <label className="block text-black mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-black"
                  required
                />
              </div>

              <div className="flex flex-col font-candal font-normal">
                <label className="block text-black mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-black"
                  required
                />
              </div>

              <div className="flex flex-col font-candal font-normal">
                <label className="block text-black mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-black"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'SIGNING IN...' : 'GET STARTED'}
              </button>
            </form>
          </div>

          {/* Right Side - Illustration */}
          <div className="w-1/2">
            <div className="relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 rounded-full opacity-20" />
              <img 
                src="https://cdn.dribbble.com/users/579262/screenshots/3264391/52-ambulance.gif" 
                alt="Medical illustration" 
                className="mt-4 w-full pl-4 block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
