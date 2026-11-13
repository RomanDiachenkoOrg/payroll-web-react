export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

export function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.value(row))).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

export function downloadCsv(fileName: string, content: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const money2 = (v: number) => v.toFixed(2);
