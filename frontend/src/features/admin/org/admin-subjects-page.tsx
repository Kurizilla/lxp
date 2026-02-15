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
import { admin_subjects_service, ApiException } from '@/services';
import type { Subject, CreateSubjectRequest, UpdateSubjectRequest } from '@/types';

const ITEMS_PER_PAGE = 10;

interface FormErrors {
  code?: string;
  name?: string;
  description?: string;
  grade?: string;
}

/**
 * Validate subject form
 */
function validate_subject_form(
  values: CreateSubjectRequest | UpdateSubjectRequest,
  is_create: boolean
): FormErrors {
  const errors: FormErrors = {};

  if (is_create) {
    const create_values = values as CreateSubjectRequest;
    if (!create_values.code || create_values.code.length < 2) {
      errors.code = 'Code must be at least 2 characters';
    }
    if (!create_values.name || create_values.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
  } else {
    const update_values = values as UpdateSubjectRequest;
    if (update_values.code !== undefined && update_values.code.length < 2) {
      errors.code = 'Code must be at least 2 characters';
    }
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
 * Admin Subjects Page
 * Displays list of subjects with CRUD operations
 */
export function AdminSubjectsPage() {
  // Data state
  const [subjects, set_subjects] = useState<Subject[]>([]);
  const [total, set_total] = useState(0);
  const [offset, set_offset] = useState(0);

  // Filter state
  const [search, set_search] = useState('');
  const [status_filter, set_status_filter] = useState<string>('');

  // Loading state
  const [is_loading, set_is_loading] = useState(true);
  const [is_submitting, set_is_submitting] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // Modal state
  const [show_create_modal, set_show_create_modal] = useState(false);
  const [show_edit_modal, set_show_edit_modal] = useState(false);
  const [show_delete_modal, set_show_delete_modal] = useState(false);
  const [selected_subject, set_selected_subject] = useState<Subject | null>(null);

  // Form state
  const [form_values, set_form_values] = useState<CreateSubjectRequest>({
    code: '',
    name: '',
    description: '',
    grade: '',
    is_active: true,
  });
  const [form_errors, set_form_errors] = useState<FormErrors>({});

  /**
   * Fetch subjects list
   */
  const fetch_subjects = useCallback(async () => {
    set_is_loading(true);
    set_error(null);

    try {
      const response = await admin_subjects_service.list({
        offset,
        limit: ITEMS_PER_PAGE,
      });
      // Apply client-side filtering since backend doesn't support it
      let filtered = response.subjects;
      if (search) {
        const search_lower = search.toLowerCase();
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(search_lower) || 
          s.code.toLowerCase().includes(search_lower)
        );
      }
      if (status_filter !== '') {
        const is_active = status_filter === 'active';
        filtered = filtered.filter(s => s.is_active === is_active);
      }
      set_subjects(filtered);
      set_total(filtered.length);
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load subjects');
      }
    } finally {
      set_is_loading(false);
    }
  }, [offset, search, status_filter]);

  /**
   * Handle search
   */
  const handle_search = useCallback(() => {
    set_offset(0);
    fetch_subjects();
  }, [fetch_subjects]);

  /**
   * Handle create subject
   */
  const handle_create = useCallback(async () => {
    const errors = validate_subject_form(form_values, true);
    if (Object.keys(errors).length > 0) {
      set_form_errors(errors);
      return;
    }

    set_is_submitting(true);
    try {
      await admin_subjects_service.create(form_values);
      set_success('Subject created successfully');
      set_show_create_modal(false);
      reset_form();
      fetch_subjects();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to create subject');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [form_values, fetch_subjects]);

  /**
   * Handle update subject
   */
  const handle_update = useCallback(async () => {
    if (!selected_subject) return;

    const update_data: UpdateSubjectRequest = {};
    if (form_values.code !== selected_subject.code) {
      update_data.code = form_values.code;
    }
    if (form_values.name !== selected_subject.name) {
      update_data.name = form_values.name;
    }
    if (form_values.description !== (selected_subject.description || '')) {
      update_data.description = form_values.description;
    }
    if (form_values.grade !== (selected_subject.grade || '')) {
      update_data.grade = form_values.grade;
    }
    if (form_values.is_active !== selected_subject.is_active) {
      update_data.is_active = form_values.is_active;
    }

    const errors = validate_subject_form(update_data, false);
    if (Object.keys(errors).length > 0) {
      set_form_errors(errors);
      return;
    }

    set_is_submitting(true);
    try {
      await admin_subjects_service.update(selected_subject.id, update_data);
      set_success('Subject updated successfully');
      set_show_edit_modal(false);
      reset_form();
      fetch_subjects();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to update subject');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_subject, form_values, fetch_subjects]);

  /**
   * Handle delete subject
   */
  const handle_delete = useCallback(async () => {
    if (!selected_subject) return;

    set_is_submitting(true);
    try {
      await admin_subjects_service.delete(selected_subject.id);
      set_success('Subject deleted successfully');
      set_show_delete_modal(false);
      set_selected_subject(null);
      fetch_subjects();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to delete subject');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_subject, fetch_subjects]);

  /**
   * Reset form state
   */
  const reset_form = () => {
    set_form_values({
      code: '',
      name: '',
      description: '',
      grade: '',
      is_active: true,
    });
    set_form_errors({});
    set_selected_subject(null);
  };

  /**
   * Open edit modal
   */
  const open_edit_modal = (subject: Subject) => {
    set_selected_subject(subject);
    set_form_values({
      code: subject.code,
      name: subject.name,
      description: subject.description || '',
      grade: subject.grade || '',
      is_active: subject.is_active,
    });
    set_form_errors({});
    set_show_edit_modal(true);
  };

  /**
   * Open delete modal
   */
  const open_delete_modal = (subject: Subject) => {
    set_selected_subject(subject);
    set_show_delete_modal(true);
  };

  // Fetch data on mount
  useEffect(() => {
    fetch_subjects();
  }, [fetch_subjects]);

  // Table columns
  const columns: Column<Subject>[] = [
    {
      key: 'name',
      header: 'Subject',
      render: (subject) => (
        <div>
          <div className="font-medium">{subject.name}</div>
          <div className="text-sm text-gray-500">{subject.code}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (subject) =>
        subject.description ? (
          <span className="text-sm text-gray-600 line-clamp-2">
            {subject.description}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (subject) =>
        subject.grade ? (
          <Badge variant="info">{subject.grade}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (subject) => (
        <Badge variant={subject.is_active ? 'success' : 'danger'}>
          {subject.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (subject) => format_date(subject.created_at),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
            <p className="text-gray-600 mt-1">Manage academic subjects</p>
          </div>
          <Button onClick={() => set_show_create_modal(true)}>
            Create Subject
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
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => set_search(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handle_search()}
              />
            </div>
            <div className="w-40">
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
            data={subjects}
            get_row_key={(subject) => subject.id}
            is_loading={is_loading}
            empty_message="No subjects found"
            total={total}
            offset={offset}
            limit={ITEMS_PER_PAGE}
            on_page_change={set_offset}
            row_actions={(subject) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => open_edit_modal(subject)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => open_delete_modal(subject)}
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
          title="Create Subject"
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
              <Input
                label="Code"
                name="code"
                value={form_values.code}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, code: e.target.value }))
                }
                error={form_errors.code}
                placeholder="e.g., MATH101"
              />
              <Input
                label="Grade"
                name="grade"
                value={form_values.grade || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, grade: e.target.value }))
                }
                error={form_errors.grade}
                placeholder="e.g., Grade 10"
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
              placeholder="Subject name"
            />
            <Input
              label="Description"
              name="description"
              value={form_values.description || ''}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, description: e.target.value }))
              }
              error={form_errors.description}
              placeholder="Subject description"
            />
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
          title="Edit Subject"
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
              <Input
                label="Code"
                name="code"
                value={form_values.code}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, code: e.target.value }))
                }
                error={form_errors.code}
              />
              <Input
                label="Grade"
                name="grade"
                value={form_values.grade || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, grade: e.target.value }))
                }
                error={form_errors.grade}
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
            <Input
              label="Description"
              name="description"
              value={form_values.description || ''}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, description: e.target.value }))
              }
              error={form_errors.description}
            />
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
            set_selected_subject(null);
          }}
          on_confirm={handle_delete}
          title="Delete Subject"
          message={`Are you sure you want to delete "${selected_subject?.name}"? This action cannot be undone.`}
          confirm_text="Delete"
          is_loading={is_submitting}
          variant="danger"
        />
      </div>
    </div>
  );
}
