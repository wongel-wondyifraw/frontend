'use client';

import React, { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Input, Select, Space } from 'antd';
import { Calendar } from 'lucide-react';
import type { Dayjs } from 'dayjs';
import {
  ETHIOPIC_MONTHS,
  convertFieldCalendar,
  formatByPrecision,
  formatFieldEquivalent,
  formatGcFieldDisplay,
  getEthiopianMonthDays,
  getTodayInCalendar,
  isCalendarDateInFuture,
  isValidEthiopianDate,
  parseFieldDateParts,
  parseFlexibleCalendarDate,
  parseTypedGcDateInput,
  type CalendarDateFieldValue,
  type CalendarSystem,
  type DatePrecision,
} from '@/lib/ethiopian-calendar';
import './CalendarDateInput.css';

const DynamicGcDatePicker = dynamic(() => import('./GcDatePicker'), {
  ssr: false,
  loading: () => <div className="cal-date-input__picker-skeleton" aria-hidden="true" />,
});

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

function inferPrecisionFromString(
  rawDate: string | null | undefined,
  fallback: DatePrecision = 'day',
): DatePrecision {
  if (!rawDate) return fallback;
  const parts = parseFieldDateParts({ date: rawDate, precision: fallback, calendar: 'gc' });
  if (!parts) return fallback;
  if (parts.day !== undefined) return 'day';
  if (parts.month !== undefined) return 'month';
  return 'year';
}

