import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { DataTable, Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { useUsersStore } from '../../store/usersStore';
import { useRolesStore } from '../../store/rolesStore';
import { useEstablishmentsStore } from '../../store/establishmentsStore';
import { useAuthStore } from '../../store/authStore';
import { User, CreateUserDto, UpdateUserDto } from '../../types/api';

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
  establishmentId: string;
  isActive: boolean;
}

const initialFormData: UserFormData = {
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  roleId: '',
  establishmentId: '',
  isActive: true,
};

export function AdminUsersPage() {
  const {
    users,
    total,
    page,
    limit,
    search,
    isLoading,
    error,
    selectedUser,
    isModalOpen,
    modalMode,
    fetchUsers,
    setPage,
    setLimit,
    setSearch,
    createUser,
    updateUser,
    deleteUser,
    openModal,
    closeModal,
    clearError,
  } = useUsersStore();

  const { allRoles, fetchAllRoles } = useRolesStore();
  const { allEstablishments, fetchAllEstablishments } = useEstablishmentsStore();
  const { hasPermission } = useAuthStore();

  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const canCreate = hasPermission('users:create');
  const canUpdate = hasPermission('users:update');
  const canDelete = hasPermission('users:delete');

  useEffect(() => {
    fetchUsers();
    fetchAllRoles();
    fetchAllEstablishments();
  }, [fetchUsers, fetchAllRoles, fetchAllEstablishments]);

  useEffect(() => {
    if (selectedUser && modalMode === 'edit') {
      setFormData({
        email: selectedUser.email,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        password: '',
        roleId: selectedUser.roleId,
        establishmentId: selectedUser.establishmentId || '',
        isActive: selectedUser.isActive,
      });
    } else {
      setFormData(initialFormData);
    }
    setFormErrors({});
  }, [selectedUser, modalMode, isModalOpen]);

  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }

    if (modalMode === 'create' && !formData.password) {
      errors.password = 'Password is required';
    }

    if (!formData.roleId) {
      errors.roleId = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (modalMode === 'create') {
        const createData: CreateUserDto = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          roleId: formData.roleId,
          establishmentId: formData.establishmentId || undefined,
          isActive: formData.isActive,
        };
        await createUser(createData);
      } else if (selectedUser) {
        const updateData: UpdateUserDto = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleId: formData.roleId,
          establishmentId: formData.establishmentId || undefined,
          isActive: formData.isActive,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateUser(selectedUser.id, updateData);
      }
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteUser(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (user) => user.email,
    },
    {
      key: 'name',
      header: 'Name',
      render: (user) => `${user.firstName} ${user.lastName}`,
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => user.roleName || '-',
    },
    {
      key: 'establishment',
      header: 'Establishment',
      render: (user) => user.establishmentName || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => <StatusBadge isActive={user.isActive} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex gap-2">
          {canUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('edit', user);
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
                setDeleteConfirm(user);
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
    <AdminLayout title="User Management">
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
              placeholder="Search users..."
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
              Add User
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            rowKey={(user) => user.id}
            emptyMessage="No users found"
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
        title={modalMode === 'create' ? 'Create User' : 'Edit User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.firstName ? 'border-red-300' : ''
                }`}
              />
              {formErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.lastName ? 'border-red-300' : ''
                }`}
              />
              {formErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.email ? 'border-red-300' : ''
              }`}
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password {modalMode === 'create' ? '*' : '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.password ? 'border-red-300' : ''
              }`}
            />
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                id="roleId"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.roleId ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select a role</option>
                {allRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {formErrors.roleId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.roleId}</p>
              )}
            </div>

            <div>
              <label htmlFor="establishmentId" className="block text-sm font-medium text-gray-700">
                Establishment
              </label>
              <select
                id="establishmentId"
                value={formData.establishmentId}
                onChange={(e) => setFormData({ ...formData, establishmentId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">No establishment</option>
                {allEstablishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
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
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteConfirm?.email}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isLoading}
      />
    </AdminLayout>
  );
}

export default AdminUsersPage;
