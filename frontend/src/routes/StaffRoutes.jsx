import { Route } from 'react-router-dom'
import { BarChart3, Calendar, CreditCard, LayoutDashboard, Receipt, Users, Car, FileText, Star } from 'lucide-react'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleLayout from '../components/RoleLayout'
import StaffDashboard from '../pages/Staff/StaffDashboard'
import StaffCustomers from '../pages/Staff/StaffCustomers'
import StaffCreditTracking from '../pages/Staff/StaffCreditTracking'
import StaffCustomerRecords from '../pages/Staff/StaffCustomerRecords'
import StaffSalesInvoices from '../pages/Staff/StaffSalesInvoices'
import StaffReports from '../pages/Staff/StaffReports'
import StaffReviews from '../pages/Staff/StaffReviews'
import StaffAppointments from '../pages/Staff/StaffAppointments'
import StaffVehicles from '../pages/Staff/StaffVehicles'
import { getStoredUser } from '../lib/auth'

const staffNavItems = [
  { label: 'Dashboard', to: '/staff', end: true, icon: LayoutDashboard },
  { label: 'Appointments', to: '/staff/appointments', icon: Calendar },
  { label: 'Customers', to: '/staff/customers', icon: Users },
  { label: 'Customer Records', to: '/staff/customer-records', icon: FileText },
  { label: 'Sales Invoices', to: '/staff/sales-invoices', icon: Receipt },
  { label: 'Credit tracking', to: '/staff/credit-tracking', icon: CreditCard },
  { label: 'Vehicles', to: '/staff/vehicles', icon: Car },
  { label: 'Reviews', to: '/staff/reviews', icon: Star },
  { label: 'Reports', to: '/staff/reports', icon: BarChart3 },
]

const StaffLayout = () => {
  const user = getStoredUser()
  return (
    <RoleLayout
      appName="SawariSync"
      subtitle="Staff Station"
      roleLabel="Staff"
      roleBadgeColor="emerald"
      brandInitial="S"
      navItems={staffNavItems}
      userName={user?.fullName ?? 'Staff'}
      userDetail={user?.email ?? 'staff@sawarisync.com'}
      headerEyebrow="SawariSync"
      headerTitle="Staff Portal"
    />
  )
}

export const staffRoutes = (
  <Route
    path="/staff"
    element={
      <ProtectedRoute allowedRoles={['Staff']}>
        <StaffLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<StaffDashboard />} />
    <Route path="appointments" element={<StaffAppointments />} />
    <Route path="customers" element={<StaffCustomers />} />
    <Route path="customer-records" element={<StaffCustomerRecords />} />
    <Route path="sales-invoices" element={<StaffSalesInvoices />} />
    <Route path="credit-tracking" element={<StaffCreditTracking />} />
    <Route path="vehicles" element={<StaffVehicles />} />
    <Route path="reviews" element={<StaffReviews />} />
    <Route path="reports" element={<StaffReports />} />
  </Route>
)