function normalizePropValue(
  raw: CalendarDateFieldValue | string | null | undefined,
  defaultCalendar: CalendarSystem,
  defaultPrecision: DatePrecision,
  allowPartial: boolean,
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
      allowPartial,
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
  const cal = raw.calendar ?? defaultCalendar;
  const prec = allowPartial
    ? (raw.date ? inferPrecisionFromString(raw.date, raw.precision ?? defaultPrecision) : (raw.precision ?? defaultPrecision))
    : 'day';
  return {
    date: raw.date ?? null,
    precision: prec,
    calendar: cal,
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

const CALENDAR_SWITCH_OPTIONS = [
  { value: 'gc', label: 'GC — Gregorian' },
  { value: 'ec', label: 'EC — Ethiopian' },
];

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
    precision: allowPartial ? defaultPrecision : 'day',
  });

  const [ecDraft, setEcDraft] = useState<{
    year?: number;
    month?: number;
    day?: number;
  } | null>(null);

  const [gcDraft, setGcDraft] = useState<{
    text: string;
    error: string | null;
  } | null>(null);

  const [isGcFocused, setIsGcFocused] = useState(false);
  const [pickerMounted, setPickerMounted] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const wasOpenBeforeClickRef = useRef(false);

  const normalized = useMemo(() => {
    if (value && typeof value === 'object') {
      return normalizePropValue(
        value,
        value.calendar ?? internalMeta.calendar,
        value.precision ?? internalMeta.precision,
        allowPartial,
      );
    }
    if (typeof value === 'string') {
      return normalizePropValue(
        value,
        internalMeta.calendar,
        internalMeta.precision,
        allowPartial,
      );
    }
    return normalizePropValue(
      null,
      internalMeta.calendar,
      internalMeta.precision,
      allowPartial,
    );
  }, [value, internalMeta.calendar, internalMeta.precision, allowPartial]);

  const valueKey = `${normalized.calendar}:${normalized.precision}:${normalized.date ?? ''}`;
  const [prevValueProp, setPrevValueProp] = useState(value);
  const [selfEmittedKey, setSelfEmittedKey] = useState<string | null>(null);

  if (value !== prevValueProp) {
    setPrevValueProp(value);
    if (valueKey !== selfEmittedKey) {
      setGcDraft(null);
      setEcDraft(null);
    }
  }

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
    const nextKey = `${next.calendar}:${next.precision}:${next.date ?? ''}`;
    setSelfEmittedKey(nextKey);
    setInternalMeta({ calendar: next.calendar, precision: next.precision });
    onChange?.(next);
  };

  const handleCalendarSwitch = (nextCal: CalendarSystem) => {
    if (nextCal === effectiveCalendar) return;
    setEcDraft(null);
    setGcDraft(null);
    setCalendarOpen(false);
    const converted = convertFieldCalendar(
      { ...normalized, precision: effectivePrecision },
      nextCal,
    );
    emitChange(converted);
  };

  const commitEcParts = (next: { year?: number; month?: number; day?: number }) => {
    if (!next.year && !next.month && !next.day) {
      setEcDraft(null);
      emitChange({
        date: null,
        precision: 'day',
        calendar: 'ec',
      });
      return;
    }

    if (!next.year) {
      setEcDraft(next);
      emitChange({
        date: null,
        precision: 'day',
        calendar: 'ec',
      });
      return;
    }

    if (allowPartial) {
      if (!next.month) {
        setEcDraft(null);
        emitChange({
          date: String(next.year).padStart(4, '0'),
          precision: 'year',
          calendar: 'ec',
        });
        return;
      }

      if (!next.day) {
        setEcDraft(null);
        emitChange({
          date: formatByPrecision(next.year, next.month, 1, 'month'),
          precision: 'month',
          calendar: 'ec',
        });
        return;
      }
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

  const handleGcTextChange = (rawText: string) => {
    if (!rawText.trim()) {
      setGcDraft(isGcFocused ? { text: '', error: null } : null);
      emitChange({
        date: null,
        precision: 'day',
        calendar: 'gc',
      });
      return;
    }

    const parsed = parseTypedGcDateInput(rawText, { minYear, maxYear });
    if (!parsed) {
      setGcDraft({ text: rawText, error: null });
      emitChange({
        date: null,
        precision: 'day',
        calendar: 'gc',
      });
      return;
    }

    if (
      disableFuture &&
      isCalendarDateInFuture(
        parsed.year,
        parsed.month,
        parsed.day,
        parsed.precision,
        'gc',
        todayGc,
      )
    ) {
      setGcDraft({ text: rawText, error: 'Future date is not allowed' });
      emitChange({
        date: null,
        precision: 'day',
        calendar: 'gc',
      });
      return;
    }

    setGcDraft({ text: rawText, error: null });
    emitChange({
      date: parsed.date,
      precision: parsed.precision,
      calendar: 'gc',
    });
  };

  const handleGcInputBlur = () => {
    setIsGcFocused(false);
    if (!gcDraft) return;
    const trimmed = gcDraft.text.trim();
    if (!trimmed) {
      setGcDraft(null);
      return;
    }
    const parsed = parseTypedGcDateInput(trimmed, { minYear, maxYear });
    if (!parsed) {
      setGcDraft({
        text: gcDraft.text,
        error: 'Enter YYYY (e.g. 1995), YYYY-MM, or full date',
      });
      return;
    }
    if (
      disableFuture &&
      isCalendarDateInFuture(
        parsed.year,
        parsed.month,
        parsed.day,
        parsed.precision,
        'gc',
        todayGc,
      )
    ) {
      setGcDraft({
        text: gcDraft.text,
        error: 'Future date is not allowed',
      });
      return;
    }
    setGcDraft(null);
  };

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
    (allowPartial ? 'Select date or enter year' : 'Select date (G.C.)');

  const gcInputDisplay =
    gcDraft !== null
      ? gcDraft.text
      : formatGcFieldDisplay(normalized);

  const ecNotice =
    effectiveCalendar === 'ec' &&
    !normalized.date &&
    (activeEcYear !== undefined || activeEcMonth !== undefined || activeEcDay !== undefined)
      ? activeEcYear === undefined
        ? 'Select Ethiopian year to set date'
        : !allowPartial
          ? !activeEcMonth
            ? 'Select Ethiopian month and day'
            : 'Select day to complete'
          : null
      : null;

  const calendarSelect = !hideCalendarSwitch ? (
    <Select
      aria-label="Calendar system"
      className="cal-date-input__cal-select"
      size={size}
      value={effectiveCalendar}
      popupMatchSelectWidth={false}
      labelRender={({ value: cal }) => (cal === 'ec' ? 'EC' : 'GC')}
      onChange={(v) => handleCalendarSwitch(v as CalendarSystem)}
      options={CALENDAR_SWITCH_OPTIONS}
    />
  ) : null;

  const gcControlNode = !allowPartial ? (
    hideCalendarSwitch ? (
      <DynamicGcDatePicker
        mode="inline"
        parsedParts={parsedParts}
        disableFuture={disableFuture}
        todayGc={todayGc}
        disabledDate={disabledDate}
        size={size}
        allowClear={allowClear}
        placeholder={gcPlaceholder}
        minYear={minYear}
        maxYear={maxYear}
        onChange={(dateStr) =>
          emitChange({
            date: dateStr,
            precision: 'day',
            calendar: 'gc',
          })
        }
      />
    ) : (
      <Space.Compact className="cal-date-input__compact" style={{ width: '100%' }}>
        <DynamicGcDatePicker
          mode="inline"
          parsedParts={parsedParts}
          disableFuture={disableFuture}
          todayGc={todayGc}
          disabledDate={disabledDate}
          size={size}
          allowClear={allowClear}
          placeholder={gcPlaceholder}
          minYear={minYear}
          maxYear={maxYear}
          onChange={(dateStr) =>
            emitChange({
              date: dateStr,
              precision: 'day',
              calendar: 'gc',
            })
          }
        />
        {calendarSelect}
      </Space.Compact>
    )
  ) : (
    <div className="cal-date-input__gc-wrap">
      {hideCalendarSwitch ? (
        <Input
          className="cal-date-input__gc-text"
          size={size}
          value={gcInputDisplay}
          allowClear={allowClear}
          status={gcDraft?.error ? 'warning' : undefined}
          placeholder={gcPlaceholder}
          onFocus={() => {
            setIsGcFocused(true);
            if (gcDraft === null) {
              setGcDraft({ text: formatGcFieldDisplay(normalized), error: null });
            }
          }}
          onBlur={handleGcInputBlur}
          onChange={(e) => handleGcTextChange(e.target.value)}
          suffix={
            <button
              type="button"
              className="cal-date-input__calendar-btn"
              aria-label="Open calendar picker"
              onMouseDownCapture={() => {
                wasOpenBeforeClickRef.current = calendarOpen;
              }}
              onClick={() => {
                setPickerMounted(true);
                setCalendarOpen(!wasOpenBeforeClickRef.current);
              }}
            >
              <Calendar size={15} />
            </button>
          }
        />
      ) : (
        <Space.Compact className="cal-date-input__compact" style={{ width: '100%' }}>
          <Input
            className="cal-date-input__gc-text"
            size={size}
            value={gcInputDisplay}
            allowClear={allowClear}
            status={gcDraft?.error ? 'warning' : undefined}
            placeholder={gcPlaceholder}
            onFocus={() => {
              setIsGcFocused(true);
              if (gcDraft === null) {
                setGcDraft({ text: formatGcFieldDisplay(normalized), error: null });
              }
            }}
            onBlur={handleGcInputBlur}
            onChange={(e) => handleGcTextChange(e.target.value)}
            suffix={
              <button
                type="button"
                className="cal-date-input__calendar-btn"
                aria-label="Open calendar picker"
                onMouseDownCapture={() => {
                  wasOpenBeforeClickRef.current = calendarOpen;
                }}
                onClick={() => {
                  setPickerMounted(true);
                  setCalendarOpen(!wasOpenBeforeClickRef.current);
                }}
              >
                <Calendar size={15} />
              </button>
            }
          />
          {calendarSelect}
        </Space.Compact>
      )}

      {pickerMounted ? (
        <DynamicGcDatePicker
          mode="popover"
          open={calendarOpen}
          onOpenChange={setCalendarOpen}
          parsedParts={parsedParts}
          disableFuture={disableFuture}
          todayGc={todayGc}
          disabledDate={disabledDate}
          size={size}
          minYear={minYear}
          maxYear={maxYear}
          onChange={(dateStr) => {
            setGcDraft(null);
            setCalendarOpen(false);
            emitChange({
              date: dateStr,
              precision: 'day',
              calendar: 'gc',
            });
          }}
        />
      ) : null}
    </div>
  );

  return (
    <div id={id} className={`cal-date-input cal-date-input--${size} ${className}`.trim()}>
      <div className="cal-date-input__control">
        {effectiveCalendar === 'gc' ? (
          gcControlNode
        ) : (
          <div className="cal-date-input__ec-row">
            <Select
              className="cal-date-input__ec-year"
              size={size}
              showSearch
              allowClear={allowClear}
              optionFilterProp="label"
              placeholder="Year (EC)"
              value={activeEcYear}
              options={ecYearOptions}
              onChange={(y: number | undefined) => {
                if (y === undefined) {
                  commitEcParts({});
                  return;
                }
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

            <Select
              className="cal-date-input__ec-month"
              size={size}
              showSearch
              allowClear={allowPartial && allowClear}
              optionFilterProp="label"
              placeholder={allowPartial ? 'Month (opt)' : 'Month (EC)'}
              value={activeEcMonth}
              options={ecMonthOptions}
              onChange={(m: number | undefined) => {
                if (m === undefined) {
                  commitEcParts({
                    year: activeEcYear,
                    month: undefined,
                    day: undefined,
                  });
                  return;
                }
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

            <Select
              className="cal-date-input__ec-day"
              size={size}
              allowClear={allowPartial && allowClear}
              disabled={!activeEcMonth}
              placeholder={allowPartial ? 'Day (opt)' : 'Day'}
              value={activeEcDay}
              options={ecDayOptions}
              onChange={(d: number | undefined) => {
                commitEcParts({
                  year: activeEcYear,
                  month: activeEcMonth,
                  day: d,
                });
              }}
            />

            {calendarSelect}
          </div>
        )}
      </div>

      {gcDraft?.error ? (
        <div className="cal-date-input__hint cal-date-input__hint--warn">
          {gcDraft.error}
        </div>
      ) : equivalent ? (
        <div className="cal-date-input__hint">
          {`= ${equivalent}`}
        </div>
      ) : ecNotice ? (
        <div className="cal-date-input__hint cal-date-input__hint--warn">
          {ecNotice}
        </div>
      ) : null}
    </div>
  );
};

export default CalendarDateInput;
