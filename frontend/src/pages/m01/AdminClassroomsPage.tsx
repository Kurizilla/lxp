import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { DataTable, Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { useClassroomsStore } from '../../store/classroomsStore';
import { useEstablishmentsStore } from '../../store/establishmentsStore';
import { useAuthStore } from '../../store/authStore';
import { Classroom, CreateClassroomDto, UpdateClassroomDto } from '../../types/api';

interface ClassroomFormData {
  name: string;
  code: string;
  capacity: number;
  establishmentId: string;
  floor: string;
  building: string;
  isActive: boolean;
}

const initialFormData: ClassroomFormData = {
  name: '',
  code: '',
  capacity: 30,
  establishmentId: '',
  floor: '',
  building: '',
  isActive: true,
};

export function AdminClassroomsPage() {
  const {
    classrooms,
    total,
    page,
    limit,
    search,
    isLoading,
    error,
    selectedClassroom,
    isModalOpen,
    modalMode,
    fetchClassrooms,
    setPage,
    setLimit,
    setSearch,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    openModal,
    closeModal,
    clearError,
  } = useClassroomsStore();

  const { allEstablishments, fetchAllEstablishments } = useEstablishmentsStore();
  const { hasPermission } = useAuthStore();

  const [formData, setFormData] = useState<ClassroomFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Classroom | null>(null);

  const canCreate = hasPermission('classrooms:create');
  const canUpdate = hasPermission('classrooms:update');
  const canDelete = hasPermission('classrooms:delete');

  useEffect(() => {
    fetchClassrooms();
    fetchAllEstablishments();
  }, [fetchClassrooms, fetchAllEstablishments]);

  useEffect(() => {
    if (selectedClassroom && modalMode === 'edit') {
      setFormData({
        name: selectedClassroom.name,
        code: selectedClassroom.code,
        capacity: selectedClassroom.capacity,
        establishmentId: selectedClassroom.establishmentId,
        floor: selectedClassroom.floor || '',
        building: selectedClassroom.building || '',
        isActive: selectedClassroom.isActive,
      });
    } else {
      setFormData(initialFormData);
    }
    setFormErrors({});
  }, [selectedClassroom, modalMode, isModalOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name) {
      errors.name = 'Name is required';
    }

    if (!formData.code) {
      errors.code = 'Code is required';
    }

    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }

    if (!formData.establishmentId) {
      errors.establishmentId = 'Establishment is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (modalMode === 'create') {
        const createData: CreateClassroomDto = {
          name: formData.name,
          code: formData.code,
          capacity: formData.capacity,
          establishmentId: formData.establishmentId,
          floor: formData.floor || undefined,
          building: formData.building || undefined,
          isActive: formData.isActive,
        };
        await createClassroom(createData);
      } else if (selectedClassroom) {
        const updateData: UpdateClassroomDto = {
          name: formData.name,
          code: formData.code,
          capacity: formData.capacity,
          establishmentId: formData.establishmentId,
          floor: formData.floor || undefined,
          building: formData.building || undefined,
          isActive: formData.isActive,
        };
        await updateClassroom(selectedClassroom.id, updateData);
      }
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteClassroom(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  const columns: Column<Classroom>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (classroom) => (
        <span className="font-medium text-gray-900">{classroom.name}</span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (classroom) => (
        <span className="font-mono text-sm text-gray-600">{classroom.code}</span>
      ),
    },
    {
      key: 'establishment',
      header: 'Establishment',
      render: (classroom) => classroom.establishmentName || '-',
    },
    {
      key: 'location',
      header: 'Location',
      render: (classroom) => {
        const parts = [];
        if (classroom.building) parts.push(classroom.building);
        if (classroom.floor) parts.push(`Floor ${classroom.floor}`);
        return parts.length > 0 ? parts.join(', ') : '-';
      },
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (classroom) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {classroom.capacity} seats
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (classroom) => <StatusBadge isActive={classroom.isActive} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (classroom) => (
        <div className="flex gap-2">
          {canUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('edit', classroom);
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
                setDeleteConfirm(classroom);
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
    <AdminLayout title="Classroom Management">
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
              placeholder="Search classrooms..."
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
              Add Classroom
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <DataTable
            columns={columns}
            data={classrooms}
            isLoading={isLoading}
            rowKey={(classroom) => classroom.id}
            emptyMessage="No classrooms found"
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
        title={modalMode === 'create' ? 'Create Classroom' : 'Edit Classroom'}
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
            <label htmlFor="establishmentId" className="block text-sm font-medium text-gray-700">
              Establishment *
            </label>
            <select
              id="establishmentId"
              value={formData.establishmentId}
              onChange={(e) => setFormData({ ...formData, establishmentId: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.establishmentId ? 'border-red-300' : ''
              }`}
            >
              <option value="">Select an establishment</option>
              {allEstablishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.name}
                </option>
              ))}
            </select>
            {formErrors.establishmentId && (
              <p className="mt-1 text-sm text-red-600">{formErrors.establishmentId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Capacity *
              </label>
              <input
                type="number"
                id="capacity"
                min={1}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.capacity ? 'border-red-300' : ''
                }`}
              />
              {formErrors.capacity && (
                <p className="mt-1 text-sm text-red-600">{formErrors.capacity}</p>
              )}
            </div>

            <div>
              <label htmlFor="building" className="block text-sm font-medium text-gray-700">
                Building
              </label>
              <input
                type="text"
                id="building"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                Floor
              </label>
              <input
                type="text"
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
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
        title="Delete Classroom"
        message={`Are you sure you want to delete classroom "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isLoading}
      />
    </AdminLayout>
  );
}

export default AdminClassroomsPage;
