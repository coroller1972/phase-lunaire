import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const LOCAL_INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function localDateTimeToUtc(localDateTime: string, timezone: string): Date {
  return fromZonedTime(localDateTime, timezone);
}

export function utcToLocalDateTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, LOCAL_INPUT_FORMAT);
}

export function isValidLocalDateTime(value: string, timezone: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  try {
    const date = localDateTimeToUtc(value, timezone);
    return Number.isFinite(date.getTime()) && utcToLocalDateTime(date, timezone) === value;
  } catch { return false; }
}

export function formatObservationDate(localDateTime: string, timezone: string): string {
  const date = localDateTimeToUtc(localDateTime, timezone);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatObservationTime(localDateTime: string, timezone: string): string {
  const date = localDateTimeToUtc(localDateTime, timezone);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
  }).format(date).replace(".", "");
}

export function formatEventTime(date: Date | null, timezone: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
