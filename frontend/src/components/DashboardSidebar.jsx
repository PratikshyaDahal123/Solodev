import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

const DashboardSidebar = ({
  appName = 'SawariSync',
  subtitle,
  roleLabel,
  brandInitial = 'A',
  roleBadgeColor = 'sky',
  items = [],
  isCollapsed,
  onToggleCollapse,
  onSignOut,
  userName,
  userDetail,
}) => {
  const userInitial = userName?.charAt(0)?.toUpperCase() ?? brandInitial?.charAt(0)?.toUpperCase() ?? 'A'

  return (
    <aside
      className={[
        'fixed left-0 top-0 h-screen z-40 flex flex-col',
        'bg-white border-r border-gray-200',
        'transition-all duration-200 ease-in-out',
        isCollapsed ? 'w-[64px]' : 'w-56',
      ].join(' ')}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-100 flex-shrink-0">
        <img
          src="/small.png"
          alt="SawariSync"
          className="w-7 h-7 object-contain flex-shrink-0"
        />
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{appName}</p>
            {subtitle && (
              <p className="text-[11px] text-gray-400 truncate leading-tight">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon

          if (item.to) {
            return (
              <NavLink
                key={item.key ?? item.to}
                to={item.to}
                end={item.end ?? false}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors w-full',
                    isCollapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                  ].join(' ')
                }
              >
                {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            )
          }

          return (
            <button
              key={item.key ?? item.label}
              type="button"
              title={isCollapsed ? item.label : undefined}
              onClick={item.onClick}
              className={[
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors w-full',
                isCollapsed ? 'justify-center' : '',
                item.isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-2 space-y-0.5 flex-shrink-0">
        <div className={['flex items-center gap-2.5 px-2.5 py-2', isCollapsed ? 'justify-center' : ''].join(' ')}>
          <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {userInitial}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-[10px] text-gray-400 truncate">{userDetail}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onSignOut}
          title="Sign out"
          className={[
            'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors',
            isCollapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-16 z-50 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      )}
    </aside>
  )
}

export default DashboardSidebar
