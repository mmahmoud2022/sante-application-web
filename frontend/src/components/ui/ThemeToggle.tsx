/**
 * Theme Toggle Component
 * Allows users to switch between light, dark, and system themes
 */

'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" aria-label="Light mode" />;
      case 'dark':
        return <Moon className="h-5 w-5" aria-label="Dark mode" />;
      case 'system':
        return <Monitor className="h-5 w-5" aria-label="System theme" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Mode clair';
      case 'dark':
        return 'Mode sombre';
      case 'system':
        return 'Mode système';
    }
  };

  return (
    <button
      onClick={handleThemeChange}
      className="
        relative p-2 rounded-lg 
        bg-neutral-100 dark:bg-neutral-800
        hover:bg-neutral-200 dark:hover:bg-neutral-700
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        hover-lift button-press
        group
      "
      aria-label={`Changer le thème - Actuellement: ${getLabel()}`}
      title={getLabel()}
    >
      <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200 transition-colors">
        <span className="scale-on-hover inline-block">
          {getIcon()}
        </span>
      </span>
      <span className="sr-only">{getLabel()}</span>
    </button>
  );
}

export function ThemeToggleExpanded() {
  const { theme, setTheme } = useTheme();

  return (
    <div 
      className="inline-flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 shadow-soft"
      role="radiogroup"
      aria-label="Sélectionner le thème"
    >
      {[
        { value: 'light', icon: Sun, label: 'Clair' },
        { value: 'dark', icon: Moon, label: 'Sombre' },
        { value: 'system', icon: Monitor, label: 'Système' },
      ].map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            flex items-center gap-2
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            button-press
            ${
              theme === value
                ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }
          `}
          role="radio"
          aria-checked={theme === value}
          aria-label={`Mode ${label.toLowerCase()}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
