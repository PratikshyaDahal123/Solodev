/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Plus, Search, Car, Eye, History } from 'lucide-react'

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
  DialogClose,
} from '../../components/ui/dialog'
import {
  useGetCustomerByIdQuery,
  useGetCustomerHistoryQuery,
  useRegisterCustomerMutation,
  useSearchCustomersQuery,
} from '../../services/backendApi'

const emptyForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  address: '',
  registrationNumber: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  fuelType: '',
}

const PAGE_SIZE = 8

const StaffCustomers = () => {
  const [registerCustomer, registerState] = useRegisterCustomerMutation()
  const [form, setForm] = useState(emptyForm)
  const [includeVehicle, setIncludeVehicle] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [searchTerm, setSearchTerm] = useState('')
  const [viewCustomerId, setViewCustomerId] = useState(null)
  const [historyCustomerId, setHistoryCustomerId] = useState(null)

  // Search with empty string returns all customers
  const { data: customers = [] } = useSearchCustomersQuery(searchTerm)

  const { data: viewCustomer } = useGetCustomerByIdQuery(viewCustomerId, {
    skip: !viewCustomerId,
  })
  const { data: history } = useGetCustomerHistoryQuery(historyCustomerId, {
    skip: !historyCustomerId,
  })

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedCustomers = customers.slice(startIndex, startIndex + PAGE_SIZE)

  const handleSubmit = async () => {
    const payload = {
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      password: form.password,
      address: form.address || null,
      vehicle: includeVehicle
        ? {
            registrationNumber: form.registrationNumber,
            brand: form.brand,
            model: form.model,
            year: Number(form.year || 0),
            color: form.color || null,
            fuelType: form.fuelType || null,
          }
        : null,
    }
    const result = await registerCustomer(payload)
    if (!result.error) {
      setForm(emptyForm)
      setAddOpen(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} customers total</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, phone, ID or vehicle…"
          className="pl-9"
        />
      </div>

      {/* Customers table */}
      <div className="rounded-2xl overflow-hidden bg-slate-50/80 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-10 text-slate-500 font-medium">#</TableHead>
              <TableHead className="text-slate-500 font-medium uppercase text-xs tracking-wide">Full Name</TableHead>
              <TableHead className="text-slate-500 font-medium uppercase text-xs tracking-wide">Phone</TableHead>
              <TableHead className="text-slate-500 font-medium uppercase text-xs tracking-wide">Email</TableHead>
              <TableHead className="text-slate-500 font-medium uppercase text-xs tracking-wide">Vehicles</TableHead>
              <TableHead className="text-slate-500 font-medium uppercase text-xs tracking-wide text-right">Credit</TableHead>
              <TableHead className="text-right text-slate-500 font-medium uppercase text-xs tracking-wide">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-sm text-slate-400">
                  {searchTerm ? 'No customers match your search.' : 'No customers registered yet.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((c, i) => (
                <TableRow key={c.customerId} className="hover:bg-slate-50/60">
                  <TableCell className="text-slate-400 text-sm">{startIndex + i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {c.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{c.fullName}</div>
                        <div className="text-xs text-slate-400">#{c.customerCode}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">{c.phoneNumber || '—'}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{c.email || '—'}</TableCell>
                  <TableCell>
                    {c.vehicleRegistrationNumbers?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {c.vehicleRegistrationNumbers.map((v) => (
                          <Badge key={v} className="text-xs font-normal bg-cyan-50 text-cyan-700">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-600">
                    Rs {Number(c.creditBalance ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                        title="View profile"
                        onClick={() => {
                          setViewCustomerId(c.customerId)
                          setHistoryCustomerId(null)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                        title="View history"
                        onClick={() => {
                          setHistoryCustomerId(c.customerId)
                          setViewCustomerId(null)
                        }}
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {customers.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-slate-500">
              Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, customers.length)} of {customers.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="border-0 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="border-0 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Customer Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Customer</DialogTitle>
            <DialogDescription>
              Fill in the customer details and optionally add their primary vehicle.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={form.fullName} onChange={handleChange('fullName')} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={handleChange('email')} placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={form.phoneNumber} onChange={handleChange('phoneNumber')} placeholder="+977 98XXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password</Label>
              <Input type="password" value={form.password} onChange={handleChange('password')} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={handleChange('address')} placeholder="Kathmandu, Nepal" />
            </div>
          </div>

          {/* Vehicle toggle */}
          <div className="mt-5 rounded-xl bg-slate-50/80 p-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeVehicle}
                onChange={(e) => setIncludeVehicle(e.target.checked)}
                className="h-4 w-4 rounded border-0"
              />
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Car className="h-4 w-4 text-slate-400" />
                Include primary vehicle
              </span>
            </label>

            {includeVehicle && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 pt-4">
                <div className="space-y-1.5">
                  <Label>Registration Number</Label>
                  <Input value={form.registrationNumber} onChange={handleChange('registrationNumber')} placeholder="BA 1 CHA 1234" />
                </div>
                <div className="space-y-1.5">
                  <Label>Brand</Label>
                  <Input value={form.brand} onChange={handleChange('brand')} placeholder="Toyota" />
                </div>
                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <Input value={form.model} onChange={handleChange('model')} placeholder="Corolla" />
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Input type="number" value={form.year} onChange={handleChange('year')} placeholder="2020" />
                </div>
                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <Input value={form.color} onChange={handleChange('color')} placeholder="Silver" />
                </div>
                <div className="space-y-1.5">
                  <Label>Fuel Type</Label>
                  <Input value={form.fuelType} onChange={handleChange('fuelType')} placeholder="Petrol" />
                </div>
              </div>
            )}
          </div>

          {registerState.isError && (
            <p className="text-sm text-red-500 mt-2">Failed to register customer. Please check the details.</p>
          )}

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="ghost" className="bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={registerState.isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {registerState.isLoading ? 'Registering…' : 'Register Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Profile Dialog ── */}
      <Dialog open={!!viewCustomerId} onOpenChange={(open) => !open && setViewCustomerId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
            <DialogDescription>Details and financials for this customer.</DialogDescription>
          </DialogHeader>
          {viewCustomer ? (
            <div className="mt-4 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {viewCustomer.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{viewCustomer.fullName}</p>
                  <p className="text-sm text-slate-500">{viewCustomer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Customer Code', viewCustomer.customerCode],
                  ['Phone', viewCustomer.phoneNumber],
                  ['Address', viewCustomer.address || '—'],
                  ['Joined', new Date(viewCustomer.dateJoined).toLocaleDateString()],
                  ['Loyalty Points', `${viewCustomer.loyaltyPoints} pts`],
                  ['Total Spent', `Rs ${Number(viewCustomer.totalSpent).toLocaleString()}`],
                  ['Credit Balance', `Rs ${Number(viewCustomer.creditBalance).toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="font-medium text-slate-800 break-all">{value}</p>
                  </div>
                ))}
              </div>

              {viewCustomer.vehicleRegistrationNumbers?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Vehicles</p>
                  <div className="flex flex-wrap gap-2">
                    {viewCustomer.vehicleRegistrationNumbers.map((v) => (
                      <Badge key={v} className="gap-1.5 bg-cyan-50 text-cyan-700">
                        <Car className="h-3 w-3" /> {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mt-4">Loading…</p>
          )}
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="ghost" className="bg-slate-100 text-slate-700 hover:bg-slate-200">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View History Dialog ── */}
      <Dialog open={!!historyCustomerId} onOpenChange={(open) => !open && setHistoryCustomerId(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer History</DialogTitle>
            <DialogDescription>Appointments and past purchases.</DialogDescription>
          </DialogHeader>

          {history ? (
            <div className="mt-4 space-y-6">
              {/* Appointments */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Appointments</p>
                {history.appointments?.length ? (
                  <div className="rounded-xl overflow-hidden bg-slate-50/70">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs">Service</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-right text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.appointments.map((a) => (
                          <TableRow key={a.appointmentId}>
                            <TableCell className="font-medium text-sm">{a.serviceType}</TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(a.appointmentDateTime).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={`text-xs ${a.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                {a.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No appointments yet.</p>
                )}
              </div>

              {/* Purchases */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Purchases</p>
                {history.purchases?.length ? (
                  <div className="rounded-xl overflow-hidden bg-slate-50/70">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs">Invoice</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-right text-xs">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.purchases.map((p) => (
                          <TableRow key={p.salesInvoiceId}>
                            <TableCell className="font-medium text-sm">{p.invoiceNumber}</TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(p.invoiceDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">
                              Rs {Number(p.totalAmount).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No purchases yet.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 mt-4">Loading history…</p>
          )}

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="ghost" className="bg-slate-100 text-slate-700 hover:bg-slate-200">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffCustomers