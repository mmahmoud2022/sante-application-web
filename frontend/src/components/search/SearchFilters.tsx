/**
 * Search Filters Component
 * Advanced filter panel for search functionality
 */

'use client';

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'checkbox' | 'range' | 'text';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  value?: any;
}

interface SearchFiltersProps {
  filters: FilterOption[];
  onFilterChange: (filterId: string, value: any) => void;
  onReset?: () => void;
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderFilter = (filter: FilterOption) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            className={cn(
              'w-full px-3 py-2 rounded-md',
              'border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
          >
            <option value="">All</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.value?.includes(option.value) || false}
                  onChange={(e) => {
                    const currentValue = filter.value || [];
                    const newValue = e.target.checked
                      ? [...currentValue, option.value]
                      : currentValue.filter((v: string) => v !== option.value);
                    onFilterChange(filter.id, newValue);
                  }}
                  className={cn(
                    'w-4 h-4 rounded',
                    'border-gray-300 dark:border-gray-600',
                    'text-primary-600 focus:ring-primary-500'
                  )}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={filter.min || 0}
              max={filter.max || 100}
              value={filter.value || filter.min || 0}
              onChange={(e) => onFilterChange(filter.id, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{filter.min || 0}</span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {filter.value || filter.min || 0}
              </span>
              <span>{filter.max || 100}</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            value={filter.value || ''}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            className={cn(
              'w-full px-3 py-2 rounded-md',
              'border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'md:hidden flex items-center space-x-2 px-4 py-2 rounded-md',
          'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'transition-colors'
        )}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
      </button>

      {/* Filters panel */}
      <div
        className={cn(
          'mt-2 md:mt-0 space-y-4 p-4 rounded-lg',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          'md:block',
          !isOpen && 'hidden'
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filters
          </h3>
          {onReset && (
            <button
              onClick={onReset}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Reset
            </button>
          )}
        </div>

        {filters.map((filter) => (
          <div key={filter.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {filter.label}
            </label>
            {renderFilter(filter)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchFilters;
