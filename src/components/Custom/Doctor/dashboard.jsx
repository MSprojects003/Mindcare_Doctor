import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/**
 * Dashboard with message modal + unread indicators (frontend-only)
 *
 * Notes:
 * - Messages are stored in `messagesByCustomer` local state.
 * - Unread patient messages set unread flag; a red dot shows on table row.
 * - Opening the message modal marks patient messages as read.
 * - Sending messages appends to the conversation (text or image).
 * - Replace local state with API / websocket logic as needed.
 */

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // Message dialog state
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // sample customers (doctor-oriented)
  const customers = [
    { id: 1, name: 'John Doe', service: 'General Consultation', date: '2025-08-05', time: '10:00', price: 'LKR 3,500', status: 'Pending' },
    { id: 2, name: 'Jane Smith', service: 'Dermatology Checkup', date: '2025-08-06', time: '14:30', price: 'LKR 4,200', status: 'Pending' },
    { id: 3, name: 'Mike Johnson', service: 'Dental Cleaning', date: '2025-08-07', time: '11:15', price: 'LKR 5,000', status: 'Accepted' },
    { id: 4, name: 'Sarah Williams', service: 'Eye Examination', date: '2025-08-08', time: '15:45', price: 'LKR 3,000', status: 'Completed' },
    { id: 5, name: 'Robert Brown', service: 'Cardiology Follow-up', date: '2025-08-09', time: '09:30', price: 'LKR 6,500', status: 'Pending' },
    { id: 6, name: 'Emily Davis', service: 'Physiotherapy Session', date: '2025-08-10', time: '13:00', price: 'LKR 4,800', status: 'Cancel' },
    { id: 7, name: 'David Lee', service: 'Nutrition Counseling', date: '2025-08-11', time: '16:00', price: 'LKR 2,800', status: 'Accepted' },
    { id: 8, name: 'Lisa Anderson', service: 'Psychiatry Consultation', date: '2025-08-12', time: '12:30', price: 'LKR 5,500', status: 'Completed' },
  ];

  // Local messages state keyed by customer id.
  // Each message: { id, from: 'patient'|'doctor', text?, imageUrl?, timestamp, read: boolean }
  // Pre-populate some patient messages (some unread) for demonstration.
  const [messagesByCustomer, setMessagesByCustomer] = useState(() => ({
    1: [
      { id: 'm1-1', from: 'patient', text: 'Good morning doctor, I have a question about my meds.', timestamp: Date.now() - 1000 * 60 * 60 * 10, read: false },
      { id: 'm1-2', from: 'doctor', text: 'Hello John — sure, what is it?', timestamp: Date.now() - 1000 * 60 * 60 * 9, read: true },
    ],
    2: [
      { id: 'm2-1', from: 'patient', text: 'I have a rash on my arm. attaching a photo.', imageUrl: null, timestamp: Date.now() - 1000 * 60 * 60 * 24, read: false },
    ],
    // other customers start with empty thread
  }));

  // For composing messages
  const [composeText, setComposeText] = useState('');
  const [composeFile, setComposeFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Filter customers by search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  // helper: check if customer has unread patient messages
  const hasUnread = (customerId) => {
    const msgs = messagesByCustomer[customerId] || [];
    return msgs.some((m) => m.from === 'patient' && !m.read);
  };

  // open message modal for a customer
  function openMessageModal(customerId) {
    setActiveConversationId(customerId);
    setIsMessageOpen(true);

    // mark patient messages as read
    setMessagesByCustomer((prev) => {
      const copy = { ...prev };
      const arr = (copy[customerId] || []).map((m) =>
        m.from === 'patient' ? { ...m, read: true } : m
      );
      copy[customerId] = arr;
      return copy;
    });
  }

  // send a message (text or image) as doctor
  function sendMessage(customerId) {
    if (!composeText.trim() && !composeFile) return;

    const newMsg = {
      id: `d-${Date.now()}`,
      from: 'doctor',
      text: composeText.trim() || undefined,
      imageUrl: composeFile ? URL.createObjectURL(composeFile) : undefined,
      timestamp: Date.now(),
      read: true,
    };

    setMessagesByCustomer((prev) => {
      const list = prev[customerId] ? [...prev[customerId], newMsg] : [newMsg];
      return { ...prev, [customerId]: list };
    });

    // clear composer
    setComposeText('');
    setComposeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // scroll to bottom after a tick
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // OPTIONAL: Simulate a patient reply to demonstrate unread indicator if you like:
    // setTimeout(() => {
    //   const patientReply = {
    //     id: `p-reply-${Date.now()}`,
    //     from: 'patient',
    //     text: 'Thanks doctor! I will try that.',
    //     timestamp: Date.now() + 2000,
    //     read: false, // unread until doctor opens
    //   };
    //   setMessagesByCustomer(prev => {
    //     const list = prev[customerId] ? [...prev[customerId], patientReply] : [patientReply];
    //     return { ...prev, [customerId]: list };
    //   });
    // }, 5000);
  }

  // attach image
  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setComposeFile(f);
  }

  // show message modal open/close effects (scroll)
  useEffect(() => {
    if (isMessageOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, [isMessageOpen, activeConversationId]);

  // Render
  return (
    // Outer padding kept small; inner card shifted left to align with dashboard
    <div className="py-6 px-6 w-full">
      <div
        className="max-w-[980px] bg-white rounded-xl shadow-sm px-8 py-6"
        style={{ marginLeft: '-260px' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900">
              Customer
              <br />
              <span className="text-4xl">Appointments</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500">Manage upcoming bookings and messaging.</p>
          </div>

          <div className="ml-auto w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate" style={{ borderSpacing: '0 10px' }}>
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Name</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Service</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Date</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Time</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Price</th>
                <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">Status</th>
                <th className="text-right text-sm font-medium text-gray-600 py-3 px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="bg-white align-middle">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-700">
                        {customer.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <TruncatedCell value={customer.name} />
                        </div>
                        <div className="text-xs text-gray-500">{customer.service}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">{customer.service}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{customer.date}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{customer.time}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{customer.price}</td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[customer.status]}`}
                      style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.03)' }}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* unread dot */}
                      {hasUnread(customer.id) && (
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
                              setSelectedCustomer(customer);
                              setIsViewOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4 text-green-600" />
                            View
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setUpdatedStatus(customer.status);
                              setIsUpdateOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                            Update Status
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => openMessageModal(customer.id)}
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
      {selectedCustomer && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Customer Details</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Full appointment information
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2 text-gray-700">
              <p><strong>Name:</strong> {selectedCustomer.name}</p>
              <p><strong>Service:</strong> {selectedCustomer.service}</p>
              <p><strong>Date:</strong> {selectedCustomer.date}</p>
              <p><strong>Time:</strong> {selectedCustomer.time}</p>
              <p><strong>Price:</strong> {selectedCustomer.price}</p>
              <p><strong>Status:</strong> {selectedCustomer.status}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Dialog */}
      {selectedCustomer && (
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Update Appointment Status</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Change the current status for this customer
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <p><strong>Name:</strong> {selectedCustomer.name}</p>
              <Select value={updatedStatus} onValueChange={setUpdatedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancel">Cancel</SelectItem>
                </SelectContent>
              </Select>
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
                  {activeConversationId ? (customers.find(c => c.id === activeConversationId)?.name.split(' ').map(n => n[0]).slice(0,2).join('')) : ''}
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {activeConversationId ? customers.find(c => c.id === activeConversationId)?.name : 'Conversation'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {activeConversationId ? customers.find(c => c.id === activeConversationId)?.service : ''}
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
              {(!activeConversationId || !messagesByCustomer[activeConversationId]) && (
                <div className="text-center text-sm text-gray-500 mt-8">No messages yet</div>
              )}

              {activeConversationId && (messagesByCustomer[activeConversationId] || []).map((m) => (
                <div key={m.id} className={`mb-3 flex ${m.from === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[72%] p-3 rounded-lg ${m.from === 'doctor' ? 'bg-white border border-gray-200' : 'bg-white border border-gray-200'}`}>
                    <div className="text-xs text-gray-500 mb-1">{m.from === 'doctor' ? 'You' : 'Patient'}</div>
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
