import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RecoverPasswordPage, SessionsPage } from '@/features/auth';
import {
  AdminUsersPage,
  AdminRolesPage,
  AdminInstitutionsPage,
  AdminSubjectsPage,
  AdminClassroomsPage,
} from '@/features/admin';
import {
  SelectInstitutionPage,
  SelectClassroomPage,
} from '@/features/teacher';
import {
  NotificationsPage,
  PreferencesPage,
} from '@/features/notifications';
import { AssistantPage } from '@/features/assistant';
import { AuthGuard, GuestGuard, AdminGuard, TeacherGuard } from '@/routes';
import { AdminLayout, TeacherLayout } from '@/components/layout';

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

      {/* Teacher routes with layout */}
      <Route
        path="/teacher/select-institution"
        element={
          <TeacherGuard>
            <TeacherLayout>
              <SelectInstitutionPage />
            </TeacherLayout>
          </TeacherGuard>
        }
      />
      <Route
        path="/teacher/select-classroom"
        element={
          <TeacherGuard>
            <TeacherLayout>
              <SelectClassroomPage />
            </TeacherLayout>
          </TeacherGuard>
        }
      />

      {/* Notification routes */}
      <Route
        path="/notifications"
        element={
          <AuthGuard>
            <TeacherLayout>
              <NotificationsPage />
            </TeacherLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/notifications/preferences"
        element={
          <AuthGuard>
            <TeacherLayout>
              <PreferencesPage />
            </TeacherLayout>
          </AuthGuard>
        }
      />

      {/* Assistant route */}
      <Route
        path="/assistant"
        element={
          <AuthGuard>
            <TeacherLayout>
              <AssistantPage />
            </TeacherLayout>
          </AuthGuard>
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
