import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { DataTable, Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { useEstablishmentsStore } from '../../store/establishmentsStore';
import { useAuthStore } from '../../store/authStore';
import { Establishment, CreateEstablishmentDto, UpdateEstablishmentDto } from '../../types/api';

interface EstablishmentFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const initialFormData: EstablishmentFormData = {
  name: '',
  code: '',
  address: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  isActive: true,
};

export function AdminEstablishmentsPage() {
  const {
    establishments,
    total,
    page,
    limit,
    search,
    isLoading,
    error,
    selectedEstablishment,
    isModalOpen,
    modalMode,
    fetchEstablishments,
    setPage,
    setLimit,
    setSearch,
    createEstablishment,
    updateEstablishment,
    deleteEstablishment,
    openModal,
    closeModal,
    clearError,
  } = useEstablishmentsStore();

  const { hasPermission } = useAuthStore();

  const [formData, setFormData] = useState<EstablishmentFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<EstablishmentFormData>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Establishment | null>(null);

  const canCreate = hasPermission('establishments:create');
  const canUpdate = hasPermission('establishments:update');
  const canDelete = hasPermission('establishments:delete');

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  useEffect(() => {
    if (selectedEstablishment && modalMode === 'edit') {
      setFormData({
        name: selectedEstablishment.name,
        code: selectedEstablishment.code,
        address: selectedEstablishment.address,
        city: selectedEstablishment.city,
        country: selectedEstablishment.country,
        phone: selectedEstablishment.phone || '',
        email: selectedEstablishment.email || '',
        isActive: selectedEstablishment.isActive,
      });
    } else {
      setFormData(initialFormData);
    }
    setFormErrors({});
  }, [selectedEstablishment, modalMode, isModalOpen]);

  const validateForm = (): boolean => {
    const errors: Partial<EstablishmentFormData> = {};

    if (!formData.name) {
      errors.name = 'Name is required';
    }

    if (!formData.code) {
      errors.code = 'Code is required';
    }

    if (!formData.address) {
      errors.address = 'Address is required';
    }

    if (!formData.city) {
      errors.city = 'City is required';
    }

    if (!formData.country) {
      errors.country = 'Country is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (modalMode === 'create') {
        const createData: CreateEstablishmentDto = {
          name: formData.name,
          code: formData.code,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          isActive: formData.isActive,
        };
        await createEstablishment(createData);
      } else if (selectedEstablishment) {
        const updateData: UpdateEstablishmentDto = {
          name: formData.name,
          code: formData.code,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          isActive: formData.isActive,
        };
        await updateEstablishment(selectedEstablishment.id, updateData);
      }
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteEstablishment(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  const columns: Column<Establishment>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (est) => (
        <span className="font-medium text-gray-900">{est.name}</span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (est) => (
        <span className="font-mono text-sm text-gray-600">{est.code}</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (est) => `${est.city}, ${est.country}`,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (est) => (
        <div className="text-sm">
          {est.email && <div>{est.email}</div>}
          {est.phone && <div className="text-gray-500">{est.phone}</div>}
          {!est.email && !est.phone && '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (est) => <StatusBadge isActive={est.isActive} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (est) => (
        <div className="flex gap-2">
          {canUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('edit', est);
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
                setDeleteConfirm(est);
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
    <AdminLayout title="Establishment Management">
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
              placeholder="Search establishments..."
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
              Add Establishment
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <DataTable
            columns={columns}
            data={establishments}
            isLoading={isLoading}
            rowKey={(est) => est.id}
            emptyMessage="No establishments found"
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
        title={modalMode === 'create' ? 'Create Establishment' : 'Edit Establishment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Code *
              </label>
              <input
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.code ? 'border-red-300' : ''
                }`}
              />
              {formErrors.code && (
                <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address *
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.address ? 'border-red-300' : ''
              }`}
            />
            {formErrors.address && (
              <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City *
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.city ? 'border-red-300' : ''
                }`}
              />
              {formErrors.city && (
                <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country *
              </label>
              <input
                type="text"
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.country ? 'border-red-300' : ''
                }`}
              />
              {formErrors.country && (
                <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
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
        title="Delete Establishment"
        message={`Are you sure you want to delete establishment "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isLoading}
      />
    </AdminLayout>
  );
}

export default AdminEstablishmentsPage;
