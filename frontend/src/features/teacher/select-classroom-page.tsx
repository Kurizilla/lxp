import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  Alert,
  Select,
  Badge,
} from '@/components/ui';
import { teacher_service, ApiException } from '@/services';
import type { TeacherClassroom, TeacherInstitution } from '@/types';

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
 * Select Classroom Page
 * Allows teacher to select their active classroom, optionally filtered by institution
 */
export function SelectClassroomPage() {
  const navigate = useNavigate();
  const [search_params] = useSearchParams();
  const institution_id_param = search_params.get('institution_id');

  // Data state
  const [institutions, set_institutions] = useState<TeacherInstitution[]>([]);
  const [filtered_classrooms, set_filtered_classrooms] = useState<TeacherClassroom[]>([]);
  
  // Selection state
  const [selected_institution_id, set_selected_institution_id] = useState<string>(
    institution_id_param || ''
  );
  const [selected_classroom_id, set_selected_classroom_id] = useState<string>('');
  const [selected_classroom, set_selected_classroom] = useState<TeacherClassroom | null>(null);

  // Loading state
  const [is_loading, set_is_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);

  /**
   * Fetch institutions for filter dropdown
   */
  const fetch_institutions = useCallback(async () => {
    try {
      const response = await teacher_service.get_institutions();
      set_institutions(response.institutions);
    } catch {
      // Silently fail - filter is optional
    }
  }, []);

  /**
   * Fetch classrooms
   */
  const fetch_classrooms = useCallback(async () => {
    set_is_loading(true);
    set_error(null);

    try {
      const response = await teacher_service.get_classrooms(
        selected_institution_id ? { institution_id: selected_institution_id } : undefined
      );
      set_filtered_classrooms(response.classrooms);

      // Auto-select if only one classroom
      if (response.classrooms.length === 1) {
        const cls = response.classrooms[0];
        set_selected_classroom_id(cls.id);
        set_selected_classroom(cls);
      }
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load classrooms');
      }
    } finally {
      set_is_loading(false);
    }
  }, [selected_institution_id]);

  /**
   * Handle institution filter change
   */
  const handle_institution_change = (institution_id: string) => {
    set_selected_institution_id(institution_id);
    set_selected_classroom_id('');
    set_selected_classroom(null);
  };

  /**
   * Handle classroom selection change
   */
  const handle_classroom_change = (classroom_id: string) => {
    set_selected_classroom_id(classroom_id);
    const cls = filtered_classrooms.find((c) => c.id === classroom_id) || null;
    set_selected_classroom(cls);
  };

  /**
   * Handle continue - placeholder for classroom context setting
   */
  const handle_continue = () => {
    if (selected_classroom) {
      // In a real app, this would set the active classroom in store/context
      // For now, navigate to assistant or dashboard
      navigate('/assistant');
    }
  };

  // Fetch institutions on mount
  useEffect(() => {
    fetch_institutions();
  }, [fetch_institutions]);

  // Fetch classrooms when institution filter changes
  useEffect(() => {
    fetch_classrooms();
  }, [fetch_classrooms]);

  // Build select options
  const institution_options = [
    { value: '', label: 'All Institutions' },
    ...institutions.map((inst) => ({
      value: inst.id,
      label: `${inst.name} (${inst.code})`,
    })),
  ];

  const classroom_options = filtered_classrooms.map((cls) => ({
    value: cls.id,
    label: `${cls.name}${cls.section ? ` - ${cls.section}` : ''} (${cls.subject.name})`,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader
            title="Select Classroom"
            subtitle="Choose your classroom to start teaching"
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

          {/* Filters and selection */}
          <div className="space-y-4">
            {/* Institution filter */}
            {institutions.length > 1 && (
              <Select
                label="Filter by Institution"
                options={institution_options}
                value={selected_institution_id}
                onChange={(e) => handle_institution_change(e.target.value)}
              />
            )}

            {/* Loading state */}
            {is_loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Loading classrooms...</span>
              </div>
            ) : filtered_classrooms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No classrooms available.</p>
                <p className="text-sm text-gray-400 mt-2">
                  {selected_institution_id
                    ? 'Try selecting a different institution.'
                    : 'Contact your administrator to be enrolled in a classroom.'}
                </p>
                {institution_id_param && (
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => navigate('/teacher/select-institution')}
                  >
                    Back to Institutions
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Classroom selector */}
                <Select
                  label="Classroom"
                  options={classroom_options}
                  value={selected_classroom_id}
                  onChange={(e) => handle_classroom_change(e.target.value)}
                  placeholder="Select a classroom..."
                />

                {/* Selected classroom details */}
                {selected_classroom && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {selected_classroom.name}
                      {selected_classroom.section && (
                        <span className="text-gray-500 font-normal">
                          {' '}
                          - {selected_classroom.section}
                        </span>
                      )}
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-gray-500">Subject</dt>
                        <dd className="font-medium">
                          {selected_classroom.subject.name}
                          <span className="text-gray-400 ml-1">
                            ({selected_classroom.subject.code})
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Institution</dt>
                        <dd className="font-medium">
                          {selected_classroom.institution.name}
                        </dd>
                      </div>
                      {selected_classroom.subject.grade && (
                        <div>
                          <dt className="text-gray-500">Grade</dt>
                          <dd className="font-medium">{selected_classroom.subject.grade}</dd>
                        </div>
                      )}
                      {selected_classroom.academic_year && (
                        <div>
                          <dt className="text-gray-500">Academic Year</dt>
                          <dd className="font-medium">{selected_classroom.academic_year}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-gray-500">Status</dt>
                        <dd>
                          <Badge variant={selected_classroom.is_active ? 'success' : 'danger'}>
                            {selected_classroom.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Your Role</dt>
                        <dd>
                          <Badge variant="info">{selected_classroom.role}</Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Enrolled</dt>
                        <dd className="font-medium">{format_date(selected_classroom.enrolled_at)}</dd>
                      </div>
                    </dl>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/teacher/select-institution')}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handle_continue}
                    disabled={!selected_classroom_id}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Classrooms list */}
        {!is_loading && filtered_classrooms.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">
              Available Classrooms ({filtered_classrooms.length})
            </h3>
            <div className="space-y-3">
              {filtered_classrooms.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handle_classroom_change(cls.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selected_classroom_id === cls.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {cls.name}
                        {cls.section && (
                          <span className="text-gray-500 font-normal"> - {cls.section}</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {cls.subject.name} @ {cls.institution.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={cls.is_active ? 'success' : 'danger'}>
                        {cls.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="info">{cls.role}</Badge>
                    </div>
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
