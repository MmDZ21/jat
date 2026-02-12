/**
 * Time utility helpers for the JAT Booking System.
 * - All database times are stored in UTC.
 * - Display is always in Asia/Tehran timezone.
 * - Persian week starts on Saturday (dayOfWeek 0).
 */

export const TEHRAN_TZ = "Asia/Tehran";

// Persian day names (Saturday = 0 → Friday = 6)
export const PERSIAN_DAY_NAMES = [
  "شنبه",      // 0 - Saturday
  "یک‌شنبه",   // 1 - Sunday
  "دوشنبه",    // 2 - Monday
  "سه‌شنبه",   // 3 - Tuesday
  "چهارشنبه",  // 4 - Wednesday
  "پنج‌شنبه",  // 5 - Thursday
  "جمعه",      // 6 - Friday
];

/**
 * Convert a JS Date `getDay()` (0=Sunday) to our Persian week index (0=Saturday).
 */
export function jsDayToPersianDay(jsDay: number): number {
  // JS: 0=Sun,1=Mon,...,6=Sat → Persian: 0=Sat,1=Sun,...,6=Fri
  return jsDay === 6 ? 0 : jsDay + 1;
}

/**
 * Convert our Persian day index (0=Saturday) to JS Date `getDay()` (0=Sunday).
 */
export function persianDayToJsDay(persianDay: number): number {
  return persianDay === 0 ? 6 : persianDay - 1;
}

/**
 * Format a Date as Persian date string (e.g., "۱۴۰۴/۱۱/۲۳ شنبه")
 */
export function formatPersianDate(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(date);
}

/**
 * Format a Date as short Persian date (e.g., "۲۳ بهمن")
 */
export function formatPersianDateShort(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN_TZ,
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format a Date as Persian time string (e.g., "۱۴:۳۰")
 */
export function formatPersianTime(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Format time in Latin digits for internal use (e.g., "14:30")
 */
export function formatTimeLatinTehran(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Convert "HH:mm" local time on a specific date to a UTC Date.
 * @param dateStr - ISO date string "YYYY-MM-DD"
 * @param timeStr - "HH:mm" in Tehran time
 */
export function tehranTimeToUTC(dateStr: string, timeStr: string): Date {
  // Build the Tehran datetime string
  const tehranDatetime = `${dateStr}T${timeStr}:00`;

  // Use Intl to find the UTC offset for Tehran at this moment
  // We create a date object and adjust
  const tempDate = new Date(tehranDatetime + "Z"); // treat as UTC first
  const tehranOffset = getTehranOffsetMs(tempDate);
  return new Date(tempDate.getTime() - tehranOffset);
}

/**
 * Get Tehran timezone offset in milliseconds for a given UTC date.
 * This accounts for DST changes in Iran.
 */
function getTehranOffsetMs(utcDate: Date): number {
  // Format the date in Tehran tz to get the local date/time parts
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(utcDate);

  const get = (type: string) => {
    const p = parts.find((p) => p.type === type);
    return parseInt(p?.value || "0", 10);
  };

  const tehranLocal = new Date(
    Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
  );

  return tehranLocal.getTime() - utcDate.getTime();
}

/**
 * Get a date string "YYYY-MM-DD" in Tehran timezone for a given Date.
 */
export function getTehranDateStr(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TEHRAN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // en-CA gives "YYYY-MM-DD" format
}

/**
 * Get the JS day of week in Tehran timezone for a given UTC date.
 */
export function getTehranDayOfWeek(date: Date): number {
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TZ,
    weekday: "short",
  }).format(date);

  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[dayStr] ?? 0;
}

/**
 * Generate all time slot start times for a given availability window.
 * @param startTime "HH:mm"
 * @param endTime "HH:mm"
 * @param slotDuration minutes
 * @returns Array of "HH:mm" start times
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number
): string[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots: string[] = [];
  for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }

  return slots;
}

/**
 * Check if two time ranges overlap.
 */
export function timeRangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Add minutes to a Date.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Get start of day in Tehran timezone as a UTC Date.
 */
export function getTehranStartOfDay(date: Date): Date {
  const dateStr = getTehranDateStr(date);
  return tehranTimeToUTC(dateStr, "00:00");
}

/**
 * Get end of day in Tehran timezone as a UTC Date.
 */
export function getTehranEndOfDay(date: Date): Date {
  const dateStr = getTehranDateStr(date);
  return tehranTimeToUTC(dateStr, "23:59");
}
