import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RecoverPasswordPage, SessionsPage } from '@/features/auth';
import { AuthGuard, GuestGuard } from '@/routes';

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
