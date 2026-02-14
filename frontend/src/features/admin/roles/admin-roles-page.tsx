import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  Alert,
  DataTable,
  Modal,
  CheckboxList,
  Badge,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import {
  admin_roles_service,
  admin_permissions_service,
  ApiException,
} from '@/services';
import type { AdminRole, AdminPermission } from '@/types';

const ITEMS_PER_PAGE = 10;

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
 * Admin Roles Page
 * Displays list of roles with permission assignment
 */
export function AdminRolesPage() {
  // Data state
  const [roles, set_roles] = useState<AdminRole[]>([]);
  const [permissions, set_permissions] = useState<AdminPermission[]>([]);
  const [total, set_total] = useState(0);
  const [offset, set_offset] = useState(0);

  // Loading state
  const [is_loading, set_is_loading] = useState(true);
  const [is_submitting, set_is_submitting] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // Modal state
  const [show_permissions_modal, set_show_permissions_modal] = useState(false);
  const [show_view_modal, set_show_view_modal] = useState(false);
  const [selected_role, set_selected_role] = useState<AdminRole | null>(null);

  // Form state
  const [selected_permissions, set_selected_permissions] = useState<string[]>([]);

  /**
   * Fetch roles list
   */
  const fetch_roles = useCallback(async () => {
    set_is_loading(true);
    set_error(null);

    try {
      const response = await admin_roles_service.list({
        offset,
        limit: ITEMS_PER_PAGE,
      });
      set_roles(response.roles);
      set_total(response.total);
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load roles');
      }
    } finally {
      set_is_loading(false);
    }
  }, [offset]);

  /**
   * Fetch permissions list
   */
  const fetch_permissions = useCallback(async () => {
    try {
      const response = await admin_permissions_service.list({ limit: 200 });
      set_permissions(response.permissions);
    } catch {
      // Silently fail - permissions list is needed for assignment
    }
  }, []);

  /**
   * Handle assign permissions
   */
  const handle_assign_permissions = useCallback(async () => {
    if (!selected_role) return;

    set_is_submitting(true);
    try {
      await admin_roles_service.assign_permissions(selected_role.id, {
        permission_ids: selected_permissions,
      });
      set_success('Permissions assigned successfully');
      set_show_permissions_modal(false);
      set_selected_role(null);
      set_selected_permissions([]);
      fetch_roles();
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to assign permissions');
      }
    } finally {
      set_is_submitting(false);
    }
  }, [selected_role, selected_permissions, fetch_roles]);

  /**
   * Open permissions modal
   */
  const open_permissions_modal = (role: AdminRole) => {
    set_selected_role(role);
    set_selected_permissions(role.permissions?.map((p) => p.id) || []);
    set_show_permissions_modal(true);
  };

  /**
   * Open view modal
   */
  const open_view_modal = (role: AdminRole) => {
    set_selected_role(role);
    set_show_view_modal(true);
  };

  // Fetch data on mount
  useEffect(() => {
    fetch_roles();
    fetch_permissions();
  }, [fetch_roles, fetch_permissions]);

  // Group permissions by resource for display
  const grouped_permissions = permissions.reduce<Record<string, AdminPermission[]>>(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {}
  );

  // Table columns
  const columns: Column<AdminRole>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (role) => (
        <div>
          <div className="font-medium">{role.name}</div>
          {role.description && (
            <div className="text-sm text-gray-500">{role.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'is_system',
      header: 'Type',
      render: (role) => (
        <Badge variant={role.is_system ? 'warning' : 'default'}>
          {role.is_system ? 'System' : 'Custom'}
        </Badge>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (role) => (
        <span className="text-sm text-gray-600">
          {role.permissions?.length || 0} permissions
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (role) => format_date(role.created_at),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
            <p className="text-gray-600 mt-1">
              Manage roles and their permissions
            </p>
          </div>
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

        {/* Info */}
        <Card className="mb-6">
          <div className="p-4">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> System roles cannot be deleted. You can
              only modify permissions for custom roles.
            </p>
          </div>
        </Card>

        {/* Data table */}
        <Card>
          <DataTable
            columns={columns}
            data={roles}
            get_row_key={(role) => role.id}
            is_loading={is_loading}
            empty_message="No roles found"
            total={total}
            offset={offset}
            limit={ITEMS_PER_PAGE}
            on_page_change={set_offset}
            row_actions={(role) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => open_view_modal(role)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => open_permissions_modal(role)}
                >
                  Permissions
                </Button>
              </div>
            )}
          />
        </Card>

        {/* View Modal */}
        <Modal
          is_open={show_view_modal}
          on_close={() => {
            set_show_view_modal(false);
            set_selected_role(null);
          }}
          title={`Role: ${selected_role?.name}`}
          size="lg"
          footer={
            <Button
              variant="secondary"
              onClick={() => {
                set_show_view_modal(false);
                set_selected_role(null);
              }}
            >
              Close
            </Button>
          }
        >
          {selected_role && (
            <div className="space-y-4">
              <div>
                <label className="label">Description</label>
                <p className="text-gray-700">
                  {selected_role.description || 'No description'}
                </p>
              </div>
              <div>
                <label className="label">Type</label>
                <Badge variant={selected_role.is_system ? 'warning' : 'default'}>
                  {selected_role.is_system ? 'System Role' : 'Custom Role'}
                </Badge>
              </div>
              <div>
                <label className="label">
                  Permissions ({selected_role.permissions?.length || 0})
                </label>
                {selected_role.permissions && selected_role.permissions.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mt-2">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Resource
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Action
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selected_role.permissions.map((permission) => (
                          <tr key={permission.id}>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {permission.resource}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <Badge variant="info">{permission.action}</Badge>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {permission.name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No permissions assigned</p>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Permissions Modal */}
        <Modal
          is_open={show_permissions_modal}
          on_close={() => {
            set_show_permissions_modal(false);
            set_selected_role(null);
            set_selected_permissions([]);
          }}
          title={`Assign Permissions - ${selected_role?.name}`}
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  set_show_permissions_modal(false);
                  set_selected_role(null);
                  set_selected_permissions([]);
                }}
                disabled={is_submitting}
              >
                Cancel
              </Button>
              <Button onClick={handle_assign_permissions} is_loading={is_submitting}>
                Save Permissions
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {Object.entries(grouped_permissions).map(
              ([resource, resource_permissions]) => (
                <div key={resource}>
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">
                    {resource}
                  </h4>
                  <CheckboxList
                    options={resource_permissions.map((p) => ({
                      value: p.id,
                      label: `${p.action} - ${p.name}`,
                    }))}
                    selected={selected_permissions}
                    on_change={set_selected_permissions}
                    max_height="150px"
                  />
                </div>
              )
            )}
            {Object.keys(grouped_permissions).length === 0 && (
              <p className="text-gray-500">No permissions available</p>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
