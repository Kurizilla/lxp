import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { use_auth_store } from '@/store';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Check if user has valid authentication
 */
function use_valid_auth() {
  const { is_authenticated, expires_at } = use_auth_store();
  const is_token_valid = expires_at ? Date.now() < expires_at : false;
  return is_authenticated && is_token_valid;
}

/**
 * Protected route guard
 * Redirects unauthenticated users to login page
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const has_valid_auth = use_valid_auth();
  const location = useLocation();

  if (!has_valid_auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Guest route guard
 * Redirects authenticated users to their appropriate dashboard based on role
 */
export function GuestGuard({ children }: AuthGuardProps) {
  const has_valid_auth = use_valid_auth();
  const { user_role } = use_auth_store();

  if (has_valid_auth) {
    // Redirect based on detected role
    if (user_role === 'admin') {
      return <Navigate to="/admin/users" replace />;
    } else if (user_role === 'teacher') {
      return <Navigate to="/teacher/select-institution" replace />;
    } else {
      // Default for student or unknown role
      return <Navigate to="/sessions" replace />;
    }
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: React.ReactNode;
  required_permission?: string;
}

/**
 * Admin route guard
 * Ensures user is authenticated and has admin role
 * Redirects non-admin users to teacher dashboard
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const has_valid_auth = use_valid_auth();
  const { user_role } = use_auth_store();
  const location = useLocation();

  if (!has_valid_auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin role
  if (user_role !== 'admin') {
    // Redirect non-admin users to teacher dashboard
    return <Navigate to="/teacher/select-institution" replace />;
  }

  return <>{children}</>;
}

interface TeacherGuardProps {
  children: React.ReactNode;
}

/**
 * Teacher route guard
 * Ensures user is authenticated and has teacher role
 * Redirects non-teacher users to admin dashboard
 */
export function TeacherGuard({ children }: TeacherGuardProps) {
  const has_valid_auth = use_valid_auth();
  const { user_role } = use_auth_store();
  const location = useLocation();

  if (!has_valid_auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has teacher role
  if (user_role !== 'teacher') {
    // Redirect non-teacher users to admin dashboard
    return <Navigate to="/admin/users" replace />;
  }

  return <>{children}</>;
}
