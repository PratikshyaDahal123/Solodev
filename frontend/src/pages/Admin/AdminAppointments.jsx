import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'

import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import {
  useGetAppointmentsQuery,
  useGetStaffQuery,
  useUpdateAppointmentStatusMutation,
} from '../../services/backendApi'

const pageSize = 8

const AdminAppointments = () => {
  const { data: appointments = [], isLoading } = useGetAppointmentsQuery()
  const { data: staff = [] } = useGetStaffQuery()
  const [updateStatus, updateStatusState] = useUpdateAppointmentStatusMutation()

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesStatus = statusFilter === 'all' || apt.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesSearch =
        apt.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.description?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [appointments, statusFilter, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize))
  const pagedAppointments = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAppointments.slice(start, start + pageSize)
  }, [page, filteredAppointments])

  const handleOpenModal = (apt) => {
    setSelectedAppointment(apt)
    setAssignedStaffId(apt.staffId?.toString() || '')
    setAdminNotes(apt.adminNotes || '')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAppointment(null)
    setAssignedStaffId('')
    setAdminNotes('')
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedAppointment) return

    try {
      await updateStatus({
        appointmentId: selectedAppointment.appointmentId,
        status: newStatus,
        staffId: assignedStaffId ? Number(assignedStaffId) : undefined,
        adminNotes: adminNotes || null,
      }).unwrap()

      toast.success(`Appointment ${newStatus.toLowerCase()}.`)
      handleCloseModal()
      setPage(1)
    } catch (error) {
      toast.error('Failed to update appointment.')
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Service Appointments"
        description="Manage customer appointments and assign staff"
        icon={<Clock className="h-8 w-8" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>View and manage all service appointments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by service type or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="flex-1 min-w-[200px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading appointments...</p>
          ) : pagedAppointments.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No appointments found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Staff Assigned</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedAppointments.map((apt, idx) => {
                    const assignedStaff = staff.find((s) => s.staffId === apt.staffId)
                    return (
                      <TableRow key={apt.appointmentId}>
                        <TableCell className="text-xs text-slate-500 font-medium">
                          {(page - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">{apt.serviceType}</TableCell>
                        <TableCell>{apt.customerName || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(apt.appointmentDateTime).toLocaleDateString()}{' '}
                          {new Date(apt.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell className="text-sm">{assignedStaff?.fullName || <span className="text-slate-400">Unassigned</span>}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(apt)}
                            className="h-8"
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Appointment</DialogTitle>
            <DialogDescription>Update appointment status and assign staff.</DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded">
                <div>
                  <p className="text-slate-500">Service Type</p>
                  <p className="font-medium">{selectedAppointment.serviceType}</p>
                </div>
                <div>
                  <p className="text-slate-500">Current Status</p>
                  <p className="font-medium">{selectedAppointment.status}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">Appointment Date</p>
                  <p className="font-medium">
                    {new Date(selectedAppointment.appointmentDateTime).toLocaleDateString()}{' '}
                    {new Date(selectedAppointment.appointmentDateTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign Staff</Label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.staffId} value={s.staffId}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes..."
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              variant="default"
              onClick={() => handleUpdateStatus(selectedAppointment.status)}
              disabled={updateStatusState.isLoading}
            >
              Save Changes
            </Button>
            {selectedAppointment?.status?.toLowerCase() === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus('Cancelled')}
                  className="bg-red-50 text-red-700 hover:bg-red-100"
                  disabled={updateStatusState.isLoading}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('Approved')}
                  disabled={updateStatusState.isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Approve
                </Button>
              </>
            )}
            {selectedAppointment?.status?.toLowerCase() === 'approved' && (
              <Button
                onClick={() => handleUpdateStatus('Completed')}
                disabled={updateStatusState.isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Mark Completed
              </Button>
            )}
            <Button variant="outline" onClick={handleCloseModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminAppointments
