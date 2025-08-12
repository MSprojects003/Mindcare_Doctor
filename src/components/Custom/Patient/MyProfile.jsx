import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Chatbot from './chatbot';


const MyProfile = () => {
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '0712345678',
    nic: '981234567V',
    dob: '1998-03-15',
    gender: 'Male',
    address: '123, Main Street, Colombo',
    profileImage: '/images/user.jpg',
    password: '',
    occupation: 'Software Engineer',
    emergencyContact: 'Jane Doe - 0719876543',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Invalid email format';
    if (!formData.phone.match(/^\d{10}$/)) newErrors.phone = 'Phone must be 10 digits';
    if (!formData.nic.match(/^\d{9}[VvXx]$/)) newErrors.nic = 'Invalid NIC format';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profileImage' && files.length > 0) {
      const imageUrl = URL.createObjectURL(files[0]);
      setFormData((prev) => ({ ...prev, profileImage: imageUrl }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    console.log('Updated Profile:', formData);
    // 🔁 Send to backend API
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 w-full relative">
      {/* Dropdown Menu */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-3 !bg-white px-6 py-2 rounded-full shadow hover:shadow-md transition cursor-pointer min-w-[180px]">
              <Avatar className="h-8 w-8">
                <AvatarImage src={formData.profileImage} alt="User" />
                <AvatarFallback>{formData.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-800 text-sm">{formData.fullName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-2">
            <DropdownMenuItem asChild>
              <a href="/my-profile">My Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/MyAppointments">My Appointments</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-white rounded-xl shadow-sm px-8 py-6 max-w-4xl" style={{ marginLeft: '-260px' }}>
        {/* Header + Edit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <h2 className="text-4xl font-extrabold leading-tight text-gray-900">
            My
            <br />
            <span className="text-4xl">Profile</span>
          </h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4 sm:mt-0 bg-blue-600 text-white hover:bg-blue-700">
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={errors.fullName ? 'border-red-500' : ''}
                    />
                    {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                  </div>
                  <div>
                    <Label>NIC</Label>
                    <Input
                      name="nic"
                      value={formData.nic}
                      onChange={handleChange}
                      className={errors.nic ? 'border-red-500' : ''}
                    />
                    {errors.nic && <p className="text-red-500 text-sm">{errors.nic}</p>}
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input name="dob" type="date" value={formData.dob} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Address</Label>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Occupation</Label>
                    <Input name="occupation" value={formData.occupation} onChange={handleChange} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Emergency Contact</Label>
                    <Input
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Password</Label>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Profile Image</Label>
                    <Input type="file" name="profileImage" onChange={handleChange} />
                  </div>
                </div>
                <div className="text-right pt-6">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Save Changes
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile Summary */}
        <div className="flex items-center space-x-6 mb-6 bg-gray-50 p-6 rounded-lg">
          <Avatar className="h-32 w-32">
            <AvatarImage src={formData.profileImage} alt="Profile" />
            <AvatarFallback>{formData.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-2xl font-semibold text-gray-800">{formData.fullName}</h3>
            <p className="text-gray-600">{formData.email}</p>
            <p className="text-gray-600">{formData.occupation}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-sm text-gray-700 bg-gray-50 p-6 rounded-lg">
          <p><strong>Phone:</strong> {formData.phone}</p>
          <p><strong>NIC:</strong> {formData.nic}</p>
          <p><strong>Date of Birth:</strong> {formData.dob}</p>
          <p><strong>Gender:</strong> {formData.gender}</p>
          <p><strong>Occupation:</strong> {formData.occupation}</p>
          <p><strong>Emergency Contact:</strong> {formData.emergencyContact}</p>
          <p className="sm:col-span-2"><strong>Address:</strong> {formData.address}</p>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default MyProfile;