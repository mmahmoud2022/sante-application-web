/**
 * Empty State Component
 * Display when no data is available
 */

'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {Icon && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          <Icon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-4 py-2 rounded-md font-medium transition-colors',
            'bg-primary-600 hover:bg-primary-700',
            'text-white'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
