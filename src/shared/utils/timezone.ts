/**
 * Enterprise Timezone Engine
 * -----------------------------------------------------------------------
 * Handles exact conversions between world timezones, UTC instants, and
 * cross-date boundary slot generation for tutors and students globally.
 * Built on ECMAScript standard Intl APIs (zero external dependencies).
 * -----------------------------------------------------------------------
 */

export interface TimeSlotOutput {
  time: string; // "HH:mm" in student local time
  utcStartTime: string; // ISO 8601 UTC timestamp: "YYYY-MM-DDTHH:mm:ss.sssZ"
  utcEndTime: string; // ISO 8601 UTC timestamp: "YYYY-MM-DDTHH:mm:ss.sssZ"
  period: "morning" | "afternoon" | "evening";
  available: boolean;
  reason?: string;
  tutorLocalTime: string; // "HH:mm" in tutor's clock
  tutorLocalDate: string; // "YYYY-MM-DD" in tutor's calendar
}

export interface CrossTimezoneSlotParams {
  studentDate: string; // "YYYY-MM-DD" in student timezone
  studentTz: string; // e.g. "America/New_York"
  tutorTz: string; // e.g. "Asia/Tokyo"
  rules: Array<{
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    startTime: string; // "HH:mm:ss" or "HH:mm"
    endTime: string; // "HH:mm:ss" or "HH:mm"
    isActive: boolean;
  }>;
  exceptions?: Array<{
    date: string; // "YYYY-MM-DD" in tutor local date
    isBlocked: boolean;
    startTime?: string | null;
    endTime?: string | null;
  }>;
  bookedLessons?: Array<{
    scheduledStart: string; // ISO UTC
    scheduledEnd: string; // ISO UTC
    status?: string;
  }>;
  durationMinutes?: number; // default 50
  bufferMinutes?: number; // default 10
  minNoticeHours?: number; // default 2
}

/**
 * Converts a local calendar date ("YYYY-MM-DD") and local time ("HH:mm")
 * in a specified IANA timeZone into an exact UTC Date instance.
 * Resilient to Daylight Saving Time (DST) forward/backward leaps.
 */
export function localDateTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string = "UTC"
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Initial approximation treating numbers as UTC
  let utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  // Iterative convergence (converges in 1-2 passes for any valid IANA timezone)
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(utcDate);
    const p: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== "literal") p[part.type] = Number(part.value);
    }
    const formattedHour = p.hour === 24 ? 0 : p.hour;
    const asLocal = Date.UTC(p.year, p.month - 1, p.day, formattedHour, p.minute, p.second || 0);
    const target = Date.UTC(year, month - 1, day, hours, minutes, 0);
    const diff = target - asLocal;
    if (diff === 0) break;
    utcDate = new Date(utcDate.getTime() + diff);
  }

  return utcDate;
}

/**
 * Returns the calendar date string ("YYYY-MM-DD") of a given UTC instant in a specific timezone.
 */
export function utcToLocalDateString(
  utcInput: Date | string | number,
  timeZone: string = "UTC"
): string {
  const d = typeof utcInput === "string" || typeof utcInput === "number" ? new Date(utcInput) : utcInput;
  if (isNaN(d.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().split("T")[0];
  }
}

/**
 * Returns the 24-hour time string ("HH:mm") of a given UTC instant in a specific timezone.
 */
export function utcToLocalTimeString(
  utcInput: Date | string | number,
  timeZone: string = "UTC"
): string {
  const d = typeof utcInput === "string" || typeof utcInput === "number" ? new Date(utcInput) : utcInput;
  if (isNaN(d.getTime())) return "";

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const h = parts.find((p) => p.type === "hour")?.value || "00";
    const m = parts.find((p) => p.type === "minute")?.value || "00";
    const cleanHour = h === "24" ? "00" : h;
    return `${cleanHour}:${m}`;
  } catch {
    return "00:00";
  }
}

/**
 * Returns the integer hour (0-23) of a given UTC instant in a specific timezone.
 */
export function utcToLocalHour(
  utcInput: Date | string | number,
  timeZone: string = "UTC"
): number {
  const timeStr = utcToLocalTimeString(utcInput, timeZone);
  return parseInt(timeStr.split(":")[0], 10) || 0;
}

/**
 * Core Cross-Timezone Slot Generator
 * -----------------------------------------------------------------------
 * Calculates all valid, bookable slots for a tutor on a student's requested
 * calendar date, accurately bridging date-line crossovers, tutor buffer minutes,
 * advance notice rules, and existing bookings.
 */
