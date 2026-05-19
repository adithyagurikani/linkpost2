export const DEFAULT_TZ = "Asia/Kolkata";

function getTzOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);

  const tzYear = parseInt(parts.find((p) => p.type === "year")!.value);
  const tzMonth = parseInt(parts.find((p) => p.type === "month")!.value) - 1;
  const tzDay = parseInt(parts.find((p) => p.type === "day")!.value);
  const tzHour = parseInt(parts.find((p) => p.type === "hour")!.value);
  const tzMinute = parseInt(parts.find((p) => p.type === "minute")!.value);
  const tzSecond = parseInt(parts.find((p) => p.type === "second")!.value);

  const localEpoch = Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute, tzSecond);
  return localEpoch - date.getTime();
}

export function localToUtc(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const noonUtc = Date.UTC(year, month, day, 12, 0, 0);
  const offsetMs = getTzOffsetMs(new Date(noonUtc), timezone);
  return new Date(Date.UTC(year, month, day, hour, minute, 0) - offsetMs);
}

export function getNextRun(
  times: string[],
  after: Date = new Date(),
  timezone: string = DEFAULT_TZ,
): Date {
  if (!times.length) return new Date(after.getTime() + 86400000);

  const sorted = [...times].sort();

  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(after);

  const year = parseInt(dateParts.find((p) => p.type === "year")!.value);
  const month = parseInt(dateParts.find((p) => p.type === "month")!.value) - 1;
  const day = parseInt(dateParts.find((p) => p.type === "day")!.value);

  for (const time of sorted) {
    const [h, m] = time.split(":").map(Number);
    const candidate = localToUtc(timezone, year, month, day, h, m);
    if (candidate > after) return candidate;
  }

  const tomorrow = new Date(after.getTime() + 86400000);
  const tomorrowParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(tomorrow);

  const tYear = parseInt(tomorrowParts.find((p) => p.type === "year")!.value);
  const tMonth = parseInt(tomorrowParts.find((p) => p.type === "month")!.value) - 1;
  const tDay = parseInt(tomorrowParts.find((p) => p.type === "day")!.value);

  const [fh, fm] = sorted[0].split(":").map(Number);
  return localToUtc(timezone, tYear, tMonth, tDay, fh, fm);
}

export function getDateInTz(timezone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function detectTimezone(): string {
  if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {}
  }
  return DEFAULT_TZ;
}

export function getTzAbbr(timezone: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value || timezone;
  } catch {
    return timezone;
  }
}
