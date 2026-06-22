/**
 * Global site configuration — the single editable source for identity, socials,
 * the resume link, and the experience start constant. Nothing here is fetched at
 * runtime; everything is baked into the static bundle.
 */

export const SITE = {
  name: 'Gautam Singh',
  shortName: 'GRS',
  domain: 'singhgautam.com',
  url: 'https://singhgautam.com',
  email: 'gautamsingh1997@gmail.com',
  role: 'Senior software engineer in backend, cloud infrastructure & AI systems.',
  description:
    'Gautam Singh, senior software engineer in backend, cloud infrastructure and AI systems. Ask the on-device assistant anything.',
  /**
   * Experience start constant: 13 Jan 2019, 9:00 AM IST. All experience math
   * (years, precise mode) derives from this. Bumping it shifts every derived
   * number across the site and the assistant.
   */
  experienceStart: '2019-01-13T09:00:00+05:30',
  // Resume is a user-initiated navigation to a static asset, not a runtime fetch.
  resumeUrl:
    'https://github.com/singhgautam7/singhgautam7/raw/main/assets/GRS_resume.docx',
} as const;

export interface SocialLink {
  name: string;
  url: string;
}

export const SOCIALS: SocialLink[] = [
  { name: 'GitHub', url: 'https://github.com/singhgautam7' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/singhgautam7' },
  { name: 'Medium', url: 'https://medium.com/@singhgautam7' },
  { name: 'Instagram', url: 'https://www.instagram.com/singhgautam7' },
  { name: 'YouTube', url: 'https://www.youtube.com/watch?v=g0OA1Le593c' },
];

/** Grouped skills shown in the Skills section and answered by the assistant. */
export const SKILL_GROUPS = [
  { label: 'BACKEND', items: ['Go', 'Python', 'Django', 'Flask', 'DRF'] },
  {
    label: 'DEVOPS / CLOUD',
    items: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'Azure', 'Docker'],
  },
  { label: 'FRONTEND', items: ['Next.js', 'React', 'Redux Toolkit', 'TypeScript'] },
  { label: 'DATABASES', items: ['SQL', 'Redis', 'MongoDB', 'Firestore'] },
] as const;

/**
 * Build/deploy timestamp. Injected at build time via NEXT_PUBLIC_DEPLOYED_AT
 * (set in the `build` script) so it is inlined into the static bundle and does
 * NOT resolve to the visitor's clock. Falls back to a dev label.
 */
export const DEPLOYED_AT = process.env.NEXT_PUBLIC_DEPLOYED_AT ?? 'dev build';
