import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "../../assets/logo.png"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, User, Settings, LogOut, ChevronsUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import Profile from "./Profile";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Create an axios instance with the backend base URL
const api = axios.create({
  baseURL: 'http://localhost:5000', // Replace with your backend API URL
});

function CustomSidebar() {
  const [therapistId, setTherapistId] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Get therapist ID from therapyToken in localStorage
  useEffect(() => {
    const token = localStorage.getItem('therapyToken');
    console.log('Retrieved token:', token);

    if (!token) {
      setAuthError('No authentication token found');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('Decoded token:', decoded);

      if (!decoded?.therapist_id) {
        setAuthError('Invalid token structure - missing therapist_id');
        return;
      }

      if (decoded.exp * 1000 < Date.now()) {
        setAuthError('Token expired - please login again');
        return;
      }

      setTherapistId(decoded.therapist_id);
    } catch (error) {
      console.error('Token decode error:', error);
      setAuthError('Invalid token format');
    }
  }, []);

  // Fetch therapist data
  const {
    data: therapist,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['therapist', therapistId],
    queryFn: async () => {
      const token = localStorage.getItem('therapyToken');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      try {
        const response = await api.get(`/api/therapists/${therapistId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          validateStatus: (status) => status < 500,
        });

        console.log('Full API response:', response);
        console.log('Response data:', response.data);

        if (response.status === 401) {
          throw new Error('Session expired - please login again');
        }
        if (response.status === 404) {
          throw new Error('Therapist profile not found');
        }

        // Check for HTML response
        if (typeof response.data === 'string' && response.data.includes('<!doctype html')) {
          console.error('Received HTML instead of JSON:', response.data);
          throw new Error('Invalid response: Received HTML from server');
        }

        // Handle different response structures
        const therapistData = response.data?.data || response.data;
        if (!therapistData || typeof therapistData !== 'object') {
          console.error('Unexpected response format:', response.data);
          throw new Error('Invalid response format from server');
        }

        return therapistData;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    enabled: !!therapistId,
    retry: 1,
  });

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('therapyToken');
    localStorage.removeItem('therapyLogged');
    window.location.href = '/login'; // Force full page reload to reset state
  };

  return (
    <Sidebar className="fixed top-0 left-0 h-screen w-64 bg-background text-foreground shadow-lg border-r border-border">
      {/* Logo Section */}
      <SidebarHeader className="p-6 flex items-center justify-center border-b border-border">
        <img
          src={logo} // Adjust path to your logo in src/assets
          alt="MindCare Logo"
          className="h-16 w-auto object-contain"
        />
      </SidebarHeader>

      {/* Navigation Links */}
      <SidebarContent>
        <ScrollArea className="p-4">
          <nav className="flex flex-col items-start space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
              asChild
            >
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Dashboard
              </Link>
            </Button>
          </nav>
        </ScrollArea>
      </SidebarContent>

      {/* Profile Footer with Dropdown */}
      <SidebarFooter className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center space-x-3">
                {therapist?.image_path ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`${api.defaults.baseURL}/${therapist.image_path}`}
                      alt="User"
                    />
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                    <div className="w-4 h-3 bg-background rounded-sm flex flex-col justify-center items-center">
                      <div className="w-3 h-0.5 bg-foreground mb-0.5"></div>
                      <div className="w-3 h-0.5 bg-foreground mb-0.5"></div>
                      <div className="w-3 h-0.5 bg-foreground"></div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">
                    {isLoading ? 'Loading...' : isError ? 'Error' : therapist?.full_name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isLoading ? 'Loading...' : isError ? 'N/A' : therapist?.email || 'No email'}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            {/* Profile Section */}
            <div className="flex items-center space-x-2 p-2">
              {therapist?.image_path ? (
                <Avatar className="h-8 w-8 border-2 border-black rounded-3xl">
                  <AvatarImage
                    src={`${api.defaults.baseURL}/${therapist.image_path}`}
                    alt="User"
                  />
                </Avatar>
              ) : (
                <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                  <div className="w-4 h-3 bg-background rounded-sm flex flex-col justify-center items-center">
                    <div className="w-3 h-0.5 bg-foreground mb-0.5"></div>
                    <div className="w-3 h-0.5 bg-foreground mb-0.5"></div>
                    <div className="w-3 h-0.5 bg-foreground"></div>
                  </div>
                </div>
              )}
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {isLoading ? 'Loading...' : isError ? 'Error' : therapist?.full_name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {isLoading ? 'Loading...' : isError ? 'N/A' : therapist?.email || 'No email'}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Profile />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default CustomSidebar;