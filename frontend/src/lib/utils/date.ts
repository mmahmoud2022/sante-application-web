/**
 * Date utility functions to handle timezone-safe date operations
 */

/**
 * Format a Date object as YYYY-MM-DD string in LOCAL timezone
 * (avoids UTC conversion issues with toISOString())
 * 
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format (local timezone)
 * 
 * @example
 * // If local time is 2025-11-13 23:00 CET (UTC+1)
 * formatLocalDate(new Date()) // Returns "2025-11-13"
 * // NOT "2025-11-12" like toISOString() would give
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string in LOCAL timezone
 * 
 * @returns Today's date string in YYYY-MM-DD format
 */
export function getTodayLocal(): string {
  return formatLocalDate(new Date());
}

/**
 * Get tomorrow's date as YYYY-MM-DD string in LOCAL timezone
 * 
 * @returns Tomorrow's date string in YYYY-MM-DD format
 */
export function getTomorrowLocal(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalDate(tomorrow);
}

/**
 * Parse a date string (YYYY-MM-DD) as a local Date object
 * (avoids timezone interpretation with Date constructor)
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 * 
 * @example
 * parseLocalDate("2025-11-13") // Creates Date for Nov 13, 2025 at 00:00 LOCAL time
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Add days to a date and return formatted string
 * 
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns Date string in YYYY-MM-DD format
 */
export function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return formatLocalDate(result);
}

/**
 * Format a date string for display (locale-aware)
 * 
 * @param dateStr - Date string in YYYY-MM-DD or ISO format
 * @param locale - Locale string (default: 'fr-FR')
 * @returns Formatted date string
 */
export function formatDisplayDate(dateStr: string, locale: string = 'fr-FR'): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(locale);
}
