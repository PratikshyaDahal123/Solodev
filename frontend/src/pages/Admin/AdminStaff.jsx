import { useMemo, useState } from 'react'
import { Filter, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import PopoverModal from '../../components/ui/PopoverModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import {
  useDeleteStaffMutation,
  useGetStaffQuery,
  useRegisterStaffMutation,
  useUpdateStaffMutation,
} from '../../services/backendApi'

const roleOptions = ['Admin', 'Staff', 'Customer']

const generateEmployeeCode = () => {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  return `EMP-${timestamp}`
}

const AdminStaff = () => {
  const { data: staff = [], isLoading } = useGetStaffQuery()
  const [registerStaff, registerState] = useRegisterStaffMutation()
  const [updateStaff, updateState] = useUpdateStaffMutation()
  const [deleteStaff, deleteState] = useDeleteStaffMutation()
  const staffRows = useMemo(() => staff ?? [], [staff])
  const [modalState, setModalState] = useState({
    type: null,
    user: null,
  })
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    employeeCode: '',
    jobTitle: '',
    hireDate: '',
    salary: '',
  })
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Staff',
    employeeCode: '',
    jobTitle: '',
    hireDate: '',
    salary: '',
    isActive: true,
  })
  const [formErrors, setFormErrors] = useState({})
  const [createErrors, setCreateErrors] = useState({})

  const resolveRoleClass = (roleLabel) => {
    const normalized = typeof roleLabel === 'string' ? roleLabel.toLowerCase() : ''
    if (normalized === 'admin') return 'bg-cyan-50 text-cyan-700'
    if (normalized === 'customer') return 'bg-slate-100 text-slate-600'
    return 'bg-emerald-50 text-emerald-700'
  }

  const closeModal = () => setModalState({ type: null, user: null })

  const openCreateModal = () => {
    setCreateForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      employeeCode: generateEmployeeCode(),
      jobTitle: '',
      hireDate: '',
      salary: '',
    })
    setCreateErrors({})
    setModalState({ type: 'create', user: null })
  }

  const openEditModal = (user) => {
    const hireDate = user?.hireDate ? new Date(user.hireDate) : null
    setEditForm({
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      role: user?.role ?? 'Staff',
      employeeCode: user?.employeeCode ?? '',
      jobTitle: user?.jobTitle ?? '',
      hireDate: hireDate ? hireDate.toISOString().slice(0, 10) : '',
      salary: user?.salary?.toString?.() ?? '',
      isActive: user?.isActive ?? true,
    })
    setFormErrors({})
    setModalState({ type: 'edit', user })
  }

  const openDeleteModal = (user) => {
    setModalState({ type: 'delete', user })
  }

  const handleEditChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateChange = (field) => (event) => {
    const value = event.target.value
    if (createErrors[field]) {
      setCreateErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const errors = {}
    if (!editForm.fullName.trim()) errors.fullName = 'Full name is required.'
    if (!editForm.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = 'Enter a valid email.'
    }
    if (!editForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required.'
    }
    if (!editForm.employeeCode.trim()) errors.employeeCode = 'Employee code is required.'
    if (!editForm.jobTitle.trim()) errors.jobTitle = 'Job title is required.'
    if (!editForm.hireDate) errors.hireDate = 'Hire date is required.'
    if (editForm.salary !== '' && Number(editForm.salary) < 0) {
      errors.salary = 'Salary must be 0 or more.'
    }
    return errors
  }

  const validateCreate = () => {
    const errors = {}
    if (!createForm.fullName.trim()) errors.fullName = 'Full name is required.'
    if (!createForm.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = 'Enter a valid email.'
    }
    if (!createForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required.'
    }
    if (!createForm.password.trim() || createForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
    }
    if (!createForm.employeeCode.trim()) errors.employeeCode = 'Employee code is required.'
    if (!createForm.jobTitle.trim()) errors.jobTitle = 'Job title is required.'
    if (!createForm.hireDate) errors.hireDate = 'Hire date is required.'
    if (createForm.salary !== '' && Number(createForm.salary) < 0) {
      errors.salary = 'Salary must be 0 or more.'
    }
    return errors
  }

  const handleSave = async () => {
    if (!modalState.user?.staffId) return
    const errors = validateForm()
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      return
    }
    try {
      await updateStaff({
        staffId: modalState.user.staffId,
        fullName: editForm.fullName,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        role: editForm.role,
        employeeCode: editForm.employeeCode,
        jobTitle: editForm.jobTitle,
        hireDate: `${editForm.hireDate}T00:00:00`,
        salary: editForm.salary ? Number(editForm.salary) : 0,
        isActive: Boolean(editForm.isActive),
      }).unwrap()
      toast.success('User updated successfully.')
      closeModal()
    } catch (error) {
      const message = error?.data?.message ?? 'Could not update the user.'
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!modalState.user?.staffId) return
    try {
      await deleteStaff(modalState.user.staffId).unwrap()
      toast.success('User deleted successfully.')
      closeModal()
    } catch (error) {
      const message = error?.data?.message ?? 'Could not delete the user.'
      toast.error(message)
    }
  }

  const handleCreate = async () => {
    const errors = validateCreate()
    if (Object.keys(errors).length) {
      setCreateErrors(errors)
      return
    }
    try {
      await registerStaff({
        fullName: createForm.fullName,
        email: createForm.email,
        phoneNumber: createForm.phoneNumber,
        password: createForm.password,
        employeeCode: createForm.employeeCode,
        jobTitle: createForm.jobTitle,
        hireDate: `${createForm.hireDate}T00:00:00`,
        salary: createForm.salary ? Number(createForm.salary) : 0,
      }).unwrap()
      toast.success('User created successfully.')
      closeModal()
    } catch (error) {
      const message = error?.data?.message ?? 'Could not create the user.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500">
            {staffRows.length} users total
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
            Add user
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-6 py-6 text-sm text-slate-500">Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Full name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffRows.map((item, index) => (
                  <TableRow key={item.staffId ?? `${item.email}-${index}`}>
                    <TableCell className="text-xs text-slate-500">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-600">
                          {item.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.fullName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{item.email}</TableCell>
                    <TableCell>
                      <Badge className={resolveRoleClass(item.role)}>
                        {item.role ?? 'Staff'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          aria-label="Edit user"
                          onClick={() => openEditModal(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete user"
                          onClick={() => openDeleteModal(item)}
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

      <PopoverModal
        isOpen={modalState.type !== null}
        onClose={closeModal}
        title={
          modalState.type === 'create'
            ? 'Add user'
            : modalState.type === 'edit'
            ? 'Edit user'
            : 'Delete user'
        }
        description={
          modalState.type === 'create'
            ? 'Create a new user account and assign staff details.'
            : modalState.type === 'edit'
            ? 'Update the selected user profile details.'
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
                disabled={registerState.isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {registerState.isLoading ? 'Saving...' : 'Create user'}
              </Button>
            </>
          ) : modalState.type === 'edit' ? (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
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
                {deleteState.isLoading ? 'Deleting...' : 'Delete user'}
              </Button>
            </>
          )
        }
      >
        {modalState.type === 'create' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="create-full-name">Full name</Label>
              <Input
                id="create-full-name"
                value={createForm.fullName}
                onChange={handleCreateChange('fullName')}
                aria-invalid={Boolean(createErrors.fullName)}
              />
              {createErrors.fullName ? (
                <p className="text-xs text-destructive">{createErrors.fullName}</p>
              ) : null}
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
            <div className="space-y-1">
              <Label htmlFor="create-phone">Phone number</Label>
              <Input
                id="create-phone"
                value={createForm.phoneNumber}
                onChange={handleCreateChange('phoneNumber')}
                aria-invalid={Boolean(createErrors.phoneNumber)}
              />
              {createErrors.phoneNumber ? (
                <p className="text-xs text-destructive">{createErrors.phoneNumber}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-password">Temporary password</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={handleCreateChange('password')}
                aria-invalid={Boolean(createErrors.password)}
              />
              {createErrors.password ? (
                <p className="text-xs text-destructive">{createErrors.password}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-employee">Employee code</Label>
              <Input
                id="create-employee"
                value={createForm.employeeCode}
                onChange={handleCreateChange('employeeCode')}
                readOnly
                className="bg-slate-50 text-slate-600"
                aria-invalid={Boolean(createErrors.employeeCode)}
              />
              {createErrors.employeeCode ? (
                <p className="text-xs text-destructive">{createErrors.employeeCode}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-title">Job title</Label>
              <Input
                id="create-title"
                value={createForm.jobTitle}
                onChange={handleCreateChange('jobTitle')}
                aria-invalid={Boolean(createErrors.jobTitle)}
              />
              {createErrors.jobTitle ? (
                <p className="text-xs text-destructive">{createErrors.jobTitle}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-hire">Hire date</Label>
              <Input
                id="create-hire"
                type="date"
                value={createForm.hireDate}
                onChange={handleCreateChange('hireDate')}
                aria-invalid={Boolean(createErrors.hireDate)}
              />
              {createErrors.hireDate ? (
                <p className="text-xs text-destructive">{createErrors.hireDate}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-salary">Salary</Label>
              <Input
                id="create-salary"
                type="number"
                value={createForm.salary}
                onChange={handleCreateChange('salary')}
                min="0"
                aria-invalid={Boolean(createErrors.salary)}
              />
              {createErrors.salary ? (
                <p className="text-xs text-destructive">{createErrors.salary}</p>
              ) : null}
            </div>
            {registerState.isError ? (
              <p className="text-sm text-destructive sm:col-span-2">
                Could not create the user. Check the details and try again.
              </p>
            ) : null}
          </div>
        ) : modalState.type === 'edit' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="edit-full-name">Full name</Label>
              <Input
                id="edit-full-name"
                value={editForm.fullName}
                onChange={handleEditChange('fullName')}
                aria-invalid={Boolean(formErrors.fullName)}
              />
              {formErrors.fullName ? (
                <p className="text-xs text-destructive">{formErrors.fullName}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={handleEditChange('email')}
                aria-invalid={Boolean(formErrors.email)}
              />
              {formErrors.email ? (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-phone">Phone number</Label>
              <Input
                id="edit-phone"
                value={editForm.phoneNumber}
                onChange={handleEditChange('phoneNumber')}
                aria-invalid={Boolean(formErrors.phoneNumber)}
              />
              {formErrors.phoneNumber ? (
                <p className="text-xs text-destructive">{formErrors.phoneNumber}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={editForm.role}
                onChange={handleEditChange('role')}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-employee">Employee code</Label>
              <Input
                id="edit-employee"
                value={editForm.employeeCode}
                onChange={handleEditChange('employeeCode')}
                aria-invalid={Boolean(formErrors.employeeCode)}
              />
              {formErrors.employeeCode ? (
                <p className="text-xs text-destructive">{formErrors.employeeCode}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-title">Job title</Label>
              <Input
                id="edit-title"
                value={editForm.jobTitle}
                onChange={handleEditChange('jobTitle')}
                aria-invalid={Boolean(formErrors.jobTitle)}
              />
              {formErrors.jobTitle ? (
                <p className="text-xs text-destructive">{formErrors.jobTitle}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-hire">Hire date</Label>
              <Input
                id="edit-hire"
                type="date"
                value={editForm.hireDate}
                onChange={handleEditChange('hireDate')}
                aria-invalid={Boolean(formErrors.hireDate)}
              />
              {formErrors.hireDate ? (
                <p className="text-xs text-destructive">{formErrors.hireDate}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-salary">Salary</Label>
              <Input
                id="edit-salary"
                type="number"
                value={editForm.salary}
                onChange={handleEditChange('salary')}
                min="0"
                aria-invalid={Boolean(formErrors.salary)}
              />
              {formErrors.salary ? (
                <p className="text-xs text-destructive">{formErrors.salary}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={editForm.isActive}
                onChange={handleEditChange('isActive')}
                className="h-4 w-4 rounded border border-input"
              />
              <Label htmlFor="edit-active">Active account</Label>
            </div>
            {updateState.isError ? (
              <p className="text-sm text-destructive sm:col-span-2">
                Could not update the user. Check the details and try again.
              </p>
            ) : null}
          </div>
        ) : modalState.user ? (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              {modalState.user.fullName}
            </p>
            <p>{modalState.user.email}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {modalState.user.role ?? 'Staff'}
            </p>
          </div>
        ) : null}
      </PopoverModal>
    </div>
  )
}

export default AdminStaff
