"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import axios from 'axios'
import { toast } from "sonner"

// Create an axios instance with the backend base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
})

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

function ProcessAppointments({ appointment, onClose, onStatusUpdate }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState(null)

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: async (status) => {
      const token = localStorage.getItem('therapyToken')
      if (!token) {
        toast.error('Authentication token missing - please login', {
          style: { background: '#fee2e2', color: '#991b1b', fontWeight: 'bold' },
          icon: '❌',
          duration: 3000,
        })
        throw new Error('Authentication token missing')
      }

      console.log(`Updating appointment ID ${appointment.id} to status ${status}`)
      const response = await api.patch(`/api/appointments/${appointment.id}/process`, { status }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update status')
      }

      return response.data
    },
    onSuccess: (data, status) => {
      const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      onStatusUpdate(appointment.id, status)
    },
    onError: (error) => {
      console.error('Status update failed:', error)
      toast.error(error.message || 'Failed to update status', {
        style: { background: '#fee2e2', color: '#991b1b', fontWeight: 'bold' },
        icon: '❌',
        duration: 3000,
      })
    },
  })

  const handleAction = (action) => {
    setDialogAction(action)
    setIsDialogOpen(true)
  }

  const handleConfirmAction = () => {
    if (dialogAction === 'confirm') {
      updateStatus('confirmed')
    } else if (dialogAction === 'cancel') {
      updateStatus('cancelled')
    } else if (dialogAction === 'wait') {
      updateStatus('waiting')
    }
    setIsDialogOpen(false)
  }

  const { className, text } = getStatusColor(appointment.status)

  return (
    <>
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent className="md:w-[600px] p-4 sm:w-[540px] overflow-y-auto max-h-screen">
          <SheetHeader>
            <SheetTitle>Appointment Details</SheetTitle>
            <SheetDescription>View and process appointment information</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-base">{appointment.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-base">{appointment.time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Treatment Name</p>
                  <p className="text-base">{appointment.treatmentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Therapy Name</p>
                  <p className="text-base">{appointment.therapyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="text-base font-semibold">{appointment.price}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer</p>
                  <p className="text-base">{appointment.customer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${className}`}
                  >
                    {text}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Therapy Image</p>
                  <img
                    src={appointment.therapyImage || "/placeholder.svg"}
                    alt="Therapy"
                    className="w-full h-32 object-cover rounded-md border"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Treatment Image</p>
                  <img
                    src={appointment.treatmentImage || "/placeholder.svg"}
                    alt="Treatment"
                    className="w-full h-32 object-cover rounded-md border"
                  />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="flex flex-row gap-2">
            {appointment.status !== 'Cancelled' && appointment.status !== 'Waiting' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction('cancel')}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  disabled={isPending}
                >
                  Cancel Appointment
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleAction('wait')}
                  className="bg-green-200 text-green-900 hover:bg-green-700 border border-green-800"
                  disabled={isPending}
                >
                  Confirm Appointment
                </Button>
              </>
            )}
            
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className={
            dialogAction === 'cancel'
              ? 'border-red-300 bg-red-50'
              : dialogAction === 'confirm'
              ? 'border-green-300 bg-green-50'
              : 'border-orange-300 bg-orange-50'
          }
        >
          <DialogHeader>
            <DialogTitle
              className={
                dialogAction === 'cancel'
                  ? 'text-red-800'
                  : dialogAction === 'confirm'
                  ? 'text-green-800'
                  : 'text-orange-800'
              }
            >
              {dialogAction === 'cancel'
                ? 'Cancel Appointment'
                : dialogAction === 'confirm'
                ? 'Confirm Appointment'
                : 'Set to Waiting'}
            </DialogTitle>
            <DialogDescription
              className={
                dialogAction === 'cancel'
                  ? 'text-red-600'
                  : dialogAction === 'confirm'
                  ? 'text-green-600'
                  : 'text-orange-600'
              }
            >
              {dialogAction === 'cancel'
                ? 'Are you sure you want to cancel this appointment? This action cannot be undone.'
                : dialogAction === 'confirm'
                ? 'Are you sure you want to confirm this appointment?'
                : 'Are you sure you want to set this appointment to waiting?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
              Close
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={
                dialogAction === 'cancel'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : dialogAction === 'confirm'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }
              disabled={isPending}
            >
              {isPending
                ? 'Processing...'
                : dialogAction === 'cancel'
                ? 'Yes, Cancel'
                : dialogAction === 'confirm'
                ? 'Yes, Confirm'
                : 'Yes, Set Waiting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProcessAppointments