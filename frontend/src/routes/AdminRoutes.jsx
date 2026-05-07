import { Route } from 'react-router-dom'
import {
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  Star,
  Truck,
  Users,
  Wrench,
} from 'lucide-react'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleLayout from '../components/RoleLayout'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import AdminReports from '../pages/Admin/AdminReports'
import AdminReviews from '../pages/Admin/AdminReviews'
import AdminAppointments from '../pages/Admin/AdminAppointments'
import AdminCreditTracking from '../pages/Admin/AdminCreditTracking'
import AdminCustomers from '../pages/Admin/AdminCustomers'
import AdminStaff from '../pages/Admin/AdminStaff'
import AdminParts from '../pages/Admin/AdminParts'
import AdminPurchaseInvoices from '../pages/Admin/AdminPurchaseInvoices'
import AdminSalesInvoices from '../pages/Admin/AdminSalesInvoices'
import AdminCategories from '../pages/Admin/AdminCategories'
import AdminVendors from '../pages/Admin/AdminVendors'
import AdminInventory from '../pages/Admin/AdminInventory'
import { getStoredUser } from '../lib/auth'

const adminNavItems = [
  { label: 'Dashboard', to: '/admin', end: true, icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Vendor management', to: '/admin/vendors', icon: Truck },
  { label: 'Appointments', to: '/admin/appointments', icon: Calendar },
  { label: 'Purchase orders', to: '/admin/purchase-invoices', icon: FileText },
  { label: 'Sales invoices', to: '/admin/sales-invoices', icon: FileText },
  { label: 'Credit tracking', to: '/admin/credit-tracking', icon: CreditCard },
  { label: 'Reviews', to: '/admin/reviews', icon: Star },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Categories', to: '/admin/categories', icon: Layers },
  { label: 'Parts', to: '/admin/parts', icon: Wrench },
  { label: 'Inventory', to: '/admin/inventory', icon: Truck },
]

const AdminLayout = () => {
  const user = getStoredUser()
  return (
    <RoleLayout
      appName="SawariSync"

      subtitle="Admin Console"
      roleLabel="Admin"
      roleBadgeColor="blue"
      brandInitial="A"
      navItems={adminNavItems}
      userName={user?.fullName ?? 'Admin'}
      userDetail={user?.email ?? 'admin@sawarisync.com'}

      headerEyebrow="Admin command center"
      headerTitle="SawariSync Operations"

    />
  )
}

export const adminRoutes = (
  <Route
    path="/admin"
    element={
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<AdminDashboard />} />
    <Route path="reports" element={<AdminReports />} />
    <Route path="reviews" element={<AdminReviews />} />
    <Route path="appointments" element={<AdminAppointments />} />
    <Route path="users" element={<AdminStaff />} />
    <Route path="customers" element={<AdminCustomers />} />
    <Route path="parts" element={<AdminParts />} />
    <Route path="purchase-invoices" element={<AdminPurchaseInvoices />} />
    <Route path="sales-invoices" element={<AdminSalesInvoices />} />
    <Route path="credit-tracking" element={<AdminCreditTracking />} />
    <Route path="categories" element={<AdminCategories />} />
    <Route path="vendors" element={<AdminVendors />} />
    <Route path="inventory" element={<AdminInventory />} />
  </Route>
)
