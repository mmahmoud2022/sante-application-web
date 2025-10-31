/**
 * Password Strength Indicator
 * Visual indicator for password strength
 */

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  percentage: number;
}

const calculatePasswordStrength = (password: string): StrengthResult => {
  let score = 0;

  if (password.length === 0) {
    return { score: 0, label: '', color: 'bg-gray-300', percentage: 0 };
  }

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1; // lowercase
  if (/[A-Z]/.test(password)) score += 1; // uppercase
  if (/[0-9]/.test(password)) score += 1; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special characters

  // Penalty for common patterns
  if (/^[a-z]+$/.test(password) || /^[A-Z]+$/.test(password)) score -= 1;
  if (/^[0-9]+$/.test(password)) score -= 1;
  if (/(.)\1{2,}/.test(password)) score -= 1; // repeated characters

  // Normalize score to 0-4 range
  score = Math.max(0, Math.min(4, score));

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
  ];

  return {
    score,
    label: labels[score],
    color: colors[score],
    percentage: ((score + 1) / 5) * 100,
  };
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  className,
}) => {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
        <span className={cn(
          'font-medium',
          strength.score <= 1 ? 'text-red-600 dark:text-red-400' :
          strength.score === 2 ? 'text-yellow-600 dark:text-yellow-400' :
          'text-green-600 dark:text-green-400'
        )}>
          {strength.label}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', strength.color)}
          style={{ width: `${strength.percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
        <p>Use at least 8 characters with a mix of:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
            8+ characters
          </li>
          <li className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
            Uppercase letters
          </li>
          <li className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
            Lowercase letters
          </li>
          <li className={/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
            Numbers
          </li>
          <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
            Special characters
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordStrength;
