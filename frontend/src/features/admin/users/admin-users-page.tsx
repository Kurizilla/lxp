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
  CheckboxList,
  Badge,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import {
  admin_users_service,
  admin_roles_service,
  ApiException,
} from '@/services';
import type {
  AdminUser,
  AdminRole,
  CreateUserRequest,
  UpdateUserRequest,
} from '@/types';

const ITEMS_PER_PAGE = 10;

interface FormErrors {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Validate user form
 */
function validate_user_form(
  values: CreateUserRequest | UpdateUserRequest,
  is_create: boolean
): FormErrors {
  const errors: FormErrors = {};

  if (is_create) {
    const create_values = values as CreateUserRequest;
    if (!create_values.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(create_values.email)) {
      errors.email = 'Invalid email format';
    }

    if (create_values.password && create_values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
  } else {
    const update_values = values as UpdateUserRequest;
    if (update_values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update_values.email)) {
      errors.email = 'Invalid email format';
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
 * Admin Users Page
 * Displays list of users with CRUD operations
 */
export function AdminUsersPage() {
  // Data state
  const [users, set_users] = useState<AdminUser[]>([]);
  const [roles, set_roles] = useState<AdminRole[]>([]);
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
  const [show_roles_modal, set_show_roles_modal] = useState(false);
  const [selected_user, set_selected_user] = useState<AdminUser | null>(null);

  // Form state
  const [form_values, set_form_values] = useState<CreateUserRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_active: true,
  });
  const [form_errors, set_form_errors] = useState<FormErrors>({});
  const [selected_roles, set_selected_roles] = useState<string[]>([]);

  /**
   * Fetch users list
   */
  const fetch_users = useCallback(async () => {
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

      const response = await admin_users_service.list(params as Parameters<typeof admin_users_service.list>[0]);
      set_users(response.users);
      set_total(response.total);
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load users');
      }
    } finally {
      set_is_loading(false);
    }
  }, [offset, search, status_filter]);

  /**
   * Fetch roles list
   */
  const fetch_roles = useCallback(async () => {
    try {
      const response = await admin_roles_service.list({ limit: 100 });
      set_roles(response.roles);
    } catch {
      // Silently fail - roles are optional for display
    }
  }, []);

  /**
   * Handle search
   */
  const handle_search = useCallback(() => {
    set_offset(0);
    fetch_users();
  }, [fetch_users]);

