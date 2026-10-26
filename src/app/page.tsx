import { Hero } from '@/features/hero/Hero';
import { LandingSections } from '@/features/sections/Landing';
import { HashScroll } from '@/components/sections/HashScroll';

/** The landing: server-rendered hero (keyboard loads after paint) and the eight sections. */
export default function HomePage() {
  return (
    <main id="main">
      <HashScroll />
      <Hero />
      <LandingSections />
    </main>
  );
}
