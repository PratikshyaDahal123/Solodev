import { useState } from 'react'
import { Star, MessageCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { useGetAllReviewsQuery } from '../../services/backendApi'

const AdminReviews = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRating, setFilterRating] = useState(null)

  const { data: reviews = [] } = useGetAllReviewsQuery()

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(review.appointmentId ?? '').includes(searchTerm)

    const matchesRating = !filterRating || review.rating === filterRating

    return matchesSearch && matchesRating
  })

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  }

  const staffPerformance = reviews.reduce((acc, review) => {
    const staffId = review.staffId
    if (!staffId) return acc

    if (!acc[staffId]) {
      acc[staffId] = {
        name: review.staffName || 'Unknown Staff',
        ratings: [],
        count: 0,
      }
    }
    acc[staffId].ratings.push(review.rating)
    acc[staffId].count++
    return acc
  }, {})

  const staffStats = Object.values(staffPerformance)
    .map((staff) => ({
      ...staff,
      average: (staff.ratings.reduce((a, b) => a + b, 0) / staff.ratings.length).toFixed(1),
    }))
    .sort((a, b) => b.average - a.average)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">All Customer Reviews</h1>
        <p className="text-sm text-slate-500 mt-0.5">Monitor all customer feedback and staff performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Overall Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <div className="text-4xl font-bold text-amber-500">{averageRating}</div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
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
                <p className="text-xs text-slate-500">From {reviews.length} reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-6">{rating}★</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded">
                    <div
                      className="h-full bg-amber-400 rounded"
                      style={{
                        width: `${reviews.length > 0 ? (ratingDistribution[rating] / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-8">{ratingDistribution[rating]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance */}
      {staffStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance Rankings</CardTitle>
            <CardDescription>Average ratings by staff member</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Average Rating</TableHead>
                  <TableHead>Reviews</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffStats.map((staff, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-amber-500">{staff.average}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.round(staff.average)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{staff.count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search by customer, service, or staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-64"
          />
          <div className="flex gap-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                variant={filterRating === rating ? 'default' : 'outline'}
                size="sm"
                className="gap-1"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {rating}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No reviews found</p>
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
                    <TableHead>Staff</TableHead>
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
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{review.staffName || '-'}</p>
                          <p className="text-xs text-slate-500">ID: {review.staffId ?? '-'}</p>
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

export default AdminReviews
