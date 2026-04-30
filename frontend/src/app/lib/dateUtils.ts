import { format, isPast, isToday, isFuture, isValid } from "date-fns";

/**
 * Safely parses any date input (string, number, Date) and returns a valid Date object or null.
 */
export const toValidDate = (date: string | number | Date | null | undefined): Date | null => {
  if (date === null || date === undefined || date === "") return null;
  const d = new Date(date);
  return isValid(d) ? d : null;
};

/**
 * Safely formats a date. Returns fallback if date is invalid.
 */
export const safeFormat = (
  date: string | number | Date | null | undefined,
  formatStr: string,
  fallback: string = "N/A"
): string => {
  const d = toValidDate(date);
  if (!d) return fallback;
  try {
    return format(d, formatStr);
  } catch (error) {
    console.error("Date formatting error:", error, { date, formatStr });
    return fallback;
  }
};

/**
 * Safely checks if a date is in the past.
 */
export const safeIsPast = (date: string | number | Date | null | undefined): boolean => {
  const d = toValidDate(date);
  if (!d) return false;
  try {
    return isPast(d);
  } catch {
    return false;
  }
};

/**
 * Safely checks if a date is today.
 */
export const safeIsToday = (date: string | number | Date | null | undefined): boolean => {
  const d = toValidDate(date);
  if (!d) return false;
  try {
    return isToday(d);
  } catch {
    return false;
  }
};

/**
 * Safely checks if a date is in the future.
 */
export const safeIsFuture = (date: string | number | Date | null | undefined): boolean => {
  const d = toValidDate(date);
  if (!d) return false;
  try {
    return isFuture(d);
  } catch {
    return false;
  }
};
