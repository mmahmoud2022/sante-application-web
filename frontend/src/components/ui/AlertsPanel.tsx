/**
 * AlertsPanel Component
 * Display urgent alerts and notifications with modern styling
 */

'use client';

import React from 'react';
import { AlertCircle, Bell, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import clsx from 'clsx';

interface Alert {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  action?: string;
}

interface AlertsPanelProps {
  alerts?: Alert[];
  className?: string;
}

export function AlertsPanel({ alerts = [], className }: AlertsPanelProps) {
  // Default alerts if none provided
  const defaultAlerts: Alert[] = [
    {
      id: '1',
      type: 'urgent',
      title: 'Patient urgent',
      message: 'Marie Dubois nécessite une attention immédiate',
      time: 'Il y a 5 minutes',
      action: 'Voir détails',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Rappel consultation',
      message: 'Consultation avec Jean Martin dans 30 minutes',
      time: 'Il y a 25 minutes',
    },
    {
      id: '3',
      type: 'info',
      title: 'Nouveau message',
      message: 'Sophie Laurent a envoyé un message',
      time: 'Il y a 1 heure',
    },
  ];

  const displayAlerts = alerts.length > 0 ? alerts : defaultAlerts;

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500',
          icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          badge: 'bg-red-500 text-white',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500',
          icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          badge: 'bg-amber-500 text-white',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500',
          icon: <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          badge: 'bg-blue-500 text-white',
        };
    }
  };

  return (
    <Card className={clsx('border-2 border-neutral-100 dark:border-neutral-700', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-warm-coral/20 to-warm-coral/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-warm-coral" />
            </div>
            <span>Alertes urgentes</span>
          </div>
          {displayAlerts.length > 0 && (
            <span className="px-3 py-1 bg-warm-coral text-white text-sm font-bold rounded-full">
              {displayAlerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayAlerts.length > 0 ? (
          <div className="space-y-3">
            {displayAlerts.map((alert) => {
              const styles = getAlertStyles(alert.type);
              return (
                <div
                  key={alert.id}
                  className={clsx(
                    'p-4 rounded-xl transition-all duration-300',
                    'hover:shadow-md cursor-pointer',
                    styles.bg
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className={clsx('p-2 rounded-lg flex-shrink-0', styles.iconBg)}>
                      {styles.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                          {alert.title}
                        </h5>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', styles.badge)}>
                          {alert.type === 'urgent' ? 'Urgent' : alert.type === 'warning' ? 'Attention' : 'Info'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          {alert.time}
                        </span>
                        {alert.action && (
                          <button className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                            {alert.action} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-neutral-600 dark:text-neutral-400">Aucune alerte pour le moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
