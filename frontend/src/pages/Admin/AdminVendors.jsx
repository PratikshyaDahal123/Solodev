import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'react-toastify'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import PopoverModal from '../../components/ui/PopoverModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import {
  useCreateVendorMutation,
  useDeleteVendorMutation,
  useGetVendorsQuery,
  useUpdateVendorMutation,
} from '../../services/backendApi'

const pageSize = 6

const AdminVendors = () => {
  const { data: vendors = [], isLoading } = useGetVendorsQuery()
  const [createVendor, createState] = useCreateVendorMutation()
  const [updateVendor, updateState] = useUpdateVendorMutation()
  const [deleteVendor, deleteState] = useDeleteVendorMutation()

  const vendorList = useMemo(() => vendors ?? [], [vendors])
  const totalPages = Math.max(1, Math.ceil(vendorList.length / pageSize))
  const [page, setPage] = useState(1)

  const [modalState, setModalState] = useState({
    type: null,
    vendor: null,
  })
  const [createForm, setCreateForm] = useState({
    vendorName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    isActive: true,
  })
  const [editForm, setEditForm] = useState({
    vendorName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    isActive: true,
  })
  const [createErrors, setCreateErrors] = useState({})
  const [editErrors, setEditErrors] = useState({})

  const pagedVendors = useMemo(() => {
    const start = (page - 1) * pageSize
    return vendorList.slice(start, start + pageSize)
  }, [page, vendorList])

  const closeModal = () => setModalState({ type: null, vendor: null })

  const openCreateModal = () => {
    setCreateForm({
      vendorName: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      address: '',
      isActive: true,
    })
    setCreateErrors({})
    setModalState({ type: 'create', vendor: null })
  }

  const openEditModal = (vendor) => {
    setEditForm({
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      contactPerson: vendor.contactPerson ?? '',
      phoneNumber: vendor.phoneNumber ?? '',
      email: vendor.email ?? '',
      address: vendor.address ?? '',
      isActive: vendor.isActive,
    })
    setEditErrors({})
    setModalState({ type: 'edit', vendor })
  }

  const openDeleteModal = (vendor) => {
    setModalState({ type: 'delete', vendor })
  }

  const handleCreateChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value
    if (createErrors[field]) {
      setCreateErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value
    if (editErrors[field]) {
      setEditErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateVendor = (form) => {
    const errors = {}
    if (!form.vendorName?.trim()) errors.vendorName = 'Vendor name is required.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email.'
    }
    return errors
  }

  const handleCreate = async () => {
    const errors = validateVendor(createForm)
    if (Object.keys(errors).length) {
      setCreateErrors(errors)
      return
    }
    try {
      await createVendor({
        vendorName: createForm.vendorName,
        contactPerson: createForm.contactPerson || null,
        phoneNumber: createForm.phoneNumber || null,
        email: createForm.email || null,
        address: createForm.address || null,
        isActive: Boolean(createForm.isActive),
      }).unwrap()
      toast.success('Vendor created successfully.')
      closeModal()
    } catch (error) {
      const message = error?.data?.message ?? 'Could not create vendor.'
      toast.error(message)
    }
  }

  const handleUpdate = async () => {
    if (!editForm.vendorId) return
    const errors = validateVendor(editForm)
    if (Object.keys(errors).length) {
      setEditErrors(errors)
      return
    }
    try {
      await updateVendor({
        vendorId: editForm.vendorId,
        vendorName: editForm.vendorName,
        contactPerson: editForm.contactPerson || null,
        phoneNumber: editForm.phoneNumber || null,
        email: editForm.email || null,
        address: editForm.address || null,
        isActive: Boolean(editForm.isActive),
      }).unwrap()
      toast.success('Vendor updated successfully.')
      closeModal()
    } catch (error) {
      const message = error?.data?.message ?? 'Could not update vendor.'
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!modalState.vendor?.vendorId) return
    try {
      await deleteVendor(modalState.vendor.vendorId).unwrap()
      toast.success('Vendor deleted successfully.')
      closeModal()
    } catch (error) {
      const message = error?.data?.message ?? 'Could not delete vendor.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vendor management</h2>
          <p className="text-sm text-slate-500">
            {vendorList.length} vendors total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            type="button"
            onClick={openCreateModal}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add vendor
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-6 py-6 text-sm text-slate-500">Loading vendors...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedVendors.map((vendor, index) => (
                  <TableRow key={vendor.vendorId}>
                    <TableCell className="text-xs text-slate-500">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {vendor.vendorName}
                      </div>
                      <p className="text-xs text-slate-500">
                        {vendor.email ?? 'No email'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>{vendor.contactPerson ?? 'N/A'}</div>
                      <p className="text-xs text-slate-500">
                        {vendor.phoneNumber ?? 'No phone'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.isActive ? 'default' : 'outline'}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          aria-label="Edit vendor"
                          onClick={() => openEditModal(vendor)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete vendor"
                          onClick={() => openDeleteModal(vendor)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PopoverModal
        isOpen={modalState.type !== null}
        onClose={closeModal}
        title={
          modalState.type === 'create'
            ? 'Add vendor'
            : modalState.type === 'edit'
            ? 'Edit vendor'
            : 'Delete vendor'
        }
        description={
          modalState.type === 'create'
            ? 'Capture vendor contact details.'
            : modalState.type === 'edit'
            ? 'Update vendor status and contact info.'
            : 'This action cannot be undone.'
        }
        footer={
          modalState.type === 'create' ? (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={createState.isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createState.isLoading ? 'Saving...' : 'Create vendor'}
              </Button>
            </>
          ) : modalState.type === 'edit' ? (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdate}
                disabled={updateState.isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updateState.isLoading ? 'Saving...' : 'Save changes'}
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
                disabled={deleteState.isLoading}
              >
                {deleteState.isLoading ? 'Deleting...' : 'Delete vendor'}
              </Button>
            </>
          )
        }
      >
        {modalState.type === 'create' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="create-vendor-name">Vendor name</Label>
              <Input
                id="create-vendor-name"
                value={createForm.vendorName}
                onChange={handleCreateChange('vendorName')}
                aria-invalid={Boolean(createErrors.vendorName)}
              />
              {createErrors.vendorName ? (
                <p className="text-xs text-destructive">{createErrors.vendorName}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-contact">Contact person</Label>
              <Input
                id="create-contact"
                value={createForm.contactPerson}
                onChange={handleCreateChange('contactPerson')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-phone">Phone number</Label>
              <Input
                id="create-phone"
                value={createForm.phoneNumber}
                onChange={handleCreateChange('phoneNumber')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={handleCreateChange('email')}
                aria-invalid={Boolean(createErrors.email)}
              />
              {createErrors.email ? (
                <p className="text-xs text-destructive">{createErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="create-address">Address</Label>
              <Input
                id="create-address"
                value={createForm.address}
                onChange={handleCreateChange('address')}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={createForm.isActive}
                onChange={handleCreateChange('isActive')}
                className="h-4 w-4 rounded border border-input"
              />
              Active
            </label>
            {createState.isError ? (
              <p className="text-sm text-destructive sm:col-span-2">
                Unable to save vendor.
              </p>
            ) : null}
          </div>
        ) : modalState.type === 'edit' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="edit-vendor-name">Vendor name</Label>
              <Input
                id="edit-vendor-name"
                value={editForm.vendorName}
                onChange={handleEditChange('vendorName')}
                aria-invalid={Boolean(editErrors.vendorName)}
              />
              {editErrors.vendorName ? (
                <p className="text-xs text-destructive">{editErrors.vendorName}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-contact">Contact person</Label>
              <Input
                id="edit-contact"
                value={editForm.contactPerson}
                onChange={handleEditChange('contactPerson')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-phone">Phone number</Label>
              <Input
                id="edit-phone"
                value={editForm.phoneNumber}
                onChange={handleEditChange('phoneNumber')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={handleEditChange('email')}
                aria-invalid={Boolean(editErrors.email)}
              />
              {editErrors.email ? (
                <p className="text-xs text-destructive">{editErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={handleEditChange('address')}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={handleEditChange('isActive')}
                className="h-4 w-4 rounded border border-input"
              />
              Active
            </label>
            {updateState.isError ? (
              <p className="text-sm text-destructive sm:col-span-2">
                Unable to update vendor.
              </p>
            ) : null}
          </div>
        ) : modalState.vendor ? (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              {modalState.vendor.vendorName}
            </p>
            <p>{modalState.vendor.email ?? 'No email'}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {modalState.vendor.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        ) : null}
      </PopoverModal>
    </div>
  )
}

export default AdminVendors
