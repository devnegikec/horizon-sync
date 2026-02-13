/**
 * Date formats:
 * - DD-MM-YY: 31-01-26
 * - MM-DD-YY: 01-31-26
 * - DD-MMM-YY: 31-Jan-26
 * - MMM-DD-YY: Jan-31-26
 */
export type DateFormat = 'DD-MM-YY' | 'MM-DD-YY' | 'DD-MMM-YY' | 'MMM-DD-YY';

export type DateInput = Date | string | number;

/** Options for time display when includeTime is true */
export type TimeFormat = 'HH:mm' | 'HH:mm:ss';

export interface FormatDateOptions {
  /** Include time in the output (uses user's local timezone) */
  includeTime?: boolean;
  /** Time format when includeTime is true. Default: 'HH:mm' */
  timeFormat?: TimeFormat;
  /** IANA timezone (e.g. 'America/New_York'). Default: user's local timezone */
  timeZone?: string;
}

export function toDate(input: DateInput): Date {
  console.log({input});
  // 1. Handle empty cases immediately
  if (input === null || input === undefined) {
    throw new Error('date_util: Input is null or undefined');
  }

  // 2. Initialize the Date object
  // If it's already a Date, new Date(date) creates a safe clone.
  // If it's a string or number, it attempts to parse it.
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);

  // 3. Validation
  // getTime() returns NaN for "Invalid Date" objects.
  if (isNaN(date.getTime())) {
    throw new Error(`date_util: Unable to parse "${input}" into a valid date`);
  }

  return date;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DateParts {
  month: string;
  day: string;
  year: string;
  hour: string;
  minute: string;
  second: string;
}

function getPartsInTimezone(d: Date, timeZone: string, opts: FormatDateOptions): DateParts {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: opts.includeTime ? '2-digit' : undefined,
    minute: opts.includeTime ? '2-digit' : undefined,
    second: opts.includeTime && opts.timeFormat === 'HH:mm:ss' ? '2-digit' : undefined,
    hour12: false,
  });
  const parts = dtf.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    month: pad2(parseInt(get('month'), 10) || 0),
    day: pad2(parseInt(get('day'), 10) || 0),
    year: get('year'),
    hour: pad2(parseInt(get('hour'), 10) || 0),
    minute: pad2(parseInt(get('minute'), 10) || 0),
    second: pad2(parseInt(get('second'), 10) || 0),
  };
}

function getPartsLocal(d: Date): DateParts {
  return {
    month: pad2(d.getMonth() + 1),
    day: pad2(d.getDate()),
    year: String(d.getFullYear()).slice(-2),
    hour: pad2(d.getHours()),
    minute: pad2(d.getMinutes()),
    second: pad2(d.getSeconds()),
  };
}

function buildDateString(format: DateFormat, month: string, day: string, year: string): string {
  const mmm = MONTH_ABBREV[(parseInt(month, 10) || 1) - 1];
  if (format === 'DD-MM-YY') return `${day}-${month}-${year}`;
  if (format === 'MM-DD-YY') return `${month}-${day}-${year}`;
  if (format === 'DD-MMM-YY') return `${day}-${mmm}-${year}`;
  if (format === 'MMM-DD-YY') return `${mmm}-${day}-${year}`;
  return `${day}-${month}-${year}`;
}

/**
 * Formats a date in the user's timezone (or the given timezone).
 *
 * @param date - Date instance, ISO string, or timestamp
 * @param format - 'DD-MM-YY' | 'MM-DD-YY' | 'DD-MMM-YY' | 'MMM-DD-YY'
 * @param includeTimeOrOptions - When true, appends time (HH:mm). Or pass options for time format and timezone.
 * @returns Formatted date string (and time if requested)
 *
 * @example
 * formatDate('2026-01-31T10:30:00Z', 'DD-MM-YY')
 * // => "31-01-26" (in user's timezone)
 *
 * formatDate('2026-01-31T10:30:00Z', 'MM-DD-YY', true)
 * // => "01-31-26 10:30" (or local equivalent)
 *
 * formatDate(new Date(), 'DD-MM-YY', { includeTime: true, timeFormat: 'HH:mm:ss' })
 * // => "31-01-26 15:45:30"
 *
 * formatDate('2026-01-31', 'DD-MMM-YY')
 * // => "31-Jan-26"
 *
 * formatDate('2026-01-31', 'MMM-DD-YY')
 * // => "Jan-31-26"
 */
export function formatDate(date: DateInput, format: DateFormat, includeTimeOrOptions?: boolean | FormatDateOptions): string {
  const opts: FormatDateOptions = typeof includeTimeOrOptions === 'boolean' ? { includeTime: includeTimeOrOptions } : { ...includeTimeOrOptions };

  const d = toDate(date);
  const parts = opts.timeZone ? getPartsInTimezone(d, opts.timeZone, opts) : getPartsLocal(d);
  const { month, day, year, hour, minute, second } = parts;
  let out = buildDateString(format, month, day, year);

  if (opts.includeTime) {
    const timeFmt = opts.timeFormat ?? 'HH:mm';
    const time = timeFmt === 'HH:mm:ss' ? `${hour}:${minute}:${second}` : `${hour}:${minute}`;
    out = `${out} ${time}`;
  }

  return out;
}
