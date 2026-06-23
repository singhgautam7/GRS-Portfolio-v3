/**
 * Skills vocabulary + curated blurbs (editable config).
 *
 * This is the single source of truth for the assistant's tech-experience
 * answers ("do you know Go?", "what's your experience with Kubernetes?"). Each
 * entry is hand-written and TRUE: the assistant never fabricates depth it does
 * not have. To teach a new skill, add an entry to `SKILLS`. To have the
 * assistant be honest about something Gautam does NOT specialize in, add it to
 * `NOT_CORE` (it gets a polite "not my core stack" answer instead of a guess).
 *
 * Copy rule: first person, warm, no em or en dashes.
 */

/** Depth of experience, which colors the phrasing of the answer. */
export type SkillLevel = 'core' | 'strong' | 'working';

export interface SkillEntry {
  id: string;
  label: string;
  /** Lowercase aliases matched as whole words (or as the entire short query). */
  aliases: string[];
  level: SkillLevel;
  /** Curated, first-person sentence(s). True to real experience. */
  blurb: string;
}

export const SKILLS: SkillEntry[] = [
  // ----- backend -----
  {
    id: 'go',
    label: 'Go',
    aliases: ['go', 'golang', 'go lang'],
    level: 'core',
    blurb:
      "Go is my daily driver at HashiCorp: I write the modules and Cadence workflows behind high-availability HVD clusters. It's the language I reach for when something has to be reliable and fast.",
  },
  {
    id: 'python',
    label: 'Python',
    aliases: ['python', 'py'],
    level: 'core',
    blurb:
      "Python is where I have the most mileage: Django and Flask backends across HSBC, Fractal and SpringML, plus a handful of utilities I published to PyPI. It's my go-to for data work and quick services.",
  },
  {
    id: 'django',
    label: 'Django',
    aliases: ['django', 'drf', 'django rest', 'django rest framework'],
    level: 'core',
    blurb:
      'I have shipped production Django and Django REST Framework APIs for years, including data-heavy services at Fractal and SpringML. Comfortable from models and migrations to DRF serializers and auth.',
  },
  {
    id: 'flask',
    label: 'Flask',
    aliases: ['flask'],
    level: 'strong',
    blurb:
      'I reach for Flask when I want something lean: small services and internal tools where Django would be too much. Used it in production alongside heavier Django systems.',
  },
  // ----- devops / cloud -----
  {
    id: 'kubernetes',
    label: 'Kubernetes',
    aliases: ['kubernetes', 'k8s', 'kube'],
    level: 'core',
    blurb:
      'Kubernetes is core to my day job: I run and automate HA cluster infrastructure on it at HashiCorp across AWS and Azure. Comfortable with the operational side, not just the YAML.',
  },
  {
    id: 'terraform',
    label: 'Terraform',
    aliases: ['terraform', 'iac', 'infrastructure as code'],
    level: 'core',
    blurb:
      "Terraform is how I keep infrastructure boring and repeatable. I automate cloud provisioning and ops with it daily, and I have written enough custom modules to have opinions. I even wrote a learning project around Go and Terraform.",
  },
  {
    id: 'aws',
    label: 'AWS',
    aliases: ['aws', 'amazon web services'],
    level: 'strong',
    blurb:
      'I run production workloads on AWS at HashiCorp, mostly the compute, networking and IAM surface around our clusters, with a side habit of trimming cloud cost through IAM-driven automation.',
  },
  {
    id: 'gcp',
    label: 'GCP',
    aliases: ['gcp', 'google cloud', 'google cloud platform'],
    level: 'strong',
    blurb:
      'I have built and shipped on GCP, including custom IAM roles and Terraform-managed setups. A good chunk of my earlier data and backend work lived on Google Cloud.',
  },
  {
    id: 'azure',
    label: 'Azure',
    aliases: ['azure', 'microsoft azure'],
    level: 'working',
    blurb:
      'I operate cluster infrastructure across Azure as well as AWS at HashiCorp, so I am comfortable working multi-cloud rather than treating one provider as special.',
  },
  {
    id: 'docker',
    label: 'Docker',
    aliases: ['docker', 'containers', 'containerization'],
    level: 'core',
    blurb:
      'Containers are second nature: I package services with Docker and run them on Kubernetes day to day. Multi-stage builds, slim images, the usual care.',
  },
  // ----- frontend -----
  {
    id: 'nextjs',
    label: 'Next.js',
    aliases: ['next.js', 'nextjs', 'next js'],
    level: 'strong',
    blurb:
      "Next.js is my front-of-house for side projects, including this site and my local-first AI apps. I lean on the App Router and static export to keep things fast and zero-cost to host.",
  },
  {
    id: 'react',
    label: 'React',
    aliases: ['react', 'react.js', 'reactjs'],
    level: 'strong',
    blurb:
      'I build interfaces in React and TypeScript for my projects, from this portfolio to AI Reader. Comfortable with hooks, state, and keeping components honest.',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    aliases: ['typescript', 'ts'],
    level: 'strong',
    blurb:
      'I write my frontend and tooling in strict TypeScript. I like the safety net, and it pairs well with the kind of static, no-surprises sites I enjoy building.',
  },
  // ----- databases -----
  {
    id: 'sql',
    label: 'SQL',
    aliases: ['sql', 'postgres', 'postgresql', 'mysql', 'relational'],
    level: 'core',
    blurb:
      'SQL has been a constant: schema design, queries and tuning behind the Django and data services I have shipped. I am comfortable reasoning about indexes and query plans, not just writing selects.',
  },
  {
    id: 'redis',
    label: 'Redis',
    aliases: ['redis', 'cache', 'caching'],
    level: 'strong',
    blurb:
      'I use Redis for caching, queues and the occasional rate limiter. Handy whenever a service needs to be fast or needs a lightweight coordination layer.',
  },
  {
    id: 'mongodb',
    label: 'MongoDB',
    aliases: ['mongodb', 'mongo', 'nosql'],
    level: 'working',
    blurb:
      'I have used MongoDB where a flexible document model fit better than a relational schema, mostly in earlier product work.',
  },
  {
    id: 'firestore',
    label: 'Firestore',
    aliases: ['firestore', 'firebase'],
    level: 'working',
    blurb:
      'Firestore backs a couple of my mobile side projects, where its realtime sync and zero-ops nature let me ship without running a backend.',
  },
  // ----- practices / domains -----
  {
    id: 'ai',
    label: 'AI systems',
    aliases: ['ai', 'rag', 'llm', 'llms', 'agents', 'agent memory', 'machine learning', 'ml'],
    level: 'strong',
    blurb:
      'My current obsession is practical, local-first AI: high-performance RAG pipelines, agent memory, and on-device inference. AI Reader and this very assistant are both examples, no server and no API key in sight.',
  },
  {
    id: 'cicd',
    label: 'CI/CD',
    aliases: ['ci/cd', 'cicd', 'ci cd', 'github actions', 'pipelines', 'devops'],
    level: 'strong',
    blurb:
      'I treat delivery as part of the product: automated pipelines, repeatable builds, and deploys that do not page me at 3am. Boring releases are the goal.',
  },
];

