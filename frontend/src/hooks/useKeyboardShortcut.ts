/**
 * Keyboard Shortcut Hook
 * Handles keyboard shortcuts in a declarative way
 */

import { useEffect, useCallback, useMemo } from 'react';

type KeyboardShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

export function useKeyboardShortcut(
  config: ShortcutConfig | string,
  handler: KeyboardShortcutHandler,
  deps: any[] = []
) {
  const shortcutConfig = useMemo(() => 
    typeof config === 'string' ? { key: config } : config,
    [config]
  );

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false } = shortcutConfig;

    // Check if all modifier keys match
    if (
      event.key.toLowerCase() === key.toLowerCase() &&
      event.ctrlKey === ctrlKey &&
      event.shiftKey === shiftKey &&
      event.altKey === altKey &&
      event.metaKey === metaKey
    ) {
      event.preventDefault();
      handler(event);
    }
  }, [shortcutConfig.key, shortcutConfig.ctrlKey, shortcutConfig.shiftKey, shortcutConfig.altKey, shortcutConfig.metaKey, handler, ...deps]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
}

// Hook for multiple shortcuts
export function useKeyboardShortcuts(
  shortcuts: Record<string, { config: ShortcutConfig | string; handler: KeyboardShortcutHandler }>,
  deps: any[] = []
) {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    for (const [, { config, handler }] of Object.entries(shortcuts)) {
      const shortcutConfig = typeof config === 'string' 
        ? { key: config } 
        : config;

      const { key, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false } = shortcutConfig;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey &&
        event.metaKey === metaKey
      ) {
        event.preventDefault();
        handler(event);
        break;
      }
    }
  }, [shortcuts, ...deps]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
}

export default useKeyboardShortcut;
