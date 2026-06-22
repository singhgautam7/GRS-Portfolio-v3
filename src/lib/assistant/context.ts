import { projects } from '@/lib/content';
import type { Project } from '@/lib/content';
import { computeStats } from '@/lib/stats';
import { experienceLabel, preciseExperienceSentence } from '@/lib/experience';
import { SITE } from '@/lib/site';
import type { AssistantCard, AssistantContext } from './types';

const toCard = (p: Project): AssistantCard => ({
  title: p.title,
  kind: p.tech[0] ?? p.type,
  desc: p.excerpt,
  tags: p.tech.slice(0, 2),
  url: p.external ?? p.github,
});

/** Curated local-first showcase, in a fixed order, for the projects reply. */
export function showcaseCards(): AssistantCard[] {
  const order = ['ai-reader', 'postpurush'];
  const picked = order
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter((p): p is Project => Boolean(p))
    .map(toCard);
  return picked.length ? picked : projects.slice(0, 2).map(toCard);
}

/**
 * Build the live context for intent handlers. `now` is injectable so experience
 * math is deterministic under test.
 */
export function buildContext(now: Date = new Date()): AssistantContext {
  const s = computeStats(now);
  return {
    now,
    experienceLabel: experienceLabel(now),
    experiencePreciseSentence: preciseExperienceSentence(now),
    projectCount: s.projectCount,
    roleCount: s.roleCount,
    postCount: s.postCount,
    pypiPackages: s.pypiPackages,
    email: SITE.email,
    resumeUrl: SITE.resumeUrl,
    showcase: showcaseCards(),
  };
}
