import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  MoreVertical,
  Eye,
  MessageSquare,
  Send,
  Image as ImageIcon,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * My Appointments page for patients with cancel and message functionality (frontend-only)
 *
 * Notes:
 * - Appointments are stored in `appointments` local state.
 * - Unread doctor messages set unread flag; a red dot shows on table row.
 * - Opening the message modal marks doctor messages as read.
 * - Sending messages appends to the conversation (text or image).
 * - Replace local state with API / websocket logic as needed.
 */

export default function MyAppointments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Message dialog state
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Sample appointments (patient-oriented)
  const [appointments, setAppointments] = useState([
    { id: 1, doctor: 'Dr. John Doe', service: 'General Consultation', date: '2025-08-05', time: '10:00', price: 'LKR 3,500', status: 'Pending' },
    { id: 2, doctor: 'Dr. Jane Smith', service: 'Dermatology Checkup', date: '2025-08-06', time: '14:30', price: 'LKR 4,200', status: 'Accepted' },
    { id: 3, doctor: 'Dr. Mike Johnson', service: 'Dental Cleaning', date: '2025-08-07', time: '11:15', price: 'LKR 5,000', status: 'Completed' },
    { id: 4, doctor: 'Dr. Sarah Williams', service: 'Eye Examination', date: '2025-08-08', time: '15:45', price: 'LKR 3,000', status: 'Pending' },
    { id: 5, doctor: 'Dr. Robert Brown', service: 'Cardiology Follow-up', date: '2025-08-09', time: '09:30', price: 'LKR 6,500', status: 'Accepted' },
  ]);

  // Local messages state keyed by appointment id.
  // Each message: { id, from: 'patient'|'doctor', text?, imageUrl?, timestamp, read: boolean }
  // Pre-populate some doctor messages (some unread) for demonstration.
  const [messagesByAppointment, setMessagesByAppointment] = useState(() => ({
    1: [
      { id: 'm1-1', from: 'doctor', text: 'Please arrive 15 minutes early.', timestamp: Date.now() - 1000 * 60 * 60 * 10, read: false },
      { id: 'm1-2', from: 'patient', text: 'Sure, I will be there.', timestamp: Date.now() - 1000 * 60 * 60 * 9, read: true },
    ],
    2: [
      { id: 'm2-1', from: 'doctor', text: 'Bring your previous reports.', timestamp: Date.now() - 1000 * 60 * 60 * 24, read: false },
    ],
    // other appointments start with empty thread
  }));

  // For composing messages
  const [composeText, setComposeText] = useState('');
  const [composeFile, setComposeFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Placeholder customer name
  const customerName = "John Doe";

  // Filter appointments by search
  const filteredAppointments = appointments.filter((appointment) =>
    appointment.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TruncatedCell = ({ value, maxLength = 24 }) => {
    const isTruncated = value.length > maxLength;
    const displayText = isTruncated ? `${value.slice(0, maxLength)}…` : value;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block truncate max-w-[220px]">{displayText}</span>
          </TooltipTrigger>
          {isTruncated && (
            <TooltipContent>
              <p>{value}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Accepted: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Cancel: 'bg-red-100 text-red-800',
  };

  // helper: check if appointment has unread doctor messages
  const hasUnread = (appointmentId) => {
    const msgs = messagesByAppointment[appointmentId] || [];
    return msgs.some((m) => m.from === 'doctor' && !m.read);
  };

  // open message modal for an appointment
  function openMessageModal(appointmentId) {
    setActiveConversationId(appointmentId);
    setIsMessageOpen(true);

    // mark doctor messages as read
    setMessagesByAppointment((prev) => {
      const copy = { ...prev };
      const arr = (copy[appointmentId] || []).map((m) =>
        m.from === 'doctor' ? { ...m, read: true } : m
      );
      copy[appointmentId] = arr;
      return copy;
    });
  }

  // send a message (text or image) as patient
  function sendMessage(appointmentId) {
    if (!composeText.trim() && !composeFile) return;

    const newMsg = {
      id: `p-${Date.now()}`,
      from: 'patient',
      text: composeText.trim() || undefined,
      imageUrl: composeFile ? URL.createObjectURL(composeFile) : undefined,
      timestamp: Date.now(),
      read: true,
    };

    setMessagesByAppointment((prev) => {
      const list = prev[appointmentId] ? [...prev[appointmentId], newMsg] : [newMsg];
      return { ...prev, [appointmentId]: list };
    });

    // clear composer
    setComposeText('');
    setComposeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // scroll to bottom after a tick
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  // attach image
  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setComposeFile(f);
  }

  // cancel appointment (simulated)
  function cancelAppointment(appointmentId) {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === appointmentId ? { ...appt, status: 'Cancel' } : appt
      )
    );
    alert(`Appointment with ID ${appointmentId} has been canceled.`);
  }

  // show message modal open/close effects (scroll)
  useEffect(() => {
    if (isMessageOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, [isMessageOpen, activeConversationId]);

  // Render
  return (
    <div className="py-6 px-6 w-full relative">
      <div
        className="max-w-[980px] bg-white rounded-xl shadow-sm px-8 py-6"
        style={{ marginLeft: '-260px' }}
      >
        {/* Header with button and dropdown in top-right corner */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900">
              Your
              <br />
              <span className="text-4xl">Appointments</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500">View, cancel, or message about your bookings.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="left-2 w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 shadow-sm"
                />
              </div>
            </div>
            <div className="absolute top-2 left-160">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-3 !bg-white px-6 py-2 rounded-full shadow hover:shadow-md transition cursor-pointer min-w-[180px]">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/images/user.jpg" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-800 text-sm">{customerName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 mt-2">
                  <DropdownMenuItem asChild><a href="/my-profile">My Profile</a></DropdownMenuItem>
                  <DropdownMenuItem asChild><a href="/MyAppointments">My Appointments</a></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate" style={{ borderSpacing: '0 10px' }}>
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Doctor</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Service</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Date</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Time</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Price</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Status</th>
                <th className="text-right text-sm font-medium text-gray-600 py-3 px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="bg-white align-middle">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-700">
                        {appointment.doctor.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <TruncatedCell value={appointment.doctor} />
                        </div>
                        <div className="text-xs text-gray-500">{appointment.service}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">{appointment.service}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{appointment.date}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{appointment.time}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{appointment.price}</td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[appointment.status]}`}
                      style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.03)' }}
                    >
                      {appointment.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* unread dot */}
                      {hasUnread(appointment.id) && (
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2" title="Unread messages" />
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-transparent hover:bg-gray-100 p-2 rounded-md"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsViewOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4 text-green-600" />
                            View
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => cancelAppointment(appointment.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => openMessageModal(appointment.id)}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4 text-indigo-600" />
                            Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Dialog */}
      {selectedAppointment && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Appointment Details</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Full appointment information
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2 text-gray-700">
              <p><strong>Doctor:</strong> {selectedAppointment.doctor}</p>
              <p><strong>Service:</strong> {selectedAppointment.service}</p>
              <p><strong>Date:</strong> {selectedAppointment.date}</p>
              <p><strong>Time:</strong> {selectedAppointment.time}</p>
              <p><strong>Price:</strong> {selectedAppointment.price}</p>
              <p><strong>Status:</strong> {selectedAppointment.status}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={(open) => { setIsMessageOpen(open); if (!open) setActiveConversationId(null); }}>
        <DialogContent className="sm:max-w-2xl bg-white">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  {activeConversationId ? (appointments.find(a => a.id === activeConversationId)?.doctor.split(' ').map(n => n[0]).slice(0, 2).join('')) : ''}
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {activeConversationId ? appointments.find(a => a.id === activeConversationId)?.doctor : 'Conversation'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {activeConversationId ? appointments.find(a => a.id === activeConversationId)?.service : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setIsMessageOpen(false); setActiveConversationId(null); }}
                className="inline-flex items-center justify-center p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Chat body */}
          <div className="mt-4">
            <div className="h-[360px] overflow-y-auto rounded-md border border-gray-100 p-4 bg-gray-50" id="chat-window">
              {/* messages */}
              {(!activeConversationId || !messagesByAppointment[activeConversationId]) && (
                <div className="text-center text-sm text-gray-500 mt-8">No messages yet</div>
              )}

              {activeConversationId && (messagesByAppointment[activeConversationId] || []).map((m) => (
                <div key={m.id} className={`mb-3 flex ${m.from === 'patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[72%] p-3 rounded-lg ${m.from === 'patient' ? 'bg-white border border-gray-200' : 'bg-white border border-gray-200'}`}>
                    <div className="text-xs text-gray-500 mb-1">{m.from === 'patient' ? 'You' : 'Doctor'}</div>
                    {m.text && <div className="text-sm text-gray-900 whitespace-pre-line">{m.text}</div>}
                    {m.imageUrl && (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <img src={m.imageUrl} alt="attachment" className="mt-2 max-h-40 object-contain rounded-md border" />
                    )}
                    <div className="text-[10px] text-gray-400 mt-1 text-right">{new Date(m.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                  id="chat-image-input"
                />
                <label htmlFor="chat-image-input" className="inline-flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-md text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                  <ImageIcon className="h-4 w-4" />
                  Attach
                </label>

                <input
                  type="text"
                  placeholder="Write a message..."
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none"
                />

                <button
                  onClick={() => activeConversationId && sendMessage(activeConversationId)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                >
                  <Send className="h-4 w-4" />
                  <span className="text-sm">Send</span>
                </button>
              </div>

              {/* preview image */}
              {composeFile && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={URL.createObjectURL(composeFile)} alt="preview" className="w-24 h-24 object-cover rounded-md border" />
                  <button
                    onClick={() => { setComposeFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="px-3 py-1 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}