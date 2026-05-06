import { useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  useBookAppointmentMutation,
  useGetAppointmentsByCustomerQuery,
  useGetCustomerByIdQuery,
} from '../../services/backendApi'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CustomerAppointments = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId

  const { data: customer } = useGetCustomerByIdQuery(customerId, {
    skip: !customerId,
  })
  const { data: appointments } = useGetAppointmentsByCustomerQuery(customerId, {
    skip: !customerId,
  })
  const [bookAppointment, bookAppointmentState] = useBookAppointmentMutation()
  const vehicles = customer?.vehicles ?? []

  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDateTime: '',
    serviceType: '',
    description: '',
    vehicleId: '',
  })

  if (!customerId) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
        <CardDescription>Book and track service visits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Date and time</Label>
            <Input
              type="datetime-local"
              value={appointmentForm.appointmentDateTime}
              onChange={(event) =>
                setAppointmentForm((prev) => ({
                  ...prev,
                  appointmentDateTime: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Service type</Label>
            <Input
              value={appointmentForm.serviceType}
              onChange={(event) =>
                setAppointmentForm((prev) => ({
                  ...prev,
                  serviceType: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Vehicle (optional)</Label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-cyan-300 focus:outline-none"
              value={appointmentForm.vehicleId}
              onChange={(event) =>
                setAppointmentForm((prev) => ({
                  ...prev,
                  vehicleId: event.target.value,
                }))
              }
              disabled={!vehicles.length}
            >
              <option value="">
                {vehicles.length ? 'Select a vehicle' : 'No vehicles available'}
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                  {vehicle.brand} {vehicle.model}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={appointmentForm.description}
              onChange={(event) =>
                setAppointmentForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={() =>
            bookAppointment({
              customerId,
              vehicleId: appointmentForm.vehicleId
                ? Number(appointmentForm.vehicleId)
                : null,
              appointmentDateTime: appointmentForm.appointmentDateTime
                ? new Date(appointmentForm.appointmentDateTime).toISOString()
                : new Date().toISOString(),
              serviceType: appointmentForm.serviceType,
              description: appointmentForm.description,
            })
          }
          disabled={bookAppointmentState.isLoading}
        >
          {bookAppointmentState.isLoading ? 'Booking...' : 'Book appointment'}
        </Button>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Upcoming appointments
          </p>
          <div className="mt-3 space-y-3">
            {(appointments ?? []).map((appointment) => (
              <div
                key={appointment.appointmentId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {appointment.serviceType}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(appointment.appointmentDateTime).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{appointment.status}</Badge>
              </div>
            ))}
            {!appointments?.length && (
              <p className="text-sm text-slate-500">No appointments yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomerAppointments
