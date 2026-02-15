import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  Alert,
  Select,
  Badge,
} from '@/components/ui';
import { teacher_service, ApiException } from '@/services';
import type { TeacherInstitution } from '@/types';

/**
 * Format date for display
 */
function format_date(date_string: string): string {
  const date = new Date(date_string);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Select Institution Page
 * Allows teacher to select their active institution from assigned ones
 */
export function SelectInstitutionPage() {
  const navigate = useNavigate();

  // Data state
  const [institutions, set_institutions] = useState<TeacherInstitution[]>([]);
  const [selected_institution_id, set_selected_institution_id] = useState<string>('');
  const [selected_institution, set_selected_institution] = useState<TeacherInstitution | null>(null);

  // Loading state
  const [is_loading, set_is_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);

  /**
   * Fetch institutions
   */
  const fetch_institutions = useCallback(async () => {
    set_is_loading(true);
    set_error(null);

    try {
      const response = await teacher_service.get_institutions();
      set_institutions(response.institutions);

      // Auto-select if only one institution
      if (response.institutions.length === 1) {
        const inst = response.institutions[0];
        set_selected_institution_id(inst.id);
        set_selected_institution(inst);
      }
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load institutions');
      }
    } finally {
      set_is_loading(false);
    }
  }, []);

  /**
   * Handle institution selection change
   */
  const handle_selection_change = (institution_id: string) => {
    set_selected_institution_id(institution_id);
    const inst = institutions.find((i) => i.id === institution_id) || null;
    set_selected_institution(inst);
  };

  /**
   * Handle continue to classroom selection
   */
  const handle_continue = () => {
    if (selected_institution_id) {
      navigate(`/teacher/select-classroom?institution_id=${selected_institution_id}`);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetch_institutions();
  }, [fetch_institutions]);

  // Build select options
  const institution_options = institutions.map((inst) => ({
    value: inst.id,
    label: `${inst.name} (${inst.code})`,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader
            title="Select Institution"
            subtitle="Choose your institution to view available classrooms"
          />

          {/* Error alert */}
          {error && (
            <Alert
              type="error"
              message={error}
              on_close={() => set_error(null)}
              className="mb-4"
            />
          )}

          {/* Loading state */}
          {is_loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading institutions...</span>
            </div>
          ) : institutions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No institutions assigned to you yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Contact your administrator to be assigned to an institution.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Institution selector */}
              <Select
                label="Institution"
                options={institution_options}
                value={selected_institution_id}
                onChange={(e) => handle_selection_change(e.target.value)}
                placeholder="Select an institution..."
              />

              {/* Selected institution details */}
              {selected_institution && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {selected_institution.name}
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Code</dt>
                      <dd className="font-medium">{selected_institution.code}</dd>
                    </div>
                    {selected_institution.address && (
                      <div>
                        <dt className="text-gray-500">Address</dt>
                        <dd className="font-medium">{selected_institution.address}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Status</dt>
                      <dd>
                        <Badge variant={selected_institution.is_active ? 'success' : 'danger'}>
                          {selected_institution.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Joined</dt>
                      <dd className="font-medium">{format_date(selected_institution.joined_at)}</dd>
                    </div>
                    {selected_institution.role_context && (
                      <div className="sm:col-span-2">
                        <dt className="text-gray-500">Role</dt>
                        <dd>
                          <Badge variant="info">{selected_institution.role_context}</Badge>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={handle_continue}
                  disabled={!selected_institution_id}
                >
                  Continue to Classrooms
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Institutions list */}
        {!is_loading && institutions.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">
              Your Institutions ({institutions.length})
            </h3>
            <div className="space-y-3">
              {institutions.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => handle_selection_change(inst.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selected_institution_id === inst.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{inst.name}</h4>
                      <p className="text-sm text-gray-500">{inst.code}</p>
                    </div>
                    <Badge variant={inst.is_active ? 'success' : 'danger'}>
                      {inst.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
