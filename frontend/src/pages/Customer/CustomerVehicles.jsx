import { useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import PopoverModal from '../../components/ui/PopoverModal'
import {
  useAddCustomerVehicleMutation,
  useDeleteCustomerVehicleMutation,
  useGetCustomerByIdQuery,
  useUpdateCustomerVehicleMutation,
} from '../../services/backendApi'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const emptyVehicleForm = {
  registrationNumber: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  fuelType: '',
}

const CustomerVehicles = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId

  const { data: customer } = useGetCustomerByIdQuery(customerId, { skip: !customerId })
  const [addVehicle, addVehicleState] = useAddCustomerVehicleMutation()
  const [updateVehicle, updateVehicleState] = useUpdateCustomerVehicleMutation()
  const [deleteVehicle, deleteVehicleState] = useDeleteCustomerVehicleMutation()

  const [vehicleForm, setVehicleForm] = useState({ ...emptyVehicleForm })
  const [editForm, setEditForm] = useState({
    vehicleId: null,
    registrationNumber: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    fuelType: '',
  })
  const [modalState, setModalState] = useState({ type: null, vehicle: null })

  const vehicles = customer?.vehicles ?? []

  const closeModal = () => setModalState({ type: null, vehicle: null })

  const openEdit = (vehicle) => {
    setEditForm({
      vehicleId: vehicle.vehicleId,
      registrationNumber: vehicle.registrationNumber ?? '',
      brand: vehicle.brand ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year ? String(vehicle.year) : '',
      color: vehicle.color ?? '',
      fuelType: vehicle.fuelType ?? '',
    })
    setModalState({ type: 'edit', vehicle })
  }

  const openDelete = (vehicle) => {
    setModalState({ type: 'delete', vehicle })
  }

  const handleAdd = async () => {
    if (!customerId) return
    try {
      await addVehicle({
        customerId,
        ...vehicleForm,
        year: vehicleForm.year ? Number(vehicleForm.year) : 0,
      }).unwrap()
      setVehicleForm({ ...emptyVehicleForm })
    } catch (error) {
      console.error(error)
    }
  }

  const handleUpdate = async () => {
    if (!customerId || !editForm.vehicleId) return
    try {
      await updateVehicle({
        customerId,
        vehicleId: editForm.vehicleId,
        brand: editForm.brand,
        model: editForm.model,
        year: editForm.year ? Number(editForm.year) : 0,
        color: editForm.color,
        fuelType: editForm.fuelType,
      }).unwrap()
      closeModal()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!customerId || !modalState.vehicle) return
    try {
      await deleteVehicle({
        customerId,
        vehicleId: modalState.vehicle.vehicleId,
      }).unwrap()
      closeModal()
    } catch (error) {
      console.error(error)
    }
  }

  if (!customerId) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My vehicles</CardTitle>
          <CardDescription>
            Add, edit, or remove your registered vehicles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {vehicles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.vehicleId}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-slate-500">
                        {vehicle.registrationNumber}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {vehicle.year || 'N/A'}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    <p>Color: {vehicle.color || 'Not set'}</p>
                    <p>Fuel: {vehicle.fuelType || 'Not set'}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(vehicle)}>
                      Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => openDelete(vehicle)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-900">No vehicles yet</p>
              <p className="text-xs text-slate-500">Add your first vehicle below.</p>
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
              Add a vehicle
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Registration number</Label>
                <Input
                  value={vehicleForm.registrationNumber}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      registrationNumber: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={vehicleForm.brand}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      brand: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={vehicleForm.model}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      model: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={vehicleForm.year}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      year: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={vehicleForm.color}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      color: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fuel type</Label>
                <Input
                  value={vehicleForm.fuelType}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      fuelType: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <Button
              className="mt-4"
              type="button"
              onClick={handleAdd}
              disabled={addVehicleState.isLoading}
            >
              {addVehicleState.isLoading ? 'Adding...' : 'Add vehicle'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PopoverModal
        isOpen={modalState.type !== null}
        onClose={closeModal}
        title={
          modalState.type === 'edit'
            ? 'Edit vehicle'
            : 'Delete vehicle'
        }
        description={
          modalState.type === 'edit'
            ? 'Update your vehicle details.'
            : 'This action cannot be undone.'
        }
        footer={
          modalState.type === 'edit' ? (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdate}
                disabled={updateVehicleState.isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updateVehicleState.isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteVehicleState.isLoading}
              >
                {deleteVehicleState.isLoading ? 'Deleting...' : 'Delete vehicle'}
              </Button>
            </>
          )
        }
      >
        {modalState.type === 'edit' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                {editForm.registrationNumber || 'Vehicle'}
              </p>
              <p>{editForm.brand} {editForm.model}</p>
            </div>
            <div className="space-y-1">
              <Label>Brand</Label>
              <Input
                value={editForm.brand}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    brand: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <Input
                value={editForm.model}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    model: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input
                type="number"
                value={editForm.year}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    year: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input
                value={editForm.color}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    color: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Fuel type</Label>
              <Input
                value={editForm.fuelType}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    fuelType: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        ) : modalState.vehicle ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              {modalState.vehicle.registrationNumber}
            </p>
            <p>{modalState.vehicle.brand} {modalState.vehicle.model}</p>
          </div>
        ) : null}
      </PopoverModal>
    </div>
  )
}

export default CustomerVehicles
