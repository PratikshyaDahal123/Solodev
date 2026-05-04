import DashboardSidebar from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'

const UserLayout = ({
  children,
  sidebarProps = {},
  headerEyebrow,
  headerTitle,
  headerRight,
}) => {
  const isCollapsed = sidebarProps.isCollapsed ?? false

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar
        appName={sidebarProps.appName}
        subtitle={sidebarProps.subtitle}
        roleLabel={sidebarProps.roleLabel}
        sectionLabel={sidebarProps.sectionLabel}
        brandInitial={sidebarProps.brandInitial}
        roleBadgeColor={sidebarProps.roleBadgeColor ?? 'sky'}
        items={sidebarProps.items ?? []}
        isCollapsed={isCollapsed}
        onToggleCollapse={sidebarProps.onToggleCollapse}
        onSignOut={sidebarProps.onSignOut}
        userName={sidebarProps.userName}
        userDetail={sidebarProps.userDetail}
      />

      <div
        className="flex flex-col min-h-screen transition-[margin] duration-200 ease-in-out"
        style={{ marginLeft: isCollapsed ? 64 : 224 }}
      >
        <DashboardHeader
          eyebrow={headerEyebrow}
          title={headerTitle}
          right={headerRight}
        />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default UserLayout