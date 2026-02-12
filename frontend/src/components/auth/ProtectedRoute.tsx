import { Navigate, useLocation } from 'react-router-dom';
import { useM01AuthStore } from '../../stores/m01AuthStore';
import { LoadingPage } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireInstitution?: boolean;
  requireClassroom?: boolean;
}

export function ProtectedRoute({
  children,
  requireInstitution = false,
  requireClassroom = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, selectedInstitution, selectedClassroom } =
    useM01AuthStore();

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingPage message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/m01/login" state={{ from: location }} replace />;
  }

  // Redirect to institution selector if institution is required but not selected
  if (requireInstitution && !selectedInstitution) {
    return <Navigate to="/m01/select-institution" replace />;
  }

  // Redirect to classroom selector if classroom is required but not selected
  if (requireClassroom && !selectedClassroom) {
    return <Navigate to="/m01/select-classroom" replace />;
  }

  return <>{children}</>;
}

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, selectedInstitution, selectedClassroom } =
    useM01AuthStore();

  // If authenticated, redirect to appropriate page
  if (isAuthenticated) {
    if (!selectedInstitution) {
      return <Navigate to="/m01/select-institution" replace />;
    }
    if (!selectedClassroom) {
      return <Navigate to="/m01/select-classroom" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
