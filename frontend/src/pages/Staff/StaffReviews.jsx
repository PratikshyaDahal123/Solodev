import { useState } from 'react'
import { Star, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  useGetReviewsForStaffQuery,
} from '../../services/backendApi'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const StaffReviews = () => {
  const user = getStoredUser()
  const staffId = user?.staffId ?? user?.userId
  const [searchTerm, setSearchTerm] = useState('')

  const { data: reviews = [] } = useGetReviewsForStaffQuery(staffId, {
    skip: !staffId,
  })

  if (!staffId) return null

  const filteredReviews = reviews.filter(
    (review) =>
      review.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(review.appointmentId ?? '').includes(searchTerm)
  )

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0

  const ratingCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Customer Reviews</h1>
        <p className="text-sm text-slate-500 mt-0.5">Reviews from customers on your appointments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500 mb-2">{averageRating}</div>
              <div className="flex justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">Average rating</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">{reviews.length}</div>
              <p className="text-xs text-slate-500">Total reviews</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded">
                    <div
                      className="h-full bg-amber-400 rounded"
                      style={{
                        width: `${reviews.length > 0 ? (ratingCounts[rating] / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-6">{ratingCounts[rating]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <Input
          placeholder="Search by customer name or service type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No reviews yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Review</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.reviewId}>
                      <TableCell className="font-medium">#{review.reviewId}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{review.customerName}</p>
                          <p className="text-xs text-slate-500">ID: {review.customerId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{review.serviceType || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{review.appointmentDateTime ? new Date(review.appointmentDateTime).toLocaleDateString() : '-'}</p>
                          <p className="text-xs text-slate-500">ID: {review.appointmentId ?? '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-amber-500">{review.rating}.0</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            review.appointmentStatus === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }
                        >
                          {review.appointmentStatus || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.isApproved ? 'default' : 'outline'}>
                          {review.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[260px] whitespace-pre-wrap text-sm text-slate-700">
                        {review.comment || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString()}{' '}
                        {new Date(review.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default StaffReviews
