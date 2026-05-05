import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import PopoverModal from '../../components/ui/PopoverModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../services/backendApi'

const pageSize = 6

const AdminCategories = () => {
  const { data: categories = [], isLoading } = useGetCategoriesQuery()
  const [createCategory, createState] = useCreateCategoryMutation()
  const [updateCategory, updateState] = useUpdateCategoryMutation()
  const [deleteCategory, deleteState] = useDeleteCategoryMutation()

  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil((categories?.length || 0) / pageSize))

  const pagedCategories = useMemo(() => {
    const start = (page - 1) * pageSize
    return (categories || []).slice(start, start + pageSize)
  }, [page, categories])

  const [modalState, setModalState] = useState({ type: null, category: null })
  const [createForm, setCreateForm] = useState({ categoryName: '', description: '', isActive: true })
  const [editForm, setEditForm] = useState({ categoryId: null, categoryName: '', description: '', isActive: true })
  const [createErrors, setCreateErrors] = useState({})
  const [editErrors, setEditErrors] = useState({})

  const closeModal = () => setModalState({ type: null, category: null })

  const openCreateModal = () => {
    setCreateForm({ categoryName: '', description: '', isActive: true })
    setCreateErrors({})
    setModalState({ type: 'create', category: null })
  }

  const openEditModal = (category) => {
    setEditForm({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      description: category.description ?? '',
      isActive: category.isActive,
    })
    setEditErrors({})
    setModalState({ type: 'edit', category })
  }

  const openDeleteModal = (category) => setModalState({ type: 'delete', category })

  const handleCreateChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value
    setCreateErrors((prev) => ({ ...prev, [field]: undefined }))
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value
    setEditErrors((prev) => ({ ...prev, [field]: undefined }))
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = (form) => {
    const errors = {}
    if (!form.categoryName?.trim()) errors.categoryName = 'Category name is required.'
    return errors
  }

  const handleCreate = async () => {
    const errors = validate(createForm)
    if (Object.keys(errors).length) { setCreateErrors(errors); return }
    try {
      await createCategory({
        categoryName: createForm.categoryName,
        description: createForm.description || null,
        isActive: Boolean(createForm.isActive),
      }).unwrap()
      toast.success('Category created successfully.')
      closeModal()
    } catch {
      toast.error('Could not create category.')
    }
  }

  const handleUpdate = async () => {
    if (!editForm.categoryId) return
    const errors = validate(editForm)
    if (Object.keys(errors).length) { setEditErrors(errors); return }
    try {
      await updateCategory({
        categoryId: editForm.categoryId,
        categoryName: editForm.categoryName,
        description: editForm.description || null,
        isActive: Boolean(editForm.isActive),
      }).unwrap()
      toast.success('Category updated successfully.')
      closeModal()
    } catch {
      toast.error('Could not update category.')
    }
  }

  const handleDelete = async () => {
    if (!modalState.category?.categoryId) return
    try {
      await deleteCategory(modalState.category.categoryId).unwrap()
      toast.success('Category deleted.')
      closeModal()
    } catch {
      toast.error('Could not delete category.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Categories</h2>
          <p className="text-sm text-slate-500">{categories.length} categories total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button type="button" onClick={openCreateModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-6 py-6 text-sm text-slate-500">Loading categories...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedCategories.map((cat, index) => (
                    <TableRow key={cat.categoryId}>
                      <TableCell className="text-xs text-slate-500">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{cat.categoryName}</div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {cat.description ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.isActive ? 'default' : 'outline'}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-label="Edit category"
                            onClick={() => openEditModal(cat)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete category"
                            onClick={() => openDeleteModal(cat)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagedCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-400">
                        No categories found. Click "Add category" to get started.
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
          modalState.type === 'create' ? 'Add category'
            : modalState.type === 'edit' ? 'Edit category'
            : 'Delete category'
        }
        description={
          modalState.type === 'create' ? 'Create a new parts category.'
            : modalState.type === 'edit' ? 'Update category details.'
            : 'This action cannot be undone.'
        }
        footer={
          modalState.type === 'create' ? (
            <>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="button" onClick={handleCreate} disabled={createState.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {createState.isLoading ? 'Saving...' : 'Create category'}
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
                {deleteState.isLoading ? 'Deleting...' : 'Delete category'}
              </Button>
            </>
          )
        }
      >
        {modalState.type === 'create' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-cat-name">Category name</Label>
              <Input id="create-cat-name" value={createForm.categoryName} onChange={handleCreateChange('categoryName')} aria-invalid={Boolean(createErrors.categoryName)} />
              {createErrors.categoryName && <p className="text-xs text-destructive">{createErrors.categoryName}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-cat-desc">Description</Label>
              <Input id="create-cat-desc" value={createForm.description} onChange={handleCreateChange('description')} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={createForm.isActive} onChange={handleCreateChange('isActive')} className="h-4 w-4 rounded border border-input" />
              Active
            </label>
          </div>
        ) : modalState.type === 'edit' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-cat-name">Category name</Label>
              <Input id="edit-cat-name" value={editForm.categoryName} onChange={handleEditChange('categoryName')} aria-invalid={Boolean(editErrors.categoryName)} />
              {editErrors.categoryName && <p className="text-xs text-destructive">{editErrors.categoryName}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-cat-desc">Description</Label>
              <Input id="edit-cat-desc" value={editForm.description} onChange={handleEditChange('description')} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editForm.isActive} onChange={handleEditChange('isActive')} className="h-4 w-4 rounded border border-input" />
              Active
            </label>
          </div>
        ) : modalState.category ? (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{modalState.category.categoryName}</p>
            <p>{modalState.category.description ?? 'No description'}</p>
          </div>
        ) : null}
      </PopoverModal>
    </div>
  )
}

export default AdminCategories
