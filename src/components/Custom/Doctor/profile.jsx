import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function EditDoctorProfile({ initialData = null, onCancel }) {
  // default data (doctor)
  const defaultData = initialData || {
    full_name: 'Dr. Nimal Perera',
    email: 'nimal@example.com',
    phone: '+94 77 123 4567',
    specialization: 'General Practitioner',
    experience_years: 8,
    qualifications: 'MBBS, MD',
    clinic_address: 'No. 12, Hospital Road, Colombo',
    consultation_fee: '3,500',
    gender: 'Male',
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    bio: 'Compassionate GP with 8 years experience in community health.',
    avatar: null,
  };

  const [form, setForm] = useState(defaultData);
  const [avatarPreview, setAvatarPreview] = useState(defaultData.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function handleNumberChange(e) {
    const { name, value } = e.target;
    const cleaned = value.replace(/[^\d,]/g, '');
    setForm((s) => ({ ...s, [name]: cleaned }));
  }

  function handleGenderChange(value) {
    setForm((s) => ({ ...s, gender: value }));
  }

  function toggleDay(day) {
    setForm((s) => {
      const setDays = new Set(s.working_days || []);
      if (setDays.has(day)) setDays.delete(day);
      else setDays.add(day);
      return { ...s, working_days: Array.from(setDays) };
    });
  }

  function handleAvatarPick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone) {
      setMessage({ type: 'error', text: 'Please fill in full name, email and phone.' });
      return;
    }

    setMessage(null);
    setSaving(true);

    const payload = {
      ...form,
      consultation_fee: form.consultation_fee.replace(/,/g, ''),
    };

    // TODO: Replace with real API call
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      console.log('Saved payload:', payload, 'avatarFile:', avatarFile);
    }, 800);
  }

  return (
    // Outer container (keeps page padding). We shift the inner card left via marginLeft inline style.
    <div className="py-6 px-6 w-full">
      <div
        className="max-w-5xl bg-white rounded-2xl shadow-md px-8 py-6"
        style={{ marginLeft: '-260px' }} // adjust this value to align with your sidebar; -260px is a starting point
      >
        {/* Top header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Edit Doctor Profile</h1>
            <p className="mt-1 text-sm text-gray-500">Update professional details visible to patients.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Cancel */}
            <Button
              variant="ghost"
              className="border border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => onCancel?.()}
            >
              Cancel
            </Button>

            {/* Save */}
            <Button
              type="button"
              onClick={handleSave}
              className="border border-gray-200 text-gray-800 hover:bg-gray-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - avatar + summary */}
          <div className="col-span-1">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-36 h-36 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar preview" />
                ) : (
                  <div className="text-gray-600 font-medium text-xl">
                    {(form.full_name || 'Dr').split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <label
                  htmlFor="avatar"
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50 transition"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-sm">Change</span>
                  <input
                    id="avatar"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarPick}
                    className="hidden"
                  />
                </label>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition"
                  >
                    <X className="h-4 w-4" />
                    <span className="text-sm">Remove</span>
                  </button>
                )}
              </div>

              <div className="text-center mt-2">
                <div className="text-sm font-medium text-gray-900">{form.full_name}</div>
                <div className="text-xs text-gray-500 mt-1">{form.specialization}</div>
              </div>
            </div>
          </div>

          {/* Middle + right columns - form */}
          <div className="col-span-2">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Row 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Full name</label>
                <Input name="full_name" value={form.full_name} onChange={handleChange} className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} className="mt-1" />
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <Input name="phone" value={form.phone} onChange={handleChange} className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <Input name="specialization" value={form.specialization} onChange={handleChange} className="mt-1" />
              </div>

              {/* Row 3 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                <Input
                  name="experience_years"
                  value={form.experience_years}
                  onChange={(e) => setForm(s => ({ ...s, experience_years: Number(e.target.value || 0) }))}
                  type="number"
                  min="0"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Qualifications</label>
                <Input name="qualifications" value={form.qualifications} onChange={handleChange} className="mt-1" />
              </div>

              {/* Row 4 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Clinic address</label>
                <Input name="clinic_address" value={form.clinic_address} onChange={handleChange} className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Consultation fee (LKR)</label>
                <Input
                  name="consultation_fee"
                  value={form.consultation_fee}
                  onChange={handleNumberChange}
                  className="mt-1"
                  placeholder="e.g. 3,500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <Select value={form.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger className="mt-1 border border-gray-300 bg-transparent">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Working days */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Working days</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {days.map((d) => {
                    const checked = (form.working_days || []).includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          checked
                            ? 'bg-teal-600 text-white border-transparent'
                            : 'bg-transparent text-gray-700 border-gray-300'
                        } transition`}
                        aria-pressed={checked}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Short bio</label>
                <Textarea name="bio" value={form.bio} onChange={handleChange} className="mt-1 h-28" />
              </div>

              {/* Message + actions */}
              <div className="md:col-span-2 flex items-center justify-between mt-2">
                <div>
                  {message && (
                    <div
                      className={`px-3 py-2 rounded-md text-sm ${
                        message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    className="border border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => onCancel?.()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="border border-gray-200 text-gray-800 hover:bg-gray-50"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? 'Saving...' : 'Save profile'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
