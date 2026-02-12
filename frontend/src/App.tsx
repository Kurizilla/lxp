import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useM01NotificationStore } from './stores/m01NotificationStore';
import NotificationsPage from './pages/m01/NotificationsPage';
import AnnouncementsPage from './pages/m01/AnnouncementsPage';
import NotificationPrefsPage from './pages/m01/NotificationPrefsPage';
import TutorAssistantPage from './pages/m01/TutorAssistantPage';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  );
}

function NotificationBadge() {
  const getUnreadCount = useM01NotificationStore((state) => state.getUnreadCount);
  const unreadCount = getUnreadCount();

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="font-bold text-xl text-blue-600">
                LXP Flow
              </Link>
            </div>
            <nav className="flex items-center gap-1">
              <div className="relative">
                <NavLink to="/m01/notifications">Notifications</NavLink>
                <NotificationBadge />
              </div>
              <NavLink to="/m01/announcements">Announcements</NavLink>
              <NavLink to="/m01/notification-prefs">Preferences</NavLink>
              <NavLink to="/m01/tutor-assistant">Tutor Assistant</NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Routes>
          <Route
            path="/"
            element={
              <div className="max-w-4xl mx-auto px-6 text-center py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to LXP Flow
                </h1>
                <p className="text-gray-600 mb-8">
                  Your learning experience platform. Navigate using the menu above.
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                  <Link
                    to="/m01/notifications"
                    className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      View your notifications
                    </p>
                  </Link>
                  <Link
                    to="/m01/announcements"
                    className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-medium text-gray-900">Announcements</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Latest news and updates
                    </p>
                  </Link>
                  <Link
                    to="/m01/notification-prefs"
                    className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-medium text-gray-900">Preferences</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage your settings
                    </p>
                  </Link>
                  <Link
                    to="/m01/tutor-assistant"
                    className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-medium text-gray-900">Tutor Assistant</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Get help with learning
                    </p>
                  </Link>
                </div>
              </div>
            }
          />
          <Route path="/m01/notifications" element={<NotificationsPage />} />
          <Route path="/m01/announcements" element={<AnnouncementsPage />} />
          <Route path="/m01/notification-prefs" element={<NotificationPrefsPage />} />
          <Route path="/m01/tutor-assistant" element={<TutorAssistantPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
