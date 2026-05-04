import { useState, useRef, useEffect, useMemo } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { toast } from 'react-toastify'

import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from '../services/backendApi'

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr)
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'Just now'
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  const { data: notifications = [] } = useGetNotificationsQuery()
  const [markAsRead] = useMarkNotificationAsReadMutation()
  const [markAllRead] = useMarkAllNotificationsAsReadMutation()
  const [deleteNotif] = useDeleteNotificationMutation()

  const unread = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications])

  // Track previously seen notification IDs to detect new notifications
  const prevNotifIdsRef = useRef(new Set())

  useEffect(() => {
    const prev = prevNotifIdsRef.current
    const currentIds = new Set(notifications.map((n) => n.notificationId))

    // Find newly added notifications (present now but not in prev)
    const newNotifs = notifications.filter((n) => !prev.has(n.notificationId) && !n.isRead)
    if (newNotifs.length > 0) {
      // Show toast for each new unread notification (limit to 3 to avoid spam)
      newNotifs.slice(0, 3).forEach((n) => {
        toast.info(n.title + ': ' + (n.message?.slice(0, 140) ?? ''), { autoClose: 5000 })
      })
    }

    // Update prev set to current IDs
    prevNotifIdsRef.current = currentIds
  }, [notifications])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1.5 flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-semibold">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`flex items-start gap-3 px-4 py-3 ${!n.isRead ? 'bg-gray-50' : 'bg-white'}`}
                >
                  {!n.isRead && (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0" style={{ marginLeft: n.isRead ? '9px' : '0' }}>
                    <p className="text-sm font-medium text-gray-900 leading-tight">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.notificationId)}
                        className="p-1 text-gray-300 hover:text-gray-600 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotif(n.notificationId)}
                      className="p-1 text-gray-300 hover:text-gray-600 transition-colors"
                      title="Delete"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">
              {unread > 0 ? `${unread} unread` : 'All caught up'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
