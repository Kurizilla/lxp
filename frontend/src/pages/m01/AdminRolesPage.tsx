import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { DataTable, Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { useRolesStore } from '../../store/rolesStore';
import { useAuthStore } from '../../store/authStore';
import { Role, CreateRoleDto, UpdateRoleDto, ALL_PERMISSIONS, Permission } from '../../types/api';

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

const initialFormData: RoleFormData = {
  name: '',
  description: '',
  permissions: [],
  isActive: true,
};

export function AdminRolesPage() {
  const {
    roles,
    total,
    page,
    limit,
    search,
    isLoading,
    error,
    selectedRole,
    isModalOpen,
    modalMode,
    fetchRoles,
    setPage,
    setLimit,
    setSearch,
    createRole,
    updateRole,
    deleteRole,
    openModal,
    closeModal,
    clearError,
  } = useRolesStore();

  const { hasPermission } = useAuthStore();

  const [formData, setFormData] = useState<RoleFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<RoleFormData>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);

  const canCreate = hasPermission('roles:create');
  const canUpdate = hasPermission('roles:update');
  const canDelete = hasPermission('roles:delete');

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRole && modalMode === 'edit') {
      setFormData({
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedRole.permissions,
        isActive: selectedRole.isActive,
      });
    } else {
      setFormData(initialFormData);
    }
    setFormErrors({});
  }, [selectedRole, modalMode, isModalOpen]);

  const validateForm = (): boolean => {
    const errors: Partial<RoleFormData> = {};

    if (!formData.name) {
      errors.name = 'Name is required';
    }

    if (!formData.description) {
      errors.description = 'Description is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (modalMode === 'create') {
        const createData: CreateRoleDto = {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          isActive: formData.isActive,
        };
        await createRole(createData);
      } else if (selectedRole) {
        const updateData: UpdateRoleDto = {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          isActive: formData.isActive,
        };
        await updateRole(selectedRole.id, updateData);
      }
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteRole(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  const handlePermissionToggle = (permission: Permission) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter((p) => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSelectAllPermissions = () => {
    if (formData.permissions.length === ALL_PERMISSIONS.length) {
      setFormData({ ...formData, permissions: [] });
    } else {
      setFormData({ ...formData, permissions: [...ALL_PERMISSIONS] });
    }
  };

  // Group permissions by resource
  const permissionGroups = ALL_PERMISSIONS.reduce((groups, permission) => {
    const [resource] = permission.split(':');
    if (!groups[resource]) {
      groups[resource] = [];
    }
    groups[resource].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (role) => (
        <span className="font-medium text-gray-900">{role.name}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (role) => role.description,
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (role) => (
        <span className="text-sm text-gray-500">
          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (role) => <StatusBadge isActive={role.isActive} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (role) => (
        <div className="flex gap-2">
          {canUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('edit', role);
              }}
              className="text-blue-600 hover:text-blue-900"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(role);
              }}
              className="text-red-600 hover:text-red-900"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Role Management">
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header with Search and Create button */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search roles..."
            />
          </div>
          {canCreate && (
            <button
              onClick={() => openModal('create')}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Add Role
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <DataTable
            columns={columns}
            data={roles}
            isLoading={isLoading}
            rowKey={(role) => role.id}
            emptyMessage="No roles found"
          />
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Create Role' : 'Edit Role'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.name ? 'border-red-300' : ''
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.description ? 'border-red-300' : ''
              }`}
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Permissions</label>
              <button
                type="button"
                onClick={handleSelectAllPermissions}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {formData.permissions.length === ALL_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(permissionGroups).map(([resource, permissions]) => (
                <div key={resource} className="rounded-md border border-gray-200 p-3">
                  <h4 className="mb-2 text-sm font-medium capitalize text-gray-900">{resource}</h4>
                  <div className="space-y-2">
                    {permissions.map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {permission.split(':')[1]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Are you sure you want to delete role "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isLoading}
      />
    </AdminLayout>
  );
}

export default AdminRolesPage;
