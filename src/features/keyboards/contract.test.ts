import { describe, expect, test } from 'bun:test';
import { layoutFor, requiredCodes } from './core/layouts';
import { loadVariant } from './core/loaders';
import type { KeyboardRig } from './core/rig';
import { VARIANTS, isVariantId } from './variants';
import { DEFAULT_PREFS } from './prefs';
import type { OS } from '@/lib/platform';

const OSES: OS[] = ['mac', 'windows', 'linux'];

describe('keyboard variant contract', () => {
  test('six variants with chip, name and subtitle', () => {
    expect(VARIANTS.map((v) => v.id)).toEqual(['thk', 'tik', 'clk', 'pop', 'pew', '8bt']);
    for (const v of VARIANTS) expect(v.name && v.subtitle && v.chip).toBeTruthy();
  });

  for (const v of VARIANTS)
    test(`${v.id}: layout has every shortcut key on every OS, and the module implements the contract`, async () => {
      for (const os of OSES) {
        const codes = new Set(layoutFor(v.layout, os).map((k) => k.code));
        for (const c of requiredCodes(os)) expect(codes.has(c)).toBe(true);
      }
      const factory = await loadVariant(v.id);
      // Factories must not touch the rig until build time, so a stub is enough to inspect the shape.
      const impl = factory({} as KeyboardRig);
      expect(typeof impl.body).toBe('function');
      expect(typeof impl.makeCap).toBe('function');
      expect(typeof impl.profile).toBe('function');
      expect(impl.cfg.travel).toBeGreaterThan(0);
      expect(['dom', 'paper', 'marquee', 'screen']).toContain(impl.cfg.trail);
      if (impl.cfg.trail !== 'dom') expect(typeof impl.print).toBe('function');
      // Disposal: the rig frees every geometry/material/texture of the variant group; variants with
      // their own timers or shared geometry implement dispose().
      if (v.id === 'pew' || v.id === 'pop') expect(typeof impl.dispose).toBe('function');
    });
});

describe('selector persistence', () => {
  test('defaults: Mechanical, unmuted', () => {
    expect(DEFAULT_PREFS).toEqual({ variant: 'thk', muted: false });
  });
  test('variant ids validate', () => {
    expect(isVariantId('8bt')).toBe(true);
    expect(isVariantId('qwerty')).toBe(false);
  });
});
