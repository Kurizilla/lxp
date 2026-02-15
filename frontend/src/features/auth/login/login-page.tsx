import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, CardHeader, Alert } from '@/components/ui';
import { auth_service, ApiException } from '@/services';
import { use_auth_store, detect_user_role } from '@/store';
import type { LoginRequest } from '@/types';

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Validate login form inputs
 */
function validate_form(values: LoginRequest): FormErrors {
  const errors: FormErrors = {};

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Invalid email format';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
}

/**
 * Login page component
 * Supports email/password and Google OAuth authentication
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { set_auth, set_user_role, set_loading, set_error, is_loading, error, clear_error } =
    use_auth_store();

  const [form_values, set_form_values] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [form_errors, set_form_errors] = useState<FormErrors>({});
  const [google_loading, set_google_loading] = useState(false);

  /**
   * Handle input changes
   */
  const handle_change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      set_form_values((prev) => ({ ...prev, [name]: value }));
      // Clear field error on change
      if (form_errors[name as keyof FormErrors]) {
        set_form_errors((prev) => ({ ...prev, [name]: undefined }));
      }
      // Clear general error
      if (error) {
        clear_error();
      }
    },
    [form_errors, error, clear_error]
  );

  /**
   * Handle email/password form submission
   */
  const handle_submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      const errors = validate_form(form_values);
      if (Object.keys(errors).length > 0) {
        set_form_errors(errors);
        return;
      }

      set_loading(true);
      try {
        const response = await auth_service.login(form_values);
        set_auth({
          user: response.user,
          access_token: response.access_token,
          token_type: response.token_type,
          expires_in: response.expires_in,
        });

        // Detect user role based on API access
        const role = await detect_user_role(response.access_token);
        set_user_role(role);

        // Redirect based on role
        if (role === 'admin') {
          navigate('/admin/users');
        } else if (role === 'teacher') {
          navigate('/teacher/select-institution');
        } else {
          navigate('/sessions');
        }
      } catch (err) {
        if (err instanceof ApiException) {
          set_error(err.message);
        } else {
          set_error('An unexpected error occurred');
        }
      }
    },
    [form_values, set_auth, set_user_role, set_loading, set_error, navigate]
  );

  /**
   * Handle Google OAuth login
   * This triggers Google's OAuth flow and receives an ID token
   */
  const handle_google_login = useCallback(async () => {
    set_google_loading(true);
    clear_error();

    try {
      // Check if Google Sign-In is available
      if (typeof google === 'undefined' || !google.accounts) {
        // Fallback: Show message that Google Sign-In needs configuration
        set_error(
          'Google Sign-In is not configured. Please set up Google OAuth credentials.'
        );
        set_google_loading(false);
        return;
      }

      // Initialize Google Sign-In
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: async (response: { credential: string }) => {
          try {
            const result = await auth_service.google_login({
              id_token: response.credential,
            });
            set_auth({
              user: result.user,
              access_token: result.access_token,
              token_type: result.token_type,
              expires_in: result.expires_in,
            });

            // Detect user role based on API access
            const role = await detect_user_role(result.access_token);
            set_user_role(role);

            // Redirect based on role
            if (role === 'admin') {
              navigate('/admin/users');
            } else if (role === 'teacher') {
              navigate('/teacher/select-institution');
            } else {
              navigate('/sessions');
            }
          } catch (err) {
            if (err instanceof ApiException) {
              set_error(err.message);
            } else {
              set_error('Google login failed');
            }
          } finally {
            set_google_loading(false);
          }
        },
      });

      // Prompt for account selection
      google.accounts.id.prompt();
    } catch {
      set_error('Failed to initialize Google Sign-In');
      set_google_loading(false);
    }
  }, [set_auth, set_user_role, set_error, clear_error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader
          title="Sign in to your account"
          subtitle="Enter your credentials to access your account"
        />

        {error && (
          <Alert
            type="error"
            message={error}
            on_close={clear_error}
            className="mb-6"
          />
        )}

        <form onSubmit={handle_submit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            name="email"
            value={form_values.email}
            onChange={handle_change}
            error={form_errors.email}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={is_loading}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={form_values.password}
            onChange={handle_change}
            error={form_errors.password}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={is_loading}
          />

          <div className="flex items-center justify-between">
            <Link
              to="/recover-password"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            is_loading={is_loading}
            className="w-full"
            disabled={is_loading || google_loading}
          >
            Sign in
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={handle_google_login}
              is_loading={google_loading}
              disabled={is_loading || google_loading}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Declare google type for TypeScript
declare const google: {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      prompt: () => void;
    };
  };
};