export function generateCrossTimezoneSlots({
  studentDate,
  studentTz = "UTC",
  tutorTz = "UTC",
  rules = [],
  exceptions = [],
  bookedLessons = [],
  durationMinutes = 50,
  bufferMinutes = 10,
  minNoticeHours = 2,
}: CrossTimezoneSlotParams): TimeSlotOutput[] {
  const now = new Date();
  const minNoticeTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

  // 1. Student day window in UTC: [studentDate 00:00:00, studentDate 23:59:59.999]
  const studentDayStartUtc = localDateTimeToUtc(studentDate, "00:00", studentTz);
  const studentDayEndUtc = new Date(studentDayStartUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

  // 2. Identify the tutor's calendar dates that intersect this 24-hour UTC window.
  // Because offset differences can span up to 26 hours, we check the tutor's local
  // date at the start and end of the student's day.
  const tutorDateStart = utcToLocalDateString(studentDayStartUtc, tutorTz);
  const tutorDateEnd = utcToLocalDateString(studentDayEndUtc, tutorTz);

  const tutorDatesToCheck = Array.from(new Set([tutorDateStart, tutorDateEnd])).filter(Boolean);
  const stepMinutes = durationMinutes + bufferMinutes;
  const slots: TimeSlotOutput[] = [];
  const seenUtcStarts = new Set<string>();

  for (const tDate of tutorDatesToCheck) {
    // Check if the entire day is blocked by a tutor exception
    const fullDayBlocked = exceptions.some(
      (ex) => ex.date === tDate && ex.isBlocked && !ex.startTime
    );
    if (fullDayBlocked) continue;

    // Determine the tutor's day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    const [y, m, d] = tDate.split("-").map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();

    // Active rules for this tutor day
    const dayRules = rules
      .filter((r) => r.dayOfWeek === dayOfWeek && r.isActive)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

    for (const rule of dayRules) {
      const [startH, startM] = rule.startTime.split(":").map(Number);
      const [endH, endM] = rule.endTime.split(":").map(Number);

      let currentMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      while (currentMin + durationMinutes <= endMin) {
        const slotHour = Math.floor(currentMin / 60);
        const slotMin = currentMin % 60;
        const timeStr = `${String(slotHour).padStart(2, "0")}:${String(slotMin).padStart(2, "0")}`;

        // Convert potential slot start to UTC
        const slotStartUtc = localDateTimeToUtc(tDate, timeStr, tutorTz);
        const slotEndUtc = new Date(slotStartUtc.getTime() + durationMinutes * 60 * 1000);
        const utcStartIso = slotStartUtc.toISOString();

        // Ensure this slot begins within the student's selected 24h day window
        if (
          slotStartUtc >= studentDayStartUtc &&
          slotStartUtc <= studentDayEndUtc &&
          !seenUtcStarts.has(utcStartIso)
        ) {
          seenUtcStarts.add(utcStartIso);

          // Check notice rule (is slot too soon?)
          const isTooSoon = slotStartUtc < minNoticeTime;

          // Check partial-day tutor exception
          const isExceptionBlocked = exceptions.some((ex) => {
            if (ex.date !== tDate || !ex.isBlocked) return false;
            if (!ex.startTime || !ex.endTime) return true;
            const exStart = localDateTimeToUtc(tDate, ex.startTime.slice(0, 5), tutorTz);
            const exEnd = localDateTimeToUtc(tDate, ex.endTime.slice(0, 5), tutorTz);
            return slotStartUtc < exEnd && slotEndUtc > exStart;
          });

          // Check collision with existing booked lessons
          const isBooked = bookedLessons.some((l) => {
            if (l.status === "CANCELLED" || l.status === "DISPUTED") return false;
            const bStart = new Date(l.scheduledStart).getTime();
            const bEnd = new Date(l.scheduledEnd).getTime();
            // Overlap condition: startA < endB && endA > startB
            return slotStartUtc.getTime() < bEnd && slotEndUtc.getTime() > bStart;
          });

          let available = true;
          let reason = "Available";

          if (isTooSoon) {
            available = false;
            reason = `Notice required: minimum ${minNoticeHours}h in advance`;
          } else if (isExceptionBlocked) {
            available = false;
            reason = "Tutor unavailable (time-off exception)";
          } else if (isBooked) {
            available = false;
            reason = "Booked by another student";
          }

          const studentTime = utcToLocalTimeString(slotStartUtc, studentTz);
          const studentHour = Number(studentTime.split(":")[0]);
          let period: "morning" | "afternoon" | "evening" = "morning";
          if (studentHour >= 12 && studentHour < 17) period = "afternoon";
          else if (studentHour >= 17) period = "evening";

          slots.push({
            time: studentTime,
            utcStartTime: utcStartIso,
            utcEndTime: slotEndUtc.toISOString(),
            period,
            available,
            reason,
            tutorLocalTime: timeStr,
            tutorLocalDate: tDate,
          });
        }

        currentMin += stepMinutes;
      }
    }
  }

  // Sort slots strictly chronologically by UTC start time
  slots.sort((a, b) => new Date(a.utcStartTime).getTime() - new Date(b.utcStartTime).getTime());
  return slots;
}
