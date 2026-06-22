import type { AssistantContext, AssistantResponse, Intent } from './types';

/**
 * Layer 1 — the intent registry.
 *
 * Order matters: intents are evaluated top to bottom, so more specific intents
 * (easter eggs, hire, "are you a real AI") sit above the broad ones. Copy is
 * first-person, warm, lightly playful, and contains no em dashes. To add an
 * intent, append an entry here (see docs/ask-me-anything.md).
 */

const r = (resp: Omit<AssistantResponse, 'source'>, intentId: string): AssistantResponse => ({
  ...resp,
  source: 'intent',
  intentId,
});

export const intents: Intent[] = [
  // ----- easter eggs (terminal personality) -----
  {
    id: 'egg-whoami',
    examples: ['whoami', 'who am i'],
    keywords: ['whoami'],
    handler: (ctx) =>
      r(
        {
          text: `gautam, senior software engineer. ${ctx.roleCount} roles, ${ctx.experienceLabel} years, and a habit of building things on weekends. You are currently talking to my on-device assistant.`,
          buttons: [
            { label: 'See experience', kind: 'ghost', action: 'route', value: 'Experience' },
          ],
        },
        'egg-whoami',
      ),
  },
  {
    id: 'egg-sudo-hire',
    examples: ['sudo hire me', 'sudo hire', 'sudo hire gautam'],
    keywords: ['sudo hire', 'sudo apt install gautam', 'sudo'],
    handler: () =>
      r(
        {
          text: 'Permission granted. You have root access to my inbox. Drop me a line and let us build something reliable together.',
          buttons: [
            { label: 'Email me', kind: 'primary', action: 'mailto' },
            { label: 'Resume', kind: 'ghost', action: 'resume' },
          ],
        },
        'egg-sudo-hire',
      ),
  },
  {
    id: 'egg-help',
    examples: ['help', 'man', 'commands', 'what can you do', 'what can i ask'],
    keywords: ['help', 'man ', 'commands', 'what can you do', 'what can i ask'],
    handler: () =>
      r(
        {
          text: 'I answer questions about Gautam, all on-device. Try: experience, what he works on, his projects, what he is up to now, or how to get in touch. Easter eggs exist for the curious.',
          buttons: [
            { label: 'Experience', kind: 'ghost', action: 'ask', value: 'How much experience do you have?' },
            { label: 'Projects', kind: 'ghost', action: 'ask', value: 'Show me your best projects' },
            { label: 'Contact', kind: 'ghost', action: 'ask', value: 'How do I contact you?' },
          ],
        },
        'egg-help',
      ),
  },

  // ----- personality + guardrails (these win over the broad topics) -----
  {
    id: 'reading',
    examples: [
      'what are you reading?',
      'what books are you reading?',
      'what are you reading right now?',
      'any book recommendations?',
      'what are you watching?',
    ],
    keywords: ['reading', 'what books', 'book recommend', 'watchlist', 'what are you watching'],
    handler: () =>
      r(
        {
          text: "Honestly? Right now I'm reading your messages. A proper books and watchlist section is coming soon.",
          buttons: [
            { label: 'What are you building?', kind: 'ghost', action: 'ask', value: 'What are you building?' },
          ],
        },
        'reading',
      ),
  },
  {
    id: 'affection',
    examples: ['i love you', 'i like you', 'i really like you', 'marry me', 'will you marry me'],
    keywords: ['love you', 'i like you', 'really like you', 'marry me'],
    handler: () =>
      r(
        {
          text: "If you're a recruiter willing to pay above my current salary, then sure, I like you too.",
          buttons: [{ label: 'Contact me', kind: 'primary', action: 'mailto' }],
        },
        'affection',
      ),
  },
  {
    id: 'offtopic',
    examples: ['how is the weather?', "how's the weather today?", 'what is the weather like?'],
    keywords: ['weather', 'how are you doing today', 'how is your day'],
    handler: () =>
      r(
        {
          text: 'Is that really what you want to ask me after seeing my portfolio?',
          buttons: [
            { label: 'Ask about my work', kind: 'ghost', action: 'ask', value: 'What do you work on?' },
          ],
        },
        'offtopic',
      ),
  },
  {
    id: 'news',
    examples: ['what is the news?', 'any news today?', 'what is the latest news?'],
    keywords: ['the news', 'news today', 'latest news', 'current events'],
    handler: () =>
      r(
        {
          text: "I hear there's someone on this site who can solve your software problems. Want to talk to him?",
          buttons: [{ label: 'Contact me', kind: 'primary', action: 'mailto' }],
        },
        'news',
      ),
  },
  {
    id: 'do-my-work',
    examples: [
      'can you write a program?',
      'write me some code',
      'design a system for me',
      'build me an app',
      'fix my code',
      'solve this problem for me',
    ],
    keywords: [
      'write a program',
      'write code',
      'write me a',
      'design a system',
      'build me',
      'fix my code',
      'solve this',
      'do my homework',
    ],
    handler: () =>
      r(
        {
          text: "Sure, I can do that and a lot more. Let's connect first.",
          buttons: [{ label: 'Contact me', kind: 'primary', action: 'mailto' }],
        },
        'do-my-work',
      ),
  },

  // ----- playful -----
  {
    id: 'hire',
    examples: [
      'Why should I hire you?',
      'are you open to work?',
      'are you available?',
      'are you looking for a job?',
      'I want to recruit you',
    ],
    keywords: ['hire', 'open to work', 'available', 'recruit', 'looking for'],
    handler: () =>
      r(
        {
          text: 'Honestly? I ship reliable systems and sweat the details nobody sees: the 3am pages, the cost leaks, the flaky deploy. Years of making infrastructure boring, in the best way. And I build for fun, so I actually enjoy this.',
          buttons: [
            { label: 'Resume', kind: 'primary', action: 'resume' },
            { label: 'Contact me', kind: 'ghost', action: 'ask', value: 'How do I contact you?' },
          ],
        },
        'hire',
      ),
  },
  {
    id: 'fun',
    examples: [
      'Tell me something fun',
      'tell me something interesting',
      'surprise me',
      'what are your hobbies?',
      'what do you do on weekends?',
    ],
    keywords: ['fun', 'interesting', 'surprise', 'tell me something', 'hobby', 'weekend'],
    handler: () =>
      r(
        {
          text: 'I turned a pile of my own Python utilities into published PyPI packages, partly so my own code would autocomplete nicely. On weekends I ship mobile apps: a money manager (Kuber) and a Go-learning app (A Tour of Go) are both live on the Play Store.',
          buttons: [{ label: 'Show projects', kind: 'ghost', action: 'route', value: 'Projects' }],
        },
        'fun',
      ),
  },
  {
    id: 'real-ai',
    examples: [
      'Are you a real AI?',
      'are you actually AI?',
      'are you an LLM?',
      'are you ChatGPT?',
      'are you GPT?',
      'what model are you?',
    ],
    keywords: ['real ai', 'are you real', 'actually ai', 'llm', 'chatgpt', 'gpt', 'model'],
    handler: () =>
      r(
        {
          text: "I'm a small rule-based assistant running entirely in your browser. No server, no API key, nothing leaves your device. Think of me as Gautam's answering machine with good manners.",
          buttons: [
            { label: 'What he works on', kind: 'ghost', action: 'ask', value: 'What do you work on?' },
          ],
        },
        'real-ai',
      ),
  },
  {
    id: 'coffee',
    examples: ['Coffee or terminal?', 'tabs or spaces?', 'vim or emacs?'],
    keywords: ['coffee', 'terminal', 'tabs or spaces', 'vim', 'emacs'],
    handler: () =>
      r(
        {
          text: 'Terminal, with coffee in hand. Now, what would you actually like to know?',
          buttons: [
            { label: 'Experience', kind: 'ghost', action: 'ask', value: 'How much experience do you have?' },
            { label: 'Projects', kind: 'ghost', action: 'ask', value: 'Show me your best projects' },
          ],
        },
        'coffee',
      ),
  },

  // ----- core topics -----
  {
    id: 'experience',
    examples: [
      'How much experience do you have?',
      'How senior are you?',
      'Walk me through your career',
      'how long have you been working?',
      'who are you?',
      'tell me about yourself',
    ],
    keywords: [
      'experience',
      'years',
      'how long',
      'senior',
      'level',
      'career',
      'about you',
      'who are you',
    ],
    handler: (ctx: AssistantContext, query: string) => {
      const wantsPrecise = /\b(precise|precisely|exact|exactly|down to|to the minute)\b/.test(
        query.toLowerCase(),
      );
      const text = wantsPrecise
        ? `Down to the minute: ${ctx.experiencePreciseSentence} of building software, counting from my first day on 13 Jan 2019. The short version is ${ctx.experienceLabel} years across backend, cloud infrastructure and AI systems.`
        : `I've been building software for ${ctx.experienceLabel} years across backend, cloud infrastructure and AI systems. Right now I'm an Engineer 2 at HashiCorp (an IBM company), working on high-availability cluster infrastructure in Go, Kubernetes and Terraform.`;
      return r(
        {
          text,
          buttons: [
            { label: 'Download Resume', kind: 'primary', action: 'resume' },
            { label: 'View timeline', kind: 'ghost', action: 'route', value: 'Timeline' },
          ],
        },
        'experience',
      );
    },
  },
  {
    id: 'work',
    examples: [
      'What do you work on?',
      'What do you do at HashiCorp?',
      'what is your day to day?',
      'what is your role?',
      'what do you build at work?',
    ],
    keywords: ['work', 'do you do', 'hashicorp', 'infra', 'day to day', 'role', 'build at'],
    handler: () =>
      r(
        {
          text: 'Day to day I engineer and operate high-availability HVD clusters at HashiCorp: writing Go modules and Cadence workflows, automating ops with Terraform and Kubernetes across AWS and Azure, and trimming cloud cost with IAM-driven automation.',
          buttons: [
            { label: 'See projects', kind: 'primary', action: 'route', value: 'Projects' },
            { label: 'My skills', kind: 'ghost', action: 'ask', value: 'What is your tech stack?' },
          ],
        },
        'work',
      ),
  },
  {
    id: 'projects',
    examples: [
      'Show me your best projects',
      'What have you built?',
      'Show me something local-first',
      'show me your portfolio',
      'what have you made?',
      'show me something cool',
    ],
    keywords: [
      'project',
      'best',
      'built',
      'portfolio',
      'made',
      'ship',
      'local-first',
      'something cool',
    ],
    handler: (ctx) =>
      r(
        {
          text: "Here are two I'm proud of. Both are local-first and privacy-minded:",
          cards: ctx.showcase,
          buttons: [
            {
              label: `Browse all ${ctx.projectCount} →`,
              kind: 'ghost',
              action: 'route',
              value: 'Projects',
            },
          ],
        },
        'projects',
      ),
  },
  {
    id: 'now',
    examples: [
      'What are you doing now?',
      'What are you learning?',
      'what are you up to these days?',
    ],
    keywords: ['what are you doing', 'currently', 'learning', 'these days', 'up to', 'right now'],
    handler: () =>
      r(
        {
          text: 'This month: shipping HVD cluster work at HashiCorp, building local-first AI side projects in Next.js and Go, and going deep on high-performance RAG pipelines and agent memory. Currently re-reading Designing Data-Intensive Applications.',
          buttons: [{ label: 'My Now page', kind: 'ghost', action: 'route', value: 'Now' }],
        },
        'now',
      ),
  },
  {
    id: 'contact',
    examples: [
      'How do I contact you?',
      'How do I reach you?',
      'how do I get in touch?',
      "what's your email?",
      'can we connect?',
    ],
    keywords: ['contact', 'email', 'reach', 'connect', 'talk', 'touch', 'hello there'],
    handler: () =>
      r(
        {
          text: "Easiest is email, I read everything. I'm also on LinkedIn and GitHub.",
          buttons: [
            { label: 'Email me', kind: 'primary', action: 'mailto' },
            { label: 'LinkedIn', kind: 'ghost', action: 'link', value: 'https://www.linkedin.com/in/singhgautam7' },
            { label: 'GitHub', kind: 'ghost', action: 'link', value: 'https://github.com/singhgautam7' },
          ],
        },
        'contact',
      ),
  },
  {
    id: 'skills',
    examples: [
      'What is your tech stack?',
      'what languages do you use?',
      'what tools do you know?',
      'what are your skills?',
    ],
    keywords: ['skill', 'tech', 'stack', 'language', 'tools'],
    handler: () =>
      r(
        {
          text: 'Backend: Go, Python, Django, Flask. DevOps / Cloud: Kubernetes, Terraform, AWS, GCP, Azure, Docker. Frontend: Next.js, React, TypeScript. Databases: SQL, Redis, MongoDB, Firestore.',
          buttons: [
            { label: 'See experience', kind: 'ghost', action: 'route', value: 'Experience' },
          ],
        },
        'skills',
      ),
  },
  {
    id: 'resume',
    examples: ['Can I see your resume?', 'download your CV', 'send me your resume'],
    keywords: ['resume', 'cv'],
    handler: (ctx) =>
      r(
        {
          text: `Sure, here's my resume. It covers the full ${ctx.experienceLabel} years across HashiCorp, HSBC, Fractal, SpringML and CodeNicely.`,
          buttons: [{ label: 'Download Resume', kind: 'primary', action: 'resume' }],
        },
        'resume',
      ),
  },
  {
    id: 'blog',
    examples: ['Do you write a blog?', 'show me your posts', 'where can I read your writing?'],
    keywords: ['blog', 'post', 'writing', 'article', 'read your'],
    handler: () =>
      r(
        {
          text: 'I write the occasional deep-dive. The latest is a case study on AI Reader: how I built a privacy-first, multi-provider TTS audiobook app entirely client-side.',
          buttons: [{ label: 'Read the blog', kind: 'primary', action: 'route', value: 'Blog' }],
        },
        'blog',
      ),
  },
  {
    id: 'greeting',
    examples: ['hello', 'hi there', 'hey', 'yo', 'namaste', 'good morning'],
    keywords: ['hello', 'hi ', 'hey', 'yo ', 'sup', 'namaste'],
    handler: () =>
      r(
        {
          text: "Hey! I'm Gautam's on-device assistant, everything I answer runs right here in your browser. Ask about my experience, what I'm working on, my projects, or how to get in touch.",
          buttons: [
            { label: 'Best projects', kind: 'ghost', action: 'ask', value: 'Show me your best projects' },
            { label: 'Contact', kind: 'ghost', action: 'ask', value: 'How do I contact you?' },
          ],
        },
        'greeting',
      ),
  },
];
