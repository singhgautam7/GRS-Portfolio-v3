import { HeroChatShell } from '@/components/hero/HeroChatShell';
import { About } from '@/components/sections/About';
import { Skills } from '@/components/sections/Skills';
import { Experience } from '@/components/sections/Experience';
import { FeaturedProjects } from '@/components/sections/FeaturedProjects';
import { RecentPosts } from '@/components/sections/RecentPosts';
import { NowSection } from '@/components/sections/NowSection';
import { Contact } from '@/components/sections/Contact';
import { HashScroll } from '@/components/sections/HashScroll';

/**
 * The landing. The hero (assistant launcher) is sealed and carries its own
 * background; everything below sits on the quiet landing grid with the rhythm
 * system. Sections are real, crawlable DOM (not only reachable via the chat).
 */
export default function HomePage() {
  return (
    <>
      <HeroChatShell />
      <main className="grs-landing-grid" style={{ position: 'relative' }}>
        <HashScroll />
        <About />
        <Skills />
        <Experience />
        <FeaturedProjects />
        <RecentPosts />
        <NowSection />
        <Contact />
      </main>
    </>
  );
}
