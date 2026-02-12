import { useEffect, useState, useCallback } from 'react';
import { useM01NotificationStore } from '../../stores/m01NotificationStore';

export function NotificationPrefsPage() {
  const {
    preferences,
    preferencesLoading,
    preferencesError,
    fetchPreferences,
    updatePreferences,
  } = useM01NotificationStore();

  const [formState, setFormState] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: false,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Sync form state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setFormState({
        emailEnabled: preferences.emailEnabled,
        inAppEnabled: preferences.inAppEnabled,
        pushEnabled: preferences.pushEnabled,
      });
      setIsDirty(false);
    }
  }, [preferences]);

  const handleToggle = useCallback((field: keyof typeof formState) => {
    setFormState((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    setIsDirty(true);
    setSaveSuccess(false);
  }, []);

  const handleSave = useCallback(async () => {
    await updatePreferences(formState);
    setSaveSuccess(true);
    setIsDirty(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  }, [formState, updatePreferences]);

  const handleReset = useCallback(() => {
    if (preferences) {
      setFormState({
        emailEnabled: preferences.emailEnabled,
        inAppEnabled: preferences.inAppEnabled,
        pushEnabled: preferences.pushEnabled,
      });
      setIsDirty(false);
      setSaveSuccess(false);
    }
  }, [preferences]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Notification Preferences
        </h1>
        <p className="text-gray-600 mt-1">
          Manage how you receive notifications.
        </p>
      </div>

      {preferencesError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {preferencesError}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Preferences saved successfully!
        </div>
      )}

      {preferencesLoading && !preferences ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {/* Email Notifications */}
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Email Notifications
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Receive notifications via email.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formState.emailEnabled}
              onClick={() => handleToggle('emailEnabled')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formState.emailEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formState.emailEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* In-App Notifications */}
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                In-App Notifications
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Receive notifications within the application.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formState.inAppEnabled}
              onClick={() => handleToggle('inAppEnabled')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formState.inAppEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formState.inAppEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Receive push notifications on your device.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formState.pushEnabled}
              onClick={() => handleToggle('pushEnabled')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formState.pushEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formState.pushEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty || preferencesLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || preferencesLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {preferencesLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

export default NotificationPrefsPage;
