import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { useCreateReviewMutation } from '../../services/backendApi'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CustomerReviews = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId

  const [createReview, createReviewState] = useCreateReviewMutation()

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  })

  if (!customerId) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service review</CardTitle>
        <CardDescription>Share feedback on your service.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Rating (1-5)</Label>
            <Input
              type="number"
              min="1"
              max="5"
              value={reviewForm.rating}
              onChange={(event) =>
                setReviewForm((prev) => ({
                  ...prev,
                  rating: Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Comment</Label>
            <Textarea
              value={reviewForm.comment}
              onChange={(event) =>
                setReviewForm((prev) => ({
                  ...prev,
                  comment: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <p className="text-sm text-slate-500">To leave a review for a specific appointment, please go to your <strong>Service history</strong> and select the appointment once it's marked completed.</p>
        <Button type="button" disabled className="opacity-50 mt-2">Submit review</Button>
      </CardContent>
    </Card>
  )
}

export default CustomerReviews
