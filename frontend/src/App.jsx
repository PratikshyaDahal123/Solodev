
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { getStoredUser, resolveRoleRoute } from './lib/auth'
import Landing from './pages/Landing'
import { adminRoutes } from './routes/AdminRoutes'
import { staffRoutes } from './routes/StaffRoutes'
import { customerRoutes } from './routes/CustomerRoutes'

const AuthShell = ({ children }) => (
  <div className="auth-shell">
    <div className="auth-shell__content">
        <img src="/logo.png" alt="SawariSync" className="h-12 w-auto object-contain" />

      <div className="auth-shell__panel">{children}</div>
    </div>
  </div>
)

function AppRoutes() {
  const user = getStoredUser()
  const token = localStorage.getItem('token')
  const hasValidRole = Boolean(token) && ['Admin', 'Staff', 'Customer'].includes(user?.role)

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          hasValidRole ? (
            <Navigate to={resolveRoleRoute(user.role)} replace />
          ) : (
            <AuthShell>
              <LoginPage />
            </AuthShell>
          )
        }
      />
      <Route
        path="/register"
        element={
          hasValidRole ? (
            <Navigate to={resolveRoleRoute(user.role)} replace />
          ) : (
            <AuthShell>
              <RegisterPage />
            </AuthShell>
          )
        }
      />
      {adminRoutes}
      {staffRoutes}
      {customerRoutes}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes