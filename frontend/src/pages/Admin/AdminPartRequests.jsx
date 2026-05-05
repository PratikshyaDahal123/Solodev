import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react'
import { toast } from 'react-toastify'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
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
  useGetCategoriesQuery,
  useGetPartsQuery,
  useGetPurchaseInvoicesQuery,
  useGetStaffQuery,
  useGetVendorsQuery,
} from '../../services/backendApi'

const pageSize = 6
const VAT_RATE = 0.13

const emptyItem = { partId: '', categoryId: '', quantity: 1, unitCost: '' }

const AdminPartRequests = () => {
  const { data: parts = [] } = useGetPartsQuery()
  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: vendors = [] } = useGetVendorsQuery()
  const { data: staff = [] } = useGetStaffQuery()
  const { data: requests = [], isLoading } = useGetPurchaseInvoicesQuery()
  const [createRequest, createState] = useCreatePurchaseInvoiceMutation()

  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil((requests?.length || 0) / pageSize))

  const pagedRequests = useMemo(() => {
    const start = (page - 1) * pageSize
    return (requests || []).slice(start, start + pageSize)
  }, [page, requests])

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

  const handleItemChange = (index, field) => (event) => {
    const value = event.target.value

    if (field === 'partId') {
      const selectedPart = partLookup.get(Number(value))
      const inheritedCategoryId = selectedPart?.categoryId ? String(selectedPart.categoryId) : ''
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, partId: value, categoryId: inheritedCategoryId } : item,
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

  const handleSubmit = async () => {
    await createRequest({
      vendorId: Number(vendorId),
      staffId: staffId ? Number(staffId) : null,
      taxAmount,
      notes: notes || null,
      items: items.map((item) => ({
        partId: Number(item.partId),
        categoryId: item.categoryId ? Number(item.categoryId) : null,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      })),
    })
    setVendorId('')
    setStaffId('')
    setNotes('')
    setItems([{ ...emptyItem }])
    toast.success('Purchase invoice created and stock updated.')
    handleCloseModal()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Purchase invoices</h2>
          <p className="text-sm text-slate-500">{requests.length} invoices total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            type="button"
            onClick={handleOpenModal}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create invoice
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? handleOpenModal() : handleCloseModal())}>
        <DialogContent className="max-w-4xl rounded-none">
          <DialogHeader>
            <DialogTitle>Create Purchase Invoice</DialogTitle>
            <DialogDescription>
              Buy parts from vendors and update inventory immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <select
                  value={vendorId}
                  onChange={(event) => setVendorId(event.target.value)}
                  className="h-9 w-full rounded-none border border-input bg-background px-3 text-sm"
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
                  value={staffId}
                  onChange={(event) => setStaffId(event.target.value)}
                  className="h-9 w-full rounded-none border border-input bg-background px-3 text-sm"
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
                  value={taxAmount.toFixed(2)}
                  className="h-9 rounded-none"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} className="rounded-none" onChange={(event) => setNotes(event.target.value)} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Items</h3>
                  <p className="text-sm text-slate-500">Add purchased parts and costs.</p>
                </div>
                <Button type="button" variant="outline" onClick={handleAddItem}>
                  Add item
                </Button>
              </div>
              <div className="border border-slate-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit cost</TableHead>
                      <TableHead className="text-right">Line total</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const lineTotal =
                        Number(item.quantity || 0) * Number(item.unitCost || 0)

                      return (
                        <TableRow key={`item-${index}`}>
                          <TableCell>
                            <select
                              value={item.partId}
                              onChange={handleItemChange(index, 'partId')}
                              className="h-9 w-full rounded-none border border-input bg-background px-3 text-sm"
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
                            <select
                              value={item.categoryId}
                              onChange={handleItemChange(index, 'categoryId')}
                              className="h-9 w-full rounded-none border border-input bg-background px-3 text-sm"
                            >
                              <option value="">Select category</option>
                              {categories.map((category) => (
                                <option key={category.categoryId} value={category.categoryId}>
                                  {category.categoryName}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={handleItemChange(index, 'quantity')}
                              className="h-9 rounded-none w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitCost}
                              onChange={handleItemChange(index, 'unitCost')}
                              className="h-9 rounded-none w-28"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-700">
                            Rs {lineTotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
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
                    <span className="font-medium">Subtotal:</span> Rs {subtotal.toFixed(2)}
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    <span>VAT (13%):</span> Rs {taxAmount.toFixed(2)}
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    <span>Total Amount:</span> Rs {(subtotal + taxAmount).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {createState.isError ? (
              <p className="text-sm text-destructive">
                Could not create invoice. Check required fields.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createState.isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createState.isLoading ? 'Saving...' : 'Create invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Purchase invoice history</CardTitle>
          <CardDescription>View all vendor purchase invoices.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-6 py-6 text-sm text-slate-500">Loading invoices...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRequests.map((req, index) => {
                    const vendor = vendors.find((v) => v.vendorId === req.vendorId)
                    return (
                      <TableRow key={req.purchaseInvoiceId}>
                        <TableCell className="text-xs text-slate-500">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900">
                            {req.invoiceNumber}
                          </div>
                          <p className="text-xs text-slate-500">
                            {vendor ? vendor.vendorName : 'Unknown Vendor'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {new Date(req.invoiceDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 text-right">
                          Rs {req.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-normal text-xs">
                            {req.items?.length || 0} items
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {pagedRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-400">
                        No purchase invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next <ChevronRight className="h-4 w-4" />
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

export default AdminPartRequests
