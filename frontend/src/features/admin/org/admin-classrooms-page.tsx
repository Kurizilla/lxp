import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  Alert,
  DataTable,
  Modal,
  ConfirmModal,
  Input,
  Select,
  Badge,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import {
  admin_classrooms_service,
  admin_institutions_service,
  admin_subjects_service,
  ApiException,
} from '@/services';
import type {
  Classroom,
  Institution,
  Subject,
  CreateClassroomRequest,
  UpdateClassroomRequest,
} from '@/types';

const ITEMS_PER_PAGE = 10;

interface FormErrors {
  institution_id?: string;
  subject_id?: string;
  name?: string;
  section?: string;
  academic_year?: string;
}

/**
 * Validate classroom form
 */
function validate_classroom_form(
  values: CreateClassroomRequest | UpdateClassroomRequest,
  is_create: boolean
): FormErrors {
  const errors: FormErrors = {};

  if (is_create) {
    const create_values = values as CreateClassroomRequest;
    if (!create_values.institution_id) {
      errors.institution_id = 'Institution is required';
    }
    if (!create_values.subject_id) {
      errors.subject_id = 'Subject is required';
    }
    if (!create_values.name || create_values.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
  } else {
    const update_values = values as UpdateClassroomRequest;
    if (update_values.name !== undefined && update_values.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
  }

  return errors;
}

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
 * Admin Classrooms Page
 * Displays list of classrooms with CRUD operations
 */
export function AdminClassroomsPage() {
  // Data state
  const [classrooms, set_classrooms] = useState<Classroom[]>([]);
  const [institutions, set_institutions] = useState<Institution[]>([]);
  const [subjects, set_subjects] = useState<Subject[]>([]);
  const [total, set_total] = useState(0);
  const [offset, set_offset] = useState(0);

  // Filter state
  const [search, set_search] = useState('');
  const [status_filter, set_status_filter] = useState<string>('');
  const [institution_filter, set_institution_filter] = useState<string>('');
  const [subject_filter, set_subject_filter] = useState<string>('');

  // Loading state
  const [is_loading, set_is_loading] = useState(true);
  const [is_submitting, set_is_submitting] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // Modal state
  const [show_create_modal, set_show_create_modal] = useState(false);
  const [show_edit_modal, set_show_edit_modal] = useState(false);
  const [show_delete_modal, set_show_delete_modal] = useState(false);
  const [selected_classroom, set_selected_classroom] = useState<Classroom | null>(null);

  // Form state
  const [form_values, set_form_values] = useState<CreateClassroomRequest>({
    institution_id: '',
    subject_id: '',
    name: '',
    section: '',
    academic_year: '',
    is_active: true,
  });
  const [form_errors, set_form_errors] = useState<FormErrors>({});

  /**
   * Fetch classrooms list
   */
  const fetch_classrooms = useCallback(async () => {
    set_is_loading(true);
    set_error(null);

    try {
      const params: Record<string, unknown> = {
        offset,
        limit: ITEMS_PER_PAGE,
      };

      if (search) {
        params.search = search;
      }

      if (status_filter !== '') {
        params.is_active = status_filter === 'active';
      }

      if (institution_filter) {
        params.institution_id = institution_filter;
      }

      if (subject_filter) {
        params.subject_id = subject_filter;
      }

      const response = await admin_classrooms_service.list(
        params as Parameters<typeof admin_classrooms_service.list>[0]
      );
      set_classrooms(response.classrooms);
      set_total(response.total);
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load classrooms');
      }
    } finally {
      set_is_loading(false);
    }
  }, [offset, search, status_filter, institution_filter, subject_filter]);

  /**
   * Fetch institutions and subjects for dropdowns
   */
  const fetch_options = useCallback(async () => {
    try {
      const [institutions_response, subjects_response] = await Promise.all([
        admin_institutions_service.list({ limit: 100 }),
        admin_subjects_service.list({ limit: 100 }),
      ]);
      // Filter active ones client-side since backend doesn't support is_active filter
      set_institutions(institutions_response.institutions.filter(i => i.is_active));
      set_subjects(subjects_response.subjects.filter(s => s.is_active));
    } catch {
      // Silently fail - options are needed for dropdowns
    }
  }, []);

  /**
   * Handle search
   */
  const handle_search = useCallback(() => {
    set_offset(0);
    fetch_classrooms();
  }, [fetch_classrooms]);

  /**
   * Handle create classroom
   */
  const handle_create = useCallback(async () => {
    const errors = validate_classroom_form(form_values, true);
    if (Object.keys(errors).length > 0) {
      set_form_errors(errors);
      return;
    }

    set_is_submitting(true);
    try {
      await admin_classrooms_service.create(form_values);
      set_success('Classroom created successfully');
      set_show_create_modal(false);
      reset_form();
      fetch_classrooms();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to create classroom');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [form_values, fetch_classrooms]);

  /**
   * Handle update classroom
   */
  const handle_update = useCallback(async () => {
    if (!selected_classroom) return;

    const update_data: UpdateClassroomRequest = {};
    if (form_values.institution_id !== selected_classroom.institution_id) {
      update_data.institution_id = form_values.institution_id;
    }
    if (form_values.subject_id !== selected_classroom.subject_id) {
      update_data.subject_id = form_values.subject_id;
    }
    if (form_values.name !== selected_classroom.name) {
      update_data.name = form_values.name;
    }
    if (form_values.section !== (selected_classroom.section || '')) {
      update_data.section = form_values.section;
    }
    if (form_values.academic_year !== (selected_classroom.academic_year || '')) {
      update_data.academic_year = form_values.academic_year;
    }
    if (form_values.is_active !== selected_classroom.is_active) {
      update_data.is_active = form_values.is_active;
    }

    const errors = validate_classroom_form(update_data, false);
    if (Object.keys(errors).length > 0) {
      set_form_errors(errors);
      return;
    }

    set_is_submitting(true);
    try {
      await admin_classrooms_service.update(selected_classroom.id, update_data);
      set_success('Classroom updated successfully');
      set_show_edit_modal(false);
      reset_form();
      fetch_classrooms();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to update classroom');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_classroom, form_values, fetch_classrooms]);

  /**
   * Handle delete classroom
   */
  const handle_delete = useCallback(async () => {
    if (!selected_classroom) return;

    set_is_submitting(true);
    try {
      await admin_classrooms_service.delete(selected_classroom.id);
      set_success('Classroom deleted successfully');
      set_show_delete_modal(false);
      set_selected_classroom(null);
      fetch_classrooms();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to delete classroom');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_classroom, fetch_classrooms]);

  /**
   * Reset form state
   */
  const reset_form = () => {
    set_form_values({
      institution_id: '',
      subject_id: '',
      name: '',
      section: '',
      academic_year: '',
      is_active: true,
    });
    set_form_errors({});
    set_selected_classroom(null);
  };

  /**
   * Open edit modal
   */
  const open_edit_modal = (classroom: Classroom) => {
    set_selected_classroom(classroom);
    set_form_values({
      institution_id: classroom.institution_id,
      subject_id: classroom.subject_id,
      name: classroom.name,
      section: classroom.section || '',
      academic_year: classroom.academic_year || '',
      is_active: classroom.is_active,
    });
    set_form_errors({});
    set_show_edit_modal(true);
  };

  /**
   * Open delete modal
   */
  const open_delete_modal = (classroom: Classroom) => {
    set_selected_classroom(classroom);
    set_show_delete_modal(true);
  };

  // Fetch data on mount
  useEffect(() => {
    fetch_classrooms();
    fetch_options();
  }, [fetch_classrooms, fetch_options]);

  // Table columns
  const columns: Column<Classroom>[] = [
    {
      key: 'name',
      header: 'Classroom',
      render: (classroom) => (
        <div>
          <div className="font-medium">{classroom.name}</div>
          {classroom.section && (
            <div className="text-sm text-gray-500">Section: {classroom.section}</div>
          )}
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Institution',
      render: (classroom) =>
        classroom.institution ? (
          <div>
            <div className="text-sm">{classroom.institution.name}</div>
            <div className="text-xs text-gray-500">{classroom.institution.code}</div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (classroom) =>
        classroom.subject ? (
          <div>
            <div className="text-sm">{classroom.subject.name}</div>
            <div className="text-xs text-gray-500">{classroom.subject.code}</div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'academic_year',
      header: 'Academic Year',
      render: (classroom) =>
        classroom.academic_year || <span className="text-gray-400">-</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (classroom) => (
        <Badge variant={classroom.is_active ? 'success' : 'danger'}>
          {classroom.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (classroom) => format_date(classroom.created_at),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Classrooms</h1>
            <p className="text-gray-600 mt-1">Manage classrooms and sections</p>
          </div>
          <Button onClick={() => set_show_create_modal(true)}>
            Create Classroom
          </Button>
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

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Search"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => set_search(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handle_search()}
              />
            </div>
            <div className="w-48">
              <Select
                label="Institution"
                options={[
                  { value: '', label: 'All' },
                  ...institutions.map((i) => ({
                    value: i.id,
                    label: i.name,
                  })),
                ]}
                value={institution_filter}
                onChange={(e) => {
                  set_institution_filter(e.target.value);
                  set_offset(0);
                }}
              />
            </div>
            <div className="w-48">
              <Select
                label="Subject"
                options={[
                  { value: '', label: 'All' },
                  ...subjects.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
                value={subject_filter}
                onChange={(e) => {
                  set_subject_filter(e.target.value);
                  set_offset(0);
                }}
              />
            </div>
            <div className="w-32">
              <Select
                label="Status"
                options={[
                  { value: '', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                value={status_filter}
                onChange={(e) => {
                  set_status_filter(e.target.value);
                  set_offset(0);
                }}
              />
            </div>
            <Button onClick={handle_search}>Search</Button>
          </div>
        </Card>

        {/* Data table */}
        <Card>
          <DataTable
            columns={columns}
            data={classrooms}
            get_row_key={(classroom) => classroom.id}
            is_loading={is_loading}
            empty_message="No classrooms found"
            total={total}
            offset={offset}
            limit={ITEMS_PER_PAGE}
            on_page_change={set_offset}
            row_actions={(classroom) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => open_edit_modal(classroom)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => open_delete_modal(classroom)}
                >
                  Delete
                </Button>
              </div>
            )}
          />
        </Card>

        {/* Create Modal */}
        <Modal
          is_open={show_create_modal}
          on_close={() => {
            set_show_create_modal(false);
            reset_form();
          }}
          title="Create Classroom"
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  set_show_create_modal(false);
                  reset_form();
                }}
                disabled={is_submitting}
              >
                Cancel
              </Button>
              <Button onClick={handle_create} is_loading={is_submitting}>
                Create
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Institution"
                options={institutions.map((i) => ({
                  value: i.id,
                  label: `${i.name} (${i.code})`,
                }))}
                value={form_values.institution_id}
                onChange={(e) =>
                  set_form_values((prev) => ({
                    ...prev,
                    institution_id: e.target.value,
                  }))
                }
                error={form_errors.institution_id}
                placeholder="Select institution"
              />
              <Select
                label="Subject"
                options={subjects.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.code})`,
                }))}
                value={form_values.subject_id}
                onChange={(e) =>
                  set_form_values((prev) => ({
                    ...prev,
                    subject_id: e.target.value,
                  }))
                }
                error={form_errors.subject_id}
                placeholder="Select subject"
              />
            </div>
            <Input
              label="Name"
              name="name"
              value={form_values.name}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, name: e.target.value }))
              }
              error={form_errors.name}
              placeholder="Classroom name"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Section"
                name="section"
                value={form_values.section || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, section: e.target.value }))
                }
                error={form_errors.section}
                placeholder="e.g., A, B, C"
              />
              <Input
                label="Academic Year"
                name="academic_year"
                value={form_values.academic_year || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({
                    ...prev,
                    academic_year: e.target.value,
                  }))
                }
                error={form_errors.academic_year}
                placeholder="e.g., 2024-2025"
              />
            </div>
            <Select
              label="Status"
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              value={form_values.is_active ? 'true' : 'false'}
              onChange={(e) =>
                set_form_values((prev) => ({
                  ...prev,
                  is_active: e.target.value === 'true',
                }))
              }
            />
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          is_open={show_edit_modal}
          on_close={() => {
            set_show_edit_modal(false);
            reset_form();
          }}
          title="Edit Classroom"
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  set_show_edit_modal(false);
                  reset_form();
                }}
                disabled={is_submitting}
              >
                Cancel
              </Button>
              <Button onClick={handle_update} is_loading={is_submitting}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Institution"
                options={institutions.map((i) => ({
                  value: i.id,
                  label: `${i.name} (${i.code})`,
                }))}
                value={form_values.institution_id}
                onChange={(e) =>
                  set_form_values((prev) => ({
                    ...prev,
                    institution_id: e.target.value,
                  }))
                }
                error={form_errors.institution_id}
              />
              <Select
                label="Subject"
                options={subjects.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.code})`,
                }))}
                value={form_values.subject_id}
                onChange={(e) =>
                  set_form_values((prev) => ({
                    ...prev,
                    subject_id: e.target.value,
                  }))
                }
                error={form_errors.subject_id}
              />
            </div>
            <Input
              label="Name"
              name="name"
              value={form_values.name}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, name: e.target.value }))
              }
              error={form_errors.name}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Section"
                name="section"
                value={form_values.section || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, section: e.target.value }))
                }
                error={form_errors.section}
              />
              <Input
                label="Academic Year"
                name="academic_year"
                value={form_values.academic_year || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({
                    ...prev,
                    academic_year: e.target.value,
                  }))
                }
                error={form_errors.academic_year}
              />
            </div>
            <Select
              label="Status"
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              value={form_values.is_active ? 'true' : 'false'}
              onChange={(e) =>
                set_form_values((prev) => ({
                  ...prev,
                  is_active: e.target.value === 'true',
                }))
              }
            />
          </div>
        </Modal>

        {/* Delete Modal */}
        <ConfirmModal
          is_open={show_delete_modal}
          on_close={() => {
            set_show_delete_modal(false);
            set_selected_classroom(null);
          }}
          on_confirm={handle_delete}
          title="Delete Classroom"
          message={`Are you sure you want to delete "${selected_classroom?.name}"? This action cannot be undone.`}
          confirm_text="Delete"
          is_loading={is_submitting}
          variant="danger"
        />
      </div>
    </div>
  );
}