  /**
   * Handle create user
   */
  const handle_create = useCallback(async () => {
    const errors = validate_user_form(form_values, true);
    if (Object.keys(errors).length > 0) {
      set_form_errors(errors);
      return;
    }

    set_is_submitting(true);
    try {
      await admin_users_service.create(form_values);
      set_success('User created successfully');
      set_show_create_modal(false);
      reset_form();
      fetch_users();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to create user');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [form_values, fetch_users]);

  /**
   * Handle update user
   */
  const handle_update = useCallback(async () => {
    if (!selected_user) return;

    const update_data: UpdateUserRequest = {};
    if (form_values.email !== selected_user.email) {
      update_data.email = form_values.email;
    }
    if (form_values.first_name !== (selected_user.first_name || '')) {
      update_data.first_name = form_values.first_name;
    }
    if (form_values.last_name !== (selected_user.last_name || '')) {
      update_data.last_name = form_values.last_name;
    }
    if (form_values.is_active !== selected_user.is_active) {
      update_data.is_active = form_values.is_active;
    }

    const errors = validate_user_form(update_data, false);
    if (Object.keys(errors).length > 0) {
      set_form_errors(errors);
      return;
    }

    set_is_submitting(true);
    try {
      await admin_users_service.update(selected_user.id, update_data);
      set_success('User updated successfully');
      set_show_edit_modal(false);
      reset_form();
      fetch_users();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to update user');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_user, form_values, fetch_users]);

  /**
   * Handle delete user
   */
  const handle_delete = useCallback(async () => {
    if (!selected_user) return;

    set_is_submitting(true);
    try {
      await admin_users_service.delete(selected_user.id);
      set_success('User deleted successfully');
      set_show_delete_modal(false);
      set_selected_user(null);
      fetch_users();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to delete user');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_user, fetch_users]);

  /**
   * Handle assign roles
   */
  const handle_assign_roles = useCallback(async () => {
    if (!selected_user) return;

    set_is_submitting(true);
    try {
      await admin_users_service.assign_roles(selected_user.id, {
        role_ids: selected_roles,
      });
      set_success('Roles assigned successfully');
      set_show_roles_modal(false);
      set_selected_user(null);
      set_selected_roles([]);
      fetch_users();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to assign roles');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_user, selected_roles, fetch_users]);

  /**
   * Reset form state
   */
  const reset_form = () => {
    set_form_values({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      is_active: true,
    });
    set_form_errors({});
    set_selected_user(null);
  };

  /**
   * Open edit modal
   */
  const open_edit_modal = (user: AdminUser) => {
    set_selected_user(user);
    set_form_values({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
    });
    set_form_errors({});
    set_show_edit_modal(true);
  };

  /**
   * Open roles modal
   */
  const open_roles_modal = (user: AdminUser) => {
    set_selected_user(user);
    set_selected_roles(user.roles?.map((r) => r.id) || []);
    set_show_roles_modal(true);
  };

  /**
   * Open delete modal
   */
  const open_delete_modal = (user: AdminUser) => {
    set_selected_user(user);
    set_show_delete_modal(true);
  };

  // Fetch data on mount
  useEffect(() => {
    fetch_users();
    fetch_roles();
  }, [fetch_users, fetch_roles]);

  // Table columns
  const columns: Column<AdminUser>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (user) => (
        <div>
          <div className="font-medium">{user.email}</div>
          {user.google_id && (
            <span className="text-xs text-gray-500">Google linked</span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (user) => {
        const full_name = [user.first_name, user.last_name]
          .filter(Boolean)
          .join(' ');
        return full_name || <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (user) =>
        user.roles && user.roles.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge key={role.id} variant="info">
                {role.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">No roles</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.is_active ? 'success' : 'danger'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (user) => format_date(user.created_at),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
          </div>
          <Button onClick={() => set_show_create_modal(true)}>
            Create User
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
                placeholder="Search by email or name..."
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
            data={users}
            get_row_key={(user) => user.id}
            is_loading={is_loading}
            empty_message="No users found"
            total={total}
            offset={offset}
            limit={ITEMS_PER_PAGE}
            on_page_change={set_offset}
            row_actions={(user) => (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => open_roles_modal(user)}>
                  Roles
                </Button>
                <Button size="sm" variant="secondary" onClick={() => open_edit_modal(user)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => open_delete_modal(user)}>
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
          title="Create User"
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
              label="Email"
              type="email"
              name="email"
              value={form_values.email}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, email: e.target.value }))
              }
              error={form_errors.email}
              placeholder="user@example.com"
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form_values.password || ''}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, password: e.target.value }))
              }
              error={form_errors.password}
              placeholder="Leave empty for auto-generated"
              helper_text="Min 8 characters. Leave empty to send invite email."
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                value={form_values.first_name || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, first_name: e.target.value }))
                }
                error={form_errors.first_name}
              />
              <Input
                label="Last Name"
                name="last_name"
                value={form_values.last_name || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, last_name: e.target.value }))
                }
                error={form_errors.last_name}
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
          title="Edit User"
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
              label="Email"
              type="email"
              name="email"
              value={form_values.email}
              onChange={(e) =>
                set_form_values((prev) => ({ ...prev, email: e.target.value }))
              }
              error={form_errors.email}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                value={form_values.first_name || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, first_name: e.target.value }))
                }
                error={form_errors.first_name}
              />
              <Input
                label="Last Name"
                name="last_name"
                value={form_values.last_name || ''}
                onChange={(e) =>
                  set_form_values((prev) => ({ ...prev, last_name: e.target.value }))
                }
                error={form_errors.last_name}
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
            set_selected_user(null);
          }}
          on_confirm={handle_delete}
          title="Delete User"
          message={`Are you sure you want to delete user "${selected_user?.email}"? This action cannot be undone.`}
          confirm_text="Delete"
          is_loading={is_submitting}
          variant="danger"
        />

        {/* Roles Modal */}
        <Modal
          is_open={show_roles_modal}
          on_close={() => {
            set_show_roles_modal(false);
            set_selected_user(null);
            set_selected_roles([]);
          }}
          title={`Assign Roles - ${selected_user?.email}`}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  set_show_roles_modal(false);
                  set_selected_user(null);
                  set_selected_roles([]);
                }}
                disabled={is_submitting}
              >
                Cancel
              </Button>
              <Button onClick={handle_assign_roles} is_loading={is_submitting}>
                Save Roles
              </Button>
            </>
          }
        >
          <CheckboxList
            label="Select roles to assign"
            options={roles.map((role) => ({
              value: role.id,
              label: role.name + (role.description ? ` - ${role.description}` : ''),
            }))}
            selected={selected_roles}
            on_change={set_selected_roles}
            max_height="300px"
          />
        </Modal>
      </div>
    </div>
  );
}
