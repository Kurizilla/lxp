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
import { admin_institutions_service, ApiException } from '@/services';
import type { Institution, CreateInstitutionRequest, UpdateInstitutionRequest } from '@/types';

const ITEMS_PER_PAGE = 10;

interface FormErrors {
  name?: string;
  code?: string;
  address?: string;
}

/**
 * Validate institution form
 */
function validate_institution_form(
  values: CreateInstitutionRequest | UpdateInstitutionRequest,
  is_create: boolean
): FormErrors {
  const errors: FormErrors = {};

  if (is_create) {
    const create_values = values as CreateInstitutionRequest;
    if (!create_values.name || create_values.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!create_values.code || create_values.code.length < 2) {
      errors.code = 'Code must be at least 2 characters';
    }
  } else {
    const update_values = values as UpdateInstitutionRequest;
    if (update_values.name !== undefined && update_values.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (update_values.code !== undefined && update_values.code.length < 2) {
      errors.code = 'Code must be at least 2 characters';
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
 * Admin Institutions Page
 * Displays list of institutions with CRUD operations
 */
export function AdminInstitutionsPage() {
  // Data state
  const [institutions, set_institutions] = useState<Institution[]>([]);
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
  const [selected_institution, set_selected_institution] = useState<Institution | null>(null);

  // Form state
  const [form_values, set_form_values] = useState<CreateInstitutionRequest>({
    name: '',
    code: '',
    address: '',
    is_active: true,
  });
  const [form_errors, set_form_errors] = useState<FormErrors>({});

  /**
   * Fetch institutions list
   */
  const fetch_institutions = useCallback(async () => {
    set_is_loading(true);
    set_error(null);

    try {
      const response = await admin_institutions_service.list({
        offset,
        limit: ITEMS_PER_PAGE,
      });
      // Apply client-side filtering since backend doesn't support it
      let filtered = response.institutions;
      if (search) {
        const search_lower = search.toLowerCase();
        filtered = filtered.filter(i => 
          i.name.toLowerCase().includes(search_lower) || 
          i.code.toLowerCase().includes(search_lower)
        );
      }
      if (status_filter !== '') {
        const is_active = status_filter === 'active';
        filtered = filtered.filter(i => i.is_active === is_active);
      }
      set_institutions(filtered);
      set_total(filtered.length);
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load institutions');
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
    fetch_institutions();
  }, [fetch_institutions]);

  /**
   * Handle create institution
   */
  const handle_create = useCallback(async () => {
    const errors = validate_institution_form(form_values, true);
    if (Object.keys(errors).length > 0) {
      set_form_errors(errors);
      return;
    }

    set_is_submitting(true);
    try {
      await admin_institutions_service.create(form_values);
      set_success('Institution created successfully');
      set_show_create_modal(false);
      reset_form();
      fetch_institutions();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to create institution');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [form_values, fetch_institutions]);

  /**
   * Handle update institution
   */
  const handle_update = useCallback(async () => {
    if (!selected_institution) return;

    const update_data: UpdateInstitutionRequest = {};
    if (form_values.name !== selected_institution.name) {
      update_data.name = form_values.name;
    }
    if (form_values.code !== selected_institution.code) {
      update_data.code = form_values.code;
    }
    if (form_values.address !== (selected_institution.address || '')) {
      update_data.address = form_values.address;
    }
    if (form_values.is_active !== selected_institution.is_active) {
      update_data.is_active = form_values.is_active;
    }

    const errors = validate_institution_form(update_data, false);
    if (Object.keys(errors).length > 0) {
      set_form_errors(errors);
      return;
    }

    set_is_submitting(true);
    try {
      await admin_institutions_service.update(selected_institution.id, update_data);
      set_success('Institution updated successfully');
      set_show_edit_modal(false);
      reset_form();
      fetch_institutions();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to update institution');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_institution, form_values, fetch_institutions]);

  /**
   * Handle delete institution
   */
  const handle_delete = useCallback(async () => {
    if (!selected_institution) return;

    set_is_submitting(true);
    try {
      await admin_institutions_service.delete(selected_institution.id);
      set_success('Institution deleted successfully');
      set_show_delete_modal(false);
      set_selected_institution(null);
      fetch_institutions();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to delete institution');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_institution, fetch_institutions]);

  /**
   * Reset form state
   */
  const reset_form = () => {
    set_form_values({
      name: '',
      code: '',
      address: '',
      is_active: true,
    });
    set_form_errors({});
    set_selected_institution(null);
  };

  /**
   * Open edit modal
   */
  const open_edit_modal = (institution: Institution) => {
    set_selected_institution(institution);
    set_form_values({
      name: institution.name,
      code: institution.code,
      address: institution.address || '',
      is_active: institution.is_active,
    });
    set_form_errors({});
    set_show_edit_modal(true);
  };

  /**
   * Open delete modal
   */
  const open_delete_modal = (institution: Institution) => {
    set_selected_institution(institution);
    set_show_delete_modal(true);
  };

  // Fetch data on mount
  useEffect(() => {
    fetch_institutions();
  }, [fetch_institutions]);

  // Table columns
  const columns: Column<Institution>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (institution) => (
        <div>
          <div className="font-medium">{institution.name}</div>
          <div className="text-sm text-gray-500">{institution.code}</div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (institution) =>
        institution.address || <span className="text-gray-400">-</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (institution) => (
        <Badge variant={institution.is_active ? 'success' : 'danger'}>
          {institution.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (institution) => format_date(institution.created_at),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
            <p className="text-gray-600 mt-1">Manage educational institutions</p>
          </div>
          <Button onClick={() => set_show_create_modal(true)}>
            Create Institution
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
            data={institutions}
            get_row_key={(institution) => institution.id}
            is_loading={is_loading}
            empty_message="No institutions found"
            total={total}
            offset={offset}
            limit={ITEMS_PER_PAGE}
            on_page_change={set_offset}
            row_actions={(institution) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => open_edit_modal(institution)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => open_delete_modal(institution)}
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
          title="Create Institution"
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
            <Input
              label="Name"
              name="name"
              value={form_values.name}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, name: e.target.value }))
              }
              error={form_errors.name}
              placeholder="Institution name"
            />
            <Input
              label="Code"
              name="code"
              value={form_values.code}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, code: e.target.value }))
              }
              error={form_errors.code}
              placeholder="Unique code (e.g., UNIV01)"
            />
            <Input
              label="Address"
              name="address"
              value={form_values.address || ''}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, address: e.target.value }))
              }
              error={form_errors.address}
              placeholder="Institution address"
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
          title="Edit Institution"
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
              label="Code"
              name="code"
              value={form_values.code}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, code: e.target.value }))
              }
              error={form_errors.code}
            />
            <Input
              label="Address"
              name="address"
              value={form_values.address || ''}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, address: e.target.value }))
              }
              error={form_errors.address}
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
            set_selected_institution(null);
          }}
          on_confirm={handle_delete}
          title="Delete Institution"
          message={`Are you sure you want to delete "${selected_institution?.name}"? This action cannot be undone.`}
          confirm_text="Delete"
          is_loading={is_submitting}
          variant="danger"
        />
      </div>
    </div>
  );
}
