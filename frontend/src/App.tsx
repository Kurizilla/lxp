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

      {/* Admin routes */}
      <Route
        path="/admin/users"
        element={
          <AdminGuard>
            <AdminUsersPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <AdminGuard>
            <AdminRolesPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/institutions"
        element={
          <AdminGuard>
            <AdminInstitutionsPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/subjects"
        element={
          <AdminGuard>
            <AdminSubjectsPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/classrooms"
        element={
          <AdminGuard>
            <AdminClassroomsPage />
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
