import { jobs, projects } from '@/lib/content';
import type { Job, Project } from '@/lib/content';
import { lookupSkill } from './config/skills';
import type { AssistantContext, AssistantResponse } from './types';

/**
 * Parametric resolvers (a pre-Layer-1 step).
 *
 * Where the intent registry answers fixed questions, these answer questions
 * *about a named entity*: a skill ("do you know Go?"), a company ("what did you
 * do at HSBC?"), or a project ("tell me about Kuber"). They read straight from
 * the content collections and the skills config, so they stay correct as
 * content changes and never fabricate.
 *
 * Rigid by design: an entity must be named (whole-word / exact-query match)
 * before anything fires. No entity, no answer, and the query falls through to
 * the normal intent and content-search layers.
 */

const r = (resp: Omit<AssistantResponse, 'source'>, intentId: string): AssistantResponse => ({
  ...resp,
  source: 'intent',
  intentId,
});

function dedupe(xs: string[]): string[] {
  return Array.from(new Set(xs.filter(Boolean)));
}

/** Whole-word presence (tolerant of tech punctuation like + # .). */
function wordIn(alias: string, q: string): boolean {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(q);
}

// ----- company aliases (built from the jobs collection) -----
interface CompanyAlias {
  job: Job;
  aliases: string[];
}

const COMPANY_ALIASES: CompanyAlias[] = jobs.map((job) => {
  const firstToken = job.company.split(/[^a-zA-Z0-9]+/)[0]?.toLowerCase() ?? '';
  const compact = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');
  const extra = job.slug === 'byjus' ? ['byju', 'byjus'] : [];
  return {
    job,
    aliases: dedupe([job.slug, firstToken, compact, ...extra]).filter((a) => a.length >= 3),
  };
});

// ----- project aliases (built from the projects collection) -----
interface ProjectAlias {
  project: Project;
  aliases: string[];
}

const PROJECT_ALIASES: ProjectAlias[] = projects.map((project) => {
  const title = project.title.toLowerCase();
  return {
    project,
    aliases: dedupe([
      title,
      title.replace(/^(a|an|the)\s+/, ''),
      title.replace(/[^a-z0-9]/g, ''),
      project.slug,
      project.slug.replace(/-/g, ' '),
    ]).filter((a) => a.length >= 4),
  };
});

function levelPhrase(level?: string): string {
  switch (level) {
    case 'core':
      return 'Yes, that one is core for me.';
    case 'strong':
      return 'Yes, I know it well.';
    case 'working':
      return 'Yes, I have hands-on experience there.';
    default:
      return 'Yes.';
  }
}

/** Skill / tech-experience questions. */
function resolveSkill(query: string): AssistantResponse | null {
  const hit = lookupSkill(query);
  if (!hit) return null;

  if (hit.kind === 'not-core') {
    return r(
      {
        text: `${hit.label} is not part of my core stack, so I won't pretend otherwise. My day to day is Go and Python on the backend, Kubernetes and Terraform for infrastructure, and TypeScript and Next.js when I build for the web. If your problem lives near any of those, I'm your person.`,
        buttons: [
          { label: 'My tech stack', kind: 'ghost', action: 'ask', value: 'What is your tech stack?' },
          { label: 'See experience', kind: 'ghost', action: 'route', value: 'Experience' },
        ],
      },
      'skill-unknown',
    );
  }

  return r(
    {
      text: `${levelPhrase(hit.level)} ${hit.blurb}`,
      buttons: [
        { label: 'Full tech stack', kind: 'ghost', action: 'ask', value: 'What is your tech stack?' },
        { label: 'See experience', kind: 'ghost', action: 'route', value: 'Experience' },
      ],
    },
    'skill',
  );
}

/** Company / "what did you do at X" questions. */
function resolveCompany(query: string): AssistantResponse | null {
  const q = query.toLowerCase();
  const match = COMPANY_ALIASES.find((c) => c.aliases.some((a) => wordIn(a, q)));
  if (!match) return null;
  const { job } = match;
  const name = job.company.split(/\s*[·|]\s*/)[0] ?? job.company;
  const points = job.points.slice(0, 3);
  const detail = points.length
    ? ` A few things I did there: ${points.join(' ')}`
    : job.summary
      ? ` ${job.summary}`
      : '';
  return r(
    {
      text: `At ${name} I was ${job.title} (${job.range}).${detail}`,
      buttons: [
        { label: 'See full experience', kind: 'primary', action: 'route', value: 'Experience' },
        { label: 'View timeline', kind: 'ghost', action: 'route', value: 'Timeline' },
      ],
    },
    'company',
  );
}

/** Project / "tell me about X" questions. */
function resolveProject(query: string): AssistantResponse | null {
  const q = query.toLowerCase();
  const match = PROJECT_ALIASES.find((p) => p.aliases.some((a) => wordIn(a, q)));
  if (!match) return null;
  const { project } = match;
  const desc = (project.summary || project.excerpt || '').trim();
  return r(
    {
      text: `${project.title} is one of mine. Here it is:`,
      cards: [
        {
          title: project.title,
          kind: project.tech[0] ?? project.type,
          desc: desc.length > 220 ? `${desc.slice(0, 217)}...` : desc,
          tags: project.tech.slice(0, 3),
          url: project.external ?? project.github,
        },
      ],
      buttons: [
        { label: 'Browse all projects', kind: 'ghost', action: 'route', value: 'Projects' },
      ],
    },
    'project',
  );
}

/**
 * Try the parametric resolvers in priority order. Returns null when the query
 * names no known entity, so the engine continues to the intent registry.
 */
export function resolveParametric(
  query: string,
  _ctx: AssistantContext,
): AssistantResponse | null {
  if (!query.trim()) return null;
  return resolveSkill(query) ?? resolveCompany(query) ?? resolveProject(query);
}
