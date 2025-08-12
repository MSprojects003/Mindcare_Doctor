import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, AlertTriangle, Settings } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from 'axios';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';

// Create an axios instance with the backend base URL
const api = axios.create({
  baseURL: 'http://localhost:5000', // Replace with your backend API URL
});

// Deep comparison to detect changes
const hasChanges = (current, initial) => {
  const keys = Object.keys(current);
  for (const key of keys) {
    if (key === 'image') {
      if (current[key] !== initial[key]) {
        return true;
      }
    } else if (current[key] !== initial[key]) {
      return true;
    }
  }
  return false;
};

function Profile() {
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState(null);
  const [therapistId, setTherapistId] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [initialValues, setInitialValues] = useState({});

  // Initialize React Hook Form
  const form = useForm({
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      nic_number: '',
      work_start_year: '',
      image: null,
    },
  });

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

  // Fetch therapist data with enhanced error handling
  const {
    data: therapist,
    isLoading,
    isError,
    error: queryError,
    refetch,
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

  // Set form values when therapist data is loaded
  useEffect(() => {
    if (therapist) {
      console.log('Setting form values with therapist data:', therapist);
      const defaultValues = {
        full_name: therapist.full_name || '',
        phone: therapist.phone || '',
        email: therapist.email || '',
        address: therapist.address || '',
        nic_number: therapist.nic_number || '',
        work_start_year: therapist.work_start_year ? therapist.work_start_year.toString() : '',
        image: null,
      };
      form.reset(defaultValues);
      setInitialValues(defaultValues);
      setImagePreview(therapist.image_path ? `http://localhost:5000/${therapist.image_path}` : null);
    }
  }, [therapist, form]);

  // Clean up image preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Update therapist mutation with enhanced error handling
  const updateTherapist = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('therapyToken');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const formData = new FormData();
      if (data.full_name) formData.append('full_name', data.full_name);
      if (data.phone) formData.append('phone', data.phone);
      if (data.email) formData.append('email', data.email);
      if (data.address) formData.append('address', data.address);
      if (data.nic_number) formData.append('nic_number', data.nic_number);
      if (data.work_start_year) formData.append('work_start_year', data.work_start_year);
      if (data.image) formData.append('image', data.image);

      // Debug FormData contents
      for (const [key, value] of formData.entries()) {
        console.log('FormData entry:', { key, value });
      }

      try {
        const response = await api.put(`/api/therapists/${therapistId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          validateStatus: (status) => status >= 200 && status < 300,
        });

        console.log('Update response:', response);
        return response.data;
      } catch (error) {
        console.error('Update error:', {
          message: error.message,
          response: error.response ? { status: error.response.status, data: error.response.data } : null,
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      const updatedTherapist = data?.data || data;
      queryClient.setQueryData(['therapist', therapistId], updatedTherapist);
      if (updatedTherapist.image_path) {
        setImagePreview(`http://localhost:5000/${updatedTherapist.image_path}`);
      }
      setInitialValues(form.getValues());
      toast.success(data.message || 'Profile updated successfully', {
        style: { background: '#d1fae5', color: '#065f46', fontWeight: 'bold' },
        icon: '✅',
        duration: 3000,
      });
      queryClient.invalidateQueries(['therapist', therapistId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to update profile', {
        style: { background: '#fee2e2', color: '#991b1b', fontWeight: 'bold' },
        icon: '❌',
        duration: 3000,
      });
    },
  });

  // Handle field changes (onBlur)
  const handleFieldChange = (fieldName, value) => {
    const currentValues = form.getValues();
    if (hasChanges({ [fieldName]: value }, { [fieldName]: initialValues[fieldName] })) {
      updateTherapist.mutate({ [fieldName]: value });
    }
  };

  // Handle image file selection
  const handleImageChange = (event, field) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB) and type
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(file.type)) {
        toast.error('Only PNG, JPG, JPEG, and GIF images are allowed');
        return;
      }

      field.onChange(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      handleFieldChange('image', file);
    } else {
      field.onChange(null);
      setImagePreview(therapist?.image_path ? `http://localhost:5000/${therapist.image_path}` : null);
      handleFieldChange('image', null);
    }
  };

  if (authError) {
    return (
      <div className="p-4">
        <div className="flex items-center cursor-pointer hover:text-blue-600">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account</span>
        </div>
        <p className="text-red-500 mt-2">{authError}</p>
        <Button
          onClick={() => window.location.href = '/login'}
          className="mt-2"
          variant="outline"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  if (!therapistId) {
    return (
      <div className="p-4">
        <div className="flex items-center cursor-pointer hover:text-blue-600">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account</span>
        </div>
        <p className="text-red-500 mt-2">Loading authentication...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account</span>
        </div>
        <p className="mt-2">Loading profile data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <div className="flex items-center">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account</span>
        </div>
        <p className="text-red-500 mt-2">
          {queryError.response?.data?.message || queryError.message || 'Failed to load profile data'}
        </p>
        <Button
          onClick={() => refetch()}
          className="mt-2"
          variant="outline"
        >
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Sheet>
        <SheetTrigger asChild>
          <div className="flex items-center cursor-pointer hover:text-blue-600">
            <Settings className="mr-2 h-4 w-4" />
            <span>Account</span>
          </div>
        </SheetTrigger>
        <SheetContent className="w-full p-6 sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Manage Profile
            </SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form className="space-y-6 py-6">
              {/* Image */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>Profile Image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={imagePreview} alt="Profile" />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {therapist?.full_name?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-gray-300"
                            onClick={() => document.getElementById('image-upload').click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Image
                          </Button>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/png,image/jpg,image/jpeg,image/gif"
                            className="hidden"
                            onChange={(e) => handleImageChange(e, field)}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.image && (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          {form.formState.errors.image.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Full Name */}
              <FormField
                control={form.control}
                name="full_name"
                rules={{ required: 'Full name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter full name"
                        {...field}
                        className="border-gray-300"
                        onBlur={() => handleFieldChange('full_name', field.value)}
                      />
                    </FormControl>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.full_name && (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          {form.formState.errors.full_name.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phone"
                rules={{ required: 'Phone number is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput
                        country={'lk'}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={() => handleFieldChange('phone', field.value)}
                        inputClass="border-gray-300 w-full"
                        containerClass="w-full"
                        buttonClass="border-gray-300"
                      />
                    </FormControl>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.phone && (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          {form.formState.errors.phone.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email"
                        type="email"
                        {...field}
                        className="border-gray-300"
                        onBlur={() => handleFieldChange('email', field.value)}
                      />
                    </FormControl>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.email && (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          {form.formState.errors.email.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                rules={{ required: 'Address is required', minLength: { value: 5, message: 'Address must be at least 5 characters' } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter address"
                        {...field}
                        className="border-gray-300"
                        onBlur={() => handleFieldChange('address', field.value)}
                      />
                    </FormControl>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.address && (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          {form.formState.errors.address.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* NIC Number */}
              <FormField
                control={form.control}
                name="nic_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIC Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter NIC number"
                        {...field}
                        className="border-gray-300"
                        onBlur={() => handleFieldChange('nic_number', field.value)}
                      />
                    </FormControl>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.nic_number && (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          {form.formState.errors.nic_number.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Work Start Year */}
              <FormField
                control={form.control}
                name="work_start_year"
                rules={{
                  required: 'Work start year is required',
                  pattern: { value: /^\d{4}$/, message: 'Enter a valid 4-digit year' },
                  validate: (value) => parseInt(value) <= new Date().getFullYear() || 'Work start year cannot be in the future',
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Start Year</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter work start year"
                        type="number"
                        {...field}
                        className="border-gray-300"
                        min="1900"
                        max={new Date().getFullYear()}
                        onBlur={() => handleFieldChange('work_start_year', field.value)}
                      />
                    </FormControl>
                    <FormMessage className="flex items-center gap-1 text-red-500">
                      {form.formState.errors.work_start_year && (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          {form.formState.errors.work_start_year.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default Profile;