/**
 * Debounced Search Component
 * Search input with debouncing for better performance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface DebouncedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
  defaultValue?: string;
}

export const DebouncedSearch: React.FC<DebouncedSearchProps> = ({
  onSearch,
  placeholder = 'Search...',
  className,
  delay = 500,
  defaultValue = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const debouncedSearchQuery = useDebounce(searchQuery, delay);

  useEffect(() => {
    onSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'block w-full pl-10 pr-10 py-2',
          'border border-gray-300 dark:border-gray-600',
          'rounded-lg',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-gray-100',
          'placeholder-gray-400 dark:placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-colors'
        )}
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      )}
    </div>
  );
};

export default DebouncedSearch;
