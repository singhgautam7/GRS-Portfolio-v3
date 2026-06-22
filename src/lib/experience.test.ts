import { describe, expect, it } from 'bun:test';
import {
  experienceLabel,
  experienceYears,
  preciseExperience,
  preciseExperienceSentence,
} from './experience';

// Start constant is 2019-01-13T09:00:00+05:30.
const at = (iso: string) => new Date(iso);

describe('experienceYears', () => {
  it('is ~7.44 years on 2026-06-22', () => {
    const y = experienceYears(at('2026-06-22T12:00:00+05:30'));
    expect(y).toBeGreaterThan(7.4);
    expect(y).toBeLessThan(7.5);
  });
});

describe('experienceLabel', () => {
  it('floors to the nearest half year with a +', () => {
    expect(experienceLabel(at('2026-06-22T12:00:00+05:30'))).toBe('7+');
  });
  it('shows 7.5+ once past seven and a half years', () => {
    expect(experienceLabel(at('2026-09-01T12:00:00+05:30'))).toBe('7.5+');
  });
  it('shows whole numbers without a decimal', () => {
    expect(experienceLabel(at('2027-02-01T12:00:00+05:30'))).toBe('8+');
  });
});

describe('preciseExperience', () => {
  it('breaks down years/months/days without negative carries', () => {
    const p = preciseExperience(at('2026-06-22T12:00:00+05:30'));
    expect(p.years).toBe(7);
    expect(p.months).toBeGreaterThanOrEqual(0);
    expect(p.months).toBeLessThan(12);
    expect(p.days).toBeGreaterThanOrEqual(0);
    expect(p.days).toBeLessThan(31);
  });

  it('produces a readable sentence', () => {
    const s = preciseExperienceSentence(at('2026-06-22T12:00:00+05:30'));
    expect(s).toContain('7 years');
    expect(s).toContain('and');
  });
});
