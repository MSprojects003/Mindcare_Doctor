import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useState, useEffect } from 'react';
import { isAuthenticated } from './utils/auth';

import './index.css';
import CustomSidebar from './components/Custom/sidebar';
import EditDoctorProfile from './components/Custom/Doctor/profile';
import Appointments from './components/Custom/Appointments';
import Login from './components/Custom/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    localStorage.setItem('redirectPath', window.location.pathname);
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route component
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
    localStorage.removeItem('redirectPath');
    return <Navigate to={redirectPath} replace />;
  }
  return children;
};

function App() {
  const [authStatus, setAuthStatus] = useState(isAuthenticated());

  // Debug auth status on mount and after login
  useEffect(() => {
    console.log('Auth status:', {
      isAuthenticated: isAuthenticated(),
      authToken: localStorage.getItem('therapyToken'),
      therapyLogged: localStorage.getItem('therapyLogged'),
    });

    // Listen for storage changes (in case localStorage is updated externally)
    const handleStorageChange = () => {
      setAuthStatus(isAuthenticated());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update auth status after login
  useEffect(() => {
    const checkAuth = () => {
      const newAuthStatus = isAuthenticated();
      if (newAuthStatus !== authStatus) {
        console.log('Auth status updated:', newAuthStatus);
        setAuthStatus(newAuthStatus);
      }
    };

    // Check auth status periodically
    const interval = setInterval(checkAuth, 500);
    return () => clearInterval(interval);
  }, [authStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SidebarProvider>
          {authStatus && <CustomSidebar />}
          <main className={`p-4 transition-all duration-300 ${authStatus ? 'md:ml-2 md:w-full' : ''}`}>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <EditDoctorProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  authStatus ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="*"
                element={
                  authStatus ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </main>
          <Toaster
            position="top-right"
            richColors
            expand={false}
            visibleToasts={3}
            duration={3000}
            closeButton
          />
        </SidebarProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;