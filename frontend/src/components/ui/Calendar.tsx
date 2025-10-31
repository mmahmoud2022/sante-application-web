/**
 * Calendar Component
 * Simple calendar with date selection
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  disabledDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  className,
  disabledDates = [],
  minDate,
  maxDate,
}) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [year, month]);

  const isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true;

    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    return disabledDates.some(
      disabledDate =>
        disabledDate.getDate() === date.getDate() &&
        disabledDate.getMonth() === date.getMonth() &&
        disabledDate.getFullYear() === date.getFullYear()
    );
  };

  const isDateSelected = (date: Date | null): boolean => {
    if (!date || !selected) return false;

    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;

    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (!date || isDateDisabled(date)) return;
    onSelect?.(date);
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          const disabled = isDateDisabled(date);
          const selectedDate = isDateSelected(date);
          const today = isToday(date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={cn(
                'aspect-square flex items-center justify-center rounded-md text-sm transition-colors',
                date && !disabled && 'hover:bg-gray-100 dark:hover:bg-gray-700',
                !date && 'invisible',
                disabled && 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
                selectedDate && 'bg-primary-600 text-white hover:bg-primary-700',
                today && !selectedDate && 'bg-primary-100 dark:bg-primary-900/20 text-primary-900 dark:text-primary-200',
                !disabled && !selectedDate && !today && 'text-gray-900 dark:text-gray-100'
              )}
            >
              {date?.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
