import { Link, useLocation } from 'react-router-dom';
import { use_auth_store } from '@/store';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const nav_items = [
  { path: '/admin/users', label: 'Users', icon: '👤' },
  { path: '/admin/roles', label: 'Roles', icon: '🔑' },
  { path: '/admin/institutions', label: 'Institutions', icon: '🏫' },
  { path: '/admin/subjects', label: 'Subjects', icon: '📚' },
  { path: '/admin/classrooms', label: 'Classrooms', icon: '🎓' },
];

/**
 * Admin layout with sidebar navigation
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, logout } = use_auth_store();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">LXP Admin</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
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
