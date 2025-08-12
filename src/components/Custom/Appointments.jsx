"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, MoreVertical } from "lucide-react"
import ProcessAppointments from "./ProcessAppointments"
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'sonner'

// Create an axios instance with the backend base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
})

// Static price mapping
const priceMapping = {
  "Back Pain Relief": "LKR 4,800",
  "Stress Management": "LKR 3,200",
  "Deep Tissue": "LKR 5,000",
}

// Map status to Tailwind CSS classes and display text
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return { className: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
    case 'Confirmed':
      return { className: 'bg-green-100 text-green-800', text: 'Confirmed' }
    case 'Waiting':
      return { className: 'bg-orange-100 text-orange-800', text: 'Waiting' }
    case 'Cancelled':
      return { className: 'bg-red-100 text-red-800', text: 'Cancel' }
    case 'Completed':
      return { className: 'bg-blue-100 text-blue-800', text: 'Completed' }
    default:
      return { className: 'bg-gray-100 text-gray-800', text: 'Unknown' }
  }
}

function Appointments() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("All")
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [therapistId, setTherapistId] = useState(null)
  const [authError, setAuthError] = useState(null)
  const queryClient = useQueryClient()

  // Get therapist ID from therapyToken
  useEffect(() => {
    const token = localStorage.getItem('therapyToken')
    console.log('Retrieved token:', token)

    if (!token) {
      setAuthError('No authentication token found')
      return
    }

    try {
      const decoded = jwtDecode(token)
      console.log('Decoded token:', decoded)

      if (!decoded?.therapist_id) {
        setAuthError('Invalid token structure - missing therapist_id')
        return
      }

      if (decoded.exp * 1000 < Date.now()) {
        setAuthError('Token expired - please login again')
        return
      }

      setTherapistId(decoded.therapist_id)
    } catch (error) {
      console.error('Token decode error:', error)
      setAuthError('Invalid token format')
    }
  }, [])

  // Fetch appointments using useQuery
  const {
    data: appointmentData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['appointments', therapistId],
    queryFn: async () => {
      const token = localStorage.getItem('therapyToken')
      if (!token) {
        throw new Error('Authentication token missing')
      }

      try {
        const response = await api.get(`/api/appointments/therapist/${therapistId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          validateStatus: (status) => status < 500,
        })

        console.log('Full API response:', response)
        console.log('Response data:', response.data)

        if (response.status === 401) {
          throw new Error('Session expired - please login again')
        }
        if (response.status === 404) {
          throw new Error('Therapist not found')
        }

        if (typeof response.data === 'string' && response.data.includes('<!doctype html')) {
          console.error('Received HTML instead of JSON:', response.data)
          throw new Error('Invalid response: Received HTML from server')
        }

        if (!response.data.success || !Array.isArray(response.data.appointments)) {
          console.error('Unexpected response format:', response.data)
          throw new Error('Invalid response format from server')
        }

        return response.data.appointments
      } catch (error) {
        console.error('API request failed:', error)
        throw error
      }
    },
    enabled: !!therapistId,
    retry: 1,
  })

  // Handle status update
  const handleStatusUpdate = (appointmentId, newStatus) => {
    console.log(`Updating appointment ID ${appointmentId} to status ${newStatus}`)
    queryClient.setQueryData(['appointments', therapistId], (oldData) =>
      oldData
        ? oldData.map((appt) =>
            appt.id === appointmentId
              ? { ...appt, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase() }
              : appt,
          )
        : oldData,
    )
    toast.success(`Appointment ${newStatus} successfully`, {
      style: { background: '#d1fae5', color: '#065f46', fontWeight: 'bold' },
      icon: '✅',
      duration: 3000,
    })
  }

  // Map backend data to UI format
  const appointments = appointmentData
    ? appointmentData.map((appt) => {
        const price = appt.treatment_name && priceMapping[appt.treatment_name] ? priceMapping[appt.treatment_name] : 'LKR 0'
        const status = appt.status ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1).toLowerCase() : 'Unknown'
        console.log(`Mapping appointment ID ${appt.id}: treatment_name=${appt.treatment_name}, price=${price}, status=${status}`)
        return {
          id: appt.id,
          date: appt.date,
          time: appt.time,
          therapyName: appt.therapist_name || 'Unknown',
          treatmentName: appt.treatment_name || 'Unknown',
          price: appt.price,
          customer: appt.patient_name || 'Unknown',
          therapyImage: appt.therapy_image ? `${api.defaults.baseURL}/${appt.therapy_image}` : '/placeholder.svg?height=200&width=300',
          treatmentImage: appt.treatment_image ? `${api.defaults.baseURL}/${appt.treatment_image}` : '/placeholder.svg?height=200&width=300',
          status: status,
        }
      })
    : []

  // Filter appointments
  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.customer.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filter === "All" || appointment.status === filter),
  )

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment)
  }

  if (authError) {
    return (
      <div className="container flex justify-center flex-col p-4">
        <h1 className="text-3xl font-bold mb-6">My Appointments</h1>
        <p className="text-red-500 mb-4">{authError}</p>
        <Button
          onClick={() => (window.location.href = '/login')}
          variant="outline"
        >
          Go to Login
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container flex justify-center flex-col p-4">
        <h1 className="text-3xl font-bold mb-6">My Appointments</h1>
        <p>Loading appointments...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container flex justify-center flex-col p-4">
        <h1 className="text-3xl font-bold mb-6">My Appointments</h1>
        <p className="text-red-500 mb-4">{error.message || 'Failed to load appointments'}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="container flex justify-center flex-col">
      <h1 className="text-3xl font-bold mb-6">My Appointments</h1>

      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Search by customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] border rounded-md py-2">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Waiting">Waiting</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 font-semibold text-gray-700">ID</th>
              <th className="p-3 font-semibold text-gray-700">Date</th>
              <th className="p-3 font-semibold text-gray-700">Time</th>
              <th className="p-3 font-semibold text-gray-700">Therapy Name</th>
              <th className="p-3 font-semibold text-gray-700">Treatment Name</th>
              <th className="p-3 font-semibold text-gray-700">Price</th>
              <th className="p-3 font-semibold text-gray-700">Customer</th>
              <th className="p-3 font-semibold text-gray-700">Status</th>
              <th className="p-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-3 text-center text-gray-500">
                  No appointments found
                </td>
              </tr>
            ) : (
              filteredAppointments.map((appointment) => {
                const { className, text } = getStatusColor(appointment.status)
                return (
                  <tr key={appointment.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{appointment.id}</td>
                    <td className="p-3">{appointment.date}</td>
                    <td className="p-3">{appointment.time}</td>
                    <td className="p-3">{appointment.therapyName}</td>
                    <td className="p-3">{appointment.treatmentName}</td>
                    <td className="p-3">{appointment.price}</td>
                    <td className="p-3">{appointment.customer}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${className}`}
                      >
                        {text}
                      </span>
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(appointment)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedAppointment && (
        <ProcessAppointments
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}

export default Appointments