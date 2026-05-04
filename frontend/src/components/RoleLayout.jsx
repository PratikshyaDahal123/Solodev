import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useDispatch } from 'react-redux'
import UserLayout from './UserLayout'
import NotificationBell from './NotificationBell'
import { backendApi } from '../services/backendApi'
import { clearStoredUser } from '../lib/auth'

const RoleLayout = ({
  appName = 'SawariSync',
  subtitle,
  roleLabel,
  sectionLabel,
  brandInitial,
  roleBadgeColor = 'sky',
  navItems,
  userName,
  userDetail,
  headerEyebrow,
  headerTitle,
}) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const userInitial = userName?.charAt(0)?.toUpperCase() ?? 'U'

  const handleSignOut = () => {
    clearStoredUser()
    dispatch(backendApi.util.resetApiState())
    // Force a full navigation to the login page to clear any in-memory auth state
    // and stop components from issuing requests using a stale token.
    window.location.href = '/login'
  }

  const headerRight = (
    <div className="flex items-center gap-2">
      <NotificationBell />
      <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer transition-colors">
        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold">
          {userInitial}
        </div>
        <span className="hidden text-sm font-medium text-gray-700 sm:inline">
          {userName ?? 'User'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </div>
    </div>
  )

  return (
    <UserLayout
      sidebarProps={{
        appName,
        subtitle,
        roleLabel,
        sectionLabel,
        brandInitial,
        roleBadgeColor,
        items: navItems,
        isCollapsed,
        onToggleCollapse: () => setIsCollapsed((prev) => !prev),
        onSignOut: handleSignOut,
        userName,
        userDetail,
      }}
      headerEyebrow={headerEyebrow}
      headerTitle={headerTitle}
      headerRight={headerRight}
    >
      <Outlet />
    </UserLayout>
  )
}

export default RoleLayout