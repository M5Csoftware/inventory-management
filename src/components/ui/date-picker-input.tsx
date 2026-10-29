'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseDateString(val: string | undefined | null): Date | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const trimmed = val.trim();

  // Pattern: DD-MMM-YYYY or DD-MM-YYYY
  const parts = trimmed.split(/[-/ ]/);
  if (parts.length === 3) {
    // If format is DD-MMM-YYYY (e.g., 28-Oct-2026)
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);

    const monthIndex = MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthStr);
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year) && year > 1900) {
      return new Date(year, monthIndex, day);
    }

    // If format is YYYY-MM-DD (e.g., 2026-10-28)
    if (parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }

    // If format is DD-MM-YYYY
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 1900 && m >= 0 && m <= 11) {
      return new Date(y, m, d);
    }
  }

  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDateString(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = MONTH_NAMES[date.getMonth()];
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

const PopperPortal: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return <>{children}</>;
  return createPortal(children, document.body);
};

interface DatePickerInputProps {
  value: string;
  onChange: (formattedDate: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'default' | 'sm';
  disabled?: boolean;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  size = 'default',
  disabled = false,
}: DatePickerInputProps) {
  const selectedDate = parseDateString(value);
  const isSmall = size === 'sm';

  return (
    <div className="relative w-full date-picker-input-container">
      <DatePicker
        selected={selectedDate}
        onChange={(d: Date | null) => onChange(formatDateString(d))}
        dateFormat="dd-MMM-yyyy"
        placeholderText={placeholder}
        disabled={disabled}
        popperPlacement="bottom-start"
        popperContainer={PopperPortal}
        popperProps={{ strategy: 'fixed' }}
        popperClassName="!z-[99999]"
        showPopperArrow={false}
        className={cn(
          'w-full bg-background transition-all font-medium focus:border-primary focus:outline-none cursor-pointer',
          isSmall
            ? 'h-9 rounded-lg border border-border pl-8 pr-7 text-xs'
            : 'h-10 rounded-xl border-2 border-border/80 pl-9 pr-8 text-sm',
          className
        )}
      />
      <CalendarIcon
        className={cn(
          'text-muted-foreground absolute top-1/2 -translate-y-1/2 pointer-events-none transition-colors',
          isSmall ? 'left-2.5 h-3.5 w-3.5' : 'left-3 h-4 w-4'
        )}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer',
            isSmall ? 'right-2' : 'right-2.5'
          )}
          title="Clear date"
        >
          <X className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      )}
    </div>
  );
}
