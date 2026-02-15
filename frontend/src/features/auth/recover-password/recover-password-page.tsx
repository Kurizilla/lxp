import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card, CardHeader, Alert } from '@/components/ui';
import { auth_service, ApiException } from '@/services';
import type { ForgotPasswordRequest } from '@/types';

interface FormErrors {
  email?: string;
}

/**
 * Validate forgot password form inputs
 */
function validate_form(values: ForgotPasswordRequest): FormErrors {
  const errors: FormErrors = {};

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Invalid email format';
  }

  return errors;
}

/**
 * Recover password page component
 * Allows users to request a password reset email
 */
export function RecoverPasswordPage() {
  const [email, set_email] = useState('');
  const [form_errors, set_form_errors] = useState<FormErrors>({});
  const [is_loading, set_is_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [success_message, set_success_message] = useState<string | null>(null);

  /**
   * Handle email input change
   */
  const handle_change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      set_email(e.target.value);
      // Clear errors on change
      if (form_errors.email) {
        set_form_errors({});
      }
      if (error) {
        set_error(null);
      }
      if (success_message) {
        set_success_message(null);
      }
    },
    [form_errors.email, error, success_message]
  );

  /**
   * Handle form submission
   */
  const handle_submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      const errors = validate_form({ email });
      if (Object.keys(errors).length > 0) {
        set_form_errors(errors);
        return;
      }

      set_is_loading(true);
      set_error(null);
      set_success_message(null);

      try {
        const response = await auth_service.forgot_password({ email });
        set_success_message(response.message);
        set_email('');
      } catch (err) {
        if (err instanceof ApiException) {
          set_error(err.message);
        } else {
          set_error('An unexpected error occurred');
        }
      } finally {
        set_is_loading(false);
      }
    },
    [email]
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader
          title="Reset your password"
          subtitle="Enter your email address and we'll send you a link to reset your password"
        />

        {error && (
          <Alert
            type="error"
            message={error}
            on_close={() => set_error(null)}
            className="mb-6"
          />
        )}

        {success_message && (
          <Alert
            type="success"
            message={success_message}
            on_close={() => set_success_message(null)}
            className="mb-6"
          />
        )}

        <form onSubmit={handle_submit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            name="email"
            value={email}
            onChange={handle_change}
            error={form_errors.email}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={is_loading}
          />

          <Button
            type="submit"
            is_loading={is_loading}
            className="w-full"
            disabled={is_loading}
          >
            Send reset link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
