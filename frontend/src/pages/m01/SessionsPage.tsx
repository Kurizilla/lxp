import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, Button, LoadingSpinner } from '../../components/ui';
import { useM01AuthStore } from '../../stores/m01AuthStore';
import { m01AuthService } from '../../services/m01AuthService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import type { SessionInfo } from '../../types/api.types';

export function SessionsPage() {
  const { sessions, setSessions, removeSession } = useM01AuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null
  );
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSessions = await m01AuthService.getSessions();
      setSessions(fetchedSessions);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load sessions';
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [setSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await m01AuthService.revokeSession(sessionId);
      removeSession(sessionId);
      showSuccessToast('Session revoked successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to revoke session';
      showErrorToast(message);
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsRevokingAll(true);
    try {
      await m01AuthService.revokeAllSessions();
      // Refresh sessions list after revoking all
      await fetchSessions();
      showSuccessToast('All other sessions revoked successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to revoke sessions';
      showErrorToast(message);
    } finally {
      setIsRevokingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Active Sessions</h1>
          <p className="mt-1 text-gray-600">
            Manage your active sessions across devices
          </p>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" className="mx-auto" />
            <p className="mt-4 text-center text-gray-600">
              Loading sessions...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Session */}
            {currentSession && (
              <Card>
                <CardHeader
                  title="Current Session"
                  description="This is the device you're currently using"
                />
                <SessionItem session={currentSession} isCurrent />
              </Card>
            )}

            {/* Other Sessions */}
            <Card>
              <CardHeader
                title="Other Sessions"
                description="Sessions on other devices"
              >
                {otherSessions.length > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleRevokeAllSessions}
                    isLoading={isRevokingAll}
                    disabled={isRevokingAll}
                  >
                    Revoke All
                  </Button>
                )}
              </CardHeader>

              {otherSessions.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No other sessions
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You&apos;re only signed in on this device
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {otherSessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      onRevoke={() => handleRevokeSession(session.id)}
                      isRevoking={revokingSessionId === session.id}
                      getRelativeTime={getRelativeTime}
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* Security Notice */}
            <Card className="bg-amber-50 border-amber-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Security Tip
                  </h3>
                  <p className="mt-1 text-sm text-amber-700">
                    If you notice any sessions you don&apos;t recognize, revoke
                    them immediately and consider changing your password.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: SessionInfo;
  isCurrent?: boolean;
  onRevoke?: () => void;
  isRevoking?: boolean;
  getRelativeTime?: (dateString: string) => string;
}

function SessionItem({
  session,
  isCurrent = false,
  onRevoke,
  isRevoking = false,
  getRelativeTime,
}: SessionItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex items-start justify-between p-4 rounded-lg ${
        isCurrent ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div
          className={`p-2 rounded-lg ${
            isCurrent ? 'bg-green-100' : 'bg-gray-200'
          }`}
        >
          <svg
            className={`h-6 w-6 ${
              isCurrent ? 'text-green-600' : 'text-gray-600'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900">
              {session.deviceName}
            </h4>
            {isCurrent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Current
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            IP: {session.ipAddress}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last active:{' '}
            {getRelativeTime
              ? getRelativeTime(session.lastActivity)
              : formatDate(session.lastActivity)}
          </p>
          <p className="text-xs text-gray-400">
            Created: {formatDate(session.createdAt)}
          </p>
        </div>
      </div>
      {!isCurrent && onRevoke && (
        <Button
          variant="danger"
          size="sm"
          onClick={onRevoke}
          isLoading={isRevoking}
          disabled={isRevoking}
        >
          Revoke
        </Button>
      )}
    </div>
  );
}
