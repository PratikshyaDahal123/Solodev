import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Plus, Pencil, Trash2, DownloadCloud } from 'lucide-react'
import { toast } from 'react-toastify'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
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
  useCreateSalesInvoiceMutation,
  useAddCustomerVehicleMutation,
  useGetPartsQuery,
  useGetCustomerByIdQuery,
  useSearchCustomersQuery,
  useGetSalesInvoicesQuery,
  useGetStaffQuery,
} from '../../services/backendApi'

const pageSize = 6

const emptyItem = { partId: '', quantity: 1, unitPrice: '', discount: '0' }

const AdminSalesInvoices = () => {
  const { data: parts = [] } = useGetPartsQuery()
  const { data: invoices = [], isLoading: invoicesLoading } = useGetSalesInvoicesQuery()
  const { data: staffList = [] } = useGetStaffQuery()
  const [createInvoice, createState] = useCreateSalesInvoiceMutation()
  const [addVehicle, addVehicleState] = useAddCustomerVehicleMutation()

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

  const [customerId, setCustomerId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [amountPaid, setAmountPaid] = useState('0')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ...emptyItem }])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    fuelType: '',
  })

  const { data: searchResults = [] } = useSearchCustomersQuery(searchTerm, {
    skip: !isModalOpen,
  })
  const { data: selectedCustomer } = useGetCustomerByIdQuery(
    selectedCustomerId,
    { skip: !selectedCustomerId },
  )
  const customerVehicles = selectedCustomer?.vehicles ?? []

  const partLookup = useMemo(
    () => new Map(parts.map((part) => [part.partId, part])),
    [parts],
  )

  const calculatedSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const unit = Number(item.unitPrice) || 0
      return sum + qty * unit
    }, 0)
  }, [items])

  const calculatedDiscount = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (Number(item.discount) || 0)
    }, 0)
  }, [items])

  const calculatedTotal = Math.max(calculatedSubtotal - calculatedDiscount, 0)
  const paidAmount = Number(amountPaid) || 0
  const calculatedCredit = Math.max(calculatedTotal - paidAmount, 0)

  const handleItemChange = (index, field) => (event) => {
    const value = event.target.value
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const next = { ...item, [field]: value }
        if (field === 'partId') {
          const part = partLookup.get(Number(value))
          if (part && !next.unitPrice) {
            next.unitPrice = String(part.unitPrice)
          }
        }
        return next
      }),
    )
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error('Select a customer before creating the invoice.')
      return
    }

    const invalidLine = items.find((item) => {
      const partId = Number(item.partId)
      const part = partLookup.get(partId)
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPrice)
      return !partId || !part || quantity <= 0 || unitPrice <= 0 || quantity > Number(part.stockQuantity ?? 0)
    })

    if (invalidLine) {
      toast.error('Check item quantity, stock, and price before creating the invoice.')
      return
    }

    try {
      const response = await createInvoice({
        customerId: Number(customerId),
        vehicleId: vehicleId ? Number(vehicleId) : null,
        staffId: staffId ? Number(staffId) : null,
        amountPaid: Number(amountPaid),
        notes: notes || null,
        items: items.map((item) => ({
          partId: Number(item.partId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount || 0),
        })),
      }).unwrap()

      if (response) {
      setCustomerId('')
      setVehicleId('')
      setStaffId('')
      setAmountPaid('0')
      setNotes('')
      setItems([{ ...emptyItem }])
      setShowAddVehicle(false)
      toast.success('Sales invoice created successfully.')
      handleCloseModal()
    }
    } catch (error) {
      const message = error?.data?.message || error?.error || 'Unable to create invoice.'
      toast.error(message)
    }
  }

  const handleDownloadInvoice = (inv) => {
    try {
      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.text('Sales Invoice', 14, 22)

      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Invoice No: ${inv.invoiceNumber}`, 14, 30)
      doc.text(`Date: ${new Date(inv.invoiceDate).toLocaleDateString()}`, 14, 35)
      doc.text(`Status: ${inv.status}`, 14, 40)
      doc.text(`Customer ID: ${inv.customerId}`, 14, 50)

      const tableColumn = ["Part ID", "Quantity", "Unit Price", "Discount", "Line Total"]
      const tableRows = []

      if (inv.items && inv.items.length > 0) {
        inv.items.forEach(item => {
          const rowData = [
            item.partId,
            item.quantity,
            `Rs ${item.unitPrice.toFixed(2)}`,
            `Rs ${item.discount.toFixed(2)}`,
            `Rs ${item.lineTotal.toFixed(2)}`
          ]
          tableRows.push(rowData)
        })
      }

      autoTable(doc, {
        startY: 60,
        head: [tableColumn],
        body: tableRows,
      })

      const finalY = doc.lastAutoTable?.finalY || 60
      doc.text(`Subtotal: Rs ${inv.subtotal.toFixed(2)}`, 14, finalY + 10)
      doc.text(`Discount: Rs ${inv.discountAmount.toFixed(2)}`, 14, finalY + 15)
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`Total Amount: Rs ${inv.totalAmount.toFixed(2)}`, 14, finalY + 25)
      doc.text(`Amount Paid: Rs ${inv.amountPaid.toFixed(2)}`, 14, finalY + 32)
      doc.text(`Balance: Rs ${inv.balanceAmount.toFixed(2)}`, 14, finalY + 39)

      doc.save(`${inv.invoiceNumber}.pdf`)
    } catch (err) {
      console.error(err)
      toast.error('Could not generate invoice PDF.')
    }
  }

  const handleSelectCustomer = (customer) => {
    setCustomerId(String(customer.customerId))
    setSelectedCustomerId(customer.customerId)
    setVehicleId('')
    setShowAddVehicle(false)
  }

  useEffect(() => {
    if (!customerId) {
      setSelectedCustomerId(null)
      return
    }

    const parsedId = Number(customerId)
    if (!Number.isNaN(parsedId) && parsedId !== selectedCustomerId) {
      setSelectedCustomerId(parsedId)
    }
  }, [customerId, selectedCustomerId])

  const handleVehicleFormChange = (field) => (event) => {
    const { value } = event.target
    setVehicleForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddVehicle = async () => {
    if (!selectedCustomerId) return

    try {
      await addVehicle({
        customerId: selectedCustomerId,
        registrationNumber: vehicleForm.registrationNumber,
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        year: Number(vehicleForm.year),
        color: vehicleForm.color || null,
        fuelType: vehicleForm.fuelType || null,
      }).unwrap()
      toast.success('Vehicle added.')
      setVehicleForm({
        registrationNumber: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        fuelType: '',
      })
      setShowAddVehicle(false)
    } catch (error) {
      const message = error?.data?.message || 'Unable to add vehicle.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sales invoices</h2>
          <p className="text-sm text-slate-500">
            {invoices.length} total sales records
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

      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? handleOpenModal() : handleCloseModal())}>
        <DialogContent className="max-w-xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Create Sales Invoice</DialogTitle>
            <DialogDescription>
              Record customer purchases and payment details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border border-slate-200 bg-slate-50 p-3 space-y-3 rounded-lg">
              <h4 className="font-medium text-slate-900">Customer Lookup</h4>
              <div className="space-y-2">
                <Input
                  className="h-8 text-sm"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Start typing a name, phone, or vehicle number"
                />
                <select
                  className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={customerId}
                  onChange={(event) => {
                    setCustomerId(event.target.value)
                    setSelectedCustomerId(event.target.value ? Number(event.target.value) : null)
                  }}
                >
                  <option value="">
                    {searchResults.length ? 'Select customer' : 'No customers found'}
                  </option>
                  {searchResults.map((customer) => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.fullName} (#{customer.customerId})
                    </option>
                  ))}
                </select>
              </div>
              {selectedCustomer && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-700">Selected: {selectedCustomer.fullName}</span>
                  <Badge variant="outline">ID: {selectedCustomer.customerId}</Badge>
                  <Badge variant="outline">Credit: Rs {Number(selectedCustomer.creditBalance ?? 0).toLocaleString()}</Badge>
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Vehicle (optional)</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={vehicleId}
                  onChange={(event) => setVehicleId(event.target.value)}
                  disabled={!selectedCustomerId || !customerVehicles.length}
                >
                  <option value="">
                    {!selectedCustomerId
                      ? 'Select a customer first'
                      : customerVehicles.length
                        ? 'Select a vehicle'
                        : 'No vehicles for customer'}
                  </option>
                  {customerVehicles.map((vehicle) => (
                    <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                      {vehicle.brand} {vehicle.model}
                    </option>
                  ))}
                </select>
                {selectedCustomerId && (
                  <button
                    type="button"
                    className="text-xs font-medium text-cyan-600 hover:text-cyan-700"
                    onClick={() => setShowAddVehicle((prev) => !prev)}
                  >
                    {showAddVehicle ? 'Hide add vehicle' : 'Add vehicle'}
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Staff (optional)</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={staffId}
                  onChange={(event) => setStaffId(event.target.value)}
                >
                  <option value="">Select staff</option>
                  {staffList.map((staff) => (
                    <option key={staff.staffId} value={staff.staffId}>
                      {staff.fullName} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount paid</Label>
                <Input
                  type="number"
                  className="h-8 text-sm"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                />
              </div>
            </div>

            {showAddVehicle && (
              <div className="border border-slate-200 bg-slate-50 p-4 space-y-4">
                <h4 className="font-medium text-slate-900">Add vehicle</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Registration number</Label>
                    <Input
                      value={vehicleForm.registrationNumber}
                      onChange={handleVehicleFormChange('registrationNumber')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input value={vehicleForm.brand} onChange={handleVehicleFormChange('brand')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input value={vehicleForm.model} onChange={handleVehicleFormChange('model')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={vehicleForm.year}
                      onChange={handleVehicleFormChange('year')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color (optional)</Label>
                    <Input value={vehicleForm.color} onChange={handleVehicleFormChange('color')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fuel type (optional)</Label>
                    <Input value={vehicleForm.fuelType} onChange={handleVehicleFormChange('fuelType')} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddVehicle}
                    disabled={addVehicleState.isLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {addVehicleState.isLoading ? 'Saving...' : 'Save vehicle'}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea className="h-12 min-h-[48px] resize-none text-sm p-2" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Items</h3>
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={handleAddItem}>
                  Add item
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-xs font-semibold uppercase text-slate-500">Part</TableHead>
                    <TableHead className="h-8 w-28 px-2 text-right text-xs font-semibold uppercase text-slate-500">Qty</TableHead>
                    <TableHead className="h-8 w-36 px-2 text-right text-xs font-semibold uppercase text-slate-500">Price</TableHead>
                    <TableHead className="h-8 w-28 px-2 text-right text-xs font-semibold uppercase text-slate-500">Discount</TableHead>
                    <TableHead className="h-8 w-28 px-2 text-right text-xs font-semibold uppercase text-slate-500">Total</TableHead>
                    <TableHead className="h-8 w-12 px-2 text-right text-xs font-semibold uppercase text-slate-500">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const part = partLookup.get(Number(item.partId))
                    const gross = Number(item.quantity || 0) * Number(item.unitPrice || 0)
                    const lineTotal = Math.max(gross - Number(item.discount || 0), 0)

                    return (
                      <TableRow key={`item-${index}`}>
                        <TableCell className="px-2 py-1 align-top">
                          <select
                            value={item.partId}
                            onChange={handleItemChange(index, 'partId')}
                            className="h-8 w-full max-w-[180px] rounded-md border border-input bg-background px-2 text-sm font-medium"
                          >
                            <option value="">Select part</option>
                            {parts.map((partItem) => (
                              <option key={partItem.partId} value={partItem.partId}>
                                {partItem.partName}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="px-2 py-1 align-top">
                          <Input
                            type="number"
                            className="h-8 w-full max-w-[110px] px-2 text-sm text-center"
                            value={item.quantity}
                            onChange={handleItemChange(index, 'quantity')}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 align-top">
                          <Input
                            type="number"
                            className="h-8 w-full max-w-[140px] px-2 text-sm text-right"
                            value={item.unitPrice}
                            onChange={handleItemChange(index, 'unitPrice')}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 align-top">
                          <Input
                            type="number"
                            className="h-8 w-full max-w-[110px] px-2 text-sm text-right"
                            value={item.discount}
                            onChange={handleItemChange(index, 'discount')}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 text-right text-sm font-medium text-slate-700 whitespace-nowrap">Rs {lineTotal.toFixed(2)}</TableCell>
                        <TableCell className="px-2 py-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(index)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex flex-wrap justify-end gap-4 border-t border-slate-200 pt-4 px-2">
                <div className="text-sm text-slate-500">
                  <span className="font-medium">Subtotal:</span> Rs {calculatedSubtotal.toFixed(2)}
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-medium">Total Discount:</span> Rs {calculatedDiscount.toFixed(2)}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  <span>Final Total:</span> Rs {calculatedTotal.toFixed(2)}
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-medium">Paid:</span> Rs {paidAmount.toFixed(2)}
                </div>
                <div className="text-sm font-semibold text-amber-700">
                  <span>Credit:</span> Rs {calculatedCredit.toFixed(2)}
                </div>
              </div>
            </div>

            {createState.isError ? (
              <p className="text-sm text-destructive">Unable to create invoice. Check required fields.</p>
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
          <CardTitle>Sales history</CardTitle>
          <CardDescription>View all past sales invoices.</CardDescription>
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedInvoices.map((inv, index) => {
                    const partNamesArr = (inv.items || []).map((item) => parts.find(p => p.partId === item.partId)?.partName ?? `#${item.partId}`)
                    const partDisplay = partNamesArr.slice(0,3).join(', ')
                    const partMore = partNamesArr.length > 3 ? ` +${partNamesArr.length - 3} more` : ''
                    return (
                      <TableRow key={inv.salesInvoiceId}>
                        <TableCell className="text-xs text-slate-500">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900">
                            {inv.invoiceNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(inv.invoiceDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          Customer #{inv.customerId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 text-right">
                          Rs {inv.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-slate-700">
                          Rs {Number(inv.amountPaid ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-amber-700">
                          Rs {Number(inv.balanceAmount ?? 0).toFixed(2)}
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
                              onClick={() => toast.info('Editing invoices is not supported.')}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete invoice"
                              onClick={() => toast.info('Deleting invoices is not supported.')}
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

export default AdminSalesInvoices
