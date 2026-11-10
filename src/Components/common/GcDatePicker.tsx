'use client';

import React, { useMemo } from 'react';
import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { formatByPrecision } from '@/lib/ethiopian-calendar';

export interface GcDatePickerProps {
  mode?: 'inline' | 'popover';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  parsedParts: { year: number; month?: number; day?: number } | null;
  disableFuture?: boolean;
  todayGc: { year: number; month: number; day: number };
  disabledDate?: (current: Dayjs) => boolean;
  size?: 'small' | 'middle' | 'large';
  allowClear?: boolean;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  onChange: (date: string | null) => void;
}

export default function GcDatePicker({
  mode = 'inline',
  open,
  onOpenChange,
  parsedParts,
  disableFuture = false,
  disabledDate,
  size = 'middle',
  allowClear = true,
  placeholder,
  minYear = 1900,
  maxYear = 2100,
  onChange,
}: GcDatePickerProps) {
  const pickerValue = useMemo(() => {
    if (!parsedParts) return null;
    const m = parsedParts.month ?? 1;
    const d = parsedParts.day ?? 1;
    const iso = formatByPrecision(parsedParts.year, m, d, 'day');
    const parsed = dayjs(iso, 'YYYY-MM-DD');
    return parsed.isValid() ? parsed : null;
  }, [parsedParts]);

  const mergedDisabledDate = useMemo(() => {
    return (current: Dayjs) => {
      if (current.year() < minYear || current.year() > maxYear) {
        return true;
      }
      if (disableFuture && current.isAfter(dayjs(), 'day')) {
        return true;
      }
      return disabledDate ? disabledDate(current) : false;
    };
  }, [disableFuture, disabledDate, minYear, maxYear]);

  const handlePickerChange = (d: Dayjs | null) => {
    onChange(d ? d.format('YYYY-MM-DD') : null);
    if (mode === 'popover') {
      onOpenChange?.(false);
    }
  };

  if (mode === 'popover') {
    return (
      <DatePicker
        aria-hidden="true"
        tabIndex={-1}
        className="cal-date-input__popover-anchor"
        size={size}
        picker="date"
        format="MMM D, YYYY"
        value={pickerValue}
        open={open}
        onOpenChange={onOpenChange}
        allowClear={false}
        inputReadOnly
        disabledDate={mergedDisabledDate}
        onChange={handlePickerChange}
      />
    );
  }

  return (
    <DatePicker
      className="cal-date-input__gc-picker"
      style={{ width: '100%' }}
      size={size}
      picker="date"
      format="MMM D, YYYY"
      value={pickerValue}
      allowClear={allowClear}
      disabledDate={mergedDisabledDate}
      placeholder={placeholder}
      onChange={handlePickerChange}
    />
  );
}
