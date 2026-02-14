import React, { useEffect, useCallback } from 'react';
import { Button } from './button';

export interface ModalProps {
  is_open: boolean;
  on_close: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const size_classes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Reusable modal component
 */
export function Modal({
  is_open,
  on_close,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  // Handle escape key
  const handle_keydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        on_close();
      }
    },
    [on_close]
  );

  useEffect(() => {
    if (is_open) {
      document.addEventListener('keydown', handle_keydown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handle_keydown);
      document.body.style.overflow = '';
    };
  }, [is_open, handle_keydown]);

  if (!is_open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={on_close}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-xl shadow-xl transform transition-all w-full ${size_classes[size]}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3
              id="modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h3>
            <button
              onClick={on_close}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Confirmation modal component
 */
export interface ConfirmModalProps {
  is_open: boolean;
  on_close: () => void;
  on_confirm: () => void;
  title: string;
  message: string;
  confirm_text?: string;
  cancel_text?: string;
  is_loading?: boolean;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({
  is_open,
  on_close,
  on_confirm,
  title,
  message,
  confirm_text = 'Confirm',
  cancel_text = 'Cancel',
  is_loading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal
      is_open={is_open}
      on_close={on_close}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={on_close} disabled={is_loading}>
            {cancel_text}
          </Button>
          <Button
            variant={variant}
            onClick={on_confirm}
            is_loading={is_loading}
            disabled={is_loading}
          >
            {confirm_text}
          </Button>
        </>
      }
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  );
}
