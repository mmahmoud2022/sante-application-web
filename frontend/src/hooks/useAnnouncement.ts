/**
 * Screen Reader Announcement Hook
 * Provides accessibility announcements for dynamic content
 */

'use client';

import { useCallback } from 'react';

export type AnnouncementPriority = 'polite' | 'assertive';

export function useAnnouncement() {
  const announce = useCallback((
    message: string, 
    priority: AnnouncementPriority = 'polite'
  ) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }, []);

  return { announce };
}
