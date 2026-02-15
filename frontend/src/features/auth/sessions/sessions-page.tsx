import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, CardHeader, Alert } from '@/components/ui';
import { auth_service, ApiException } from '@/services';
import { use_auth_store } from '@/store';
import type { Session } from '@/types';

/**
 * Format date for display
 */
function format_date(date_string: string): string {
  const date = new Date(date_string);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parse user agent to get a friendly browser/device name
 */
function parse_user_agent(user_agent: string | null): string {
  if (!user_agent) return 'Unknown device';

  // Simple user agent parsing
  if (user_agent.includes('Chrome')) return 'Chrome Browser';
  if (user_agent.includes('Firefox')) return 'Firefox Browser';
  if (user_agent.includes('Safari')) return 'Safari Browser';
  if (user_agent.includes('Edge')) return 'Edge Browser';
  if (user_agent.includes('Mobile')) return 'Mobile Device';

  return 'Unknown Browser';
}

/**
 * Sessions page component
 * Displays list of active sessions with ability to revoke them
 */
export function SessionsPage() {
  const navigate = useNavigate();
  const { user, logout } = use_auth_store();

  const [sessions, set_sessions] = useState<Session[]>([]);
  const [total, set_total] = useState(0);
  const [is_loading, set_is_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);
  const [deleting_ids, set_deleting_ids] = useState<Set<string>>(new Set());

  /**
   * Fetch sessions list
   */
  const fetch_sessions = useCallback(async () => {
    set_is_loading(true);
    set_error(null);

    try {
      const response = await auth_service.get_sessions();
      set_sessions(response.sessions);
      set_total(response.total);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status_code === 401) {
          logout();
          navigate('/login');
          return;
        }
        set_error(err.message);
      } else {
        set_error('Failed to load sessions');
      }
    } finally {
      set_is_loading(false);
    }
  }, [logout, navigate]);

  /**
   * Handle session deletion
   */
  const handle_delete_session = useCallback(
    async (session_id: string, is_current: boolean) => {
      // Add confirmation for current session
      if (is_current) {
        const confirmed = window.confirm(
          'This is your current session. Revoking it will log you out. Continue?'
        );
        if (!confirmed) return;
      }

      set_deleting_ids((prev) => new Set([...prev, session_id]));
      set_error(null);

      try {
        await auth_service.delete_session(session_id);

        // If current session was deleted, logout
        if (is_current) {
          logout();
          navigate('/login');
          return;
        }

        // Refresh sessions list
        await fetch_sessions();
      } catch (err) {
        if (err instanceof ApiException) {
          set_error(err.message);
        } else {
          set_error('Failed to revoke session');
        }
      } finally {
        set_deleting_ids((prev) => {
          const next = new Set(prev);
          next.delete(session_id);
          return next;
        });
      }
    },
    [fetch_sessions, logout, navigate]
  );

  /**
   * Handle logout
   */
  const handle_logout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // Fetch sessions on mount
  useEffect(() => {
    fetch_sessions();
  }, [fetch_sessions]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Active Sessions</h1>
            {user && (
              <p className="text-gray-600 mt-1">
                Logged in as {user.email}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/users">
              <Button variant="primary">
                Admin Panel
              </Button>
            </Link>
            <Button variant="secondary" onClick={handle_logout}>
              Sign out
            </Button>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            on_close={() => set_error(null)}
            className="mb-6"
          />
        )}

        {/* Sessions card */}
        <Card>
          <CardHeader
            title="Your devices"
            subtitle={`${total} active session${total !== 1 ? 's' : ''}`}
          />

          {/* Loading state */}
          {is_loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No active sessions found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  is_deleting={deleting_ids.has(session.id)}
                  on_delete={() =>
                    handle_delete_session(session.id, session.is_current)
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/**
 * Session item component
 */
interface SessionItemProps {
  session: Session;
  is_deleting: boolean;
  on_delete: () => void;
}

function SessionItem({ session, is_deleting, on_delete }: SessionItemProps) {
  const browser_name = parse_user_agent(session.user_agent);
  const is_expired = new Date(session.expires_at) < new Date();

  return (
    <div className="flex items-center justify-between py-4 px-2">
      <div className="flex items-center gap-4">
        {/* Device icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Session info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{browser_name}</span>
            {session.is_current && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Current session
              </span>
            )}
            {is_expired && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Expired
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            <span>{session.ip_address || 'Unknown IP'}</span>
            <span className="mx-2">•</span>
            <span>Started {format_date(session.created_at)}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Expires {format_date(session.expires_at)}
          </div>
        </div>
      </div>

      {/* Delete button */}
      <Button
        variant="danger"
        size="sm"
        onClick={on_delete}
        is_loading={is_deleting}
        disabled={is_deleting}
      >
        {session.is_current ? 'Sign out' : 'Revoke'}
      </Button>
    </div>
  );
}
