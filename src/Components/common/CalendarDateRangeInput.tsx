'use client';

import React, { useMemo, useState } from 'react';
import { Button, DatePicker, Segmented, Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ETHIOPIC_MONTHS,
  formatByPrecision,
  formatCalendarDate,
  fromEntityDate,
  getEthiopianMonthDays,
  getTodayInCalendar,
  isValidEthiopianDate,
  parseFieldDateParts,
  parseFlexibleCalendarDate,
  type CalendarSystem,
} from '@/lib/ethiopian-calendar';
import './CalendarDateInput.css';

const { RangePicker } = DatePicker;

export interface CalendarDateRangeValue {
  start: string | null;
  end: string | null;
  calendar: CalendarSystem;
}

export interface CalendarDateRangeInputProps {
  id?: string;
  value?: CalendarDateRangeValue | null;
  onChange?: (value: CalendarDateRangeValue) => void;
  defaultCalendar?: CalendarSystem;
  allowEmptyEnd?: boolean;
  disableFuture?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  minYear?: number;
  maxYear?: number;
}

export function requiredCalendarRangeValidator(
  options: {
    allowEmptyEnd?: boolean;
    startMessage?: string;
    endMessage?: string;
    orderMessage?: string;
  } = {},
) {
  const allowEmptyEnd = options.allowEmptyEnd ?? false;
  return async (_: unknown, value: CalendarDateRangeValue | undefined) => {
    if (!value?.start) {
      throw new Error(options.startMessage || 'Select start and end dates');
    }
    if (!allowEmptyEnd && !value?.end) {
      throw new Error(options.endMessage || 'Select start and end dates');
    }
    if (value.start && value.end) {
      const parsedStart = parseFlexibleCalendarDate(value.start, {
        calendar: value.calendar,
        precision: 'day',
        allowPartial: false,
      });
      const parsedEnd = parseFlexibleCalendarDate(value.end, {
        calendar: value.calendar,
        precision: 'day',
        allowPartial: false,
      });
      if (!parsedStart || (!allowEmptyEnd && !parsedEnd) || (parsedEnd && parsedEnd.isoDate < parsedStart.isoDate)) {
        throw new Error(
          options.orderMessage || 'End date must be on or after start date',
        );
      }
    }
  };
}

interface EcDraft {
  year?: number;
  month?: number;
  day?: number;
}

function convertRangeSingleDate(
  dateStr: string | null,
  fromCalendar: CalendarSystem,
  toCalendar: CalendarSystem,
): string | null {
  if (!dateStr || fromCalendar === toCalendar) return dateStr;
  const parsed = parseFlexibleCalendarDate(dateStr, {
    calendar: fromCalendar,
    precision: 'day',
    allowPartial: false,
  });
  if (!parsed) return null;
  return fromEntityDate(parsed.isoDate, 'day', toCalendar).date;
}

