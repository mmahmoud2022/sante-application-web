/**
 * Language Switcher Component
 * Dropdown for switching application language
 */

'use client';

import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

interface LanguageSwitcherProps {
  currentLanguage: string;
  languages: Language[];
  onLanguageChange: (languageCode: string) => void;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  languages,
  onLanguageChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const current = languages.find((lang) => lang.code === currentLanguage);

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-2 px-3 py-2 rounded-md',
          'bg-white dark:bg-gray-800',
          'border border-gray-300 dark:border-gray-600',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'transition-colors'
        )}
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">
          {current?.flag} {current?.nativeName || current?.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className={cn(
              'absolute right-0 mt-2 w-56 z-20',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'rounded-lg shadow-lg',
              'py-1'
            )}
          >
            {languages.map((language) => {
              const isSelected = language.code === currentLanguage;

              return (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2',
                    'text-left text-sm',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-colors',
                    isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  <span className="flex items-center space-x-2">
                    {language.flag && <span>{language.flag}</span>}
                    <span className="text-gray-900 dark:text-gray-100">
                      {language.nativeName}
                    </span>
                    {language.nativeName !== language.name && (
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        ({language.name})
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
