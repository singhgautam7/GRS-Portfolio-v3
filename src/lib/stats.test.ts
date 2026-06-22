import { describe, expect, it } from 'bun:test';
import { computeStats, aboutStatCells } from './stats';
import { buildChips, CHIP_POOL } from './chips';

describe('computeStats', () => {
  const s = computeStats(new Date('2026-06-22T12:00:00+05:30'));

  it('counts 19 projects from content', () => {
    expect(s.projectCount).toBe(19);
  });
  it('counts 6 roles from content', () => {
    expect(s.roleCount).toBe(6);
  });
  it('counts 2 published posts', () => {
    expect(s.postCount).toBe(2);
  });
  it('derives 4 PyPI packages', () => {
    expect(s.pypiPackages).toBe(4);
  });
  it('derives 2 Play Store apps', () => {
    expect(s.appsShipped).toBe(2);
  });
  it('exposes a 7+ experience label', () => {
    expect(s.experienceLabel).toBe('7+');
  });
});

describe('aboutStatCells', () => {
  it('yields five derived cells', () => {
    const cells = aboutStatCells(computeStats(new Date('2026-06-22T12:00:00+05:30')));
    expect(cells).toHaveLength(5);
    expect(cells[0]!.label).toBe('EXPERIENCE');
    expect(cells[1]!.num).toBe('19');
  });
});

describe('buildChips', () => {
  it('picks one chip per bucket (6 total)', () => {
    const chips = buildChips(() => 0.5);
    expect(chips).toHaveLength(6);
  });
  it('always includes a playful chip', () => {
    for (let i = 0; i < 20; i++) {
      const chips = buildChips();
      const hasPlayful = chips.some((c) => CHIP_POOL.playful.includes(c));
      expect(hasPlayful).toBe(true);
    }
  });
});
