import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import logo from "../../assets/logo.png"

function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (loginData) => {
      console.log('Sending login request:', loginData); // Debug request payload
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('therapyToken', data.token); // Fixed to use 'token'
      localStorage.setItem('therapyLogged', 'true');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login error:', error.message); // Debug error
      setError(error.message);
      toast.error(error.message || 'Login failed');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || !password) {
      setError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }

    const toastId = toast.loading('Signing in...');

    try {
      await loginMutation.mutateAsync({
        phone: phoneNumber,
        password: password,
      });
      toast.success('Sign in successful!', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Login failed', { id: toastId });
    }
  };

  return (
    <div className="md:flex items-center md:justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img
            className="mx-auto h-16 w-auto"
            src={logo}
            alt="MNDCare Logo"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Doctor Portal</h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure access to patient records and treatment plans
          </p>
        </div>

        <div className="bg-white p-8 shadow-lg rounded-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border-l-4 border-red-500">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <PhoneInput
                country={'lk'}
                value={phoneNumber}
                onChange={setPhoneNumber}
                inputProps={{
                  name: 'phone',
                  required: true,
                  id: 'phone',
                }}
                inputClass="block w-full pl-12 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                containerClass="react-tel-input"
                buttonClass="react-tel-input-btn"
                dropdownClass="react-tel-input-dropdown"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginMutation.isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loginMutation.isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loginMutation.isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Need help? Contact support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;