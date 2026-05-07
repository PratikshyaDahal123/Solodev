import { useState } from 'react'
import { Plus, Search, Car, Edit2, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
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
  useSearchCustomersQuery,
  useGetCustomerByIdQuery,
  useAddCustomerVehicleMutation,
  useUpdateCustomerVehicleMutation,
  useDeleteCustomerVehicleMutation,
} from '../../services/backendApi'

const emptyVehicle = {
  registrationNumber: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  fuelType: '',
}

const StaffVehicles = () => {
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)
  const [form, setForm] = useState(emptyVehicle)

  const { data: customers = [] } = useSearchCustomersQuery(search)
  const { data: customer } = useGetCustomerByIdQuery(selectedCustomerId, { skip: !selectedCustomerId })

  const [addVehicle, addState] = useAddCustomerVehicleMutation()
  const [updateVehicle, updateState] = useUpdateCustomerVehicleMutation()
  const [deleteVehicle] = useDeleteCustomerVehicleMutation()

  const handleChange = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleAdd = async () => {
    if (!selectedCustomerId) return
    const res = await addVehicle({
      customerId: selectedCustomerId,
      registrationNumber: form.registrationNumber,
      brand: form.brand,
      model: form.model,
      year: Number(form.year || 0),
      color: form.color || null,
      fuelType: form.fuelType || null,
    })
    if (!res.error) { setForm(emptyVehicle); setAddOpen(false) }
  }

  const handleEdit = async () => {
    if (!selectedCustomerId || !editVehicle) return
    const res = await updateVehicle({
      customerId: selectedCustomerId,
      vehicleId: editVehicle.vehicleId,
      registrationNumber: form.registrationNumber,
      brand: form.brand,
      model: form.model,
      year: Number(form.year || 0),
      color: form.color || null,
      fuelType: form.fuelType || null,
    })
    if (!res.error) { setEditOpen(false); setEditVehicle(null) }
  }

  const openEdit = (v) => {
    setEditVehicle(v)
    setForm({
      registrationNumber: v.registrationNumber ?? '',
      brand: v.brand ?? '',
      model: v.model ?? '',
      year: v.year?.toString() ?? '',
      color: v.color ?? '',
      fuelType: v.fuelType ?? '',
    })
    setEditOpen(true)
  }

  const handleDelete = async (vehicleId) => {
    if (!selectedCustomerId) return
    if (window.confirm('Remove this vehicle?')) {
      await deleteVehicle({ customerId: selectedCustomerId, vehicleId })
    }
  }

  const vehicles = customer?.vehicles ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Search a customer to view and manage their vehicles</p>
        </div>
        {selectedCustomerId && (
          <Button
            onClick={() => { setForm(emptyVehicle); setAddOpen(true) }}
            className="bg-gray-900 hover:bg-gray-700 text-white gap-1.5 text-sm"
          >
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        )}
      </div>

      {/* Customer search */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer by name, phone, or ID…"
              className="pl-9"
            />
          </div>

          {customers.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
              {customers.slice(0, 8).map((c) => (
                <button
                  key={c.customerId}
                  type="button"
                  onClick={() => setSelectedCustomerId(c.customerId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${selectedCustomerId === c.customerId ? 'bg-gray-50' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {c.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.fullName}</p>
                    <p className="text-xs text-gray-400">{c.phoneNumber} · #{c.customerCode}</p>
                  </div>
                  {selectedCustomerId === c.customerId && (
                    <span className="ml-auto text-xs text-gray-400">Selected</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer info chip */}
        {customer && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-semibold text-lg flex-shrink-0">
              {customer.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{customer.fullName}</p>
              <p className="text-sm text-gray-500">{customer.email}</p>
              <p className="text-xs text-gray-400 mt-1">{customer.phoneNumber} · #{customer.customerCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Vehicles table */}
      {selectedCustomerId ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              {vehicles.length > 0 ? `${vehicles.length} vehicle${vehicles.length > 1 ? 's' : ''}` : 'No vehicles'}
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">#</TableHead>
                <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Registration</TableHead>
                <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Brand / Model</TableHead>
                <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Year</TableHead>
                <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Color</TableHead>
                <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Fuel</TableHead>
                <TableHead className="text-right text-xs uppercase text-gray-400 font-medium tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-sm text-gray-400">
                    <Car className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    No vehicles registered for this customer.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((v, i) => (
                  <TableRow key={v.vehicleId} className="hover:bg-gray-50/60">
                    <TableCell className="text-gray-400 text-sm">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        <span className="font-medium text-gray-900 text-sm">{v.registrationNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{v.brand} {v.model}</TableCell>
                    <TableCell className="text-sm text-gray-600">{v.year || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{v.color || '—'}</TableCell>
                    <TableCell>
                      {v.fuelType ? (
                        <Badge variant="outline" className="text-xs font-normal">{v.fuelType}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                          onClick={() => openEdit(v)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => handleDelete(v.vehicleId)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-lg py-20 text-center bg-white">
          <Car className="h-10 w-10 mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">Search and select a customer above</p>
          <p className="text-xs text-gray-400 mt-1">Their vehicles will appear here</p>
        </div>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
            <DialogDescription>Register a new vehicle for {customer?.fullName}.</DialogDescription>
          </DialogHeader>
          <VehicleForm form={form} onChange={handleChange} />
          {addState.isError && <p className="text-xs text-red-500 mt-2">Failed to add vehicle.</p>}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAdd} disabled={addState.isLoading} className="bg-gray-900 hover:bg-gray-700 text-white">
              {addState.isLoading ? 'Saving…' : 'Add Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update vehicle details.</DialogDescription>
          </DialogHeader>
          <VehicleForm form={form} onChange={handleChange} />
          {updateState.isError && <p className="text-xs text-red-500 mt-2">Failed to update vehicle.</p>}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleEdit} disabled={updateState.isLoading} className="bg-gray-900 hover:bg-gray-700 text-white">
              {updateState.isLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const VehicleForm = ({ form, onChange }) => (
  <div className="mt-4 grid gap-4 sm:grid-cols-2">
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Registration Number</Label>
      <Input value={form.registrationNumber} onChange={onChange('registrationNumber')} placeholder="BA 1 CHA 1234" />
    </div>
    <div className="space-y-1.5">
      <Label>Brand</Label>
      <Input value={form.brand} onChange={onChange('brand')} placeholder="Toyota" />
    </div>
    <div className="space-y-1.5">
      <Label>Model</Label>
      <Input value={form.model} onChange={onChange('model')} placeholder="Corolla" />
    </div>
    <div className="space-y-1.5">
      <Label>Year</Label>
      <Input type="number" value={form.year} onChange={onChange('year')} placeholder="2020" />
    </div>
    <div className="space-y-1.5">
      <Label>Color</Label>
      <Input value={form.color} onChange={onChange('color')} placeholder="Silver" />
    </div>
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Fuel Type</Label>
      <Input value={form.fuelType} onChange={onChange('fuelType')} placeholder="Petrol" />
    </div>
  </div>
)

export default StaffVehicles
