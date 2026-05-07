import { Route, Navigate } from 'react-router-dom'
import { Car, CalendarCheck, CreditCard, History, Home, Package, User, ShoppingCart } from 'lucide-react'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleLayout from '../components/RoleLayout'

import CustomerHome from '../pages/Customer/CustomerHome'
import CustomerProfile from '../pages/Customer/CustomerProfile'
import CustomerAppointments from '../pages/Customer/CustomerAppointments'
import CustomerAccount from '../pages/Customer/CustomerAccount'
import CustomerHistoryPage from '../pages/Customer/CustomerHistoryPage'
import CustomerPartRequestsPage from '../pages/Customer/CustomerPartRequestsPage'
import CustomerVehicles from '../pages/Customer/CustomerVehicles'
import CustomerBuyParts from '../pages/Customer/CustomerBuyParts'
import CustomerCreditTracking from '../pages/Customer/CustomerCreditTracking'

const customerNavItems = [
  { to: '/customer/home', label: 'Home', icon: Home },
  { to: '/customer/appointments', label: 'Appointments', icon: CalendarCheck },
  { to: '/customer/history', label: 'History', icon: History },
  { to: '/customer/part-requests', label: 'Part Requests', icon: Package },
  { to: '/customer/buy-parts', label: 'Buy Parts', icon: ShoppingCart },
  { to: '/customer/credit', label: 'Credit', icon: CreditCard },
  // Combined account (profile + history)
  { to: '/customer/vehicles', label: 'My Vehicles', icon: Car },
  { to: '/customer/profile', label: 'Account', icon: User },
]

export const customerRoutes = (
  <Route
    path="/customer"
    element={
      <ProtectedRoute allowedRoles={['Customer']}>
        <RoleLayout
          appName="SawariSync"
          subtitle="Vehicle Service Center"
          roleLabel="Customer"
          sectionLabel="Dashboard"
          brandInitial="G"
          roleBadgeColor="emerald"
          navItems={customerNavItems}
        />
      </ProtectedRoute>
    }
  >
    <Route index element={<Navigate to="home" replace />} />
    <Route path="home" element={<CustomerHome />} />
    <Route path="appointments" element={<CustomerAppointments />} />
    <Route path="history" element={<CustomerHistoryPage />} />
    <Route path="buy-parts" element={<CustomerBuyParts />} />
    <Route path="credit" element={<CustomerCreditTracking />} />
    <Route path="part-requests" element={<CustomerPartRequestsPage />} />
    <Route path="vehicles" element={<CustomerVehicles />} />
    <Route path="profile" element={<CustomerAccount />} />
  </Route>
)
