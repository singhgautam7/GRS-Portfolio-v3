/** Variant metadata (no three.js): selector, palette, prefs and tests import this. */

export const VARIANT_IDS = ['thk', 'tik', 'clk', 'pop', 'pew', '8bt'] as const;
export type VariantId = (typeof VARIANT_IDS)[number];

export interface VariantMeta {
  id: VariantId;
  /** Chip legend (the id itself, per the design). */
  chip: string;
  name: string;
  subtitle: string;
  layout: 'full' | 'compact';
}

export const VARIANTS: VariantMeta[] = [
  { id: 'thk', chip: 'thk', name: 'Mechanical', subtitle: 'Deep, tactile switch (default)', layout: 'full' },
  { id: 'tik', chip: 'tik', name: 'Laptop', subtitle: 'Soft, low-travel click', layout: 'full' },
  { id: 'clk', chip: 'clk', name: 'Typewriter', subtitle: 'Clack, with a bell on Enter', layout: 'compact' },
  { id: 'pop', chip: 'pop', name: 'Bubble', subtitle: 'Soft pops', layout: 'full' },
  { id: 'pew', chip: 'pew', name: 'Bullet', subtitle: 'Pew. Pew pew.', layout: 'full' },
  { id: '8bt', chip: '8bt', name: 'Arcade', subtitle: 'Chiptune blips', layout: 'compact' },
];

export const variantMeta = (id: VariantId) => VARIANTS.find((v) => v.id === id)!;
export const isVariantId = (v: unknown): v is VariantId => VARIANT_IDS.includes(v as VariantId);
