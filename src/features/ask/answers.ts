import { answerLayer1 } from '@/lib/assistant/layer1';
import type { AssistantButton } from '@/lib/assistant/types';
import type { SectionId } from '@/input/registry';

/**
 * Ask about me: tappable questions with short answers (design 2a / 4c copy), plus free text.
 * Free text tries these keywords first, then the existing intent matcher (lib/assistant,
 * keyword + fuzzy over hand-written intents), else returns null ("I don't know that one yet").
 * Pure: no DOM, unit-tested in ask.test.ts.
 */

export type AskAction = { nav: SectionId } | { email: true } | { route: string } | { resume: true } | { link: string };

export interface AskAnswer {
  id: string;
  q: string;
  a: string;
  cta?: string;
  act?: AskAction;
}

export interface AskCtx {
  appsShipped: number;
  email: string;
}

interface Entry extends AskAnswer {
  k: string[];
}

export function askEntries(ctx: AskCtx): Entry[] {
  return [
    { id: 'work', q: 'What do you work on?', k: ['work', 'job', 'do you do', 'hashicorp', 'ibm', 'role', 'current'], a: 'I’m an Engineer 2 at HashiCorp (IBM), building and operating high-availability HVD clusters in Go, with Terraform and Kubernetes across AWS and Azure.', cta: 'View experience', act: { nav: 'experience' } },
    { id: 'apps', q: 'Show me your apps', k: ['app', 'android', 'flutter', 'play store', 'mobile', 'built'], a: `${ctx.appsShipped} shipped so far, mostly local-first Android apps in Flutter: Unfurl, PostPurush, Mull, HeadShorts, Dally, Perch, Kuber and A Tour of Go.`, cta: 'View projects', act: { nav: 'projects' } },
    { id: 'stack', q: 'What’s your tech stack?', k: ['stack', 'tech', 'language', 'skills', 'go', 'python', 'kubernetes', 'terraform'], a: 'Backend: Go, Python, Django, Flask. Cloud: Kubernetes, Terraform, AWS, GCP, Azure, Docker. Frontend: Next.js, React, TypeScript. Data: SQL, Redis, MongoDB, Firestore.', cta: 'See skills', act: { nav: 'skills' } },
    { id: 'roles', q: 'Are you open to roles?', k: ['open', 'hire', 'hiring', 'opportunit', 'available', 'job offer'], a: `Best to ask me directly. Email ${ctx.email} and I’ll reply.`, cta: 'Copy email', act: { email: true } },
    { id: 'contact', q: 'How do I contact you?', k: ['contact', 'email', 'reach', 'linkedin', 'github', 'talk'], a: `Email ${ctx.email}, or find me on GitHub and LinkedIn.`, cta: 'Copy email', act: { email: true } },
  ];
}

const SECTION_BY_ROUTE: Record<string, SectionId> = { About: 'about', Skills: 'skills', Experience: 'experience', Projects: 'projects', 'Featured Projects': 'projects', Writing: 'writing', Now: 'now', Contact: 'contact' };

function toAction(b: AssistantButton): AskAction | undefined {
  switch (b.action) {
    case 'mailto':
      return { email: true };
    case 'resume':
      return { resume: true };
    case 'link':
      return b.value ? { link: b.value } : undefined;
    case 'route': {
      const v = b.value ?? '';
      const sec = SECTION_BY_ROUTE[v];
      if (sec) return { nav: sec };
      if (v === 'Blog') return { route: '/blog' };
      if (v === 'Timeline') return { route: '/timeline' };
      return v.startsWith('/') ? { route: v } : { route: '/projects' };
    }
    default:
      return undefined;
  }
}

/** Free-text question → answer, or null when nothing matches. */
export function matchAsk(question: string, ctx: AskCtx): AskAnswer | null {
  const ql = question.trim().toLowerCase();
  if (!ql) return null;
  // Design matching (substring). Specific asks are checked before the broad "work" entry.
  const order = ['roles', 'contact', 'apps', 'stack', 'work'];
  const entries = askEntries(ctx).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const hit = entries.find((e) => e.k.some((k) => ql.includes(k)));
  if (hit) return { id: hit.id, q: question.trim(), a: hit.a, cta: hit.cta, act: hit.act };
  const r = answerLayer1(question);
  if (!r) return null;
  const b = r.buttons?.find((x) => x.kind === 'primary' && x.action !== 'ask') ?? r.buttons?.find((x) => x.action !== 'ask');
  const act = b && toAction(b);
  return { id: r.intentId ?? 'intent', q: question.trim(), a: r.text, cta: act ? b.label : undefined, act };
}
