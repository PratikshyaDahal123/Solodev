import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { useCreatePartRequestMutation, useGetPartRequestsByCustomerQuery } from '../../services/backendApi'
import { toast } from 'react-toastify'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CustomerPartRequests = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId

  const [createPartRequest, createPartRequestState] = useCreatePartRequestMutation()

  const { data: history = [], isLoading: historyLoading } = useGetPartRequestsByCustomerQuery(customerId)

  const [partRequestForm, setPartRequestForm] = useState({
    partName: '',
    requestedQuantity: 1,
    notes: '',
  })

  if (!customerId) return null

  const handleSubmit = async () => {
    try {
      await createPartRequest({ customerId, ...partRequestForm }).unwrap()
      toast.success('Part request submitted')
      setPartRequestForm({ partName: '', requestedQuantity: 1, notes: '' })
    } catch (err) {
      // If backend removed the endpoint, display friendly message
      const status = err?.status
      if (status === 404) {
        toast.error('Part requests are currently unavailable. Please contact support.')
      } else {
        toast.error('Failed to submit part request')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unavailable parts</CardTitle>
        <CardDescription>Request parts that are out of stock.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Part name</Label>
            <Input
              value={partRequestForm.partName}
              onChange={(event) =>
                setPartRequestForm((prev) => ({
                  ...prev,
                  partName: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={partRequestForm.requestedQuantity}
              onChange={(event) =>
                setPartRequestForm((prev) => ({
                  ...prev,
                  requestedQuantity: Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={partRequestForm.notes}
              onChange={(event) =>
                setPartRequestForm((prev) => ({
                  ...prev,
                  notes: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <Button type="button" onClick={handleSubmit} disabled={createPartRequestState.isLoading}>
          {createPartRequestState.isLoading ? 'Submitting...' : 'Submit request'}
        </Button>
      </CardContent>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Request history</h3>
        {historyLoading ? (
          <div>Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-sm text-muted-foreground">No requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-1">Part</th>
                  <th className="px-2 py-1">Qty</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Requested At</th>
                  <th className="px-2 py-1">Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.partRequestId} className="border-t">
                    <td className="px-2 py-1">{r.partName}</td>
                    <td className="px-2 py-1">{r.requestedQuantity}</td>
                    <td className="px-2 py-1">{r.status}</td>
                    <td className="px-2 py-1">{new Date(r.requestedAt).toLocaleString()}</td>
                    <td className="px-2 py-1">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}

export default CustomerPartRequests
