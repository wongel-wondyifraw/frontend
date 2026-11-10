'use client';

import React, { useMemo, useState } from 'react';
import { Button, DatePicker, Segmented, Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ETHIOPIC_MONTHS,
  convertFieldCalendar,
  convertFieldPrecision,
  formatByPrecision,
  formatFieldEquivalent,
  getEthiopianMonthDays,
  getTodayInCalendar,
  isValidEthiopianDate,
  parseFieldDateParts,
  parseFlexibleCalendarDate,
  type CalendarDateFieldValue,
  type CalendarSystem,
  type DatePrecision,
} from '@/lib/ethiopian-calendar';
import './CalendarDateInput.css';

export interface CalendarDateInputProps {
  id?: string;
  value?: CalendarDateFieldValue | string | null;
  onChange?: (value: CalendarDateFieldValue) => void;
  allowPartial?: boolean;
  hideCalendarSwitch?: boolean;
  defaultCalendar?: CalendarSystem;
  defaultPrecision?: DatePrecision;
  disableFuture?: boolean;
  disabledDate?: (current: Dayjs) => boolean;
  size?: 'small' | 'middle' | 'large';
  allowClear?: boolean;
  className?: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

function normalizePropValue(
  raw: CalendarDateFieldValue | string | null | undefined,
  defaultCalendar: CalendarSystem,
  defaultPrecision: DatePrecision,
): CalendarDateFieldValue {
  if (!raw) {
    return {
      date: null,
      precision: defaultPrecision,
      calendar: defaultCalendar,
    };
  }
  if (typeof raw === 'string') {
    const parsed = parseFlexibleCalendarDate(raw, {
      calendar: defaultCalendar,
      allowPartial: true,
    });
    if (!parsed) {
      return {
        date: null,
        precision: defaultPrecision,
        calendar: defaultCalendar,
      };
    }
    return {
      date: formatByPrecision(
        parsed.year,
        parsed.month,
        parsed.day,
        parsed.precision,
      ),
      precision: parsed.precision,
      calendar: parsed.calendar,
    };
  }
  return {
    date: raw.date ?? null,
    precision: raw.precision ?? defaultPrecision,
    calendar: raw.calendar ?? defaultCalendar,
  };
}

/**
 * AntD Form custom validator helper for required CalendarDateInput fields.
 */
export function requiredCalendarDateValidator(
  messageText = 'Please select a date',
) {
  return async (_: unknown, value: CalendarDateFieldValue | undefined) => {
    if (!value?.date) {
      throw new Error(messageText);
    }
  };
}

const CalendarDateInput: React.FC<CalendarDateInputProps> = ({
  id,
  value,
  onChange,
  allowPartial = true,
  hideCalendarSwitch = false,
  defaultCalendar = 'gc',
  defaultPrecision = 'day',
  disableFuture = false,
  disabledDate,
  size = 'middle',
  allowClear = true,
  className = '',
  placeholder,
  minYear = 1900,
  maxYear = 2100,
}) => {
  const [internalMeta, setInternalMeta] = useState<{
    calendar: CalendarSystem;
    precision: DatePrecision;
  }>({
    calendar: defaultCalendar,
    precision: defaultPrecision,
  });

  const [ecDraft, setEcDraft] = useState<{
    year?: number;
    month?: number;
    day?: number;
  } | null>(null);

  const normalized = useMemo(() => {
    if (value && typeof value === 'object') {
      return normalizePropValue(value, value.calendar, value.precision);
    }
    if (typeof value === 'string') {
      return normalizePropValue(value, internalMeta.calendar, internalMeta.precision);
    }
    return normalizePropValue(null, internalMeta.calendar, internalMeta.precision);
  }, [value, internalMeta.calendar, internalMeta.precision]);

  const effectivePrecision: DatePrecision = allowPartial
    ? normalized.precision
    : 'day';
  const effectiveCalendar: CalendarSystem = normalized.calendar;

  const todayGc = useMemo(() => getTodayInCalendar('gc'), []);
  const todayEc = useMemo(() => getTodayInCalendar('ec'), []);

  const parsedParts = useMemo(
    () => parseFieldDateParts(normalized),
    [normalized],
  );

  const activeEcYear =
    effectiveCalendar === 'ec' ? (parsedParts?.year ?? ecDraft?.year) : undefined;
  const activeEcMonth =
    effectiveCalendar === 'ec' ? (parsedParts?.month ?? ecDraft?.month) : undefined;
  const activeEcDay =
    effectiveCalendar === 'ec' ? (parsedParts?.day ?? ecDraft?.day) : undefined;

  const emitChange = (next: CalendarDateFieldValue) => {
    setInternalMeta({ calendar: next.calendar, precision: next.precision });
    onChange?.(next);
  };

  const handleCalendarSwitch = (nextCal: CalendarSystem) => {
    if (nextCal === effectiveCalendar) return;
    setEcDraft(null);
    const converted = convertFieldCalendar(
      { ...normalized, precision: effectivePrecision },
      nextCal,
    );
    emitChange(converted);
  };

  const handlePrecisionSwitch = (nextPrecision: DatePrecision) => {
    if (nextPrecision === effectivePrecision) return;
    const resized = convertFieldPrecision(
      { ...normalized, precision: effectivePrecision },
      nextPrecision,
    );
    if (effectiveCalendar === 'ec' && ecDraft?.year && !resized.date) {
      if (nextPrecision === 'year') {
        setEcDraft(null);
        emitChange({
          date: String(ecDraft.year).padStart(4, '0'),
          precision: 'year',
          calendar: 'ec',
        });
        return;
      }
      if (nextPrecision === 'month' && ecDraft.month) {
        setEcDraft(null);
        emitChange({
          date: formatByPrecision(ecDraft.year, ecDraft.month, 1, 'month'),
          precision: 'month',
          calendar: 'ec',
        });
        return;
      }
    }
    setEcDraft(null);
    emitChange(resized);
  };

  const commitEcParts = (next: { year?: number; month?: number; day?: number }) => {
    if (!next.year && !next.month && !next.day) {
      setEcDraft(null);
      emitChange({
        date: null,
        precision: effectivePrecision,
        calendar: 'ec',
      });
      return;
    }

    if (!next.year) {
      setEcDraft(next);
      emitChange({
        date: null,
        precision: effectivePrecision,
        calendar: 'ec',
      });
      return;
    }

    if (effectivePrecision === 'year') {
      setEcDraft(null);
      emitChange({
        date: String(next.year).padStart(4, '0'),
        precision: 'year',
        calendar: 'ec',
      });
      return;
    }

    if (effectivePrecision === 'month') {
      if (!next.month) {
        setEcDraft({ year: next.year });
        emitChange({
          date: null,
          precision: 'month',
          calendar: 'ec',
        });
        return;
      }
      setEcDraft(null);
      emitChange({
        date: formatByPrecision(next.year, next.month, 1, 'month'),
        precision: 'month',
        calendar: 'ec',
      });
      return;
    }

    if (!next.month || !next.day) {
      setEcDraft(next);
      emitChange({
        date: null,
        precision: 'day',
        calendar: 'ec',
      });
      return;
    }

    const maxDay = getEthiopianMonthDays(next.year, next.month);
    const clampedDay = Math.min(next.day, maxDay);
    if (!isValidEthiopianDate(next.year, next.month, clampedDay)) {
      setEcDraft(next);
      return;
    }
    setEcDraft(null);
    emitChange({
      date: formatByPrecision(next.year, next.month, clampedDay, 'day'),
      precision: 'day',
      calendar: 'ec',
    });
  };

  const handleClearAll = () => {
    setEcDraft(null);
    emitChange({
      date: null,
      precision: effectivePrecision,
      calendar: effectiveCalendar,
    });
  };

  const gcPickerValue = useMemo(() => {
    if (effectiveCalendar !== 'gc' || !parsedParts) return null;
    const m = parsedParts.month ?? 1;
    const d = parsedParts.day ?? 1;
    const iso = formatByPrecision(parsedParts.year, m, d, 'day');
    const parsed = dayjs(iso, 'YYYY-MM-DD');
    return parsed.isValid() ? parsed : null;
  }, [effectiveCalendar, parsedParts]);

  const gcDisabledDate = useMemo(() => {
    if (!disableFuture && !disabledDate) return undefined;
    return (current: Dayjs) => {
      if (disableFuture) {
        if (effectivePrecision === 'year' && current.year() > todayGc.year) {
          return true;
        }
        if (
          effectivePrecision === 'month' &&
          (current.year() > todayGc.year ||
            (current.year() === todayGc.year &&
              current.month() + 1 > todayGc.month))
        ) {
          return true;
        }
        if (effectivePrecision === 'day' && current.isAfter(dayjs(), 'day')) {
          return true;
        }
      }
      return disabledDate ? disabledDate(current) : false;
    };
  }, [disableFuture, disabledDate, effectivePrecision, todayGc.year, todayGc.month]);

  const ecYearOptions = useMemo(() => {
    const list: { value: number; label: string }[] = [];
    if (disableFuture) {
      const upper = Math.min(maxYear, todayEc.year);
      const lower = Math.max(1800, minYear);
      for (let y = upper; y >= lower; y -= 1) {
        list.push({ value: y, label: String(y) });
      }
      return list;
    }

    const lower = allowPartial
      ? Math.max(1800, minYear)
      : Math.max(1800, Math.min(minYear === 1900 ? todayEc.year - 5 : minYear, todayEc.year));
    const upper = allowPartial
      ? maxYear
      : Math.max(maxYear === 2100 ? todayEc.year + 25 : maxYear, todayEc.year);
    if (!allowPartial) {
      for (let y = lower; y <= upper; y += 1) {
        list.push({ value: y, label: String(y) });
      }
    } else {
      for (let y = upper; y >= lower; y -= 1) {
        list.push({ value: y, label: String(y) });
      }
    }
    return list;
  }, [allowPartial, disableFuture, maxYear, minYear, todayEc.year]);

  const ecMonthOptions = useMemo(() => {
    return ETHIOPIC_MONTHS.map((m) => {
      const futureDisabled =
        disableFuture &&
        activeEcYear === todayEc.year &&
        m.value > todayEc.month;
      return {
        value: m.value,
        label: `${m.name} (${m.value})`,
        disabled: futureDisabled,
      };
    });
  }, [disableFuture, activeEcYear, todayEc.year, todayEc.month]);

  const ecDayOptions = useMemo(() => {
    const daysCount =
      activeEcYear && activeEcMonth
        ? getEthiopianMonthDays(activeEcYear, activeEcMonth)
        : 30;
    const list: { value: number; label: string; disabled?: boolean }[] = [];
    for (let d = 1; d <= daysCount; d += 1) {
      const futureDisabled =
        disableFuture &&
        activeEcYear === todayEc.year &&
        activeEcMonth === todayEc.month &&
        d > todayEc.day;
      list.push({
        value: d,
        label: String(d).padStart(2, '0'),
        disabled: futureDisabled,
      });
    }
    return list;
  }, [
    activeEcYear,
    activeEcMonth,
    disableFuture,
    todayEc.year,
    todayEc.month,
    todayEc.day,
  ]);

  const equivalent = useMemo(
    () =>
      formatFieldEquivalent({
        ...normalized,
        precision: effectivePrecision,
      }),
    [normalized, effectivePrecision],
  );

  const gcPlaceholder =
    placeholder ||
    (effectivePrecision === 'year'
      ? 'Select year (G.C.)'
      : effectivePrecision === 'month'
        ? 'Select month & year'
        : 'Select date (G.C.)');

  const ecIncompleteNotice =
    effectiveCalendar === 'ec' &&
    !normalized.date &&
    (activeEcYear !== undefined || activeEcMonth !== undefined || activeEcDay !== undefined)
      ? activeEcYear === undefined
        ? 'Select an Ethiopian year to complete'
        : effectivePrecision === 'month'
          ? 'Select an Ethiopian month to complete'
          : !activeEcMonth
            ? 'Select Ethiopian month and day'
            : 'Select day to complete'
      : null;

  return (
    <div id={id} className={`cal-date-input ${className}`.trim()}>
      {!hideCalendarSwitch || allowPartial ? (
        <div className="cal-date-input__toolbar">
          {!hideCalendarSwitch ? (
            <Segmented
              size="small"
              aria-label="Calendar system"
              value={effectiveCalendar}
              onChange={(v) => handleCalendarSwitch(v as CalendarSystem)}
              options={[
                { label: 'GC', value: 'gc' },
                { label: 'EC', value: 'ec' },
              ]}
            />
          ) : null}
          {allowPartial ? (
            <Segmented
              size="small"
              aria-label="Date precision"
              value={effectivePrecision}
              onChange={(v) => handlePrecisionSwitch(v as DatePrecision)}
              options={[
                { label: 'Exact', value: 'day' },
                { label: 'Month & Year', value: 'month' },
                { label: 'Year Only', value: 'year' },
              ]}
            />
          ) : null}
        </div>
      ) : null}

      <div className="cal-date-input__control">
        {effectiveCalendar === 'gc' ? (
          <DatePicker
            style={{ width: '100%' }}
            size={size}
            picker={
              effectivePrecision === 'year'
                ? 'year'
                : effectivePrecision === 'month'
                  ? 'month'
                  : 'date'
            }
            format={
              effectivePrecision === 'year'
                ? 'YYYY'
                : effectivePrecision === 'month'
                  ? 'MMM YYYY'
                  : 'MMM D, YYYY'
            }
            value={gcPickerValue}
            allowClear={allowClear}
            disabledDate={gcDisabledDate}
            placeholder={gcPlaceholder}
            onChange={(d) => {
              if (!d) {
                emitChange({
                  date: null,
                  precision: effectivePrecision,
                  calendar: 'gc',
                });
                return;
              }
              const fmt =
                effectivePrecision === 'year'
                  ? 'YYYY'
                  : effectivePrecision === 'month'
                    ? 'YYYY-MM'
                    : 'YYYY-MM-DD';
              emitChange({
                date: d.format(fmt),
                precision: effectivePrecision,
                calendar: 'gc',
              });
            }}
          />
        ) : (
          <div className="cal-date-input__ec-row">
            <Select
              className="cal-date-input__ec-year"
              size={size}
              showSearch
              optionFilterProp="label"
              placeholder="Year (EC)"
              value={activeEcYear}
              options={ecYearOptions}
              onChange={(y: number) => {
                const clampedMonth =
                  disableFuture && y === todayEc.year && activeEcMonth && activeEcMonth > todayEc.month
                    ? todayEc.month
                    : activeEcMonth;
                const maxDay =
                  clampedMonth ? getEthiopianMonthDays(y, clampedMonth) : 30;
                const nextDay =
                  activeEcDay !== undefined
                    ? Math.min(
                        activeEcDay,
                        disableFuture && y === todayEc.year && clampedMonth === todayEc.month
                          ? todayEc.day
                          : maxDay,
                      )
                    : undefined;
                commitEcParts({
                  year: y,
                  month: clampedMonth,
                  day: nextDay,
                });
              }}
            />

            {effectivePrecision !== 'year' ? (
              <Select
                className="cal-date-input__ec-month"
                size={size}
                showSearch
                optionFilterProp="label"
                placeholder="Month (EC)"
                value={activeEcMonth}
                options={ecMonthOptions}
                onChange={(m: number) => {
                  const y = activeEcYear ?? todayEc.year;
                  const maxDay = getEthiopianMonthDays(y, m);
                  const nextDay =
                    activeEcDay !== undefined
                      ? Math.min(
                          activeEcDay,
                          disableFuture && y === todayEc.year && m === todayEc.month
                            ? todayEc.day
                            : maxDay,
                        )
                      : undefined;
                  commitEcParts({
                    year: activeEcYear,
                    month: m,
                    day: nextDay,
                  });
                }}
              />
            ) : null}

            {effectivePrecision === 'day' ? (
              <Select
                className="cal-date-input__ec-day"
                size={size}
                placeholder="Day"
                value={activeEcDay}
                options={ecDayOptions}
                onChange={(d: number) => {
                  commitEcParts({
                    year: activeEcYear,
                    month: activeEcMonth,
                    day: d,
                  });
                }}
              />
            ) : null}

            {allowClear && (normalized.date || ecDraft) ? (
              <Button
                type="text"
                size="small"
                icon={<CloseCircleOutlined />}
                className="cal-date-input__clear-btn"
                aria-label="Clear Ethiopian date"
                onClick={handleClearAll}
              />
            ) : null}
          </div>
        )}
      </div>

      {equivalent ? (
        <div className="cal-date-input__hint">
          {`= ${equivalent}`}
        </div>
      ) : ecIncompleteNotice ? (
        <div className="cal-date-input__hint cal-date-input__hint--warn">
          {ecIncompleteNotice}
        </div>
      ) : null}
    </div>
  );
};

export default CalendarDateInput;
