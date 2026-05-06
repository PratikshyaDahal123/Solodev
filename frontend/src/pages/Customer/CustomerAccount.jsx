import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import CustomerProfile from './CustomerProfile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import PopoverModal from '../../components/ui/PopoverModal'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { useGetSalesInvoicesQuery, useGetPartsQuery, useCreateSalesInvoiceMutation } from '../../services/backendApi'
import { toast } from 'react-toastify'

const emptyItem = { partId: '', quantity: 1, unitPrice: '' }

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CustomerAccount = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId

  const { data: allSalesInvoices = [] } = useGetSalesInvoicesQuery()
  const { data: parts = [] } = useGetPartsQuery()
  const [createInvoice, createState] = useCreateSalesInvoiceMutation()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ...emptyItem }])

  const partLookup = useMemo(
    () => new Map(parts.map((part) => [part.partId, part])),
    [parts],
  )

  // Filter invoices for this customer
  const customerInvoices = allSalesInvoices.filter(
    (inv) => inv.customerId === customerId,
  )

  const handleDownloadInvoice = (invoice) => {
    const content = `
INVOICE DETAILS
===============
Invoice Number: ${invoice.invoiceNumber}
Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}
Customer: ${invoice.customerName}
Status: ${invoice.status}

ITEMS
-----
${invoice.items
  ?.map(
    (item) =>
      `Part: ${item.partName} | Qty: ${item.quantity} | Unit Price: Rs ${item.unitPrice} | Discount: Rs ${item.discount || 0}`,
  )
  .join('\n')}

TOTALS
------
Total Amount: Rs ${Number(invoice.totalAmount).toFixed(2)}
Amount Paid: Rs ${Number(invoice.amountPaid || 0).toFixed(2)}
Outstanding: Rs ${(Number(invoice.totalAmount) - Number(invoice.amountPaid || 0)).toFixed(2)}

Notes: ${invoice.notes || 'N/A'}
    `.trim()

    const element = document.createElement('a')
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`)
    element.setAttribute('download', `invoice-${invoice.invoiceNumber}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

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

  const handleCreateInvoice = async () => {
    if (!customerId) {
      toast.error('Customer ID not found.')
      return
    }

    if (!items.some((item) => item.partId)) {
      toast.error('Please add at least one item.')
      return
    }

    try {
      await createInvoice({
        customerId: Number(customerId),
        vehicleId: null,
        staffId: null,
        amountPaid: 0,
        notes: notes || null,
        items: items
          .filter((item) => item.partId)
          .map((item) => ({
            partId: Number(item.partId),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount: 0,
          })),
      }).unwrap()
      toast.success('Invoice request submitted.')
      setIsCreateModalOpen(false)
      setNotes('')
      setItems([{ ...emptyItem }])
    } catch (err) {
      const msg = err?.data?.message || err?.error || 'Failed to create invoice.'
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CustomerProfile />
        </div>
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Invoices Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>My invoices</CardTitle>
                  <CardDescription>View and download invoices.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/customer/history">View history</Link>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Request invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {customerInvoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerInvoices.map((inv) => (
                        <TableRow key={inv.salesInvoiceId}>
                          <TableCell className="font-semibold text-slate-900">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(inv.invoiceDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Rs {Number(inv.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={inv.status === 'Paid' ? 'default' : 'secondary'}
                              className="font-normal"
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadInvoice(inv)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-slate-500">No invoices yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <PopoverModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Request invoice"
        description="Request parts or services from our staff."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Items</Label>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {items.map((item, index) => (
                <div key={`item-${index}`} className="flex gap-2">
                  <select
                    value={item.partId}
                    onChange={handleItemChange(index, 'partId')}
                    className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select part</option>
                    {parts.map((partItem) => (
                      <option key={partItem.partId} value={partItem.partId}>
                        {partItem.partName}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={handleItemChange(index, 'quantity')}
                    className="w-20"
                    placeholder="Qty"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              className="w-full"
            >
              Add item
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any special requests or notes..."
              className="min-h-20"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateInvoice}
            disabled={createState.isLoading}
          >
            {createState.isLoading ? 'Submitting...' : 'Submit request'}
          </Button>
        </div>
      </PopoverModal>
    </div>
  )
}

export default CustomerAccount