const CalendarDateRangeInput: React.FC<CalendarDateRangeInputProps> = ({
  id,
  value,
  onChange,
  defaultCalendar = 'gc',
  allowEmptyEnd = false,
  disableFuture = false,
  size = 'middle',
  className = '',
  minYear = 1900,
  maxYear = 2100,
}) => {
  const [internalCalendar, setInternalCalendar] = useState<CalendarSystem>(defaultCalendar);
  const [startDraft, setStartDraft] = useState<EcDraft | null>(null);
  const [endDraft, setEndDraft] = useState<EcDraft | null>(null);

  const effectiveCalendar: CalendarSystem = value?.calendar ?? internalCalendar;
  const startStr = value?.start ?? null;
  const endStr = value?.end ?? null;

  const todayEc = useMemo(() => getTodayInCalendar('ec'), []);

  const emitChange = (next: CalendarDateRangeValue) => {
    setInternalCalendar(next.calendar);
    onChange?.(next);
  };

  const handleCalendarSwitch = (nextCalendar: CalendarSystem) => {
    if (nextCalendar === effectiveCalendar) return;
    setStartDraft(null);
    setEndDraft(null);
    emitChange({
      start: convertRangeSingleDate(startStr, effectiveCalendar, nextCalendar),
      end: convertRangeSingleDate(endStr, effectiveCalendar, nextCalendar),
      calendar: nextCalendar,
    });
  };

  const gcRangeValue = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    if (effectiveCalendar !== 'gc') return null;
    const s = startStr ? dayjs(startStr, 'YYYY-MM-DD', true) : null;
    const e = endStr ? dayjs(endStr, 'YYYY-MM-DD', true) : null;
    const validStart = s && s.isValid() ? s : null;
    const validEnd = e && e.isValid() ? e : null;
    if (!validStart && !validEnd) return null;
    return [validStart, validEnd];
  }, [effectiveCalendar, startStr, endStr]);

  const startParts = useMemo(
    () =>
      effectiveCalendar === 'ec' && startStr
        ? parseFieldDateParts({ date: startStr, precision: 'day', calendar: 'ec' })
        : null,
    [effectiveCalendar, startStr],
  );
  const endParts = useMemo(
    () =>
      effectiveCalendar === 'ec' && endStr
        ? parseFieldDateParts({ date: endStr, precision: 'day', calendar: 'ec' })
        : null,
    [effectiveCalendar, endStr],
  );

  const ecYearOptions = useMemo(() => {
    const list: { value: number; label: string }[] = [];
    const lower = disableFuture
      ? Math.max(1800, minYear)
      : Math.max(1800, Math.min(minYear === 1900 ? todayEc.year - 5 : minYear, todayEc.year));
    const upper = disableFuture
      ? Math.min(maxYear, todayEc.year)
      : Math.max(maxYear === 2100 ? todayEc.year + 25 : maxYear, todayEc.year);
    if (disableFuture) {
      for (let y = upper; y >= lower; y -= 1) {
        list.push({ value: y, label: String(y) });
      }
    } else {
      for (let y = lower; y <= upper; y += 1) {
        list.push({ value: y, label: String(y) });
      }
    }
    return list;
  }, [disableFuture, maxYear, minYear, todayEc.year]);

  const commitEcSlot = (slot: 'start' | 'end', next: EcDraft) => {
    const setDraft = slot === 'start' ? setStartDraft : setEndDraft;
    if (!next.year && !next.month && !next.day) {
      setDraft(null);
      emitChange({
        start: slot === 'start' ? null : startStr,
        end: slot === 'end' ? null : endStr,
        calendar: 'ec',
      });
      return;
    }

    if (!next.year || !next.month || !next.day) {
      setDraft(next);
      emitChange({
        start: slot === 'start' ? null : startStr,
        end: slot === 'end' ? null : endStr,
        calendar: 'ec',
      });
      return;
    }

    const maxDay = getEthiopianMonthDays(next.year, next.month);
    const clampedDay = Math.min(next.day, maxDay);
    if (!isValidEthiopianDate(next.year, next.month, clampedDay)) {
      setDraft(next);
      return;
    }

    setDraft(null);
    const formatted = formatByPrecision(next.year, next.month, clampedDay, 'day');
    emitChange({
      start: slot === 'start' ? formatted : startStr,
      end: slot === 'end' ? formatted : endStr,
      calendar: 'ec',
    });
  };

  const renderEcSlot = (
    slot: 'start' | 'end',
    label: string,
    parts: { year: number; month?: number; day?: number } | null,
    draft: EcDraft | null,
    committedStr: string | null,
  ) => {
    const activeY = parts?.year ?? draft?.year;
    const activeM = parts?.month ?? draft?.month;
    const activeD = parts?.day ?? draft?.day;

    const monthOpts = ETHIOPIC_MONTHS.map((m) => ({
      value: m.value,
      label: `${m.name} (${m.value})`,
      disabled: disableFuture && activeY === todayEc.year && m.value > todayEc.month,
    }));

    const daysInMonth =
      activeY && activeM ? getEthiopianMonthDays(activeY, activeM) : 30;
    const dayOpts = Array.from({ length: daysInMonth }, (_, idx) => {
      const d = idx + 1;
      return {
        value: d,
        label: String(d).padStart(2, '0'),
        disabled:
          disableFuture &&
          activeY === todayEc.year &&
          activeM === todayEc.month &&
          d > todayEc.day,
      };
    });

    return (
      <div className="cal-date-range__row">
        <span className="cal-date-range__row-label">{label}</span>
        <div className="cal-date-input__ec-row">
          <Select
            className="cal-date-input__ec-year"
            size={size}
            showSearch
            optionFilterProp="label"
            placeholder="Year (EC)"
            value={activeY}
            options={ecYearOptions}
            onChange={(y: number) => {
              const clampedM =
                disableFuture && y === todayEc.year && activeM && activeM > todayEc.month
                  ? todayEc.month
                  : activeM;
              const maxDay = clampedM ? getEthiopianMonthDays(y, clampedM) : 30;
              const nextD =
                activeD !== undefined
                  ? Math.min(
                      activeD,
                      disableFuture && y === todayEc.year && clampedM === todayEc.month
                        ? todayEc.day
                        : maxDay,
                    )
                  : undefined;
              commitEcSlot(slot, { year: y, month: clampedM, day: nextD });
            }}
          />
          <Select
            className="cal-date-input__ec-month"
            size={size}
            showSearch
            optionFilterProp="label"
            placeholder="Month (EC)"
            value={activeM}
            options={monthOpts}
            onChange={(m: number) => {
              const y = activeY ?? todayEc.year;
              const maxDay = getEthiopianMonthDays(y, m);
              const nextD =
                activeD !== undefined
                  ? Math.min(
                      activeD,
                      disableFuture && y === todayEc.year && m === todayEc.month
                        ? todayEc.day
                        : maxDay,
                    )
                  : undefined;
              commitEcSlot(slot, { year: activeY, month: m, day: nextD });
            }}
          />
          <Select
            className="cal-date-input__ec-day"
            size={size}
            placeholder="Day"
            value={activeD}
            options={dayOpts}
            onChange={(d: number) => {
              commitEcSlot(slot, { year: activeY, month: activeM, day: d });
            }}
          />
          {committedStr || draft ? (
            <Button
              type="text"
              size="small"
              icon={<CloseCircleOutlined />}
              className="cal-date-input__clear-btn"
              aria-label={`Clear ${label}`}
              onClick={() => commitEcSlot(slot, {})}
            />
          ) : null}
        </div>
      </div>
    );
  };

  const { equivalentText, orderError } = useMemo(() => {
    const parsedStart = startStr
      ? parseFlexibleCalendarDate(startStr, {
          calendar: effectiveCalendar,
          precision: 'day',
          allowPartial: false,
        })
      : null;
    const parsedEnd = endStr
      ? parseFlexibleCalendarDate(endStr, {
          calendar: effectiveCalendar,
          precision: 'day',
          allowPartial: false,
        })
      : null;

    if (parsedStart && parsedEnd && parsedEnd.isoDate < parsedStart.isoDate) {
      return {
        equivalentText: null,
        orderError: 'End date must be on or after start date',
      };
    }

    if (!parsedStart) {
      return { equivalentText: null, orderError: null };
    }

    const otherCal: CalendarSystem = effectiveCalendar === 'ec' ? 'gc' : 'ec';
    const startEq = formatCalendarDate(parsedStart.isoDate, 'day', otherCal);
    if (!parsedEnd || parsedEnd.isoDate === parsedStart.isoDate) {
      return { equivalentText: startEq, orderError: null };
    }
    const endEq = formatCalendarDate(parsedEnd.isoDate, 'day', otherCal);
    return {
      equivalentText: `${startEq} – ${endEq}`,
      orderError: null,
    };
  }, [startStr, endStr, effectiveCalendar]);

  return (
    <div id={id} className={`cal-date-range ${className}`.trim()}>
      <div className="cal-date-range__toolbar">
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
      </div>

      {effectiveCalendar === 'gc' ? (
        <RangePicker
          style={{ width: '100%' }}
          size={size}
          format="MMM D, YYYY"
          value={gcRangeValue}
          allowEmpty={[true, allowEmptyEnd]}
          disabledDate={
            disableFuture ? (cur) => cur.isAfter(dayjs(), 'day') : undefined
          }
          onChange={(range) => {
            emitChange({
              start: range?.[0] ? range[0].format('YYYY-MM-DD') : null,
              end: range?.[1] ? range[1].format('YYYY-MM-DD') : null,
              calendar: 'gc',
            });
          }}
        />
      ) : (
        <div className="cal-date-range__ec-list">
          {renderEcSlot('start', 'Start date (E.C.)', startParts, startDraft, startStr)}
          {renderEcSlot(
            'end',
            allowEmptyEnd ? 'End date (E.C., optional)' : 'End date (E.C.)',
            endParts,
            endDraft,
            endStr,
          )}
        </div>
      )}

      {orderError ? (
        <div className="cal-date-input__hint cal-date-input__hint--warn">
          {orderError}
        </div>
      ) : equivalentText ? (
        <div className="cal-date-input__hint">{`= ${equivalentText}`}</div>
      ) : null}
    </div>
  );
};

export default CalendarDateRangeInput;

