import { jobs, projects, posts } from './content';
import { experienceLabel, experienceYears } from './experience';

/**
 * Content-derived statistics. Every number is computed from the Velite
 * collections (or the experience constant) at build time, never hardcoded.
 * Adding a project file bumps `projectCount` on the next build automatically.
 */
export interface SiteStats {
  experienceLabel: string; // "7+"
  experienceYears: number; // 7.44
  projectCount: number; // 19
  roleCount: number; // 6
  postCount: number; // 2
  pypiPackages: number; // packages published to PyPI (tech tag)
  appsShipped: number; // apps live on an app store
}

export function computeStats(now: Date = new Date()): SiteStats {
  const pypiPackages = projects.filter((p) =>
    p.tech.some((t) => t.toLowerCase() === 'pypi'),
  ).length;

  // Apps shipped: live, deployed applications. Anything with a live `external`
  // URL (web app or app-store listing), excluding OSS packages/modules (which
  // are libraries, not apps) and the portfolio sites themselves.
  const appsShipped = projects.filter(
    (p) => Boolean(p.external) && p.type !== 'OSS' && !p.slug.startsWith('portfolio'),
  ).length;

  return {
    experienceLabel: experienceLabel(now),
    experienceYears: experienceYears(now),
    projectCount: projects.length,
    roleCount: jobs.length,
    postCount: posts.length,
    pypiPackages,
    appsShipped,
  };
}

export const stats: SiteStats = computeStats();

/** The About "stats strip" cells, derived. Mirrors the handoff's strip layout. */
export interface StatCell {
  num: string;
  unit: string;
  label: string;
}

export function aboutStatCells(s: SiteStats = stats): StatCell[] {
  return [
    { num: s.experienceLabel, unit: ' yrs', label: 'EXPERIENCE' },
    { num: String(s.projectCount), unit: '', label: 'PROJECTS' },
    { num: String(s.roleCount), unit: '', label: 'ROLES' },
    { num: String(s.pypiPackages), unit: '', label: 'PyPI PACKAGES' },
    { num: String(s.appsShipped), unit: '', label: 'APPS SHIPPED' },
  ];
}
