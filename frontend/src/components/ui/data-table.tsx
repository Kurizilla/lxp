import React from 'react';
import { Button } from './button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  get_row_key: (item: T) => string;
  is_loading?: boolean;
  empty_message?: string;
  // Pagination
  total?: number;
  offset?: number;
  limit?: number;
  on_page_change?: (offset: number) => void;
  // Row actions
  row_actions?: (item: T) => React.ReactNode;
}

/**
 * Reusable data table component with pagination
 */
export function DataTable<T>({
  columns,
  data,
  get_row_key,
  is_loading = false,
  empty_message = 'No data found',
  total = 0,
  offset = 0,
  limit = 10,
  on_page_change,
  row_actions,
}: DataTableProps<T>) {
  const current_page = Math.floor(offset / limit) + 1;
  const total_pages = Math.ceil(total / limit);
  const has_prev = offset > 0;
  const has_next = offset + limit < total;

  const handle_prev = () => {
    if (has_prev && on_page_change) {
      on_page_change(Math.max(0, offset - limit));
    }
  };

  const handle_next = () => {
    if (has_next && on_page_change) {
      on_page_change(offset + limit);
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {row_actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {is_loading ? (
              <tr>
                <td
                  colSpan={columns.length + (row_actions ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (row_actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {empty_message}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={get_row_key(item)} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as Record<string, unknown>)[column.key] ?? '')}
                    </td>
                  ))}
                  {row_actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {row_actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={handle_prev}
              disabled={!has_prev}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handle_next}
              disabled={!has_next}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{data.length > 0 ? offset + 1 : 0}</span>
                {' '}-{' '}
                <span className="font-medium">{Math.min(offset + limit, total)}</span>
                {' '}of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Page {current_page} of {total_pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handle_prev}
                disabled={!has_prev}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handle_next}
                disabled={!has_next}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
