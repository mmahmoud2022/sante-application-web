/**
 * Online Status Indicator Component
 * Displays network connectivity status to the user
 */

'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineQueue } from '@/lib/offline-queue';
import { useAnnouncement } from '@/hooks/useAnnouncement';

const HIDE_DELAY_MS = 3000;

export function OnlineStatusIndicator() {
  const isOnline = useOnlineStatus();
  const { announce } = useAnnouncement();
  const [queueSize, setQueueSize] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Update queue size
    setQueueSize(offlineQueue.size());

    // Show indicator when offline or when there are queued items
    if (!isOnline || offlineQueue.size() > 0) {
      setShowIndicator(true);
    } else {
      // Hide indicator after a delay when back online
      const timer = setTimeout(() => setShowIndicator(false), HIDE_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  useEffect(() => {
    // Announce status changes to screen readers
    if (isOnline) {
      announce('Connexion rétablie', 'polite');
      
      // Try to flush the queue when back online
      if (offlineQueue.size() > 0) {
        offlineQueue.flush().then(({ success, failed }) => {
          if (success > 0) {
            announce(`${success} action(s) synchronisée(s)`, 'polite');
          }
          setQueueSize(offlineQueue.size());
        });
      }
    } else {
      announce('Connexion perdue. Les modifications seront sauvegardées localement.', 'assertive');
    }
  }, [isOnline, announce]);

  if (!showIndicator) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 
        flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
        transition-all duration-300 ease-in-out
        ${
          isOnline
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
        }
      `}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">En ligne</span>
          {queueSize > 0 && (
            <span className="text-xs text-green-600 dark:text-green-400">
              (Synchronisation de {queueSize} action(s)...)
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Hors ligne</span>
            {queueSize > 0 && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                {queueSize} action(s) en attente
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
