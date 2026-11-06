'use client';
import Link from 'next/link';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import styles from './Laboratory.module.scss';
import { experiments, skillGroups } from '@/content/portfolio';
const notes = [
  'A physical calendar concept for students. Exploring programmable date indicators, a task display, timekeeping, and connectivity. Component integration remains in development.',
  'A proposed split between perception on Raspberry Pi 4 and sensors / motor control on Raspberry Pi 3, connected over SPI. Intended tasks include lane following and obstacle avoidance; autonomous performance is not yet verified.',
  'An academic visual storytelling workflow: write prompts, generate scene images with Gemini and Nano Banana, then work toward a short video. Final publication details are not yet documented.',
  'Preparing to explain large language models through transformers, attention, and Query / Key / Value. An academic learning exercise, rather than a software product.',
];
export default function Laboratory() {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const tabId = (index: number) => `${id}-lab-tab-${index}`;
  const panelId = (index: number) => `${id}-lab-note-${index}`;
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case 'ArrowDown': next = (index + 1) % experiments.length; break;
      case 'ArrowUp': next = (index - 1 + experiments.length) % experiments.length; break;
      case 'Home': next = 0; break;
      case 'End': next = experiments.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  };
  return <div className={styles.lab}>
    <div className={styles.window} data-reveal><div className={styles.bar}><span aria-hidden="true">● ● ○</span><span>curiosity / experiments</span><span aria-hidden="true">↗</span></div>
      <div className={styles.files} role="tablist" aria-label="Experiment notes" aria-orientation="vertical">{experiments.map((item, index) => <button key={item.title} ref={node => { tabRefs.current[index] = node; }} type="button" id={tabId(index)} role="tab" tabIndex={selected === index ? 0 : -1} aria-selected={selected === index} aria-controls={panelId(index)} onKeyDown={event => handleTabKeyDown(event, index)} onClick={() => setSelected(index)}><span className={styles.folder} aria-hidden="true"/><span>{item.title}<small>{item.status}</small></span><span aria-hidden="true">↗</span></button>)}</div>
      {experiments.map((item, index) => <div key={item.title} className={styles.note} role="tabpanel" id={panelId(index)} aria-labelledby={tabId(index)} tabIndex={0} hidden={selected !== index}><span className={styles.noteLabel}>README / 0{index + 1}</span><h3>{item.title}</h3><p>{notes[index]}</p>{'slug' in item && <Link className="text-link" href={`/projects/${item.slug}/`}>Read project notes <span aria-hidden="true">↗</span></Link>}</div>)}
    </div>
    <div className={styles.skills} data-reveal><span className="eyebrow">THE CURRENT TOOLBOX</span>{skillGroups.map((group) => <div key={group.title}><h3>{group.title}<small>{group.level}</small></h3><p>{group.items.join(' · ')}</p></div>)}</div>
  </div>;
}
