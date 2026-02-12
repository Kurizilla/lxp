import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../../components/ui';
import { useForm } from '../../hooks/useForm';
import { useM01AuthStore } from '../../stores/m01AuthStore';
import { m01AuthService } from '../../services/m01AuthService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import type { LoginDto } from '../../types/api.types';

interface LoginFormValues {
  email: string;
  password: string;
}

const validationRules = {
  email: [
    {
      validate: (value: unknown) => {
        const str = value as string;
        return str.length > 0;
      },
      message: 'Email is required',
    },
    {
      validate: (value: unknown) => {
        const str = value as string;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
      },
      message: 'Please enter a valid email address',
    },
  ],
  password: [
    {
      validate: (value: unknown) => {
        const str = value as string;
        return str.length > 0;
      },
      message: 'Password is required',
    },
    {
      validate: (value: unknown) => {
        const str = value as string;
        return str.length >= 6;
      },
      message: 'Password must be at least 6 characters',
    },
  ],
};

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser, setError, setLoading, clearError, isLoading } =
    useM01AuthStore();

  const { values, errors, handleChange, handleBlur, handleSubmit, isSubmitting } =
    useForm<LoginFormValues>({
      initialValues: {
        email: '',
        password: '',
      },
      validationRules,
      onSubmit: async (formValues) => {
        clearError();
        setLoading(true);

        try {
          const credentials: LoginDto = {
            email: formValues.email,
            password: formValues.password,
          };

          const response = await m01AuthService.login(credentials);

          setTokens(response.accessToken, response.refreshToken);
          setUser(response.user);
          showSuccessToast('Login successful');

          // Navigate to institution selector after login
          navigate('/m01/select-institution');
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Login failed';
          setError(errorMessage);
          showErrorToast(errorMessage);
        } finally {
          setLoading(false);
        }
      },
    });

  const isFormSubmitting = isSubmitting || isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <Card className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              name="email"
              type="email"
              label="Email address"
              placeholder="Enter your email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              disabled={isFormSubmitting}
              autoComplete="email"
            />

            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              disabled={isFormSubmitting}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <Link
                to="/m01/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isFormSubmitting}
              disabled={isFormSubmitting}
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
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/m01/google-login">
                <Button variant="secondary" fullWidth type="button">
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
                  Sign in with Google
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/m01/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
