import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PATIENTS = [
  {
    id: 1,
    name: 'Kamal Silva',
    age: 34,
    gender: 'Male',
    phone: '+94 77 234 5678',
    email: 'kamal.silva@example.com',
    nextAppointment: '2025-08-15 10:30',
    service: 'General Consultation',
    fee: 'LKR 3,500',
    status: 'Pending',
    notes: 'Has recurring headaches. Bring previous MRI if available.',
    avatar: null,
  },
  {
    id: 2,
    name: 'Anusha Fernando',
    age: 28,
    gender: 'Female',
    phone: '+94 71 987 6543',
    email: 'anusha.fernando@example.com',
    nextAppointment: '2025-08-16 14:00',
    service: 'Dermatology Checkup',
    fee: 'LKR 4,200',
    status: 'Accepted',
    notes: 'Allergic to penicillin. Use mild cleansers only.',
    avatar: null,
  },
  {
    id: 3,
    name: 'Rohan Perera',
    age: 46,
    gender: 'Male',
    phone: '+94 76 555 3322',
    email: 'rohan.perera@example.com',
    nextAppointment: '2025-08-17 09:00',
    service: 'Cardiology Follow-up',
    fee: 'LKR 6,500',
    status: 'Completed',
    notes: 'BP under control. Continue medication: Amlodipine 5mg.',
    avatar: null,
  },
  {
    id: 4,
    name: 'Maya Jayawardena',
    age: 31,
    gender: 'Female',
    phone: '+94 70 444 2211',
    email: 'maya.jay@example.com',
    nextAppointment: '2025-08-18 11:15',
    service: 'Nutrition Counseling',
    fee: 'LKR 2,800',
    status: 'Pending',
    notes: 'Wants a weight-loss plan; lactose intolerant.',
    avatar: null,
  },
];

export default function Customer() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  const filtered = PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      p.service.toLowerCase().includes(query.trim().toLowerCase())
  );

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Accepted: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Cancel: 'bg-red-100 text-red-800',
  };

  function openDetails(patient) {
    setSelected(patient);
    setOpen(true);
  }

  function closeDetails() {
    setOpen(false);
    // keep selected for a frame? clear it
    setTimeout(() => setSelected(null), 150);
  }

  return (
    <div className="py-6 px-6 w-full">
      {/* Inner content shifted left to align with dashboard */}
      <div
        className="max-w-[980px] bg-white rounded-xl shadow-sm px-8 py-6"
        style={{ marginLeft: '-260px' }} // tune this value to perfectly match your sidebar
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Patients</h1>
            <p className="mt-1 text-sm text-gray-500">Click a card to view full details.</p>
          </div>

          <div className="ml-auto w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients or service..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 border-gray-200 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <article
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetails(p)}
              onKeyDown={(e) => e.key === 'Enter' && openDetails(p)}
              className="cursor-pointer bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition"
              aria-label={`View details for ${p.name}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12">
                  <Avatar>
                    {p.avatar ? (
                      <AvatarImage src={p.avatar} alt={p.name} />
                    ) : (
                      <AvatarFallback className="bg-gray-100 text-gray-700">
                        {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{p.name}</h3>
                      <div className="text-xs text-gray-500 mt-0.5">{p.service}</div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusColors[p.status]}`}
                      >
                        {p.status}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{p.fee}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                    <div>{p.nextAppointment}</div>
                    <div className="text-xs text-gray-400">Age {p.age}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No patients found for "{query}"
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl bg-white">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12">
                  <Avatar>
                    {selected?.avatar ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <AvatarImage src={selected.avatar} alt={selected?.name} />
                    ) : (
                      <AvatarFallback className="bg-gray-100 text-gray-700">
                        {selected?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div>
                  <div className="text-lg font-semibold text-gray-900">{selected?.name}</div>
                  <div className="text-sm text-gray-500">
                    {selected?.service} • {selected?.fee}
                  </div>
                </div>
              </div>

              <button
                onClick={closeDetails}
                className="inline-flex items-center justify-center p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <DialogTitle className="sr-only">Patient Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Full patient details and notes.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Contact</div>
                <div className="text-sm text-gray-900">{selected?.phone} • {selected?.email}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Next appointment</div>
                <div className="text-sm text-gray-900">{selected?.nextAppointment}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Demographics</div>
                <div className="text-sm text-gray-900">{selected?.age} years • {selected?.gender}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Recent notes</div>
                <div className="text-sm text-gray-900 whitespace-pre-line">{selected?.notes}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[selected?.status]}`}>
                  {selected?.status}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={closeDetails}
              className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
