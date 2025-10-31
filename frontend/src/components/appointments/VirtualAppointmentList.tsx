/**
 * Virtual Appointment List
 * Optimized list component with virtual scrolling for large datasets
 */

'use client';

import React, { useRef, memo, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';

interface Appointment {
  id: number;
  date: string;
  time?: string;
  patient_name?: string;
  doctor_name?: string;
  status: string;
  reason?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
}

// Memoized appointment card for performance
const AppointmentCard = memo(({ appointment }: AppointmentCardProps) => {
  const formattedDate = useMemo(
    () => {
      try {
        return format(new Date(appointment.date), 'PPP');
      } catch {
        return appointment.date;
      }
    },
    [appointment.date]
  );

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {appointment.patient_name || appointment.doctor_name || 'Appointment'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formattedDate}
            {appointment.time && ` at ${appointment.time}`}
          </p>
          {appointment.reason && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {appointment.reason}
            </p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            statusColors[appointment.status] || statusColors.scheduled
          }`}
        >
          {appointment.status}
        </span>
      </div>
    </div>
  );
});

AppointmentCard.displayName = 'AppointmentCard';

interface VirtualAppointmentListProps {
  appointments: Appointment[];
  height?: number;
  estimateSize?: number;
}

export const VirtualAppointmentList: React.FC<VirtualAppointmentListProps> = ({
  appointments,
  height = 600,
  estimateSize = 100,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: appointments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{ height: `${height}px`, overflow: 'auto' }}
      className="rounded-lg"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
            className="px-2"
          >
            <AppointmentCard appointment={appointments[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualAppointmentList;
