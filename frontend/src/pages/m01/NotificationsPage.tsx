import { useEffect, useCallback } from 'react';
import { useM01NotificationStore } from '../../stores/m01NotificationStore';
import { Priority } from '../../types/m01-notifications';

const POLL_INTERVAL = 30000; // 30 seconds

const priorityColors: Record<Priority, string> = {
  [Priority.LOW]: 'bg-gray-100 text-gray-800',
  [Priority.MEDIUM]: 'bg-blue-100 text-blue-800',
  [Priority.HIGH]: 'bg-yellow-100 text-yellow-800',
  [Priority.CRITICAL]: 'bg-red-100 text-red-800',
};

export function NotificationsPage() {
  const {
    notifications,
    notificationsLoading,
    notificationsError,
    notificationsPagination,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    getUnreadCount,
  } = useM01NotificationStore();

  const unreadCount = getUnreadCount();

  // Fetch notifications on mount and poll for updates
  useEffect(() => {
    fetchNotifications();
    
    const pollInterval = setInterval(() => {
      fetchNotifications(notificationsPagination.page, notificationsPagination.limit);
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [fetchNotifications, notificationsPagination.page, notificationsPagination.limit]);

  const handleToggleRead = useCallback(
    async (notificationId: string, isRead: boolean) => {
      if (isRead) {
        await markAsUnread(notificationId);
      } else {
        await markAsRead(notificationId);
      }
    },
    [markAsRead, markAsUnread]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchNotifications(newPage, notificationsPagination.limit);
    },
    [fetchNotifications, notificationsPagination.limit]
  );

  const totalPages = Math.ceil(
    notificationsPagination.total / notificationsPagination.limit
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-full">
            {unreadCount} unread
          </span>
        )}
      </div>

      {notificationsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {notificationsError}
        </div>
      )}

      {notificationsLoading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No notifications found.
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  notification.isRead
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-medium ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          priorityColors[notification.priority]
                        }`}
                      >
                        {notification.priority}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                        {notification.type}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleRead(notification.id, notification.isRead)
                    }
                    className={`ml-4 px-3 py-1 text-sm font-medium rounded transition-colors ${
                      notification.isRead
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {notification.isRead ? 'Mark Unread' : 'Mark Read'}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(notificationsPagination.page - 1)}
                disabled={notificationsPagination.page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {notificationsPagination.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(notificationsPagination.page + 1)}
                disabled={notificationsPagination.page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NotificationsPage;
