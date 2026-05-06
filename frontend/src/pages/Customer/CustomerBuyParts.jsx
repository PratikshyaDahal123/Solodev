import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { useGetCategoriesQuery, useGetPartsQuery, useCreateSalesInvoiceMutation } from '../../services/backendApi'
import { toast } from 'react-toastify'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CustomerBuyParts = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId

  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: parts = [] } = useGetPartsQuery()
  const [createInvoice, createState] = useCreateSalesInvoiceMutation()

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPart, setSelectedPart] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [amountPaid, setAmountPaid] = useState('0')

  const filteredParts = useMemo(() => {
    if (!selectedCategory) return parts
    return parts.filter((p) => p.categoryId === Number(selectedCategory))
  }, [parts, selectedCategory])

  const partLookup = useMemo(() => new Map(parts.map((p) => [p.partId, p])), [parts])

  const totals = useMemo(() => {
    const part = partLookup.get(Number(selectedPart))
    if (!part) return { subtotal: 0, discount: 0, total: 0, credit: 0 }
    const subtotal = Number(part.unitPrice) * Number(quantity || 0)
    const discountRate = subtotal > 5000 ? 0.1 : 0
    const discount = Number((subtotal * discountRate).toFixed(2))
    const total = Number((subtotal - discount).toFixed(2))
    const paid = Number(amountPaid || 0)
    const credit = Math.max(total - paid, 0)
    return { subtotal, discount, total, credit }
  }, [amountPaid, partLookup, quantity, selectedPart])

  const handleBuyNow = async () => {
    if (!customerId) return toast.error('Customer not found')
    if (!selectedPart) return toast.error('Select a product')
    if (!quantity || Number(quantity) <= 0) return toast.error('Enter a valid quantity')

    const part = partLookup.get(Number(selectedPart))
    if (!part) return toast.error('Selected product not found')

    try {
      const discountRate = totals.subtotal > 5000 ? 0.1 : 0
      const discountAmount = totals.discount
      const notes = discountRate > 0 ? 'Online purchase (bulk discount applied)' : 'Online purchase'
      await createInvoice({
        customerId: Number(customerId),
        vehicleId: null,
        staffId: null,
        amountPaid: Number(amountPaid || 0),
        notes,
        items: [{ partId: part.partId, quantity: Number(quantity), unitPrice: part.unitPrice, discount: discountAmount }],
      }).unwrap()
      toast.success('Purchase successful')
      setSelectedPart('')
      setQuantity(1)
      setAmountPaid('0')
    } catch (err) {
      const msg = err?.data?.message || err?.error || 'Purchase failed'
      toast.error(msg)
    }
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Buy Parts</CardTitle>
          <CardDescription>Select a category and product to buy now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Category</Label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full h-9 rounded border px-2">
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Product</Label>
              <select value={selectedPart} onChange={(e) => setSelectedPart(e.target.value)} className="w-full h-9 rounded border px-2">
                <option value="">Select product</option>
                {filteredParts.map((p) => (
                  <option key={p.partId} value={p.partId}>{p.partName} — Rs {p.unitPrice}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div>
              <Label>Amount paid</Label>
              <Input type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleBuyNow} disabled={createState.isLoading || !selectedPart || !quantity}>{createState.isLoading ? 'Processing...' : 'Buy now'}</Button>
          </div>
          {selectedPart && (
            <div className="mt-3 text-sm text-slate-600">
              {(() => {
                const part = partLookup.get(Number(selectedPart))
                if (!part) return null
                const subtotal = totals.subtotal
                const discountRate = subtotal > 5000 ? 0.1 : 0
                const totalDiscount = totals.discount
                const totalAfter = totals.total
                return (
                  <div>
                    <div>Subtotal: Rs {subtotal.toFixed(2)}</div>
                    {discountRate > 0 ? (
                      <div className="text-emerald-600">Bulk discount {Math.round(discountRate * 100)}% applied — You save Rs {totalDiscount.toFixed(2)} (Total: Rs {totalAfter.toFixed(2)})</div>
                    ) : (
                      <div className="text-slate-500">Spend over Rs 5000 to get 10% bulk discount.</div>
                    )}
                    <div className="mt-1">Paid: Rs {Number(amountPaid || 0).toFixed(2)}</div>
                    <div className="font-medium text-slate-700">Credit: Rs {totals.credit.toFixed(2)}</div>
                  </div>
                )
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerBuyParts
