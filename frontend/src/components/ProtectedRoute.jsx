import { Navigate, Outlet } from 'react-router-dom'
import { getStoredUser, resolveRoleRoute } from '../lib/auth'

const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = getStoredUser()
  const token = localStorage.getItem('token')

  if (!token || !user?.role) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={resolveRoleRoute(user.role)} replace />
  }

  return children ?? <Outlet />
}

export default ProtectedRoute
