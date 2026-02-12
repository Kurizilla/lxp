import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth';
import {
  LoginPage,
  GoogleLoginPage,
  SessionsPage,
  InstitutionSelectorPage,
  ClassroomSelectorPage,
} from './pages/m01';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />

      <Routes>
        {/* Public auth routes */}
        <Route
          path="/m01/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/m01/google-login"
          element={
            <PublicOnlyRoute>
              <GoogleLoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/m01/select-institution"
          element={
            <ProtectedRoute>
              <InstitutionSelectorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m01/select-classroom"
          element={
            <ProtectedRoute requireInstitution>
              <ClassroomSelectorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/m01/sessions"
          element={
            <ProtectedRoute>
              <SessionsPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard - requires auth and institution selection */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireInstitution>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/m01/login" replace />} />
        <Route path="/m01" element={<Navigate to="/m01/login" replace />} />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900">404</h1>
                <p className="mt-2 text-gray-600">Page not found</p>
                <a
                  href="/m01/login"
                  className="mt-4 inline-block text-primary-600 hover:text-primary-500"
                >
                  Go to login
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
