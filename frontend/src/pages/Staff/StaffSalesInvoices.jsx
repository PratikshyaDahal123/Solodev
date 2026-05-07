import { useMemo, useState } from 'react'

import StaffPageHeader from '../../components/staff/StaffPageHeader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
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
import { Trash2 } from 'lucide-react'
import {
  useCreateSalesInvoiceMutation,
  useGetPartsQuery,
  useGetCustomerByIdQuery,
  useSearchCustomersQuery,
  useSendSalesInvoiceEmailMutation,
  useGetSalesInvoicesQuery,
} from '../../services/backendApi'
import { toast } from 'react-toastify'

const emptyItem = { partId: '', quantity: 1, unitPrice: '', discount: '0' }

const PAGE_SIZE = 8

const StaffSalesInvoices = () => {
  const { data: parts = [] } = useGetPartsQuery()
  const [createInvoice, createState] = useCreateSalesInvoiceMutation()
  const [sendInvoiceEmail, sendEmailState] = useSendSalesInvoiceEmailMutation()
  const { data: allSalesInvoices = [], isLoading: loadingInvoices } = useGetSalesInvoicesQuery()

  const [customerId, setCustomerId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [amountPaid, setAmountPaid] = useState('0')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ...emptyItem }])
  const [lastInvoice, setLastInvoice] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const { data: searchResults = [] } = useSearchCustomersQuery(searchTerm, {
    skip: searchTerm.trim().length === 0,
  })
  const { data: selectedCustomer } = useGetCustomerByIdQuery(
    selectedCustomerId,
    { skip: !selectedCustomerId },
  )

  const partLookup = useMemo(
    () => new Map(parts.map((part) => [part.partId, part])),
    [parts],
  )

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const unit = Number(item.unitPrice) || 0
      const discount = Number(item.discount) || 0
      return sum + qty * Math.max(unit - discount, 0)
    }, 0)
  }, [items])
  const paidAmount = Number(amountPaid) || 0
  const creditAmount = Math.max(subtotal - paidAmount, 0)

  // Pagination for sales history
  const totalPages = Math.max(1, Math.ceil(allSalesInvoices.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedInvoices = allSalesInvoices.slice(startIndex, startIndex + PAGE_SIZE)

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
      setLastInvoice(response)
      setCustomerId('')
      setVehicleId('')
      setStaffId('')
      setAmountPaid('0')
      setNotes('')
      setItems([{ ...emptyItem }])
      setInvoiceOpen(false)
    }
    } catch (error) {
      const message = error?.data?.message || error?.error || 'Unable to create invoice.'
      toast.error(message)
    }
  }

  const handleSelectCustomer = (customer) => {
    setCustomerId(String(customer.customerId))
    setSelectedCustomerId(customer.customerId)
  }

  const handleSendEmailFromRow = async (invoice) => {
    if (!invoice?.salesInvoiceId) return
    const email = invoice.customerEmail
    const name = invoice.customerName ?? 'Customer'
    if (!email || !email.includes('@')) {
      toast.error(`No valid email found for ${name}.`)
      return
    }

    try {
      const res = await sendInvoiceEmail({ salesInvoiceId: invoice.salesInvoiceId, email }).unwrap()
      toast.success(`Email sent to ${name}: ${res?.message ?? 'sent'}`)
    } catch (err) {
      const errorMsg = err?.data?.message ?? 'Failed to send email. Check credentials and connection.'
      toast.error(`Email to ${name} failed: ${errorMsg}`) 
    }
  }

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Sales invoices"
        subtitle="Sell parts, generate invoices, and email receipts to customers."
      />

      <Card>
        <CardHeader>
          <CardTitle>Customer lookup</CardTitle>
          <CardDescription>Search and pick a customer before issuing a sales invoice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              className="h-8 text-sm"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Start typing a name, phone, or vehicle number"
            />
          </div>

          {searchTerm.trim().length === 0 ? (
            <p className="text-sm text-slate-500">Enter a search term to load results.</p>
          ) : searchResults.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((customer) => (
                  <TableRow key={customer.customerId}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{customer.fullName}</div>
                      <p className="text-xs text-slate-500">#{customer.customerCode}</p>
                    </TableCell>
                    <TableCell>{customer.phoneNumber}</TableCell>
                    <TableCell>
                      {customer.vehicleRegistrationNumbers?.length
                        ? customer.vehicleRegistrationNumbers.join(', ')
                        : 'No vehicles'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleSelectCustomer(customer)}>
                        Use
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No customers found.</p>
          )}

          {selectedCustomer ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Selected customer</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">{selectedCustomer.fullName}</span>
                <Badge variant="outline">ID {selectedCustomer.customerId}</Badge>
                <Badge variant="outline">{selectedCustomer.phoneNumber}</Badge>
                <Badge variant="outline">Credit Rs {Number(selectedCustomer.creditBalance ?? 0).toLocaleString()}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selectedCustomer.vehicleRegistrationNumbers ?? []).map((vehicle) => (
                  <Badge key={vehicle} variant="outline">{vehicle}</Badge>
                ))}
                {!selectedCustomer.vehicleRegistrationNumbers?.length && (
                  <span className="text-xs text-slate-500">No vehicles listed.</span>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Vehicle IDs are not available in the customer profile; enter the vehicle ID manually if needed.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice generation</CardTitle>
          <CardDescription>Create sales invoices in a popover dialog.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Create and record customer purchases.</p>
          <Button onClick={() => setInvoiceOpen(true)} className="bg-emerald-500 text-white">
            New invoice
          </Button>
        </CardContent>
      </Card>

      {/* Professional Invoice Dialog */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 p-0 sm:rounded-2xl">
          <div className="bg-white px-6 py-8 md:px-12 md:py-10">
            {/* Invoice Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-slate-100 pb-8">
              <div>
                <h2 className="text-3xl font-light tracking-tight text-slate-900">INVOICE</h2>
                <p className="mt-1 text-sm text-slate-500">Create new sales record</p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-sm font-medium text-slate-900">SawariSync Service Center</div>
                <div className="text-sm text-slate-500">Kathmandu, Nepal</div>
                <div className="text-sm text-slate-500">info@sawarisync.com</div>
              </div>
            </div>

            {/* Bill To & Details */}
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bill To</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Customer ID</Label>
                    <Input className="h-9 w-full max-w-[250px] bg-slate-50 border-slate-200 shadow-none focus-visible:ring-emerald-500" value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="e.g. 101" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Vehicle ID (optional)</Label>
                    <Input className="h-9 w-full max-w-[250px] bg-slate-50 border-slate-200 shadow-none focus-visible:ring-emerald-500" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 md:text-right">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Details</h3>
                <div className="space-y-3 flex flex-col md:items-end">
                  <div className="space-y-1.5 text-left md:text-right w-full max-w-[250px]">
                    <Label className="text-xs text-slate-500">Staff ID (optional)</Label>
                    <Input className="h-9 w-full bg-slate-50 border-slate-200 shadow-none focus-visible:ring-emerald-500 md:text-right" value={staffId} onChange={(event) => setStaffId(event.target.value)} />
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
                    <TableHead className="w-32 text-right text-xs font-semibold uppercase text-slate-500">Unit Price</TableHead>
                    <TableHead className="w-28 text-right text-xs font-semibold uppercase text-slate-500">Discount</TableHead>
                    <TableHead className="w-32 text-right text-xs font-semibold uppercase text-slate-500">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const part = partLookup.get(Number(item.partId))
                    const lineTotal =
                      Number(item.quantity || 0) *
                      Math.max(
                        Number(item.unitPrice || 0) - Number(item.discount || 0),
                        0,
                      )

                    return (
                      <TableRow key={`item-${index}`} className="border-slate-100 group">
                        <TableCell className="px-2 py-1 align-top">
                          <select
                            value={item.partId}
                            onChange={handleItemChange(index, 'partId')}
                            className="h-8 w-full max-w-[180px] rounded-md border-0 bg-transparent px-2 text-sm focus:ring-2 focus:ring-emerald-500 hover:bg-slate-50 transition-colors"
                          >
                            <option value="">Select part</option>
                            {parts.map((partItem) => (
                              <option key={partItem.partId} value={partItem.partId}>
                                {partItem.partName}
                              </option>
                            ))}
                          </select>
                          {part ? (
                            <p className="mt-1 px-2 text-xs text-slate-400">
                              {part.partCode}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="px-2 py-1 align-top">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={handleItemChange(index, 'quantity')}
                            className="h-8 w-full max-w-[110px] text-right border-0 bg-transparent shadow-none hover:bg-slate-50 focus-visible:ring-emerald-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 align-top">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={handleItemChange(index, 'unitPrice')}
                            className="h-8 w-full max-w-[140px] text-right border-0 bg-transparent shadow-none hover:bg-slate-50 focus-visible:ring-emerald-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 align-top">
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={handleItemChange(index, 'discount')}
                            className="h-8 w-full max-w-[110px] text-right border-0 bg-transparent shadow-none hover:bg-slate-50 focus-visible:ring-emerald-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 align-top text-right pt-3 text-sm font-medium text-slate-700 whitespace-nowrap">
                          Rs {lineTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-2 py-1 align-top text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 p-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
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
              <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="mt-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full px-4">
                + Add Line Item
              </Button>
            </div>

            {/* Summary & Notes */}
            <div className="mt-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="w-full md:max-w-[400px]">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notes & Terms</Label>
                <Textarea 
                  className="mt-2 min-h-[100px] resize-none border-slate-200 shadow-none focus-visible:ring-emerald-500 bg-slate-50" 
                  placeholder="Optional notes for customer..." 
                  value={notes} 
                  onChange={(event) => setNotes(event.target.value)} 
                />
              </div>

              <div className="w-full md:w-[320px] space-y-3 rounded-xl bg-slate-50 p-5">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>Rs {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 gap-4">
                  <span className="whitespace-nowrap">Amount Paid</span>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">Rs</span>
                    <Input 
                      type="number" 
                      className="h-9 w-32 pl-8 text-right bg-white border-slate-200 shadow-none focus-visible:ring-emerald-500" 
                      value={amountPaid} 
                      onChange={(event) => setAmountPaid(event.target.value)} 
                    />
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between font-semibold text-lg text-slate-900">
                  <span>Balance Due</span>
                  <span>Rs {creditAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            <div className="mt-6">
              {createState.isSuccess && <p className="text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">Invoice created successfully.</p>}
              {createState.isError && <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">Unable to create invoice. Please check the details.</p>}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
              <DialogClose asChild>
                <Button variant="ghost" className="text-slate-500 hover:bg-slate-100 px-6 rounded-full">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={createState.isLoading} className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-none px-8 rounded-full transition-colors">
                {createState.isLoading ? 'Processing...' : 'Issue Invoice'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email card removed: sending is now done from the Sales history rows */}

      <Card>
        <CardHeader>
          <CardTitle>Sales history</CardTitle>
          <CardDescription>View all recent sales invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <p className="text-sm text-slate-500">Loading invoices...</p>
          ) : allSalesInvoices.length > 0 ? (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((inv) => (
                  <TableRow key={inv.salesInvoiceId}>
                    <TableCell className="font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{inv.customerName}</TableCell>
                    <TableCell className="text-right font-medium">
                      Rs {Number(inv.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700">
                      Rs {Number(inv.amountPaid ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-700">
                      Rs {Number(inv.balanceAmount ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'Paid' ? 'default' : 'secondary'} className="font-normal">
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendEmailFromRow(inv)}
                      >
                        Send email
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {allSalesInvoices.length > PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm text-slate-500">
                  {`Showing ${startIndex + 1}-${Math.min(startIndex + PAGE_SIZE, allSalesInvoices.length)} of ${allSalesInvoices.length}`}
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
                  <span className="text-sm text-slate-500">Page {safeCurrentPage} of {totalPages}</span>
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
            </>
          ) : (
            <p className="text-sm text-slate-500">No sales history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffSalesInvoices
