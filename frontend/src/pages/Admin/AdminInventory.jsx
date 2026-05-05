import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { toast } from 'react-toastify'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import PopoverModal from '../../components/ui/PopoverModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { useGetPartsQuery, useGetPurchaseInvoicesQuery, useGetCategoriesQuery, useGetVendorsQuery, useCreatePurchaseInvoiceMutation } from '../../services/backendApi'

const VAT_RATE = 0.13

const pageSize = 10

const AdminInventory = () => {
  const { data: parts = [], isLoading } = useGetPartsQuery()
  const { data: purchaseInvoices = [] } = useGetPurchaseInvoicesQuery()
  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: vendors = [] } = useGetVendorsQuery()
  const [createPurchaseInvoice, createPurchaseState] = useCreatePurchaseInvoiceMutation()
  const [page, setPage] = useState(1)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [quickReorderModal, setQuickReorderModal] = useState({ open: false, part: null })
  const [reorderQty, setReorderQty] = useState('1')
  const [reorderVendor, setReorderVendor] = useState('')
  const [reorderNotes, setReorderNotes] = useState('')

  const quickReorderSubtotal = useMemo(() => {
    const part = quickReorderModal.part
    if (!part) return 0
    return (Number(reorderQty) || 0) * Number(part.costPrice || 0)
  }, [quickReorderModal.part, reorderQty])

  const quickReorderVat = useMemo(() => quickReorderSubtotal * VAT_RATE, [quickReorderSubtotal])

  const purchaseQtyByPart = useMemo(() => {
    const map = new Map()
    purchaseInvoices.forEach((inv) => {
      inv.items?.forEach((item) => {
        const current = map.get(item.partId) || 0
        map.set(item.partId, current + Number(item.quantity || 0))
      })
    })
    return map
  }, [purchaseInvoices])

  const filtered = useMemo(() => {
    let list = parts ?? []
    if (showLowStockOnly) list = list.filter((p) => Number(p.stockQuantity || 0) <= (p.reorderLevel ?? 0))
    if (categoryFilter) list = list.filter((p) => String(p.categoryId) === String(categoryFilter))
    if (statusFilter === 'low') list = list.filter((p) => Number(p.stockQuantity || 0) <= (p.reorderLevel ?? 0))
    if (statusFilter === 'ok') list = list.filter((p) => Number(p.stockQuantity || 0) > (p.reorderLevel ?? 0))
    return list
  }, [parts, showLowStockOnly, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [page, filtered])

  const exportCsv = (list) => {
    if (!list || list.length === 0) return
    const headers = ['PartId','PartCode','PartName','StockQuantity','ReorderLevel','Category','Status']
    const rows = list.map((p) => [
      p.partId,
      p.partCode,
      p.partName,
      p.stockQuantity ?? 0,
      p.reorderLevel ?? '',
      p.categoryName ?? '',
      Number(p.stockQuantity || 0) <= (p.reorderLevel ?? 0) ? 'Low' : 'OK',
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openQuickReorder = (part) => {
    setQuickReorderModal({ open: true, part })
    setReorderQty('1')
    setReorderVendor('')
    setReorderNotes('')
  }

  const closeQuickReorder = () => setQuickReorderModal({ open: false, part: null })

  const handleQuickReorder = async () => {
    const part = quickReorderModal.part
    if (!part) return
    if (!reorderVendor) {
      toast.error('Please select a vendor for the purchase.')
      return
    }
    try {
      await createPurchaseInvoice({
        vendorId: Number(reorderVendor),
        staffId: null,
        taxAmount: quickReorderVat,
        notes: reorderNotes || null,
        items: [
          {
            partId: Number(part.partId),
            categoryId: part.categoryId ?? null,
            quantity: Number(reorderQty) || 1,
            unitCost: Number(part.costPrice ?? 0),
          },
        ],
      }).unwrap()
      closeQuickReorder()
      toast.success('Reorder created and stock will update after invoice processed.')
    } catch (e) {
      toast.error('Could not create reorder.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
          <p className="text-sm text-slate-500">Track stock levels, reorder points and recent purchases.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                onClick={() => { setShowLowStockOnly((s) => !s); setPage(1) }}
              >
                <Filter className="h-4 w-4" />
                {showLowStockOnly ? 'Low stock only' : 'All parts'}
              </Button>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="all">All status</option>
                <option value="low">Low</option>
                <option value="ok">OK</option>
              </select>
              <Button type="button" variant="ghost" onClick={() => exportCsv(filtered)} className="text-sm">
                Export CSV
              </Button>
            </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-6 py-6 text-sm text-slate-500">Loading inventory...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Reorder</TableHead>
                    <TableHead className="text-right">Purchased</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((part, idx) => (
                    <TableRow key={part.partId}>
                      <TableCell className="text-xs text-slate-500">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{part.partName}</div>
                        <p className="text-xs text-slate-500">{part.partCode}</p>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-600">{Number(part.stockQuantity || 0)}</TableCell>
                      <TableCell className="text-right text-sm text-slate-600">{part.reorderLevel}</TableCell>
                      <TableCell className="text-right text-sm text-slate-600">{purchaseQtyByPart.get(part.partId) || 0}</TableCell>
                      <TableCell className="text-sm text-slate-500">{part.categoryName ?? 'Unassigned'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={Number(part.stockQuantity || 0) <= (part.reorderLevel ?? 0) ? 'destructive' : 'default'}>
                            {Number(part.stockQuantity || 0) <= (part.reorderLevel ?? 0) ? 'Low' : 'OK'}
                          </Badge>
                          <Button size="sm" type="button" onClick={() => openQuickReorder(part)}>Quick reorder</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-400">No items found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100">
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
      <PopoverModal
        isOpen={quickReorderModal.open}
        onClose={closeQuickReorder}
        title="Quick reorder"
        description={quickReorderModal.part ? `Create a quick purchase for ${quickReorderModal.part.partName}` : ''}
        footer={(
          <>
            <Button type="button" variant="outline" onClick={closeQuickReorder}>Cancel</Button>
            <Button type="button" onClick={handleQuickReorder} disabled={createPurchaseState.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {createPurchaseState.isLoading ? 'Creating...' : 'Create purchase'}
            </Button>
          </>
        )}
      >
        {quickReorderModal.part && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Part</Label>
              <div className="text-sm font-semibold">{quickReorderModal.part.partName}</div>
              <div className="text-xs text-slate-500">{quickReorderModal.part.partCode}</div>
            </div>
            <div className="space-y-1">
              <Label>Quantity</Label>
              <input type="number" min="1" value={reorderQty} onChange={(e) => setReorderQty(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            </div>
            <div className="space-y-1">
              <Label>Vendor (optional)</Label>
              <select value={reorderVendor} onChange={(e) => setReorderVendor(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <input value={reorderNotes} onChange={(e) => setReorderNotes(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-slate-500">VAT (13%): Rs {quickReorderVat.toFixed(2)}</div>
              <div className="text-xs text-slate-500">Total: Rs {(quickReorderSubtotal + quickReorderVat).toFixed(2)}</div>
            </div>
          </div>
        )}
      </PopoverModal>
    </div>
  )
}

export default AdminInventory
