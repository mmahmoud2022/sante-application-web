/**
 * Input Component
 */

import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  fullWidth = true,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx(fullWidth && 'w-full', 'mb-4')}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'placeholder:text-neutral-400',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-neutral-300 hover:border-neutral-400',
          props.disabled && 'bg-neutral-100 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export function TextArea({
  label,
  error,
  helperText,
  fullWidth = true,
  className,
  id,
  ...props
}: TextAreaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx(fullWidth && 'w-full', 'mb-4')}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-colors resize-y',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'placeholder:text-neutral-400',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-neutral-300 hover:border-neutral-400',
          props.disabled && 'bg-neutral-100 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

export function Select({
  label,
  error,
  helperText,
  fullWidth = true,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx(fullWidth && 'w-full', 'mb-4')}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-neutral-300 hover:border-neutral-400',
          props.disabled && 'bg-neutral-100 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  );
}
