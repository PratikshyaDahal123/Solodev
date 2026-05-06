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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  useCreatePartMutation,
  useGetCategoriesQuery,
  useDeletePartMutation,
  useGetPartsQuery,
  useGetPurchaseInvoicesQuery,
  useUpdatePartMutation,
} from '../../services/backendApi'

const pageSize = 6

const emptyPart = {
  partCode: '',
  partName: '',
  description: '',
  costPrice: '',
  unitPrice: '',
  reorderLevel: '10',
  categoryId: '',
  isActive: true,
}

const AdminParts = () => {
  const { data: parts = [], isLoading } = useGetPartsQuery()
  const { data: purchaseInvoices = [] } = useGetPurchaseInvoicesQuery()
  const { data: categories = [] } = useGetCategoriesQuery()
  const [createPart, createState] = useCreatePartMutation()
  const [updatePart, updateState] = useUpdatePartMutation()
  const [deletePart, deleteState] = useDeletePartMutation()

  const partList = useMemo(() => parts ?? [], [parts])
  const [page, setPage] = useState(1)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

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

  const filteredParts = useMemo(() => {
    if (!showLowStockOnly) return partList
    return partList.filter((part) => Number(part.stockQuantity || 0) <= part.reorderLevel)
  }, [partList, showLowStockOnly])

  const totalPages = Math.max(1, Math.ceil(filteredParts.length / pageSize))

  const pagedParts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredParts.slice(start, start + pageSize)
  }, [page, filteredParts])


  const [modalState, setModalState] = useState({ type: null, part: null })
  const [createForm, setCreateForm] = useState({ ...emptyPart })
  const [editForm, setEditForm] = useState({ ...emptyPart })
  const [createErrors, setCreateErrors] = useState({})
  const [editErrors, setEditErrors] = useState({})

  const closeModal = () => setModalState({ type: null, part: null })

  const openCreateModal = () => {
    setCreateForm({ ...emptyPart })
    setCreateErrors({})
    setModalState({ type: 'create', part: null })
  }

  const openEditModal = (part) => {
    setEditForm({
      partId: part.partId,
      partCode: part.partCode,
      partName: part.partName,
      description: part.description ?? '',
      costPrice: String(part.costPrice ?? 0),
      unitPrice: String(part.unitPrice),
      reorderLevel: String(part.reorderLevel),
      categoryId: part.categoryId ?? '',
      isActive: part.isActive,
    })
    setEditErrors({})
    setModalState({ type: 'edit', part })
  }

  const openDeleteModal = (part) => {
    setModalState({ type: 'delete', part })
  }

  const handleCreateChange = (field) => (e) => {
    const value = field === 'isActive' ? e.target.checked : e.target.value
    setCreateErrors((prev) => ({ ...prev, [field]: undefined }))
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditChange = (field) => (e) => {
    const value = field === 'isActive' ? e.target.checked : e.target.value
    setEditErrors((prev) => ({ ...prev, [field]: undefined }))
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = (form) => {
    const errors = {}
    if (!form.partCode?.trim()) errors.partCode = 'Part code is required.'
    if (!form.partName?.trim()) errors.partName = 'Part name is required.'
    if (!form.costPrice || Number(form.costPrice) <= 0) errors.costPrice = 'Valid cost price required.'
    if (!form.unitPrice || Number(form.unitPrice) <= 0) errors.unitPrice = 'Valid selling price required.'
    return errors
  }

  const handleCreate = async () => {
    const errors = validate(createForm)
    if (Object.keys(errors).length) { setCreateErrors(errors); return }
    try {
      await createPart({
        partCode: createForm.partCode,
        partName: createForm.partName,
        description: createForm.description || null,
        costPrice: Number(createForm.costPrice),
        unitPrice: Number(createForm.unitPrice),
        reorderLevel: Number(createForm.reorderLevel) || 10,
        categoryId: createForm.categoryId ? Number(createForm.categoryId) : null,
        isActive: Boolean(createForm.isActive),
      }).unwrap()
      toast.success('Part created successfully.')
      closeModal()
    } catch {
      toast.error('Could not create part.')
    }
  }

  const handleUpdate = async () => {
    if (!editForm.partId) return
    const errors = validate(editForm)
    if (Object.keys(errors).length) { setEditErrors(errors); return }
    try {
      await updatePart({
        partId: editForm.partId,
        partName: editForm.partName,
        description: editForm.description || null,
        costPrice: Number(editForm.costPrice),
        unitPrice: Number(editForm.unitPrice),
        reorderLevel: Number(editForm.reorderLevel) || 10,
        categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
        isActive: Boolean(editForm.isActive),
      }).unwrap()
      toast.success('Part updated successfully.')
      closeModal()
    } catch {
      toast.error('Could not update part.')
    }
  }

  const handleDelete = async () => {
    if (!modalState.part?.partId) return
    try {
      await deletePart(modalState.part.partId).unwrap()
      toast.success('Part deleted.')
      closeModal()
    } catch {
      toast.error('Could not delete part.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parts Management</h2>
          <p className="text-sm text-slate-500">
            {filteredParts.length} parts {showLowStockOnly ? 'low stock' : 'total'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
            onClick={() => {
              setShowLowStockOnly((prev) => !prev)
              setPage(1)
            }}
          >
            <Filter className="h-4 w-4" />
            {showLowStockOnly ? 'Low stock only' : 'All parts'}
          </Button>
          <Button
            type="button"
            onClick={openCreateModal}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add part
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-6 py-6 text-sm text-slate-500">Loading parts...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">Purchased Qty</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedParts.map((part, index) => (
                    <TableRow key={part.partId}>
                      <TableCell className="text-xs text-slate-500">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{part.partName}</div>
                        <p className="text-xs text-slate-500">{part.partCode}</p>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rs {Number(part.costPrice || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rs {Number(part.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-600">
                        {purchaseQtyByPart.get(part.partId) || 0}
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-600">
                        {Number(part.stockQuantity || 0)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {part.categoryName ?? 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={part.isActive ? 'default' : 'outline'}>
                          {part.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-label="Edit part"
                            onClick={() => openEditModal(part)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete part"
                            onClick={() => openDeleteModal(part)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagedParts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-sm text-slate-400">
                        No parts found. Click "Add part" to get started.
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

      <PopoverModal
        isOpen={modalState.type !== null}
        onClose={closeModal}
        title={
          modalState.type === 'create' ? 'Add part'
            : modalState.type === 'edit' ? 'Edit part'
            : 'Delete part'
        }
        description={
          modalState.type === 'create' ? 'Register a new part in inventory.'
            : modalState.type === 'edit' ? 'Update part details.'
            : 'This action cannot be undone.'
        }
        footer={
          modalState.type === 'create' ? (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="button" onClick={handleCreate} disabled={createState.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {createState.isLoading ? 'Saving...' : 'Create part'}
              </Button>
            </>
          ) : modalState.type === 'edit' ? (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="button" onClick={handleUpdate} disabled={updateState.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {updateState.isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteState.isLoading}>
                {deleteState.isLoading ? 'Deleting...' : 'Delete part'}
              </Button>
            </>
          )
        }
      >
        {(modalState.type === 'create' || modalState.type === 'edit') ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {modalState.type === 'create' && (
              <div className="space-y-1">
                <Label>Part code</Label>
                <Input value={createForm.partCode} onChange={handleCreateChange('partCode')} aria-invalid={Boolean(createErrors.partCode)} />
                {createErrors.partCode && <p className="text-xs text-destructive">{createErrors.partCode}</p>}
              </div>
            )}
            <div className="space-y-1">
              <Label>Part name</Label>
              <Input
                value={modalState.type === 'create' ? createForm.partName : editForm.partName}
                onChange={modalState.type === 'create' ? handleCreateChange('partName') : handleEditChange('partName')}
                aria-invalid={Boolean(modalState.type === 'create' ? createErrors.partName : editErrors.partName)}
              />
              {(modalState.type === 'create' ? createErrors.partName : editErrors.partName) && (
                <p className="text-xs text-destructive">{modalState.type === 'create' ? createErrors.partName : editErrors.partName}</p>
              )}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Description</Label>
              <Input
                value={modalState.type === 'create' ? createForm.description : editForm.description}
                onChange={modalState.type === 'create' ? handleCreateChange('description') : handleEditChange('description')}
              />
            </div>
            <div className="space-y-1">
              <Label>Cost price (Rs)</Label>
              <Input
                type="number"
                value={modalState.type === 'create' ? createForm.costPrice : editForm.costPrice}
                onChange={modalState.type === 'create' ? handleCreateChange('costPrice') : handleEditChange('costPrice')}
                aria-invalid={Boolean(modalState.type === 'create' ? createErrors.costPrice : editErrors.costPrice)}
              />
              {(modalState.type === 'create' ? createErrors.costPrice : editErrors.costPrice) && (
                <p className="text-xs text-destructive">{modalState.type === 'create' ? createErrors.costPrice : editErrors.costPrice}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Selling price (Rs)</Label>
              <Input
                type="number"
                value={modalState.type === 'create' ? createForm.unitPrice : editForm.unitPrice}
                onChange={modalState.type === 'create' ? handleCreateChange('unitPrice') : handleEditChange('unitPrice')}
                aria-invalid={Boolean(modalState.type === 'create' ? createErrors.unitPrice : editErrors.unitPrice)}
              />
              {(modalState.type === 'create' ? createErrors.unitPrice : editErrors.unitPrice) && (
                <p className="text-xs text-destructive">{modalState.type === 'create' ? createErrors.unitPrice : editErrors.unitPrice}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Label>Reorder level</Label>
              <Input
                type="number"
                value={modalState.type === 'create' ? createForm.reorderLevel : editForm.reorderLevel}
                onChange={modalState.type === 'create' ? handleCreateChange('reorderLevel') : handleEditChange('reorderLevel')}
              />
            </div>
            
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                value={modalState.type === 'create' ? createForm.categoryId : editForm.categoryId}
                onChange={modalState.type === 'create' ? handleCreateChange('categoryId') : handleEditChange('categoryId')}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Unassigned</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={modalState.type === 'create' ? createForm.isActive : editForm.isActive}
                onChange={modalState.type === 'create' ? handleCreateChange('isActive') : handleEditChange('isActive')}
                className="h-4 w-4 rounded border border-input"
              />
              Active
            </label>
          </div>
        ) : modalState.part ? (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{modalState.part.partName}</p>
            <p>{modalState.part.partCode}</p>
            <p className="text-xs text-slate-400">Quantity: {Number(modalState.part.stockQuantity || 0)}</p>
            <p className="text-xs text-slate-400">Purchased: {purchaseQtyByPart.get(modalState.part.partId) || 0}</p>
          </div>
        ) : null}
      </PopoverModal>
    </div>
  )
}

export default AdminParts
