'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { skillGroups } from '@/content/portfolio';
import styles from './SkillSetChapter.module.scss';

type ScrambleRun = { pause: () => unknown };
const characters = '{}[]<>/01:_+-*';

export default function SkillSetChapter() {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const runs = useRef(new Map<HTMLElement, ScrambleRun>());
  const generations = useRef(new Map<HTMLElement, number>());
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const activeRuns = runs.current;
    return () => {
      alive.current = false;
      activeRuns.forEach((animation, element) => { animation.pause(); element.textContent = element.dataset.label || ''; });
      activeRuns.clear();
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('portfolio:skills-change', { detail: { index: selected } }));
  }, [selected]);

  const restore = (button: HTMLButtonElement) => {
    const element = button.querySelector<HTMLElement>('[data-skill-scramble]');
    if (!element) return;
    generations.current.set(element, (generations.current.get(element) || 0) + 1);
    runs.current.get(element)?.pause();
    runs.current.delete(element);
    element.textContent = element.dataset.label || '';
  };

  const scramble = async (button: HTMLButtonElement) => {
    const element = button.querySelector<HTMLElement>('[data-skill-scramble]');
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const label = element.dataset.label || '';
    const generation = (generations.current.get(element) || 0) + 1;
    generations.current.set(element, generation);
    const { animate } = await import('animejs');
    if (!alive.current || !element.isConnected || generations.current.get(element) !== generation) return;
    runs.current.get(element)?.pause();
    const progress = { characters: 0 };
    // Anime.js owns only this decorative text copy. GSAP owns the surrounding section motion.
    const animation = animate(progress, {
      characters: label.length,
      duration: 440,
      ease: 'linear',
      onUpdate: () => {
        if (!alive.current || generations.current.get(element) !== generation) return;
        const resolved = Math.floor(progress.characters);
        element.textContent = [...label].map((character, index) => index < resolved || character === ' ' ? character : characters[Math.floor(Math.random() * characters.length)]).join('');
      },
      onComplete: () => { element.textContent = label; runs.current.delete(element); },
    });
    runs.current.set(element, animation);
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case 'ArrowDown': case 'ArrowRight': next = (index + 1) % skillGroups.length; break;
      case 'ArrowUp': case 'ArrowLeft': next = (index - 1 + skillGroups.length) % skillGroups.length; break;
      case 'Home': next = 0; break;
      case 'End': next = skillGroups.length - 1; break;
      default: return;
    }
    event.preventDefault();
    restore(event.currentTarget);
    setSelected(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="skills" className={styles.skills} aria-labelledby="skills-title" data-chapter="skills">
      <header className={styles.intro}>
        <div>
          <p className="chapter-label"><b>05</b> THE SKILL SET</p>
          <h2 id="skills-title" className="chapter-heading" data-word-reveal>A growing<br /><span className="serif">vocabulary.</span></h2>
        </div>
        <p>Tools I’ve used, concepts I’m studying, and systems I’m still figuring out.<span>Experience has context. Here’s mine.</span></p>
      </header>

      <div className={styles.explorer} data-skills-stage>
        <div className={styles.categories} role="tablist" aria-label="Skill categories" aria-orientation="vertical" data-skill-categories>
          {skillGroups.map((group, index) => (
            <button key={group.id} ref={element => { tabs.current[index] = element; }} type="button" role="tab" id={`${id}-skill-tab-${index}`} aria-selected={selected === index} aria-controls={`${id}-skill-panel-${index}`} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => onTabKey(event, index)} onPointerEnter={event => { void scramble(event.currentTarget); }} onPointerLeave={event => restore(event.currentTarget)} onFocus={event => { void scramble(event.currentTarget); }} onBlur={event => restore(event.currentTarget)}>
              <span className={styles.categoryNumber} aria-hidden="true">0{index + 1}</span>
              <span className="sr-only">{group.title}</span>
              <span className={styles.scramble} aria-hidden="true" data-skill-scramble data-label={group.title}>{group.title}</span>
              <span className={styles.categoryArrow} aria-hidden="true">↗</span>
            </button>
          ))}
        </div>

        <div className={styles.stage}>
          {skillGroups.map((group, index) => (
            <div key={group.id} id={`${id}-skill-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-skill-tab-${index}`} tabIndex={0} hidden={selected !== index} className={styles.panel} data-skill-panel data-active={selected === index ? 'true' : 'false'}>
              <div className={styles.panelTop}><span>THE CURRENT TOOLBOX</span><span>0{index + 1} / 0{skillGroups.length}</span></div>
              <h3 data-skill-title>{group.title}<span aria-hidden="true">.</span></h3>
              <p className={styles.level}><i aria-hidden="true" />{group.level}</p>
              <p className={styles.description}>{group.introduction}</p>
              <ul className={styles.items} data-skill-list>{group.items.map((item, itemIndex) => <li key={item} data-skill-item><span className={styles.itemIndex} aria-hidden="true">{String(itemIndex + 1).padStart(2, '0')}</span><span>{item}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}><p>Not a finished inventory.<br /><em className="serif">A working set of possibilities.</em></p><a href="/skills.md" className="text-link">Read the skill notes <span aria-hidden="true">↗</span></a></div>
      <noscript><div className={styles.noScript}><h3>The complete skill set</h3>{skillGroups.map(group => <div key={group.id}><h4>{group.title} — {group.level}</h4><p>{group.introduction}</p><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</div></noscript>
    </section>
  );
}
