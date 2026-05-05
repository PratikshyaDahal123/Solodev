import { useEffect, useState } from 'react'
import { PencilLine, Search, Trash2, X } from 'lucide-react'

import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  useDeleteCustomerMutation,
  useSearchCustomersQuery,
  useUpdateCustomerProfileMutation,
} from '../../services/backendApi'

const PAGE_SIZE = 8
const EMPTY_FORM = {
  fullName: '',
  email: '',
  phoneNumber: '',
  address: '',
}

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [updateCustomerProfile] = useUpdateCustomerProfileMutation()
  const [deleteCustomer] = useDeleteCustomerMutation()

  const { data: customers = [] } = useSearchCustomersQuery(searchTerm)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedCustomers = customers.slice(startIndex, startIndex + PAGE_SIZE)

  const openEditModal = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      fullName: customer.fullName ?? '',
      email: customer.email ?? '',
      phoneNumber: customer.phoneNumber ?? '',
      address: customer.address ?? '',
    })
    setErrorMessage('')
  }

  const closeEditModal = () => {
    setEditingCustomer(null)
    setFormData(EMPTY_FORM)
    setErrorMessage('')
  }

  const handleSaveCustomer = async (event) => {
    event.preventDefault()
    if (!editingCustomer) return

    setIsSaving(true)
    setErrorMessage('')

    try {
      await updateCustomerProfile({
        customerId: editingCustomer.customerId,
        ...formData,
      }).unwrap()
      closeEditModal()
    } catch (error) {
      setErrorMessage(error?.data?.message || 'Failed to update customer.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCustomer = async (customer) => {
    const confirmed = window.confirm(
      `Delete ${customer.fullName}? This will deactivate the account but keep invoices and history.`
    )

    if (!confirmed) return

    setErrorMessage('')

    try {
      await deleteCustomer(customer.customerId).unwrap()
      if (editingCustomer?.customerId === customer.customerId) {
        closeEditModal()
      }
    } catch (error) {
      setErrorMessage(error?.data?.message || 'Failed to delete customer.')
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Customers"
        subtitle="Track customer profiles and outstanding credit."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, phone, ID or vehicle…"
          className="pl-9"
        />
      </div>

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
              <TableHead className="text-slate-500 font-medium uppercase text-xs tracking-wide text-right">Actions</TableHead>
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
                      <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
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
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        onClick={() => openEditModal(c)}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleDeleteCustomer(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Edit customer</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{editingCustomer.fullName}</h2>
                <p className="text-sm text-slate-500">Update the profile details for this customer account.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeEditModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveCustomer}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full name</label>
                  <Input
                    value={formData.fullName}
                    onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="Customer name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone number</label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(event) => setFormData((current) => ({ ...current, phoneNumber: event.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Email address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))}
                    placeholder="Address"
                  />
                </div>
              </div>

              {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeEditModal} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800">
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCustomers
