import { Link, useLocation } from 'react-router-dom';
import { use_auth_store } from '@/store';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

const nav_items = [
  { path: '/teacher/select-institution', label: 'Institutions', icon: '🏫' },
  { path: '/teacher/select-classroom', label: 'Classrooms', icon: '🎓' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/notifications/preferences', label: 'Preferences', icon: '⚙️' },
  { path: '/assistant', label: 'Assistant', icon: '💬' },
];

/**
 * Teacher layout with sidebar navigation
 * Mobile responsive with collapsible navigation
 */
export function TeacherLayout({ children }: TeacherLayoutProps) {
  const location = useLocation();
  const { user, logout } = use_auth_store();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">LXP Teacher</h1>
        <nav className="flex gap-2">
          {nav_items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-2 rounded ${
                location.pathname === item.path
                  ? 'bg-primary-600'
                  : 'hover:bg-gray-800'
              }`}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">LXP Teacher</h1>
          <p className="text-sm text-gray-400 mt-1 truncate">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {nav_items.map((item) => {
              const is_active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      is_active
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            to="/sessions"
            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <span>📱</span>
            <span>Sessions</span>
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mt-1"
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}
