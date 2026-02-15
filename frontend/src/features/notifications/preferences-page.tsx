import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  Alert,
} from '@/components/ui';
import { notification_service, ApiException } from '@/services';
import type {
  NotificationPreference,
  PreferenceItem,
  NotificationType,
  NotificationChannel,
} from '@/types';

/**
 * Notification types with labels
 */
const NOTIFICATION_TYPES: { value: NotificationType; label: string; description: string }[] = [
  { value: 'system' as NotificationType, label: 'System', description: 'System updates and maintenance' },
  { value: 'announcement' as NotificationType, label: 'Announcements', description: 'School and class announcements' },
  { value: 'reminder' as NotificationType, label: 'Reminders', description: 'Assignment and deadline reminders' },
  { value: 'alert' as NotificationType, label: 'Alerts', description: 'Important alerts and warnings' },
  { value: 'message' as NotificationType, label: 'Messages', description: 'Direct messages from users' },
];

/**
 * Notification channels with labels
 */
const NOTIFICATION_CHANNELS: { value: NotificationChannel; label: string; icon: string }[] = [
  { value: 'in_app' as NotificationChannel, label: 'In-App', icon: '📱' },
  { value: 'email' as NotificationChannel, label: 'Email', icon: '📧' },
  { value: 'push' as NotificationChannel, label: 'Push', icon: '🔔' },
  { value: 'sms' as NotificationChannel, label: 'SMS', icon: '💬' },
];

/**
 * Build preference key from type and channel
 */
function get_preference_key(type: string, channel: string): string {
  return `${type}_${channel}`;
}

/**
 * Preferences Page
 * Allows users to toggle notification preferences by type and channel
 */
export function PreferencesPage() {
  // Data state
  const [preferences, set_preferences] = useState<NotificationPreference[]>([]);
  const [preference_map, set_preference_map] = useState<Map<string, boolean>>(new Map());

  // Track pending changes
  const [pending_changes, set_pending_changes] = useState<PreferenceItem[]>([]);
  const [has_changes, set_has_changes] = useState(false);

  // Loading state
  const [is_loading, set_is_loading] = useState(true);
  const [is_saving, set_is_saving] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  /**
   * Fetch preferences
   */
  const fetch_preferences = useCallback(async () => {
    set_is_loading(true);
    set_error(null);

    try {
      const response = await notification_service.get_preferences();
      set_preferences(response.preferences);

      // Build preference map for quick lookup
      const map = new Map<string, boolean>();
      for (const pref of response.preferences) {
        const key = get_preference_key(pref.type, pref.channel);
        map.set(key, pref.enabled);
      }
      set_preference_map(map);
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load preferences');
      }
    } finally {
      set_is_loading(false);
    }
  }, []);

  /**
   * Handle toggle change
   */
  const handle_toggle = (type: NotificationType, channel: NotificationChannel) => {
    const key = get_preference_key(type, channel);
    const current_value = preference_map.get(key) ?? true;
    const new_value = !current_value;

    // Update local state
    const new_map = new Map(preference_map);
    new_map.set(key, new_value);
    set_preference_map(new_map);

    // Track pending change
    set_pending_changes((prev) => {
      // Remove existing change for this type/channel if any
      const filtered = prev.filter(
        (p) => !(p.type === type && p.channel === channel)
      );
      // Add new change
      return [...filtered, { type, channel, enabled: new_value }];
    });
    set_has_changes(true);
  };

  /**
   * Handle save
   */
  const handle_save = async () => {
    if (pending_changes.length === 0) return;

    set_is_saving(true);
    set_error(null);

    try {
      const response = await notification_service.update_preferences({
        preferences: pending_changes,
      });

      set_success(response.message || 'Preferences saved successfully');
      set_pending_changes([]);
      set_has_changes(false);

      // Refresh preferences
      await fetch_preferences();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to save preferences');
      }
    } finally {
      set_is_saving(false);
    }
  };

  /**
   * Handle reset/cancel
   */
  const handle_reset = () => {
    // Rebuild preference map from original data
    const map = new Map<string, boolean>();
    for (const pref of preferences) {
      const key = get_preference_key(pref.type, pref.channel);
      map.set(key, pref.enabled);
    }
    set_preference_map(map);
    set_pending_changes([]);
    set_has_changes(false);
  };

  /**
   * Check if a preference is enabled
   */
  const is_enabled = (type: string, channel: string): boolean => {
    const key = get_preference_key(type, channel);
    return preference_map.get(key) ?? true; // Default to enabled
  };

  // Fetch data on mount
  useEffect(() => {
    fetch_preferences();
  }, [fetch_preferences]);

  // Clear success message after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => set_success(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
            <p className="text-gray-600 mt-1">
              Customize how you receive notifications
            </p>
          </div>
          <Link to="/notifications">
            <Button variant="secondary">
              Back to Notifications
            </Button>
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            on_close={() => set_error(null)}
            className="mb-4"
          />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            on_close={() => set_success(null)}
            className="mb-4"
          />
        )}

        {/* Preferences table */}
        <Card>
          {is_loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading preferences...</span>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Notification Type
                      </th>
                      {NOTIFICATION_CHANNELS.map((channel) => (
                        <th
                          key={channel.value}
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-900"
                        >
                          <span className="mr-1">{channel.icon}</span>
                          {channel.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {NOTIFICATION_TYPES.map((type) => (
                      <tr key={type.value} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </td>
                        {NOTIFICATION_CHANNELS.map((channel) => (
                          <td key={channel.value} className="px-4 py-4 text-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={is_enabled(type.value, channel.value)}
                                onChange={() => handle_toggle(type.value, channel.value)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view */}
              <div className="md:hidden space-y-6 p-4">
                {NOTIFICATION_TYPES.map((type) => (
                  <div key={type.value} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="mb-3">
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {NOTIFICATION_CHANNELS.map((channel) => (
                        <label
                          key={channel.value}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <span className="text-sm text-gray-700">
                            {channel.icon} {channel.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={is_enabled(type.value, channel.value)}
                            onChange={() => handle_toggle(type.value, channel.value)}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-500">
                  {has_changes ? (
                    <span className="text-yellow-600">
                      You have unsaved changes
                    </span>
                  ) : (
                    'Your preferences are saved'
                  )}
                </div>
                <div className="flex gap-2">
                  {has_changes && (
                    <Button
                      variant="secondary"
                      onClick={handle_reset}
                      disabled={is_saving}
                    >
                      Reset
                    </Button>
                  )}
                  <Button
                    onClick={handle_save}
                    disabled={!has_changes}
                    is_loading={is_saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Info card */}
        <Card className="mt-6">
          <CardHeader
            title="About Notifications"
            subtitle="How notification channels work"
          />
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <span className="font-medium">📱 In-App:</span> Notifications appear in the notifications
              center when you're using the application.
            </p>
            <p>
              <span className="font-medium">📧 Email:</span> Notifications are sent to your registered
              email address.
            </p>
            <p>
              <span className="font-medium">🔔 Push:</span> Notifications are sent to your device even
              when the app is closed (requires browser permissions).
            </p>
            <p>
              <span className="font-medium">💬 SMS:</span> Text messages are sent to your registered
              phone number (if available).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
