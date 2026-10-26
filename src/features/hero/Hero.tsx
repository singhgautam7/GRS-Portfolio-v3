import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Keycap2D, ModKey } from '@/components/ui/Keycap2D';
import { HeroKeyboard } from '@/features/keyboards/HeroKeyboard';
import { Selector, MobileSelector } from '@/features/keyboards/selector/Selector';
import { SITE } from '@/lib/site';
import { stats } from '@/lib/stats';
import { HintLine } from './HintLine';
import { MobileCluster } from './MobileCluster';
import { PlaygroundLink } from './PlaygroundLink';
import s from './hero.module.css';

/**
 * Hero (design 2a / 4a). Headline, copy, CTAs and KPIs are server-rendered HTML (the LCP);
 * the keyboard is a decorative island behind them. Phones get the keycap cluster instead.
 */
export function Hero() {
  const kpis = [
    { n: stats.experienceLabel, l: 'years' },
    { n: String(stats.appsShipped), l: 'apps shipped' },
    { n: String(stats.pypiPackages), l: 'PyPI packages' },
    { n: String(stats.projectCount), l: 'projects' },
  ];
  return (
    <section className={s.hero} data-hero aria-labelledby="hero-title">
      <HeroKeyboard />
      <div className={s.left}>
        <span className={s.pill}>
          <span className={s.live} aria-hidden />
          {SITE.headline}
        </span>
        <h1 id="hero-title" className={s.title}>
          I build systems that stay up.
        </h1>
        <p className={s.lead}>
          {stats.experienceLabel} years across backend, cloud infrastructure and AI systems. Go, Kubernetes and Terraform by day; local-first apps by night.
        </p>
        <div className={s.ctas}>
          <div className={s.ctaRow}>
            <Button href="#projects" variant="primary" size="lg">
              View projects <span className={s.mono}>→</span>
            </Button>
            <PlaygroundLink className={s.playBtn}>
              <span>Try the playground</span>
              <span className={s.keys} data-kbd-hint aria-hidden>
                <Keycap2D size="lg">
                  <ModKey />
                </Keycap2D>
                <Keycap2D size="lg" tone="accent">
                  ↵
                </Keycap2D>
              </span>
            </PlaygroundLink>
          </div>
          <Button href={SITE.resumeUrl} variant="outline" size="md" className={s.resumeBtn}>
            <Download size={16} />
            Download resume <span className={s.ext}>.docx</span>
          </Button>
        </div>
        <dl className={s.kpis}>
          {kpis.map((k) => (
            <div key={k.l} className={s.kpi}>
              <dt className={s.kpiL}>{k.l}</dt>
              <dd className={s.kpiN}>{k.n}</dd>
            </div>
          ))}
        </dl>
      </div>
      <HintLine />
      <div className={s.selector}>
        <Selector />
      </div>
      <div className={s.mobileKeys}>
        <MobileCluster />
        <MobileSelector />
      </div>
    </section>
  );
}
