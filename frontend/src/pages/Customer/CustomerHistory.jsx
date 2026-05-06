import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import { useGetCustomerHistoryQuery, useCreateReviewMutation } from '../../services/backendApi'
import { toast } from 'react-toastify'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CustomerHistory = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId
  const [createReview] = useCreateReviewMutation()

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)

  const { data: history } = useGetCustomerHistoryQuery(customerId, {
    skip: !customerId,
  })

  if (!customerId) return null

  const handleReviewClick = (appointment) => {
    setSelectedAppointment(appointment)
    if (appointment.review) {
      setRating(appointment.review.rating)
      setComment(appointment.review.comment || '')
    } else {
      setRating(5)
      setComment('')
    }
    setReviewDialogOpen(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedAppointment) return
    try {
      await createReview({
        customerId,
        appointmentId: selectedAppointment.appointmentId,
        rating,
        comment,
      }).unwrap()
      toast.success('Review submitted.')
      setReviewDialogOpen(false)
    } catch (err) {
      // Show backend message if available
      const msg = err?.data?.message || err?.error || 'Failed to submit review.'
      toast.error(msg)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
          <CardDescription>Recent invoices and totals.</CardDescription>
        </CardHeader>
        <CardContent>
          {history?.purchases?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.purchases.map((purchase) => (
                  <TableRow key={purchase.salesInvoiceId}>
                    <TableCell>{purchase.invoiceNumber}</TableCell>
                    <TableCell>
                      {new Date(purchase.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      Rs {Number(purchase.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>{purchase.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No purchases yet.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Service history</CardTitle>
          <CardDescription>Appointments and reviews.</CardDescription>
        </CardHeader>
        <CardContent>
          {history?.appointments?.length ? (
            <div className="space-y-3">
              {history.appointments.map((appointment) => (
                <div
                  key={appointment.appointmentId}
                  className="rounded-lg border border-slate-200 p-3 bg-slate-50/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{appointment.serviceType}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(appointment.appointmentDateTime).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        appointment.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : appointment.status === 'Scheduled'
                            ? 'bg-cyan-50 text-cyan-700'
                            : 'bg-slate-100 text-slate-700'
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </div>

                  {appointment.review ? (
                    <div className="bg-white rounded p-2 mb-2 border border-slate-100">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < appointment.review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      {appointment.review.comment && (
                        <p className="text-xs text-slate-600 italic">"{appointment.review.comment}"</p>
                      )}
                    </div>
                  ) : null}

                  <Button
                    onClick={() => handleReviewClick(appointment)}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    disabled={appointment.status !== 'Completed'}
                    title={appointment.status !== 'Completed' ? 'You can only review after the appointment is completed.' : ''}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {appointment.review ? 'Edit Review' : appointment.status === 'Completed' ? 'Add Review' : 'Complete to review'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No appointments yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment?.review ? 'Edit Review' : 'Leave a Review'}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment?.serviceType} - {selectedAppointment && new Date(selectedAppointment.appointmentDateTime).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Rating</Label>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    onMouseEnter={() => setHoveredRating(i + 1)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < (hoveredRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">{rating} out of 5 stars</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm">
                Comment (optional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-24 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setReviewDialogOpen(false)}
              variant="outline"
              className="text-sm"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} className="bg-primary text-white text-sm">
              {selectedAppointment?.review ? 'Update Review' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomerHistory
