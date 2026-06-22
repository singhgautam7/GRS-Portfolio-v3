import { jobs, projects, certifications, rawTimelineEntries } from './content';

export type TimelineKind = 'ROLE' | 'PROJECT' | 'CERT' | 'LIFE';

export interface TimelineItem {
  id: string;
  date: string; // ISO
  displayDate: string; // "APR 2025"
  kind: TimelineKind;
  major: boolean;
  title: string;
  org: string;
  desc: string;
}

const fmt = (iso: string): string =>
  new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toUpperCase();

/**
 * The unified timeline: career, project and certification entries are *derived*
 * from their collections (whenever `timeline: true`), then merged with the
 * hand-authored life/milestone events and sorted ascending. Adding a project
 * with `timeline: true` makes it appear here on the next build, no code change.
 */
export function buildTimeline(): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const job of jobs) {
    if (!job.timeline) continue;
    items.push({
      id: `job-${job.slug}`,
      date: job.date,
      displayDate: fmt(job.date),
      kind: 'ROLE',
      major: job.major,
      title: job.title,
      org: job.company,
      desc: job.summary,
    });
  }

  for (const project of projects) {
    if (!project.timeline) continue;
    items.push({
      id: `project-${project.slug}`,
      date: project.date,
      displayDate: fmt(project.date),
      kind: 'PROJECT',
      major: project.major,
      title: project.title,
      org: project.tech.slice(0, 2).join(' · ') || project.type,
      desc: project.excerpt,
    });
  }

  for (const cert of certifications) {
    if (!cert.timeline) continue;
    items.push({
      id: `cert-${cert.slug}`,
      date: cert.date,
      displayDate: fmt(cert.date),
      kind: 'CERT',
      major: cert.major,
      title: cert.title,
      org: cert.issuer,
      desc: cert.summary,
    });
  }

  for (const ev of rawTimelineEntries) {
    const kind: TimelineKind =
      ev.type === 'life' || ev.type === 'milestone'
        ? 'LIFE'
        : ev.type === 'job'
          ? 'ROLE'
          : ev.type === 'cert'
            ? 'CERT'
            : 'PROJECT';
    items.push({
      id: `tl-${ev.date}-${ev.title}`,
      date: ev.date,
      displayDate: ev.displayDate ? ev.displayDate.toUpperCase() : fmt(ev.date),
      kind,
      major: ev.importance === 'major',
      title: ev.title,
      org: ev.org,
      desc: ev.body,
    });
  }

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const timeline: TimelineItem[] = buildTimeline();
