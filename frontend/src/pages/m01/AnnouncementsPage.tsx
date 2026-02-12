import { useEffect, useCallback } from 'react';
import { useM01NotificationStore } from '../../stores/m01NotificationStore';
import { Priority } from '../../types/m01-notifications';

const priorityColors: Record<Priority, string> = {
  [Priority.LOW]: 'bg-gray-100 text-gray-800 border-gray-200',
  [Priority.MEDIUM]: 'bg-blue-100 text-blue-800 border-blue-200',
  [Priority.HIGH]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [Priority.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
};

const priorityBorders: Record<Priority, string> = {
  [Priority.LOW]: 'border-l-gray-400',
  [Priority.MEDIUM]: 'border-l-blue-400',
  [Priority.HIGH]: 'border-l-yellow-400',
  [Priority.CRITICAL]: 'border-l-red-400',
};

export function AnnouncementsPage() {
  const {
    announcements,
    announcementsLoading,
    announcementsError,
    announcementsPagination,
    fetchAnnouncements,
  } = useM01NotificationStore();

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchAnnouncements(newPage, announcementsPagination.limit);
    },
    [fetchAnnouncements, announcementsPagination.limit]
  );

  const totalPages = Math.ceil(
    announcementsPagination.total / announcementsPagination.limit
  );

  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-600 mt-1">
          Stay updated with the latest announcements and news.
        </p>
      </div>

      {announcementsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {announcementsError}
        </div>
      )}

      {announcementsLoading && announcements.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No announcements found.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const expired = isExpired(announcement.expiresAt);
              
              return (
                <article
                  key={announcement.id}
                  className={`p-6 bg-white rounded-lg border border-l-4 ${
                    priorityBorders[announcement.priority]
                  } ${expired ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {announcement.title}
                      </h2>
                      {expired && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-600">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          priorityColors[announcement.priority]
                        }`}
                      >
                        {announcement.priority}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                        {announcement.type}
                      </span>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                    <p>{announcement.content}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Published: {new Date(announcement.publishedAt).toLocaleDateString()}
                    </span>
                    {announcement.expiresAt && (
                      <span>
                        Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(announcementsPagination.page - 1)}
                disabled={announcementsPagination.page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {announcementsPagination.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(announcementsPagination.page + 1)}
                disabled={announcementsPagination.page === totalPages}
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

export default AnnouncementsPage;
