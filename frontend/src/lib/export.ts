/**
 * Export Utilities
 * Functions for exporting data to various formats
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return '';

  // Determine columns
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

  // Create header row
  const header = cols.map(col => `"${col.label}"`).join(',');

  // Create data rows
  const rows = data.map(row => 
    cols.map(col => {
      const value = row[col.key];
      // Escape quotes and wrap in quotes if necessary
      if (value === null || value === undefined) return '""';
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(
  data: any[],
  filename: string,
  columns?: { key: string; label: string }[]
): void {
  const csv = arrayToCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert array of objects to JSON string (formatted)
 */
export function arrayToJSON<T>(data: T[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data: any[], filename: string): void {
  const json = arrayToJSON(data);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}
