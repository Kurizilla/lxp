import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RecoverPasswordPage, SessionsPage } from '@/features/auth';
import {
  AdminUsersPage,
  AdminRolesPage,
  AdminInstitutionsPage,
  AdminSubjectsPage,
  AdminClassroomsPage,
} from '@/features/admin';
import { AuthGuard, GuestGuard, AdminGuard } from '@/routes';
import { AdminLayout } from '@/components/layout';

/**
 * Main application component with routing
 */
export function App() {
  return (
    <Routes>
      {/* Public routes (redirect to sessions if authenticated) */}
      <Route
        path="/login"
        element={
          <GuestGuard>
            <LoginPage />
          </GuestGuard>
        }
      />
      <Route
        path="/recover-password"
        element={
          <GuestGuard>
            <RecoverPasswordPage />
          </GuestGuard>
        }
      />

      {/* Protected routes */}
      <Route
        path="/sessions"
        element={
          <AuthGuard>
            <SessionsPage />
          </AuthGuard>
        }
      />

      {/* Admin routes with layout */}
      <Route
        path="/admin/users"
        element={
          <AdminGuard>
            <AdminLayout>
              <AdminUsersPage />
            </AdminLayout>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <AdminGuard>
            <AdminLayout>
              <AdminRolesPage />
            </AdminLayout>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/institutions"
        element={
          <AdminGuard>
            <AdminLayout>
              <AdminInstitutionsPage />
            </AdminLayout>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/subjects"
        element={
          <AdminGuard>
            <AdminLayout>
              <AdminSubjectsPage />
            </AdminLayout>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/classrooms"
        element={
          <AdminGuard>
            <AdminLayout>
              <AdminClassroomsPage />
            </AdminLayout>
          </AdminGuard>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 fallback */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
