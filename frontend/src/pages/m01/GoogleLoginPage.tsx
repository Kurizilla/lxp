import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, Button, LoadingSpinner } from '../../components/ui';
import { useM01AuthStore } from '../../stores/m01AuthStore';
import { m01AuthService } from '../../services/m01AuthService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

type GoogleLoginStatus = 'idle' | 'loading' | 'error' | 'success';

export function GoogleLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokens, setUser, setError, clearError } = useM01AuthStore();
  const [status, setStatus] = useState<GoogleLoginStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleCallback = useCallback(
    async (token: string) => {
      setStatus('loading');
      clearError();

      try {
        const response = await m01AuthService.loginWithGoogle(token);

        setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
        setStatus('success');
        showSuccessToast('Successfully signed in with Google');

        // Navigate to institution selector after login
        navigate('/m01/select-institution');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Google authentication failed';
        setStatus('error');
        setErrorMessage(message);
        setError(message);
        showErrorToast(message);
      }
    },
    [navigate, setTokens, setUser, setError, clearError]
  );

  const initiateGoogleLogin = useCallback(() => {
    // In a real implementation, this would redirect to Google OAuth
    // For now, we'll redirect to the backend OAuth endpoint
    const googleAuthUrl = '/api/v1/modules/m01/est-auth/google/authorize';
    window.location.href = googleAuthUrl;
  }, []);

  useEffect(() => {
    // Check for OAuth callback with token/code in URL
    const token = searchParams.get('token');
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    if (token) {
      handleGoogleCallback(token);
    } else if (code) {
      // If we have a code, we need to exchange it for a token
      handleGoogleCallback(code);
    }
  }, [searchParams, handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Sign in with Google
          </h1>
          <p className="mt-2 text-gray-600">
            Use your Google account to sign in securely
          </p>
        </div>

        <Card className="mt-8">
          {status === 'loading' && (
            <div className="py-8 text-center">
              <LoadingSpinner size="lg" className="mx-auto" />
              <p className="mt-4 text-gray-600">
                Authenticating with Google...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Authentication failed
              </h3>
              <p className="mt-2 text-gray-600">
                {errorMessage || 'An error occurred during Google sign-in'}
              </p>
              <div className="mt-6 space-y-3">
                <Button onClick={initiateGoogleLogin} fullWidth>
                  Try again
                </Button>
                <Link to="/m01/login">
                  <Button variant="secondary" fullWidth>
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Successfully authenticated
              </h3>
              <p className="mt-2 text-gray-600">Redirecting...</p>
            </div>
          )}

          {status === 'idle' && (
            <div className="py-8">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-10 h-10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-gray-600">
                  Click the button below to sign in with your Google account
                </p>
              </div>

              <Button onClick={initiateGoogleLogin} fullWidth size="lg">
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <div className="mt-6 text-center">
                <Link
                  to="/m01/login"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Back to email login
                </Link>
              </div>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
