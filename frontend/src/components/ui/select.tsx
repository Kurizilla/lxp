import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper_text?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper_text, options, placeholder, className = '', id, ...props }, ref) => {
    const select_id = id || props.name || `select-${Math.random().toString(36).slice(2)}`;
    const has_error = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={select_id} className="label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={select_id}
          className={`input ${has_error ? 'input-error' : ''} ${className}`}
          aria-invalid={has_error}
          aria-describedby={error ? `${select_id}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${select_id}-error`} className="error-message" role="alert">
            {error}
          </p>
        )}
        {helper_text && !error && (
          <p className="text-sm text-gray-500 mt-1">{helper_text}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * Multi-select checkbox list component
 */
export interface CheckboxListProps {
  label?: string;
  options: SelectOption[];
  selected: string[];
  on_change: (selected: string[]) => void;
  error?: string;
  max_height?: string;
}

export function CheckboxList({
  label,
  options,
  selected,
  on_change,
  error,
  max_height = '200px',
}: CheckboxListProps) {
  const handle_toggle = (value: string) => {
    if (selected.includes(value)) {
      on_change(selected.filter((v) => v !== value));
    } else {
      on_change([...selected, value]);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div
        className={`border border-gray-300 rounded-lg overflow-y-auto ${error ? 'border-red-500' : ''}`}
        style={{ maxHeight: max_height }}
      >
        {options.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500">No options available</div>
        ) : (
          options.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => handle_toggle(option.value)}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-3 text-sm text-gray-700">{option.label}</span>
            </label>
          ))
        )}
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
