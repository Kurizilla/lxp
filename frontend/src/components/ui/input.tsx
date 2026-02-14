import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper_text?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper_text, className = '', id, ...props }, ref) => {
    const input_id = id || props.name || `input-${Math.random().toString(36).slice(2)}`;
    const has_error = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={input_id} className="label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={input_id}
          className={`input ${has_error ? 'input-error' : ''} ${className}`}
          aria-invalid={has_error}
          aria-describedby={error ? `${input_id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${input_id}-error`} className="error-message" role="alert">
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

Input.displayName = 'Input';
