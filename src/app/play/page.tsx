import type { Metadata } from 'next';
import Link from 'next/link';
import GameChapter from '@/components/GameChapter';
import styles from './play.module.scss';

export const metadata: Metadata = {
  title: 'Signal Run',
  description: 'Play Signal Run, an original endless runner by Piyush Rajput. Jump over Error Bots and platform gaps as the pace picks up.',
  alternates: { canonical: '/play/' },
  openGraph: {
    title: 'Signal Run — Piyush Rajput',
    description: 'A tiny robot, an endless track, and a leaderboard to climb.',
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
          <p>A tiny robot on an endless track. Jump over Error Bots and platform gaps, then see how your score stacks up.</p>
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
