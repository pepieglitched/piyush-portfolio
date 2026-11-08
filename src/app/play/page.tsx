import type { Metadata } from 'next';
import Link from 'next/link';
import GameChapter from '@/components/GameChapter';
import styles from './play.module.scss';

export const metadata: Metadata = {
  title: 'Signal Run',
  description: 'Play Signal Run, an original portfolio game by Piyush Rajput. Collect three energy cores in arcade or turn-based mode.',
  alternates: { canonical: '/play/' },
  openGraph: {
    title: 'Signal Run — Piyush Rajput',
    description: 'A tiny robot. Three energy cores. A few bugs along the way.',
    url: '/play/',
  },
};

export default function PlayPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>
          <span aria-hidden="true">←</span> Back to Portfolio
        </Link>
        <header className={styles.intro}>
          <div>
            <p className={styles.kicker}><i aria-hidden="true" /> THE BUILDER’S MIND / SIDE QUEST</p>
            <h1>Signal <span className="serif">Run.</span></h1>
          </div>
          <p>A tiny robot, three energy cores, and a few bugs to jump over. Pick arcade mode or take it one turn at a time.</p>
        </header>
        <section id="signal-run" aria-label="Signal Run arcade">
          <GameChapter />
        </section>
        <footer className={styles.footer}>
          <span>AN ORIGINAL PORTFOLIO GAME</span>
          <Link href="/#skills">Explore the skill set <span aria-hidden="true">↗</span></Link>
        </footer>
      </div>
    </main>
  );
}
