import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useGetCustomerByIdQuery, useUpdateCustomerProfileMutation } from '../../services/backendApi'
import { toast } from 'react-toastify'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CustomerProfile = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId

  const { data: customer } = useGetCustomerByIdQuery(customerId, { skip: !customerId })
  const [updateProfile, updateProfileState] = useUpdateCustomerProfileMutation()

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
  })

  useEffect(() => {
    if (customer) {
      setProfileForm({
        fullName: customer.fullName ?? '',
        email: customer.email ?? '',
        phoneNumber: customer.phoneNumber ?? '',
        address: customer.address ?? '',
      })
    }
  }, [customer])

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ customerId, ...profileForm }).unwrap()
      toast.success('Profile updated successfully.')
    } catch (err) {
      const msg = err?.data?.message || err?.error || 'Failed to update profile.'
      toast.error(msg)
    }
  }

  if (!customerId) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your personal details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input
              value={profileForm.fullName}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  fullName: event.target.value,
                }))
              }
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              placeholder="your.email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone number</Label>
            <Input
              value={profileForm.phoneNumber}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  phoneNumber: event.target.value,
                }))
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input
              value={profileForm.address}
              onChange={(event) =>
                setProfileForm((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
              placeholder="Your address"
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleSaveProfile}
          disabled={updateProfileState.isLoading}
        >
          {updateProfileState.isLoading ? 'Saving...' : 'Save profile'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default CustomerProfile
