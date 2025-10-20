/**
 * Input Component
 * Enhanced with dark mode support and WCAG AAA accessibility
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
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className={clsx(fullWidth && 'w-full', 'mb-4')}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
        >
          {label}
          {props.required && (
            <span className="text-red-600 dark:text-red-400 ml-1" aria-label="requis">
              *
            </span>
          )}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={clsx(errorId, helperId)}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-all duration-200',
          'bg-white dark:bg-neutral-800',
          'text-neutral-900 dark:text-neutral-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          error
            ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500',
          props.disabled && 'bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
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
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = helperText ? `${textareaId}-helper` : undefined;

  return (
    <div className={clsx(fullWidth && 'w-full', 'mb-4')}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
        >
          {label}
          {props.required && (
            <span className="text-red-600 dark:text-red-400 ml-1" aria-label="requis">
              *
            </span>
          )}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={!!error}
        aria-describedby={clsx(errorId, helperId)}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-all duration-200 resize-y',
          'bg-white dark:bg-neutral-800',
          'text-neutral-900 dark:text-neutral-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          error
            ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500',
          props.disabled && 'bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options?: Array<{ value: string; label: string }>;
  children?: React.ReactNode;
}

export function Select({
  label,
  error,
  helperText,
  fullWidth = true,
  options,
  children,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText ? `${selectId}-helper` : undefined;

  return (
    <div className={clsx(fullWidth && 'w-full', 'mb-4')}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
        >
          {label}
          {props.required && (
            <span className="text-red-600 dark:text-red-400 ml-1" aria-label="requis">
              *
            </span>
          )}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={!!error}
        aria-describedby={clsx(errorId, helperId)}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-all duration-200',
          'bg-white dark:bg-neutral-800',
          'text-neutral-900 dark:text-neutral-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent',
          error
            ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500',
          props.disabled && 'bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
