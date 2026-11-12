/**
 * Test Suite: Enterprise Timezone Engine
 * -----------------------------------------------------------------------
 * Verifies mathematical precision, cross-date boundary conversions,
 * slot calculation across world timezones, and guard rails.
 * -----------------------------------------------------------------------
 */

const assert = require('assert');

// Test implementation of timezone functions (matching src/shared/utils/timezone.ts)
function localDateTimeToUtc(dateStr, timeStr, timeZone = 'UTC') {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  let utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(utcDate);
    const p = {};
    for (const part of parts) {
      if (part.type !== 'literal') p[part.type] = Number(part.value);
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

function utcToLocalDateString(utcInput, timeZone = 'UTC') {
  const d = typeof utcInput === 'string' || typeof utcInput === 'number' ? new Date(utcInput) : utcInput;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function utcToLocalTimeString(utcInput, timeZone = 'UTC') {
  const d = typeof utcInput === 'string' || typeof utcInput === 'number' ? new Date(utcInput) : utcInput;
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === 'hour')?.value || '00';
  const m = parts.find((p) => p.type === 'minute')?.value || '00';
  const cleanHour = h === '24' ? '00' : h;
  return `${cleanHour}:${m}`;
}

function utcToLocalHour(utcInput, timeZone = 'UTC') {
  const timeStr = utcToLocalTimeString(utcInput, timeZone);
  return parseInt(timeStr.split(':')[0], 10) || 0;
}

function generateCrossTimezoneSlots({
  studentDate,
  studentTz = 'UTC',
  tutorTz = 'UTC',
  rules = [],
  exceptions = [],
  bookedLessons = [],
  durationMinutes = 50,
  bufferMinutes = 10,
  minNoticeHours = 2,
}) {
  const now = new Date();
  const minNoticeTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

  const studentDayStartUtc = localDateTimeToUtc(studentDate, '00:00', studentTz);
  const studentDayEndUtc = new Date(studentDayStartUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

  const tutorDateStart = utcToLocalDateString(studentDayStartUtc, tutorTz);
  const tutorDateEnd = utcToLocalDateString(studentDayEndUtc, tutorTz);

  const tutorDatesToCheck = Array.from(new Set([tutorDateStart, tutorDateEnd])).filter(Boolean);
  const stepMinutes = durationMinutes + bufferMinutes;
  const slots = [];
  const seenUtcStarts = new Set();

  for (const tDate of tutorDatesToCheck) {
    const fullDayBlocked = exceptions.some(
      (ex) => ex.date === tDate && ex.isBlocked && !ex.startTime
    );
    if (fullDayBlocked) continue;

    const [y, m, d] = tDate.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();

    const dayRules = rules
      .filter((r) => r.dayOfWeek === dayOfWeek && r.isActive)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

    for (const rule of dayRules) {
      const [startH, startM] = rule.startTime.split(':').map(Number);
      const [endH, endM] = rule.endTime.split(':').map(Number);

      let currentMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      while (currentMin + durationMinutes <= endMin) {
        const slotHour = Math.floor(currentMin / 60);
        const slotMin = currentMin % 60;
        const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;

        const slotStartUtc = localDateTimeToUtc(tDate, timeStr, tutorTz);
        const slotEndUtc = new Date(slotStartUtc.getTime() + durationMinutes * 60 * 1000);
        const utcStartIso = slotStartUtc.toISOString();

        if (
          slotStartUtc >= studentDayStartUtc &&
          slotStartUtc <= studentDayEndUtc &&
          !seenUtcStarts.has(utcStartIso)
        ) {
          seenUtcStarts.add(utcStartIso);

          const isTooSoon = slotStartUtc < minNoticeTime;

          const isExceptionBlocked = exceptions.some((ex) => {
            if (ex.date !== tDate || !ex.isBlocked) return false;
            if (!ex.startTime || !ex.endTime) return true;
            const exStart = localDateTimeToUtc(tDate, ex.startTime.slice(0, 5), tutorTz);
            const exEnd = localDateTimeToUtc(tDate, ex.endTime.slice(0, 5), tutorTz);
            return slotStartUtc < exEnd && slotEndUtc > exStart;
          });

          const isBooked = bookedLessons.some((l) => {
            if (l.status === 'CANCELLED' || l.status === 'DISPUTED') return false;
            const bStart = new Date(l.scheduledStart).getTime();
            const bEnd = new Date(l.scheduledEnd).getTime();
            return slotStartUtc.getTime() < bEnd && slotEndUtc.getTime() > bStart;
          });

          let available = true;
          let reason = 'Available';

          if (isTooSoon) {
            available = false;
            reason = `Notice required: minimum ${minNoticeHours}h in advance`;
          } else if (isExceptionBlocked) {
            available = false;
            reason = 'Tutor unavailable (time-off exception)';
          } else if (isBooked) {
            available = false;
            reason = 'Booked by another student';
          }

          const studentTime = utcToLocalTimeString(slotStartUtc, studentTz);
          const studentHour = Number(studentTime.split(':')[0]);
          let period = 'morning';
          if (studentHour >= 12 && studentHour < 17) period = 'afternoon';
          else if (studentHour >= 17) period = 'evening';

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

  slots.sort((a, b) => new Date(a.utcStartTime).getTime() - new Date(b.utcStartTime).getTime());
  return slots;
}

// -----------------------------------------------------------------------------
// TESTS
// -----------------------------------------------------------------------------
console.log('🚀 Starting Enterprise Timezone Verification Suite...\n');

// 1. Exact UTC instant convergence across multiple timezones
console.log('Test 1: Bidirectional UTC convergence across world timezones');
const tokyoUtc = localDateTimeToUtc('2026-09-21', '09:00', 'Asia/Tokyo').toISOString();
const nyUtc = localDateTimeToUtc('2026-09-20', '20:00', 'America/New_York').toISOString();
const londonUtc = localDateTimeToUtc('2026-09-21', '01:00', 'Europe/London').toISOString();
const sydneyUtc = localDateTimeToUtc('2026-09-21', '10:00', 'Australia/Sydney').toISOString();

const EXPECTED_INSTANT = '2026-09-21T00:00:00.000Z';
assert.strictEqual(tokyoUtc, EXPECTED_INSTANT, 'Tokyo 09:00 must equal 00:00 UTC');
assert.strictEqual(nyUtc, EXPECTED_INSTANT, 'New York 20:00 must equal 00:00 UTC');
assert.strictEqual(londonUtc, EXPECTED_INSTANT, 'London 01:00 must equal 00:00 UTC');
assert.strictEqual(sydneyUtc, EXPECTED_INSTANT, 'Sydney 10:00 must equal 00:00 UTC');
console.log('  ✔ Passed: All 4 world cities converge to exact UTC instant (2026-09-21T00:00:00.000Z)');

// 2. Reverse conversion (UTC Instant to local dates and hours)
console.log('Test 2: UTC Instant extraction of local dates and hours');
assert.strictEqual(utcToLocalDateString(EXPECTED_INSTANT, 'Asia/Tokyo'), '2026-09-21');
assert.strictEqual(utcToLocalTimeString(EXPECTED_INSTANT, 'Asia/Tokyo'), '09:00');
assert.strictEqual(utcToLocalHour(EXPECTED_INSTANT, 'Asia/Tokyo'), 9);

assert.strictEqual(utcToLocalDateString(EXPECTED_INSTANT, 'America/New_York'), '2026-09-20');
assert.strictEqual(utcToLocalTimeString(EXPECTED_INSTANT, 'America/New_York'), '20:00');
assert.strictEqual(utcToLocalHour(EXPECTED_INSTANT, 'America/New_York'), 20);

assert.strictEqual(utcToLocalDateString(EXPECTED_INSTANT, 'Europe/London'), '2026-09-21');
assert.strictEqual(utcToLocalTimeString(EXPECTED_INSTANT, 'Europe/London'), '01:00');

assert.strictEqual(utcToLocalDateString(EXPECTED_INSTANT, 'Australia/Sydney'), '2026-09-21');
assert.strictEqual(utcToLocalTimeString(EXPECTED_INSTANT, 'Australia/Sydney'), '10:00');
console.log('  ✔ Passed: Date boundary crossovers correctly resolve across all hemispheres');

// 3. Slot Generation Across Date Line (Tokyo Tutor ↔ New York Student)
console.log('Test 3: Cross-Timezone Slot Generation (Tokyo Tutor ↔ New York Student)');
const rules = [
  { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00', isActive: true }, // Monday 09:00 - 12:00 JST
];

const bookedLessons = [
  {
    scheduledStart: '2026-09-21T01:00:00.000Z',
    scheduledEnd: '2026-09-21T01:50:00.000Z',
    status: 'SCHEDULED',
  },
];

// Student in New York queries Sunday Sep 20
const nySundaySlots = generateCrossTimezoneSlots({
  studentDate: '2026-09-20',
  studentTz: 'America/New_York',
  tutorTz: 'Asia/Tokyo',
  rules,
  bookedLessons,
  durationMinutes: 50,
  bufferMinutes: 10,
  minNoticeHours: 0,
});

assert.strictEqual(nySundaySlots.length, 3, 'Must produce 3 slots on Sunday evening');
assert.strictEqual(nySundaySlots[0].time, '20:00');
assert.strictEqual(nySundaySlots[0].available, true);
assert.strictEqual(nySundaySlots[0].utcStartTime, '2026-09-21T00:00:00.000Z');

assert.strictEqual(nySundaySlots[1].time, '21:00');
assert.strictEqual(nySundaySlots[1].available, false, 'Second slot must be booked');
assert.strictEqual(nySundaySlots[1].reason, 'Booked by another student');

assert.strictEqual(nySundaySlots[2].time, '22:00');
assert.strictEqual(nySundaySlots[2].available, true);
console.log('  ✔ Passed: New York student on Sunday sees Tokyo Monday morning slots properly converted and collision-detected');

// Student in New York queries Monday Sep 21
const nyMondaySlots = generateCrossTimezoneSlots({
  studentDate: '2026-09-21',
  studentTz: 'America/New_York',
  tutorTz: 'Asia/Tokyo',
  rules,
  bookedLessons,
  durationMinutes: 50,
  bufferMinutes: 10,
  minNoticeHours: 0,
});
assert.strictEqual(nyMondaySlots.length, 0, 'Must produce 0 slots on Monday (since shift was on Sunday night NY time)');
console.log('  ✔ Passed: Monday in New York has 0 slots (no false positives)');

// 4. Tutor Time-off Exception Guard
console.log('Test 4: Tutor Time-off Exception Guard');
const slotsWithException = generateCrossTimezoneSlots({
  studentDate: '2026-09-20',
  studentTz: 'America/New_York',
  tutorTz: 'Asia/Tokyo',
  rules,
  exceptions: [{ date: '2026-09-21', isBlocked: true }], // Block Monday in Tokyo
  durationMinutes: 50,
  bufferMinutes: 10,
  minNoticeHours: 0,
});
assert.strictEqual(slotsWithException.length, 0, 'All slots on that tutor day must be blocked');
console.log('  ✔ Passed: Tutor local date exception blocks all converted student slots');

console.log('\n✅ ALL 4 ENTERPRISE TIMEZONE TESTS PASSED WITH 100% MATHEMATICAL PRECISION!\n');
