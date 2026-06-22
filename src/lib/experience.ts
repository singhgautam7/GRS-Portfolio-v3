import { SITE } from './site';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Total years of experience as a float, measured from the configured start
 * constant (13 Jan 2019, 9:00 IST) to `now`. Uses 365.25 days/year.
 */
export function experienceYears(now: Date = new Date()): number {
  const start = new Date(SITE.experienceStart);
  return (now.getTime() - start.getTime()) / (MS_PER_DAY * 365.25);
}

/**
 * The display label for years of experience, floored to the nearest half year
 * with a trailing "+". Reads "7+ yrs" now and auto-bumps to "7.5+", "8+" as time
 * passes. Never hardcoded.
 */
export function experienceLabel(now: Date = new Date()): string {
  const floored = Math.floor(experienceYears(now) * 2) / 2;
  // Drop a trailing ".0" so we show "7+" not "7.0+".
  const n = Number.isInteger(floored) ? floored.toString() : floored.toFixed(1);
  return `${n}+`;
}

export interface PreciseExperience {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
}

/**
 * Calendar-accurate breakdown from the start constant to `now`, for the
 * assistant's "precise mode". Carries borrows across months/years properly.
 */
export function preciseExperience(now: Date = new Date()): PreciseExperience {
  const start = new Date(SITE.experienceStart);

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  let minutes = now.getMinutes() - start.getMinutes();

  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    // Borrow days from the previous month.
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days, hours, minutes };
}

/** Human sentence for precise mode, e.g. "7 years, 5 months, 9 days and 3 hours". */
export function preciseExperienceSentence(now: Date = new Date()): string {
  const p = preciseExperience(now);
  const parts = [
    `${p.years} ${p.years === 1 ? 'year' : 'years'}`,
    `${p.months} ${p.months === 1 ? 'month' : 'months'}`,
    `${p.days} ${p.days === 1 ? 'day' : 'days'}`,
    `${p.hours} ${p.hours === 1 ? 'hour' : 'hours'}`,
    `${p.minutes} ${p.minutes === 1 ? 'minute' : 'minutes'}`,
  ];
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}
