/**
 * Breadcrumb Navigation Component
 * Navigation breadcrumbs for better user orientation
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  showHome = true,
}) => {
  const allItems = showHome
    ? [{ label: 'Home', href: '/' }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isHome = showHome && index === 0;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            )}
            {isLast ? (
              <span
                className="text-gray-900 dark:text-gray-100 font-medium"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className={cn(
                  'text-gray-600 dark:text-gray-400',
                  'hover:text-primary-600 dark:hover:text-primary-400',
                  'transition-colors',
                  'flex items-center space-x-1'
                )}
              >
                {isHome && <Home className="h-4 w-4" aria-hidden="true" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
