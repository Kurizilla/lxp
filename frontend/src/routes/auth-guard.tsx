import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { use_auth_store } from '@/store';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protected route guard
 * Redirects unauthenticated users to login page
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { is_authenticated, expires_at } = use_auth_store();
  const location = useLocation();

  // Check if token is expired
  const is_token_valid = expires_at ? Date.now() < expires_at : false;
  const has_valid_auth = is_authenticated && is_token_valid;

  if (!has_valid_auth) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Guest route guard
 * Redirects authenticated users to dashboard
 */
export function GuestGuard({ children }: AuthGuardProps) {
  const { is_authenticated, expires_at } = use_auth_store();

  // Check if token is valid
  const is_token_valid = expires_at ? Date.now() < expires_at : false;
  const has_valid_auth = is_authenticated && is_token_valid;

  if (has_valid_auth) {
    // Redirect to sessions page (or dashboard)
    return <Navigate to="/sessions" replace />;
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: React.ReactNode;
  required_permission?: string;
}

/**
 * Admin route guard
 * Ensures user is authenticated and has admin access
 * In the future, this can check for specific permissions/roles
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { is_authenticated, expires_at } = use_auth_store();
  const location = useLocation();

  // Check if token is valid
  const is_token_valid = expires_at ? Date.now() < expires_at : false;
  const has_valid_auth = is_authenticated && is_token_valid;

  if (!has_valid_auth) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For now, any authenticated user can access admin pages
  // In production, check user roles/permissions here
  // Example: const { user } = use_auth_store(); if (!user?.roles?.some(r => r.name === 'admin')) return <Navigate to="/unauthorized" />

  return <>{children}</>;
}

interface TeacherGuardProps {
  children: React.ReactNode;
}

/**
 * Teacher route guard
 * Ensures user is authenticated and has teacher access
 * In the future, this can check for teacher role via CASL RBAC
 */
export function TeacherGuard({ children }: TeacherGuardProps) {
  const { is_authenticated, expires_at } = use_auth_store();
  const location = useLocation();

  // Check if token is valid
  const is_token_valid = expires_at ? Date.now() < expires_at : false;
  const has_valid_auth = is_authenticated && is_token_valid;

  if (!has_valid_auth) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For now, any authenticated user can access teacher pages
  // In production, check user roles/permissions here for teacher role

  return <>{children}</>;
}
