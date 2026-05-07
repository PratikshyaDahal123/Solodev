import { useEffect, useState } from 'react'
import { Search, History, Car, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import {
  useSearchCustomersQuery,
  useGetCustomerByIdQuery,
  useGetCustomerHistoryQuery,
} from '../../services/backendApi'

const StaffCustomerRecords = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [activeTab, setActiveTab] = useState('details') // details, history, vehicles
  const [currentPage, setCurrentPage] = useState(1)

  const { data: customers = [] } = useSearchCustomersQuery(searchTerm)
  const { data: customerDetails } = useGetCustomerByIdQuery(selectedCustomerId, {
    skip: !selectedCustomerId,
  })
  const { data: customerHistory = [] } = useGetCustomerHistoryQuery(selectedCustomerId, {
    skip: !selectedCustomerId,
  })
  const historyArray = Array.isArray(customerHistory) ? customerHistory : (customerHistory?.appointments ?? [])

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedCustomers = customers.slice(startIndex, startIndex + PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomerId(customerId)
    setActiveTab('details')
  }

  const handleCloseModal = () => {
    setSelectedCustomerId(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Customer Records</h1>
        <p className="text-sm text-slate-500 mt-0.5">View customer details, history, and vehicles</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex gap-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0 mt-2.5" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Customers List Table */}
      <div className="rounded-2xl overflow-hidden bg-slate-50/80 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-200 bg-slate-100/50">
              <TableHead className="text-slate-700 font-semibold">#</TableHead>
              <TableHead className="text-slate-700 font-semibold">Name</TableHead>
              <TableHead className="text-slate-700 font-semibold">Email</TableHead>
              <TableHead className="text-slate-700 font-semibold">Phone</TableHead>
              <TableHead className="text-slate-700 font-semibold">Address</TableHead>
              <TableHead className="text-slate-700 font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan="6" className="text-center py-8 text-slate-500">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer, index) => (
                <TableRow key={customer.customerId} className="hover:bg-slate-100/50 border-slate-100">
                  <TableCell className="text-slate-600 text-sm">{startIndex + index + 1}</TableCell>
                  <TableCell className="text-slate-900 font-medium">{customer.fullName}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{customer.email}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{customer.phoneNumber}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{customer.address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleSelectCustomer(customer.customerId)}
                      className="bg-primary hover:bg-primary/90 text-white text-sm h-8 px-3"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {customers.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, customers.length)} of{' '}
            {customers.length} customers
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              variant="outline"
              className="text-sm h-9"
            >
              Previous
            </Button>
            <div className="flex items-center px-3 py-2 text-sm text-slate-600">
              Page {safeCurrentPage} of {totalPages}
            </div>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage === totalPages}
              variant="outline"
              className="text-sm h-9"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      <Dialog open={!!selectedCustomerId} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Record</DialogTitle>
            <DialogDescription>View customer details, appointment history, and vehicles</DialogDescription>
          </DialogHeader>

          {customerDetails && (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-4 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 px-4 font-medium text-sm transition-colors ${
                    activeTab === 'details'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-3 px-4 font-medium text-sm transition-colors ${
                    activeTab === 'history'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Appointment History
                </button>
                <button
                  onClick={() => setActiveTab('vehicles')}
                  className={`pb-3 px-4 font-medium text-sm transition-colors ${
                    activeTab === 'vehicles'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vehicles
                </button>
              </div>

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-2 gap-6 bg-slate-50/80 p-6 rounded-xl">
                  <div>
                    <Label className="text-slate-600 text-xs uppercase tracking-wide">Full Name</Label>
                    <p className="text-slate-900 font-medium mt-1">{customerDetails.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-xs uppercase tracking-wide">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-900">{customerDetails.email}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-xs uppercase tracking-wide">Phone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-900">{customerDetails.phoneNumber}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-xs uppercase tracking-wide">Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-900">{customerDetails.address || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  {historyArray.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No appointment history found</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {historyArray.map((appointment, idx) => (
                        <div key={idx} className="bg-slate-50/80 p-4 rounded-lg border border-slate-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-900">
                                  {new Date(appointment.appointmentDate).toLocaleDateString()}
                                </span>
                                <span className="text-sm text-slate-500">
                                  {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {appointment.vehicle && (
                                <div className="flex items-center gap-2 mb-2 text-sm text-slate-600">
                                  <Car className="w-4 h-4" />
                                  {appointment.vehicle.brand} {appointment.vehicle.model} (
                                  {appointment.vehicle.registrationNumber})
                                </div>
                              )}
                              <p className="text-sm text-slate-600">{appointment.description}</p>
                            </div>
                            <Badge
                              className={`ml-3 ${
                                appointment.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : appointment.status === 'Scheduled'
                                    ? 'bg-cyan-50 text-cyan-700'
                                    : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vehicles Tab */}
              {activeTab === 'vehicles' && (
                <div>
                  {customerDetails.vehicles && customerDetails.vehicles.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No vehicles registered</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerDetails.vehicles?.map((vehicle, idx) => (
                        <div key={idx} className="bg-slate-50/80 p-4 rounded-lg border border-slate-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">
                                {vehicle.brand} {vehicle.model}
                              </h3>
                              <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                                <div>
                                  <Label className="text-slate-500 text-xs">Registration</Label>
                                  <p className="text-slate-900 font-medium">{vehicle.registrationNumber}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-xs">Year</Label>
                                  <p className="text-slate-900">{vehicle.year}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-xs">Color</Label>
                                  <p className="text-slate-900">{vehicle.color || '-'}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-xs">Fuel Type</Label>
                                  <p className="text-slate-900">{vehicle.fuelType || '-'}</p>
                                </div>
                              </div>
                            </div>
                            <Car className="w-10 h-10 text-slate-300 ml-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCloseModal} variant="outline" className="text-slate-600">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffCustomerRecords
