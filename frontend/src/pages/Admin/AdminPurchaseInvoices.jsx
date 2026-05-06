import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Plus, Pencil, Trash2, DownloadCloud } from 'lucide-react'
import { toast } from 'react-toastify'

import PopoverModal from '../../components/ui/PopoverModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '../../components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import {
  useCreatePurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation,
  useGetPartsQuery,
  useGetStaffQuery,
  useGetVendorsQuery,
  useGetPurchaseInvoicesQuery,
  useUpdatePurchaseInvoiceMutation,
} from '../../services/backendApi'

const pageSize = 6
const VAT_RATE = 0.13

const emptyItem = { partId: '', quantity: 1, unitCost: '' }

const AdminPurchaseInvoices = () => {
  const { data: parts = [] } = useGetPartsQuery()
  const { data: vendors = [] } = useGetVendorsQuery()
  const { data: staff = [] } = useGetStaffQuery()
  const { data: invoices = [], isLoading: invoicesLoading } = useGetPurchaseInvoicesQuery()
  const [createInvoice, createState] = useCreatePurchaseInvoiceMutation()
  const [updateInvoice, updateState] = useUpdatePurchaseInvoiceMutation()
  const [deleteInvoice, deleteState] = useDeletePurchaseInvoiceMutation()

  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil((invoices?.length || 0) / pageSize))

  const pagedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize
    return (invoices || []).slice(start, start + pageSize)
  }, [page, invoices])

  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => {
    setIsModalOpen(false)
    createState.reset()
  }

  const [vendorId, setVendorId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ...emptyItem }])

  const [editModal, setEditModal] = useState({ isOpen: false, invoice: null })
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, invoice: null })
  const [editForm, setEditForm] = useState({
    vendorId: '',
    staffId: '',
    notes: '',
    items: [{ ...emptyItem }],
  })

  const partLookup = useMemo(
    () => new Map(parts.map((part) => [part.partId, part])),
    [parts],
  )

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const cost = Number(item.unitCost) || 0
      return sum + qty * cost
    }, 0)
  }, [items])

  const taxAmount = useMemo(() => subtotal * VAT_RATE, [subtotal])

  const editSubtotal = useMemo(() => {
    return editForm.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const cost = Number(item.unitCost) || 0
      return sum + qty * cost
    }, 0)
  }, [editForm.items])

  const editTaxAmount = useMemo(() => editSubtotal * VAT_RATE, [editSubtotal])

  const handleItemChange = (index, field) => (event) => {
    const value = event.target.value

    if (field === 'partId') {
      const selectedPart = partLookup.get(Number(value))
      const qty = selectedPart ? String(Math.max(Number(selectedPart.stockQuantity ?? 0), 1)) : ''
      setItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, partId: value, unitCost: selectedPart ? String(selectedPart.costPrice ?? 0) : '', quantity: qty }
            : item,
        ),
      )
      return
    }

    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    )
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const openEditModal = (invoice) => {
    const mappedItems = (invoice.items || []).map((item) => ({
      partId: String(item.partId),
      quantity: String(item.quantity),
      unitCost: String(item.unitCost),
    }))

    setEditForm({
      vendorId: String(invoice.vendorId),
      staffId: invoice.staffId ? String(invoice.staffId) : '',
      notes: invoice.notes ?? '',
      items: mappedItems.length ? mappedItems : [{ ...emptyItem }],
    })
    setEditModal({ isOpen: true, invoice })
  }

  const closeEditModal = () => {
    setEditModal({ isOpen: false, invoice: null })
    updateState.reset()
  }

  const openDeleteModal = (invoice) => setDeleteModal({ isOpen: true, invoice })
  const closeDeleteModal = () => setDeleteModal({ isOpen: false, invoice: null })

  const handleEditItemChange = (index, field) => (event) => {
    const value = event.target.value

    setEditForm((prev) => {
      const nextItems = prev.items.map((item, i) => {
        if (i !== index) return item
        if (field === 'partId') {
          const selectedPart = partLookup.get(Number(value))
          const qty = selectedPart ? String(Math.max(Number(selectedPart.stockQuantity ?? 0), 1)) : ''
          return {
            ...item,
            partId: value,
            unitCost: selectedPart ? String(selectedPart.costPrice ?? 0) : '',
            quantity: qty,
          }
        }
        return { ...item, [field]: value }
      })
      return { ...prev, items: nextItems }
    })
  }

  const handleEditAddItem = () => {
    setEditForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))
  }

  const handleEditRemoveItem = (index) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    try {
      await createInvoice({
        vendorId: Number(vendorId),
        staffId: staffId ? Number(staffId) : null,
        taxAmount,
        notes: notes || null,
        items: items.map((item) => ({
          partId: Number(item.partId),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      }).unwrap()
      setVendorId('')
      setStaffId('')
      setNotes('')
      setItems([{ ...emptyItem }])
      toast.success('Purchase invoice created successfully.')
      handleCloseModal()
    } catch (err) {
      const msg = err?.data?.message || err?.error || 'Could not create invoice.'
      toast.error(msg)
    }
  }

  const handleUpdate = async () => {
    if (!editModal.invoice?.purchaseInvoiceId) return
    try {
      await updateInvoice({
        purchaseInvoiceId: editModal.invoice.purchaseInvoiceId,
        vendorId: Number(editForm.vendorId),
        staffId: editForm.staffId ? Number(editForm.staffId) : null,
        taxAmount: editTaxAmount,
        notes: editForm.notes || null,
        items: editForm.items.map((item) => ({
          partId: Number(item.partId),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      }).unwrap()
      toast.success('Purchase invoice updated successfully.')
      closeEditModal()
    } catch (err) {
      const msg = err?.data?.message || err?.error || 'Could not update invoice.'
      toast.error(msg)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.invoice?.purchaseInvoiceId) return
    try {
      await deleteInvoice(deleteModal.invoice.purchaseInvoiceId).unwrap()
      toast.success('Purchase invoice deleted successfully.')
      closeDeleteModal()
    } catch (err) {
      const msg = err?.data?.message || err?.error || 'Could not delete invoice.'
      toast.error(msg)
    }
  }

  const handleDownloadInvoice = (inv) => {
    try {
      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.text('Purchase Invoice', 14, 22)

      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Invoice No: ${inv.invoiceNumber}`, 14, 30)
      doc.text(`Date: ${new Date(inv.invoiceDate).toLocaleDateString()}`, 14, 35)
      
      const vendor = vendors.find(v => v.vendorId === inv.vendorId)
      doc.text(`Vendor: ${vendor ? vendor.vendorName : 'Unknown Vendor'}`, 14, 45)

      const tableColumn = ["Part ID", "Quantity", "Unit Cost", "Line Total"]
      const tableRows = []

      if (inv.items && inv.items.length > 0) {
        inv.items.forEach(item => {
          const rowData = [
            item.partId,
            item.quantity,
            `Rs ${item.unitCost.toFixed(2)}`,
            `Rs ${item.lineTotal.toFixed(2)}`
          ]
          tableRows.push(rowData)
        })
      }

      autoTable(doc, {
        startY: 55,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      })

      const finalY = doc.lastAutoTable?.finalY || 55
      doc.text(`Subtotal: Rs ${inv.subtotal.toFixed(2)}`, 14, finalY + 10)
      doc.text(`VAT (13%): Rs ${inv.taxAmount.toFixed(2)}`, 14, finalY + 15)
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`Total Amount: Rs ${inv.totalAmount.toFixed(2)}`, 14, finalY + 25)

      doc.save(`${inv.invoiceNumber}.pdf`)
    } catch (err) {
      console.error(err)
      toast.error('Could not generate invoice PDF.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Purchase invoices</h2>
          <p className="text-sm text-slate-500">
            {invoices.length} total purchase records
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
            onClick={handleOpenModal}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add invoice
          </Button>
        </div>
      </div>

      {/* Professional Purchase Invoice Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 p-0 sm:rounded-2xl">
          <div className="bg-white px-6 py-8 md:px-12 md:py-10">
            {/* Invoice Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-slate-100 pb-8">
              <div>
                <h2 className="text-3xl font-light tracking-tight text-slate-900">PURCHASE ORDER</h2>
                <p className="mt-1 text-sm text-slate-500">Record new vendor purchase</p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-sm font-medium text-slate-900">SawariSync Service Center</div>
                <div className="text-sm text-slate-500">Kathmandu, Nepal</div>
              </div>
            </div>

            {/* Bill To & Details */}
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vendor</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Vendor Name</Label>
                    <select
                      value={vendorId}
                      onChange={(event) => setVendorId(event.target.value)}
                      className="h-9 w-full max-w-[250px] rounded-md bg-slate-50 border-slate-200 px-3 text-sm focus:ring-emerald-500 shadow-none block"
                    >
                      <option value="">Select vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.vendorId} value={vendor.vendorId}>
                          {vendor.vendorName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 md:text-right">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Details</h3>
                <div className="space-y-3 flex flex-col md:items-end">
                  <div className="space-y-1.5 text-left md:text-right w-full max-w-[250px]">
                    <Label className="text-xs text-slate-500">Staff Assigned (optional)</Label>
                    <select
                      value={staffId}
                      onChange={(event) => setStaffId(event.target.value)}
                      className="h-9 w-full rounded-md bg-slate-50 border-slate-200 px-3 text-sm focus:ring-emerald-500 shadow-none block"
                    >
                      <option value="">Unassigned</option>
                      {staff.map((member) => (
                        <option key={member.staffId} value={member.staffId}>
                          {member.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-10">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase text-slate-500">Part Description</TableHead>
                    <TableHead className="w-24 text-right text-xs font-semibold uppercase text-slate-500">Qty</TableHead>
                    <TableHead className="w-32 text-right text-xs font-semibold uppercase text-slate-500">Unit Cost</TableHead>
                    <TableHead className="w-32 text-right text-xs font-semibold uppercase text-slate-500">Line Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const part = partLookup.get(Number(item.partId))
                    const lineTotal = Number(item.quantity || 0) * Number(item.unitCost || 0)

                    return (
                      <TableRow key={`item-${index}`} className="border-slate-100 group">
                        <TableCell className="p-2 align-top">
                          <select
                            value={item.partId}
                            onChange={handleItemChange(index, 'partId')}
                            className="h-9 w-full rounded-md border-0 bg-transparent px-3 text-sm focus:ring-2 focus:ring-emerald-500 hover:bg-slate-50 transition-colors"
                          >
                            <option value="">Select part</option>
                            {parts.map((partItem) => (
                              <option key={partItem.partId} value={partItem.partId}>
                                {partItem.partName}
                              </option>
                            ))}
                          </select>
                          {part ? (
                            <p className="mt-1 px-3 text-xs text-slate-400">
                              {part.partCode}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="p-2 align-top">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={handleItemChange(index, 'quantity')}
                            className="h-9 text-right border-0 bg-transparent shadow-none hover:bg-slate-50 focus-visible:ring-emerald-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell className="p-2 align-top">
                          <Input
                            type="number"
                            value={item.unitCost}
                            onChange={handleItemChange(index, 'unitCost')}
                            className="h-9 text-right border-0 bg-transparent shadow-none hover:bg-slate-50 focus-visible:ring-emerald-500 transition-colors"
                            placeholder={part ? part.costPrice : ''}
                          />
                        </TableCell>
                        <TableCell className="p-2 align-top text-right pt-4 text-sm font-medium text-slate-700">
                          Rs {lineTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="p-2 align-top text-right pt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 p-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                          >
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="mt-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full px-4">
                + Add Line Item
              </Button>
            </div>

            {/* Summary & Notes */}
            <div className="mt-10 flex flex-col md:flex-row md:items-start md:justify-between gap-10">
              <div className="w-full md:max-w-[400px]">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notes & Terms</Label>
                <Textarea 
                  className="mt-2 min-h-[100px] resize-none border-slate-200 shadow-none focus-visible:ring-emerald-500 bg-slate-50" 
                  placeholder="Optional notes for vendor..." 
                  value={notes} 
                  onChange={(event) => setNotes(event.target.value)} 
                />
              </div>

              <div className="w-full md:w-[320px] space-y-4 rounded-xl bg-slate-50 p-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>Rs {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 gap-4">
                  <span className="whitespace-nowrap">VAT (13%)</span>
                  <span className="font-medium">Rs {taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between font-semibold text-lg text-slate-900">
                  <span>Total Amount</span>
                  <span>Rs {(subtotal + taxAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            <div className="mt-6">
              {createState.isError && <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">Unable to create invoice. Please check the details.</p>}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
              <DialogClose asChild>
                <Button variant="ghost" onClick={handleCloseModal} className="text-slate-500 hover:bg-slate-100 px-6 rounded-full">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={createState.isLoading} className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-none px-8 rounded-full transition-colors">
                {createState.isLoading ? 'Processing...' : 'Create Invoice'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PopoverModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        title="Edit Purchase Invoice"
        description="Update vendor, staff, and item costs."
        className="rounded-xl p-5"
        contentStyle={{ width: '96vw', maxWidth: '1200px' }}
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeEditModal}>
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
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <select
                value={editForm.vendorId}
                onChange={(event) => setEditForm((prev) => ({ ...prev, vendorId: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.vendorId} value={vendor.vendorId}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Staff (optional)</Label>
              <select
                value={editForm.staffId}
                onChange={(event) => setEditForm((prev) => ({ ...prev, staffId: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Unassigned</option>
                {staff.map((member) => (
                  <option key={member.staffId} value={member.staffId}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>VAT (13%)</Label>
              <Input
                type="number"
                value={editTaxAmount.toFixed(2)}
                className="h-9 rounded-md"
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={editForm.notes}
              className="min-h-24 rounded-md"
              onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Items</h3>
                <p className="text-sm text-slate-500">Adjust quantities and costs.</p>
              </div>
              <Button type="button" variant="outline" onClick={handleEditAddItem}>
                Add item
              </Button>
            </div>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-64">Part</TableHead>
                    <TableHead className="min-w-28">Quantity</TableHead>
                    <TableHead className="min-w-32">Cost price</TableHead>
                    <TableHead className="min-w-28 text-right">Line total</TableHead>
                    <TableHead className="min-w-24 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editForm.items.map((item, index) => {
                    const lineTotal =
                      Number(item.quantity || 0) * Number(item.unitCost || 0)

                    return (
                      <TableRow key={`edit-item-${index}`}>
                        <TableCell>
                          <select
                            value={item.partId}
                            onChange={handleEditItemChange(index, 'partId')}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Select part</option>
                            {parts.map((partItem) => (
                              <option key={partItem.partId} value={partItem.partId}>
                                {partItem.partName}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            className="h-9 rounded-md"
                            onChange={handleEditItemChange(index, 'quantity')}
                            readOnly={Boolean(item.partId)}
                          />
                          {item.partId ? (
                            <p className="mt-1 text-xs text-slate-500">Using part's stock quantity</p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-slate-700">
                            Rs {Number(item.unitCost || 0).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">Rs {lineTotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditRemoveItem(index)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-6 pt-4 pb-2 px-4 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  <span className="font-medium">Subtotal:</span> Rs {editSubtotal.toFixed(2)}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  <span>VAT (13%):</span> Rs {editTaxAmount.toFixed(2)}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  <span>Total Amount:</span> Rs {(editSubtotal + editTaxAmount).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {updateState.isError ? (
            <p className="text-sm text-destructive">
              Could not update invoice. Check required fields.
            </p>
          ) : null}
        </div>
      </PopoverModal>

      <PopoverModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title="Delete Purchase Invoice"
        description="This action cannot be undone."
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteState.isLoading}
            >
              {deleteState.isLoading ? 'Deleting...' : 'Delete invoice'}
            </Button>
          </>
        }
      >
        {deleteModal.invoice ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{deleteModal.invoice.invoiceNumber}</p>
            <p>{new Date(deleteModal.invoice.invoiceDate).toLocaleDateString()}</p>
            <p className="text-xs text-slate-400 mt-1">Total: Rs {deleteModal.invoice.totalAmount.toFixed(2)}</p>
          </div>
        ) : null}
      </PopoverModal>

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
          <CardDescription>View all past purchase invoices.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesLoading ? (
            <p className="px-6 py-6 text-sm text-slate-500">Loading invoices...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Purchase Qty</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Parts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedInvoices.map((inv, index) => {
                    const vendor = vendors.find(v => v.vendorId === inv.vendorId)
                    const totalQty = inv.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0
                    const partNamesArr = (inv.items || []).map((item) => partLookup.get(item.partId)?.partName ?? `#${item.partId}`)
                    const partDisplay = partNamesArr.slice(0, 3).join(', ')
                    const partMore = partNamesArr.length > 3 ? ` +${partNamesArr.length - 3} more` : ''
                    return (
                      <TableRow key={inv.purchaseInvoiceId}>
                        <TableCell className="text-xs text-slate-500">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900">
                            {inv.invoiceNumber}
                          </div>
                          <p className="text-xs text-slate-500">
                            {vendor ? vendor.vendorName : 'Unknown Vendor'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {new Date(inv.invoiceDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 text-right">
                          {totalQty}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 text-right">
                          Rs {inv.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {partNamesArr.length ? (
                            <div className="text-sm text-slate-500">{partDisplay}{partMore}</div>
                          ) : (
                            <div className="text-sm text-slate-500">No items</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              aria-label="Download"
                              onClick={() => handleDownloadInvoice(inv)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <DownloadCloud className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Edit invoice"
                              onClick={() => openEditModal(inv)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete invoice"
                              onClick={() => openDeleteModal(inv)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-100">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminPurchaseInvoices
