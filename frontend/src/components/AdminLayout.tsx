import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { Permission } from '../types/api';

interface NavItem {
  name: string;
  href: string;
  requiredPermission: Permission;
}

const navigation: NavItem[] = [
  { name: 'Users', href: '/admin/users', requiredPermission: 'users:read' },
  { name: 'Roles', href: '/admin/roles', requiredPermission: 'roles:read' },
  { name: 'Establishments', href: '/admin/establishments', requiredPermission: 'establishments:read' },
  { name: 'Classrooms', href: '/admin/classrooms', requiredPermission: 'classrooms:read' },
];

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const location = useLocation();
  const { hasPermission, user, logout } = useAuthStore();

  const filteredNavigation = navigation.filter((item) => hasPermission(item.requiredPermission));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-blue-600">Admin Dashboard</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      location.pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
              )}
              <button
                onClick={logout}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile navigation */}
      <div className="sm:hidden">
        <div className="space-y-1 border-t border-gray-200 bg-white px-2 pb-3 pt-2">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                location.pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {title}
          </h1>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
