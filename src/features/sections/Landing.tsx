import Link from 'next/link';
import { Chip } from '@/components/ui/Chip';
import { Keycap2D, ModKey } from '@/components/ui/Keycap2D';
import { SectionMarker } from '@/components/ui/SectionMarker';
import { jobs, now, posts, projects } from '@/lib/content';
import { SITE, SKILL_GROUPS, SOCIALS } from '@/lib/site';
import { stats } from '@/lib/stats';
import { PlaygroundLink } from '@/features/hero/PlaygroundLink';
import { Experience } from './Experience';
import { CopyEmail } from './CopyEmail';
import { TeaserScene } from './TeaserScene';
import s from './sections.module.css';

/** Section marker G-chord keycaps (design: "G A" etc. in the marker's right slot). */
const chord = (k: string) => (
  <span data-kbd-hint style={{ display: 'flex', gap: 3 }} aria-hidden>
    <Keycap2D size="sm">G</Keycap2D>
    <Keycap2D size="sm">{k}</Keycap2D>
  </span>
);

const NOW_FOCUS = { value: 'HVD clusters', sub: 'Go · K8s · Terraform' };

export function About() {
  const years = stats.experienceLabel;
  const cells = [
    { label: 'EXPERIENCE', value: years.replace('+', ''), unit: '+ yrs' },
    { label: 'ROLES', value: String(stats.roleCount) },
    { label: 'PROJECTS', value: String(stats.projectCount) },
    { label: 'PyPI PACKAGES', value: String(stats.pypiPackages) },
    { label: 'APPS SHIPPED', value: String(stats.appsShipped) },
    { label: 'NOW', value: NOW_FOCUS.value, sub: NOW_FOCUS.sub, small: true },
  ];
  return (
    <section id="about" className={s.section} data-gap="36" aria-labelledby="about-h">
      <SectionMarker index="01" label="About" right={chord('A')} />
      <div className={s.about}>
        <div className={s.aboutText}>
          <h2 id="about-h" className={s.aboutH2}>
            I build systems that stay up, and tools that make teams faster.
          </h2>
          <p className={s.p}>
            {years} years across backend development, cloud infrastructure and scalable systems. At HashiCorp (IBM) I engineer and operate high-availability HVD clusters in Go, automate operations with Terraform and Kubernetes, and build developer tooling that drives efficiency.
          </p>
          <p className={s.p}>I care about practical impact: reducing operational risk, improving performance, and making infrastructure safer so products ship with confidence.</p>
        </div>
        <div className={s.stats}>
          {cells.map((c) => (
            <div key={c.label} className={s.stat}>
              <span className={s.label}>{c.label}</span>
              <span className={s.statValue} data-small={!!c.small}>
                {c.value}
                {c.unit && <span className={s.unit}>{c.unit}</span>}
              </span>
              {c.sub && <span className={s.statSub}>{c.sub}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Skills() {
  return (
    <section id="skills" className={s.section} data-gap="36" aria-label="Skills">
      <SectionMarker index="02" label="Skills" />
      <div className={s.grid4}>
        {SKILL_GROUPS.map((g) => (
          <div key={g.label} className={s.skill}>
            <span className={s.labelAccent}>{g.label}</span>
            <div className={s.tags}>
              {g.items.map((i) => (
                <Chip key={i} variant="cap">
                  {i}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExperienceSection() {
  return (
    <section id="experience" className={s.section} aria-labelledby="exp-h">
      <SectionMarker index="03" label="Experience" right={chord('E')} />
      <Experience jobs={jobs} />
    </section>
  );
}

export function Projects() {
  const shown = projects.slice(0, 6);
  return (
    <section id="projects" className={s.section} aria-labelledby="proj-h">
      <SectionMarker index="04" label="Projects" right={chord('P')} />
      <div className={s.titleRow}>
        <h2 id="proj-h" className={s.h2}>
          A few things I’ve shipped.
        </h2>
        <Link href="/projects" className={s.more}>
          view all {projects.length} →
        </Link>
      </div>
      <div className={s.grid3}>
        {shown.map((p) => (
          <article key={p.slug} className={s.project}>
            <div className={s.projTop}>
              <Chip variant="tag">{p.type.toUpperCase()}</Chip>
              <span className={s.year}>{p.year}</span>
            </div>
            <h3 className={s.projTitle}>{p.title}</h3>
            <span className={s.excerpt}>{p.excerpt}</span>
            <div className={s.tags}>
              {p.tech.slice(0, 5).map((t) => (
                <Chip key={t} variant="tagFilled">
                  {t}
                </Chip>
              ))}
            </div>
            <div className={s.projLinks}>
              {p.external && (
                <a href={p.external} target="_blank" rel="noopener noreferrer" className={s.live}>
                  live ↗
                </a>
              )}
              {p.github && (
                <a href={p.github} target="_blank" rel="noopener noreferrer" className={s.code}>
                  code ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PlaygroundTeaser() {
  return (
    <section id="playground" className={s.section} aria-labelledby="pg-h">
      <SectionMarker index="05" label="Playground" right="NEW" />
      <div className={s.teaser}>
        <div className={s.teaserText}>
          <h2 id="pg-h" className={s.teaserH2}>
            Push 10,000 requests a second through a system and see what breaks.
          </h2>
          <p className={s.teaserP}>Load balancers, servers, caches and databases you can scale, break and fix. No system-design knowledge needed.</p>
          <PlaygroundLink className={s.teaserBtn}>
            <span>Open the playground</span>
            <span style={{ display: 'flex', gap: 3 }} data-kbd-hint aria-hidden>
              <Keycap2D size="lg">
                <ModKey />
              </Keycap2D>
              <Keycap2D size="lg" tone="accent">
                ↵
              </Keycap2D>
            </span>
          </PlaygroundLink>
        </div>
        <div className={s.teaserScene}>
          <div className={s.teaserInner}>
            <TeaserScene />
          </div>
          <span className={s.teaserCaption}>
            <span className={s.okDot} aria-hidden />
            live preview · 4,000 req/s · all healthy
          </span>
        </div>
      </div>
    </section>
  );
}

export function Writing() {
  const post = posts[0];
  return (
    <section id="writing" className={s.section} aria-labelledby="writing-h">
      <SectionMarker index="06" label="Writing" right={chord('W')} />
      <div className={s.titleRow}>
        <h2 id="writing-h" className={s.h2}>
          Notes &amp; case studies.
        </h2>
        <Link href="/blog" className={s.more}>
          all posts →
        </Link>
      </div>
      {post && (
        <Link href={`/blog/${post.slug}`} className={s.post}>
          <div className={s.postMeta}>
            <span className={s.date}>{post.displayDate}</span>
            <span className={s.kind}>{post.kind.toUpperCase()}</span>
          </div>
          <div className={s.postBody}>
            <h3 className={s.postTitle}>{post.title}</h3>
            <span className={s.excerpt}>{post.tldr}</span>
            <div className={s.tags} style={{ marginTop: 4 }}>
              {post.tags.slice(0, 3).map((t) => (
                <Chip key={t} variant="tagFilled">
                  {t}
                </Chip>
              ))}
            </div>
          </div>
          <span className={s.postGo} aria-hidden>
            →
          </span>
        </Link>
      )}
    </section>
  );
}

export function Now() {
  return (
    <section id="now" className={s.section} aria-label="Now">
      <SectionMarker index="07" label="Now" live right={<span style={{ color: 'var(--ink-3)', fontSize: 11 }}>updated {now.lastUpdated}</span>} />
      <div className={s.grid4}>
        {now.sections.map((n) => (
          <div key={n.title} className={s.now}>
            <span className={s.labelAccent}>{n.title}</span>
            <span className={s.nowText}>{n.description}</span>
            <div className={s.tags}>
              {n.tags.map((t) => (
                <Chip key={t} variant="tag">
                  {t}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className={s.section} aria-labelledby="contact-h">
      <SectionMarker index="08" label="Contact" right={chord('C')} />
      <div className={s.contact}>
        <h2 id="contact-h" className={s.contactH2}>
          Let’s build reliable systems.
        </h2>
        <div className={s.emailRow}>
          <a href={`mailto:${SITE.email}`} className={s.email}>
            {SITE.email}
          </a>
          <CopyEmail />
        </div>
        <div className={s.socials}>
          {SOCIALS.map((so) => (
            <a key={so.name} href={so.url} target="_blank" rel="noopener noreferrer" className={s.social}>
              {so.name} <span className={s.ext}>↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingSections() {
  return (
    <div className={s.wrap}>
      <About />
      <Skills />
      <ExperienceSection />
      <Projects />
      <PlaygroundTeaser />
      <Writing />
      <Now />
      <Contact />
    </div>
  );
}
