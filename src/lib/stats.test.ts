import { describe, expect, it } from 'bun:test';
import { readdirSync } from 'node:fs';
import { computeStats, aboutStatCells } from './stats';
import { buildChips, CHIP_POOL } from './chips';

// Count source files on disk so the test tracks content/ without manual edits.
const onDisk = (dir: string) => readdirSync(`content/${dir}`).filter((f) => !f.startsWith('.')).length;

describe('computeStats', () => {
  const s = computeStats(new Date('2026-06-22T12:00:00+05:30'));

  it('counts every project folder in content/', () => {
    expect(s.projectCount).toBe(onDisk('projects'));
  });
  it('counts every role in content/', () => {
    expect(s.roleCount).toBe(onDisk('jobs'));
  });
  it('counts every post in content/', () => {
    expect(s.postCount).toBe(onDisk('posts'));
  });
  it('derives PyPI packages and shipped apps as subsets of projects', () => {
    expect(s.pypiPackages).toBeGreaterThan(0);
    expect(s.appsShipped).toBeGreaterThan(0);
    expect(s.pypiPackages + s.appsShipped).toBeLessThanOrEqual(s.projectCount);
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
    expect(cells[1]!.num).toBe(String(onDisk('projects')));
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