/**
 * Common technologies Gautam does NOT specialize in. These exist so the
 * assistant can be HONEST instead of guessing: a polite "not my core stack"
 * with a pivot to what he does use. Extend freely.
 */
export const NOT_CORE: { label: string; aliases: string[] }[] = [
  { label: 'Java', aliases: ['java'] },
  { label: 'C#', aliases: ['c#', 'csharp', 'c sharp', '.net', 'dotnet'] },
  { label: 'C++', aliases: ['c++', 'cpp'] },
  { label: 'Ruby', aliases: ['ruby', 'rails', 'ruby on rails'] },
  { label: 'PHP', aliases: ['php', 'laravel'] },
  { label: 'Rust', aliases: ['rust'] },
  { label: 'Kotlin', aliases: ['kotlin'] },
  { label: 'Swift', aliases: ['swift', 'swiftui'] },
  { label: 'Scala', aliases: ['scala'] },
  { label: 'Elixir', aliases: ['elixir', 'phoenix'] },
  { label: 'Vue', aliases: ['vue', 'vue.js', 'vuejs', 'nuxt'] },
  { label: 'Angular', aliases: ['angular', 'angular.js', 'angularjs'] },
  { label: 'Svelte', aliases: ['svelte', 'sveltekit'] },
];

/** Tech-experience framing, e.g. "do you know X", "experience with X". */
const FRAMING =
  /\b(do you (?:know|use)|have you (?:used|worked|tried|got)|experience (?:with|in|of)|familiar with|good at|comfortable with|hands.?on|worked with|work with|ever used|any experience|proficient (?:with|in))\b/;

function normalize(q: string): string {
  return q.toLowerCase().replace(/[?.!,]+$/g, '').trim();
}

/** Whole-word (or whole-query) alias presence test. */
function aliasInQuery(alias: string, q: string, normQ: string): boolean {
  if (normQ === alias) return true;
  // Word-boundary-ish match that tolerates symbols like + # . in tech names.
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(q);
}

export interface SkillLookup {
  kind: 'known' | 'not-core';
  label: string;
  level?: SkillLevel;
  blurb?: string;
}

/**
 * Resolve a tech-experience question to a known skill, an honest "not core"
 * deflection, or null (not a skill question). Rigid by design: a known alias
 * fires on either an exact one-word query or a framed question; an unknown tech
 * only deflects when framed (so we never lecture about tech the user did not
 * actually ask about).
 */
export function lookupSkill(query: string): SkillLookup | null {
  const q = query.toLowerCase();
  const normQ = normalize(query);
  const framed = FRAMING.test(q);

  for (const s of SKILLS) {
    for (const alias of s.aliases) {
      if (normQ === alias || (framed && aliasInQuery(alias, q, normQ))) {
        return { kind: 'known', label: s.label, level: s.level, blurb: s.blurb };
      }
    }
  }
  for (const n of NOT_CORE) {
    for (const alias of n.aliases) {
      if (normQ === alias || (framed && aliasInQuery(alias, q, normQ))) {
        return { kind: 'not-core', label: n.label };
      }
    }
  }
  return null;
}
