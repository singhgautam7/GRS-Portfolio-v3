/**
 * Recruiter / logistics config (editable).
 *
 * The single place to update hiring status and the answers to recruiter
 * questions. Flip `openToWork` and edit the copy here; the assistant intents in
 * `intents.ts` read straight from this object, so no handler code needs to
 * change.
 *
 * Deliberate policy: salary, compensation and visa questions NEVER return a
 * number or a hard commitment. They deflect to a real conversation. Keep it
 * that way, those belong in a call, not a static bundle.
 *
 * Copy rule: first person, warm, no em or en dashes.
 */
export const RECRUITER = {
  /** Master switch. When false, the availability answer flips to "not actively looking". */
  openToWork: true,

  /** One-line status used by the availability answer. */
  openHeadline:
    "I'm open to the right senior role. I am selective rather than urgently job-hunting, so it has to be a genuinely interesting team and problem.",
  closedHeadline:
    "I'm happy where I am right now and not actively looking, but I always like meeting good people. If something is genuinely exciting, tell me about it.",

  /** Roles Gautam is a fit for / interested in. */
  roles: [
    'Senior Backend Engineer',
    'Platform / Infrastructure Engineer',
    'Backend engineer working on AI systems',
  ],

  /** Location + remote posture. */
  location:
    "I'm based in India and work remote-first comfortably. I am happy across time zones with sensible overlap.",
  relocation:
    "I'm open to relocation for the right opportunity, and equally happy with a strong remote-first team. Worth a conversation either way.",

  /** Start timing. Intentionally soft, no contractual claims. */
  notice:
    "Timing is flexible and depends on the role. The honest answer lives in a conversation, so let's talk specifics over a call.",

  /** Freelance / contract posture. */
  freelance:
    "I take on the occasional freelance or consulting engagement when it's a good fit, usually backend, infrastructure or local-first AI work. Tell me the shape of it and we can see if it makes sense.",

  /** Sensitive: deflect to a conversation. Never a number. */
  compensation:
    "I keep compensation for a real conversation rather than a number on a static page. Tell me about the role and team and I'm glad to talk specifics over email or a call.",
  visa:
    "Visa and sponsorship are best handled directly, since the details depend entirely on the role and location. Let's sort that out on a call rather than guessing here.",
} as const;
