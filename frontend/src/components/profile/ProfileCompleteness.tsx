/**
 * Profile Completeness Indicator
 * Shows user profile completion progress
 */

'use client';

import React, { useMemo } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/types';

interface ProfileCompletenessProps {
  user: User;
  className?: string;
}

interface CompletenessCheck {
  label: string;
  completed: boolean;
}

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({
  user,
  className,
}) => {
  const checks = useMemo((): CompletenessCheck[] => {
    const baseChecks: CompletenessCheck[] = [
      { label: 'Basic information', completed: !!(user.first_name && user.last_name && user.email) },
      { label: 'Phone number', completed: !!user.phone },
      { label: 'Date of birth', completed: !!user.date_of_birth },
      { label: 'Address', completed: !!(user.address_line1 || user.city) },
    ];

    // Role-specific checks
    if (user.role === 'doctor') {
      baseChecks.push(
        { label: 'Specialization', completed: !!(user as any).specialization },
        { label: 'License number', completed: !!(user as any).license_number },
        { label: 'Bio', completed: !!(user as any).bio }
      );
    }

    if (user.role === 'patient') {
      baseChecks.push(
        { label: 'Emergency contact', completed: !!(user as any).emergency_contact },
        { label: 'Blood type', completed: !!(user as any).blood_type }
      );
    }

    return baseChecks;
  }, [user]);

  const completedCount = checks.filter(check => check.completed).length;
  const totalCount = checks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const getColor = () => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Profile Completeness
        </h3>
        <span className={cn('text-2xl font-bold', getColor())}>
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', getBarColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            {check.completed ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
            <span className={cn(
              check.completed 
                ? 'text-gray-900 dark:text-gray-100' 
                : 'text-gray-500 dark:text-gray-400'
            )}>
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {percentage < 100 && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Complete your profile to get the most out of the platform.
        </div>
      )}
    </div>
  );
};

export default ProfileCompleteness;
