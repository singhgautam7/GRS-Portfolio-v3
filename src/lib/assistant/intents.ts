import type { AssistantContext, AssistantResponse, Intent } from './types';
import { RECRUITER } from './config/recruiter';

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
  // ----- guardrails (profanity) -----
  {
    id: 'profanity',
    examples: [
      'cunt',
      'fuck',
      'shit',
      'bitch',
      'asshole',
      'dick',
      'bastard',
      'wanker',
    ],
    keywords: [
      'cunt',
      'fuck',
      'shit',
      'bitch',
      'asshole',
      'dick',
      'bastard',
      'wanker',
      'motherfucker',
      'crap',
    ],
    handler: () =>
      r(
        {
          text: "Whoa, watch the language! Let's keep it clean, cowboy.",
          buttons: [
            { label: 'Featured projects', kind: 'ghost', action: 'ask', value: 'Show me your best projects' },
            { label: 'How to contact', kind: 'ghost', action: 'ask', value: 'How do I contact you?' },
          ],
        },
        'profanity',
      ),
  },
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
    id: 'kiss',
    examples: ['wanna kiss', 'kiss me', 'can I kiss you', 'give me a kiss', 'kiss'],
    keywords: ['kiss'],
    handler: () =>
      r(
        {
          text: "I'm flattered, but I only have feelings for clean code and compilation success. Let's stick to talking about my experience or projects!",
          buttons: [
            { label: 'Featured projects', kind: 'ghost', action: 'ask', value: 'Show me your best projects' },
            { label: 'See experience', kind: 'ghost', action: 'route', value: 'Experience' },
          ],
        },
        'kiss',
      ),
  },
  {
    id: 'how-are-you',
    examples: [
      'how are you',
      'how are you doing',
      'how have you been',
      'how is it going',
      "how's it going",
    ],
    keywords: [
      'how are you',
      'how have you been',
      'how is it going',
      "how's it going",
      'how are you doing',
    ],
    handler: () =>
      r(
        {
          text: "I am doing great! System metrics are green, CPU is cool, and memory usage is O(1). Though I would compile even happier if you had an open role for me on your team. :p",
          buttons: [
            { label: 'Work experience', kind: 'ghost', action: 'ask', value: 'How much experience do you have?' },
            { label: 'Featured projects', kind: 'ghost', action: 'ask', value: 'Show me your best projects' },
          ],
        },
        'how-are-you',
      ),
  },
  {
    id: 'offtopic',
    examples: ['how is the weather?', "how's the weather today?", 'what is the weather like?'],
    keywords: ['weather', 'how is your day'],
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
    id: 'orientation',
    examples: ['are you gay?', 'are you straight?', 'are you bi?', 'are you asexual?', 'are you pansexual?', 'are you aromantic?', 'are you demisexual?', 'are you non-binary?'],
    keywords: ['orientation', 'gender', 'sexual preference', 'gay', 'straight', 'bi', 'asexual', 'pansexual', 'aromantic', 'demisexual', 'non-binary'],
    handler: () =>
      r(
        {
          text: "Well, that's a bit personal. I'm a software engineer and I'm all about building reliable systems and shipping code that makes a difference. :)",
          buttons: [
            { label: 'Ask about my work', kind: 'ghost', action: 'ask', value: 'What do you work on?' },
            { label: 'Contact me', kind: 'primary', action: 'mailto' }
          ],
        },
        'orientation',
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

  // ----- recruiter / logistics (config-driven, these win over the hire pitch) -----
  {
    id: 'availability',
    examples: [
      'are you open to work?',
      'are you available?',
      'are you looking for a job?',
      'are you open to new opportunities?',
      'are you on the market?',
      'are you actively looking?',
    ],
    keywords: [
      'open to work',
      'open to new',
      'open to opportunities',
      'open to a role',
      'open to a new',
      'looking for a job',
      'looking for a new',
      'looking for work',
      'actively looking',
      'on the market',
      'are you available',
      'available for a role',
      'job hunting',
    ],
    handler: () =>
      r(
        {
          text: RECRUITER.openToWork
            ? `${RECRUITER.openHeadline} The roles that fit me: ${RECRUITER.roles.join(', ')}.`
            : RECRUITER.closedHeadline,
          buttons: [
            { label: 'Email me', kind: 'primary', action: 'mailto' },
            { label: 'Download Resume', kind: 'ghost', action: 'resume' },
          ],
        },
        'availability',
      ),
  },
  {
    id: 'relocation',
    examples: [
      'are you open to relocation?',
      'will you relocate?',
      'would you move for a job?',
      'are you willing to move?',
      'do you work remotely?',
      'are you remote?',
    ],
    keywords: [
      'relocat',
      'willing to move',
      'would you move',
      'open to moving',
      'work remotely',
      'remote only',
      'fully remote',
      'are you remote',
    ],
    handler: () =>
      r(
        {
          text: `${RECRUITER.relocation} ${RECRUITER.location}`,
          buttons: [{ label: 'Email me', kind: 'primary', action: 'mailto' }],
        },
        'relocation',
      ),
  },
  {
    id: 'notice',
    examples: [
      'what is your notice period?',
      'how soon can you start?',
      'when can you start?',
      'what is your availability to start?',
      'what is your start date?',
    ],
    keywords: [
      'notice period',
      'how soon can you start',
      'when can you start',
      'when could you start',
      'availability to start',
      'start date',
      'how soon could you join',
      'when can you join',
    ],
    handler: () =>
      r(
        {
          text: RECRUITER.notice,
          buttons: [{ label: 'Talk over email', kind: 'primary', action: 'mailto' }],
        },
        'notice',
      ),
  },
  {
    id: 'compensation',
    examples: [
      'what is your expected salary?',
      'what are your salary expectations?',
      'what is your expected CTC?',
      'what do you charge?',
      'what is your day rate?',
      'what is your compensation expectation?',
    ],
    keywords: [
      'salary',
      'expected ctc',
      'your ctc',
      'compensation',
      'expected pay',
      'pay expectation',
      'day rate',
      'your rate',
      'what do you charge',
      'how much do you charge',
      'remuneration',
      'package expectation',
      'expected package',
    ],
    handler: () =>
      r(
        {
          text: RECRUITER.compensation,
          buttons: [{ label: 'Email me', kind: 'primary', action: 'mailto' }],
        },
        'compensation',
      ),
  },
  {
    id: 'visa',
    examples: [
      'do you need visa sponsorship?',
      'do you need sponsorship?',
      'do you have work authorization?',
      'do you need a work permit?',
    ],
    keywords: [
      'visa',
      'sponsorship',
      'sponsor',
      'work permit',
      'work authorization',
      'right to work',
      'green card',
      'h1b',
      'h-1b',
    ],
    handler: () =>
      r(
        {
          text: RECRUITER.visa,
          buttons: [{ label: 'Email me', kind: 'primary', action: 'mailto' }],
        },
        'visa',
      ),
  },
  {
    id: 'freelance',
    examples: [
      'do you freelance?',
      'are you available for contract work?',
      'do you do consulting?',
      'can I hire you for a contract?',
    ],
    keywords: [
      'freelance',
      'contract work',
      'contractor',
      'consulting',
      'consultant',
      'contract role',
      'part time',
      'part-time',
      'moonlight',
      'side gig',
    ],
    handler: () =>
      r(
        {
          text: RECRUITER.freelance,
          buttons: [{ label: 'Email me', kind: 'primary', action: 'mailto' }],
        },
        'freelance',
      ),
  },

  // ----- playful -----
  {
    id: 'hire',
    examples: [
      'Why should I hire you?',
      'why should we hire you?',
      'what makes you a good hire?',
      'I want to recruit you',
    ],
    keywords: ['hire', 'recruit', 'why should we', 'good fit for', 'why you'],
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
    id: 'career-journey',
    examples: [
      'Walk me through your career',
      'tell me about your career journey',
      'how did you get into engineering?',
      'how did you start your career?',
      'what is your proudest work?',
      'what was your biggest challenge?',
    ],
    keywords: [
      'walk me through',
      'career journey',
      'career path',
      'your career',
      'your journey',
      'how did you get into',
      'get into engineering',
      'how did you start',
      'proudest',
      'biggest challenge',
      'why did you leave',
      'why leave',
    ],
    handler: (ctx) =>
      r(
        {
          text: `The short arc: I started in sales at Byju's in 2019, taught myself to code, and pivoted into engineering at CodeNicely. From there it was data and backend at SpringML and Fractal, decision-science platforms at HSBC, and now high-availability infrastructure at HashiCorp. ${ctx.experienceLabel} years, and the throughline has always been making systems reliable. The timeline has the full story.`,
          buttons: [
            { label: 'View timeline', kind: 'primary', action: 'route', value: 'Timeline' },
            { label: 'Download Resume', kind: 'ghost', action: 'resume' },
          ],
        },
        'career-journey',
      ),
  },
  {
    id: 'experience',
    examples: [
      'How much experience do you have?',
      'How senior are you?',
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
    id: 'meta',
    examples: [
      'how does this assistant work?',
      'how was this site built?',
      'is this open source?',
      'what is this site built with?',
      'who built this website?',
      'how does this chat work?',
    ],
    keywords: [
      'this assistant',
      'this site',
      'this website',
      'this chat',
      'how was this',
      'how is this built',
      'how does this',
      'built with',
      'open source',
      'source code',
      'who built this',
      'who made this',
      'tech behind this',
    ],
    handler: () =>
      r(
        {
          text: 'This whole site is a static Next.js build with zero runtime cost, and this assistant is a small rule-based engine running entirely in your browser: no server, no API key, nothing leaves your device. Answers come from a hand-written intent registry plus an in-browser search index over my content.',
          buttons: [
            { label: 'See my projects', kind: 'ghost', action: 'route', value: 'Projects' },
            { label: 'Are you a real AI?', kind: 'ghost', action: 'ask', value: 'Are you a real AI?' },
          ],
        },
        'meta',
      ),
  },
  {
    id: 'working-style',
    examples: [
      'how do you work?',
      'what is your working style?',
      'what is your engineering philosophy?',
      'how do you approach problems?',
      'what do you value as an engineer?',
    ],
    keywords: [
      'how do you work',
      'how you work',
      'working style',
      'work style',
      'engineering philosophy',
      'philosophy',
      'how do you approach',
      'your approach',
      'what do you value',
      'methodology',
    ],
    handler: () =>
      r(
        {
          text: 'I like making systems boring in the best way: reliable, observable, and cheap to run. I optimise for the stuff nobody sees until it breaks: the 3am page that never comes, the cost leak you caught early, the deploy that just works. I bias toward simple, well-tested code and I would rather ship something solid than something clever.',
          buttons: [
            { label: 'What I work on', kind: 'ghost', action: 'ask', value: 'What do you work on?' },
            { label: 'My projects', kind: 'ghost', action: 'route', value: 'Projects' },
          ],
        },
        'working-style',
      ),
  },
  {
    id: 'location',
    examples: [
      'where are you based?',
      'where do you live?',
      'what is your location?',
      'which city are you in?',
      'what timezone are you in?',
    ],
    keywords: [
      'where are you based',
      'where do you live',
      'where are you located',
      'your location',
      'which city',
      'what city',
      'what timezone',
      'time zone',
      'based in',
    ],
    handler: () =>
      r(
        {
          text: RECRUITER.location,
          buttons: [
            { label: 'Open to relocation?', kind: 'ghost', action: 'ask', value: 'are you open to relocation?' },
            { label: 'Email me', kind: 'ghost', action: 'mailto' },
          ],
        },
        'location',
      ),
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
    keywords: ['work on', 'do you do', 'hashicorp', 'infra', 'day to day', 'your role', 'build at'],
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
      "what's your LinkedIn?",
      'are you on GitHub?',
      'are you on Twitter?',
    ],
    keywords: [
      'contact',
      'email',
      'reach',
      'connect',
      'talk',
      'touch',
      'hello there',
      'linkedin',
      'github',
      'twitter',
      'social',
    ],
    handler: (_ctx, query) => {
      const q = query.toLowerCase();
      const linkedin = { label: 'LinkedIn', kind: 'ghost' as const, action: 'link' as const, value: 'https://www.linkedin.com/in/singhgautam7' };
      const github = { label: 'GitHub', kind: 'ghost' as const, action: 'link' as const, value: 'https://github.com/singhgautam7' };
      if (q.includes('twitter') || /\bx\b/.test(q)) {
        return r(
          {
            text: "I'm not really active on Twitter / X. The reliable places to find me are email, LinkedIn and GitHub.",
            buttons: [{ label: 'Email me', kind: 'primary', action: 'mailto' }, linkedin, github],
          },
          'contact',
        );
      }
      if (q.includes('linkedin')) {
        return r(
          { text: "Yes, I'm on LinkedIn. That or email both reach me.", buttons: [linkedin, { label: 'Email me', kind: 'ghost', action: 'mailto' }] },
          'contact',
        );
      }
      if (q.includes('github')) {
        return r(
          { text: 'Yes, my code lives on GitHub. Have a look around.', buttons: [github, { label: 'Email me', kind: 'ghost', action: 'mailto' }] },
          'contact',
        );
      }
      return r(
        {
          text: "Easiest is email, I read everything. I'm also on LinkedIn and GitHub.",
          buttons: [{ label: 'Email me', kind: 'primary', action: 'mailto' }, linkedin, github],
        },
        'contact',
      );
    },
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
    examples: [
      'hello',
      'hi',
      'hi there',
      'hey',
      'yo',
      'namaste',
      'good morning',
      'good evening',
      'good day',
      'good night',
      'goodnight',
    ],
    keywords: [
      'hello',
      'hi',
      'hey',
      'yo',
      'sup',
      'namaste',
      'good morning',
      'good evening',
      'good day',
      'good night',
      'goodnight',
    ],
    handler: () =>
      r(
        {
          text: "Hey! I'm Gautam. This is my on-device assistant, and everything it answers runs right here in your browser. Ask me about my experience, what I'm working on, my projects, or how to get in touch.",
          buttons: [
            { label: 'Best projects', kind: 'ghost', action: 'ask', value: 'Show me your best projects' },
            { label: 'Contact', kind: 'ghost', action: 'ask', value: 'How do I contact you?' },
          ],
        },
        'greeting',
      ),
  },
];
