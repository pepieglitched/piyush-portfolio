'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { motionEase, motionTiming, type ChapterKind } from '@/lib/animation-config';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

type Props = {kind: ChapterKind; scope: RefObject<HTMLDivElement | null>};

/** One scoped context and labelled choreography per chapter. No canvas pixels or nav properties. */
export default function ChapterDriver({kind, scope}: Props) {
  useGSAP((_context, contextSafe) => {
    const frame = scope.current;
    const section = frame?.querySelector<HTMLElement>('section, footer');
    if (!frame || !section || !contextSafe) return;
    const media = gsap.matchMedia();
    media.add({wide: '(min-width: 1100px)', tall: '(min-height: 760px)', motion: '(prefers-reduced-motion: no-preference)'}, (match, mediaSafe) => {
      if (!match.conditions?.motion || !mediaSafe) return;
      const desktop = Boolean(match.conditions.wide);
      const q = <T extends Element = HTMLElement>(selector: string) => Array.from(section.querySelectorAll<T>(selector));
      const splits: SplitText[] = [];
      const headingLabels: Array<[HTMLElement, string | null]> = [];
      const revertText = () => {
        splits.forEach(split => split.revert());
        headingLabels.forEach(([element, label]) => {if (label === null) element.removeAttribute('aria-label'); else element.setAttribute('aria-label', label);});
      };
      const defaults = {duration: motionTiming.reveal, ease: motionEase.editorial};
      frame.dataset.motionReady = 'true';
      let activeSkills: gsap.core.Timeline | undefined;
      let refreshFrame = 0;

      const heading = section.querySelector<HTMLElement>('h2');
      if (heading && kind !== 'hero') {
        const readable = heading.cloneNode(true) as HTMLElement;
        readable.querySelectorAll('br').forEach(element => element.replaceWith(' '));
        readable.querySelectorAll('a,img,button').forEach(element => element.remove());
        const accessibleTitle = readable.textContent?.replace(/\s+/g, ' ').trim();
        headingLabels.push([heading, heading.getAttribute('aria-label')]);
        const split = SplitText.create(heading, {type: 'words', mask: 'words', wordsClass: 'motion-word', aria: 'auto', ignore: 'a,img,button'});
        splits.push(split);
        if (accessibleTitle) heading.setAttribute('aria-label', accessibleTitle);
        const words = split.words;
        words.forEach(word => { (word as HTMLElement).dataset.motionWord = 'true'; });
        const title = gsap.timeline({defaults, scrollTrigger: {trigger: heading, start: 'top 88%', toggleActions: 'play none none reverse'}});
        title.addLabel('chapter-title').from(words, {
          yPercent: 136, rotation: kind === 'skills' ? 4 : 1.5,
          stagger: motionTiming.stagger, duration: motionTiming.cinematic,
        }, 'chapter-title');
      }

      switch (kind) {
        case 'hero': {
          const lines = q<HTMLElement>('[data-hero-line]');
          const portrait = section.querySelector<HTMLElement>('[data-hero-portrait]');
          // The CSS entrance starts with server-rendered content. GSAP owns the scroll exit.
          if (desktop) {
            const departure = gsap.timeline({scrollTrigger: {trigger: section, start: 'top top', end: 'bottom top', scrub: .75}});
            departure.addLabel('into-the-mind').to(lines, {xPercent: -5, stagger: .04, ease: 'none'}, 'into-the-mind');
            if (portrait) departure.to(portrait, {yPercent: -6, ease: 'none'}, 'into-the-mind');
          }
          break;
        }
        case 'mind': {
          const visual = section.querySelector<HTMLElement>('[data-mind-visual]');
          const content = section.querySelector<HTMLElement>('[data-mind-content]');
          const entry = gsap.timeline({defaults, scrollTrigger: {trigger: visual || section, start: 'top 86%', toggleActions: 'play none none reverse'}});
          entry.addLabel('worlds-open');
          if (visual) entry.from(visual, {clipPath: 'circle(0% at 50% 50%)', scale: .9, duration: 1.5}, 'worlds-open');
          if (content) entry.from(content, {x: desktop ? 60 : 0, y: desktop ? 0 : 25}, 'worlds-open+=.2');
          if (desktop && visual) gsap.to(visual, {y: -35, ease: 'none', scrollTrigger: {trigger: section, start: 'top 35%', end: 'bottom top', scrub: .8}});
          break;
        }
        case 'education': {
          const stage = section.querySelector<HTMLElement>('[data-education-stage]');
          const line = section.querySelector<HTMLElement>('[data-timeline-line]');
          const aside = section.querySelector<HTMLElement>('[data-education-aside]');
          const items = q<HTMLElement>('[data-education-item]');
          if (stage && line) gsap.fromTo(line, {scaleY: 0}, {scaleY: 1, transformOrigin: 'top center', ease: 'none', scrollTrigger: {trigger: stage, start: 'top 70%', end: 'bottom 70%', scrub: .5}});
          items.forEach(item => {
            const entry = gsap.timeline({defaults, scrollTrigger: {trigger: item, start: 'top 84%', toggleActions: 'play none none reverse'}});
            entry.addLabel('milestone').from(item, {x: desktop ? 65 : 22, clipPath: 'inset(0 0 0 100%)', duration: 1.05}, 'milestone');
            const marker = item.querySelector('[data-education-marker]');
            if (marker) entry.from(marker, {scale: .35, duration: .65, ease: 'back.out(1.7)'}, 'milestone+=.24');
            const subjects = item.querySelectorAll('[data-education-subject]');
            if (subjects.length) entry.from(subjects, {y: 22, stagger: .07}, 'milestone+=.3');
          });
          if (desktop && match.conditions.tall && stage && aside) {
            gsap.set(aside, {position: 'relative', top: 0});
            ScrollTrigger.create({trigger: stage, pin: aside, pinSpacing: false, start: 'top 128', end: () => `+=${Math.max(160, stage.offsetHeight - aside.offsetHeight - 30)}`, anticipatePin: 1, invalidateOnRefresh: true,
              onToggle: self => {frame.dataset.motionPinned = self.isActive ? 'true' : 'false';},
            });
          }
          break;
        }
        case 'work': {
          q<HTMLElement>('[data-project-card]').forEach((card, index) => {
            const art = card.querySelector<HTMLElement>('[data-project-art]');
            const guide = art?.querySelector('[data-art-guide]');
            const meta = card.querySelector<HTMLElement>('[data-project-meta]');
            const title = card.querySelector('h3');
            const entry = gsap.timeline({defaults, scrollTrigger: {trigger: card, start: 'top 86%', toggleActions: 'play none none reverse'}});
            entry.addLabel('project-unlocked');
            if (art) entry.from(art, {clipPath: `inset(${index ? '0 0 100%' : '100% 0 0'} 0)`, duration: 1.25}, 'project-unlocked');
            if (guide) entry.from(guide, {scale: .88, opacity: 0, duration: .72}, 'project-unlocked+=.42');
            if (meta) entry.from(meta, {x: -25}, 'project-unlocked+=.35');
            if (title) entry.from(title, {y: 35, clipPath: 'inset(0 0 100% 0)'}, 'project-unlocked+=.45');
            if (desktop && art) gsap.fromTo(card, {y: index ? 25 : -10}, {y: index ? -35 : 20, ease: 'none', scrollTrigger: {trigger: card, start: 'top bottom', end: 'bottom top', scrub: .9}});
          });
          q<HTMLElement>('[data-project-row]').forEach(row => {
            const copy = row.querySelector('[data-project-row-copy]');
            const rule = row.querySelector('[data-project-row-rule]');
            const entry = gsap.timeline({
              defaults: {duration: .58, ease: motionEase.editorial},
              scrollTrigger: {trigger: row, start: 'top 94%', toggleActions: 'play none none reverse'},
            });
            // Keep all four columns in place. Reveal only the copy inside its grid cell.
            if (copy) entry.from(copy, {y: 16, clipPath: 'inset(0 0 100% 0)', clearProps: 'transform,clipPath'}, 0);
            if (rule) entry.from(rule, {scaleX: .15, clearProps: 'transform'}, .08);
          });
          break;
        }
        case 'game': {
          const signal = section.querySelector('[data-game-signal]');
          const exit = section.querySelector('[data-game-exit]');
          const traces = q('[data-game-trace]');
          if (signal) {
            const entry = gsap.timeline({defaults, scrollTrigger: {trigger: signal, start: 'top 86%', toggleActions: 'play none none reverse'}});
            entry.addLabel('incoming-signal')
              .from(traces, {scaleX: 0, duration: .9, ease: motionEase.sweep}, 'incoming-signal')
              .from(signal, {clipPath: 'inset(0 50% 0 50%)', y: 12}, 'incoming-signal+=.15');
          }
          if (exit) gsap.from(exit, {y: 45, clipPath: 'inset(0 0 100% 0)', duration: 1.1, scrollTrigger: {trigger: exit, start: 'top 92%', toggleActions: 'play none none reverse'}});
          break;
        }
        case 'skills': {
          const categories = section.querySelector('[data-skill-categories]');
          if (categories) gsap.from(categories.children, {x: -30, stagger: .055, duration: .7, ease: motionEase.editorial, scrollTrigger: {trigger: categories, start: 'top 88%', toggleActions: 'play none none reverse'}});
          // Keep callbacks inside the child media context. Re-entering the outer
          // useGSAP context here creates a parent/child context cycle on onEnter.
          const revealPanel = mediaSafe(() => {
            activeSkills?.revert();
            const panel = section.querySelector<HTMLElement>('[data-skill-panel][data-active="true"]');
            if (!panel) return;
            activeSkills = gsap.timeline({defaults: {duration: .6, ease: motionEase.editorial}});
            activeSkills.addLabel('new-vocabulary').from(panel.querySelectorAll('h3'), {y: 30, clipPath: 'inset(0 0 100% 0)'}, 'new-vocabulary')
              .from(panel.querySelectorAll('[data-skill-item]'), {x: 22, stagger: .035}, 'new-vocabulary+=.1')
              .from(panel.querySelectorAll('[data-skill-mark]'), {scale: .6, rotation: -12, stagger: .035, duration: .5}, 'new-vocabulary+=.2');
            cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
          }) as () => void;
          const stage = section.querySelector('[data-skills-stage]');
          if (stage) ScrollTrigger.create({trigger: stage, start: 'top 88%', once: true, onEnter: revealPanel});
          window.addEventListener('portfolio:skills-change', revealPanel);
          return () => {window.removeEventListener('portfolio:skills-change', revealPanel); activeSkills?.revert(); cancelAnimationFrame(refreshFrame); revertText(); delete frame.dataset.motionReady;};
        }
        case 'evidence': {
          q<HTMLElement>('[data-evidence-item]').forEach((item, index) => {
            const sequence = gsap.timeline({defaults, scrollTrigger: {trigger: item, start: 'top 90%', toggleActions: 'play none none reverse'}});
            sequence.addLabel('evidence').from(item.children, {x: desktop ? (index % 2 ? 35 : -35) : 0, y: desktop ? 0 : 20, stagger: .09}, 'evidence')
              .from(item, {borderBottomColor: 'rgba(11,12,15,0)'}, 'evidence');
          });
          break;
        }
        case 'becoming': {
          const portrait = section.querySelector('[data-portrait-reveal]');
          const image = portrait?.querySelector('img');
          if (portrait) gsap.from(portrait, {clipPath: 'inset(100% 0 0 0)', duration: 1.45, ease: motionEase.sweep, scrollTrigger: {trigger: portrait, start: 'top 82%', toggleActions: 'play none none reverse'}});
          if (desktop && image) gsap.fromTo(image, {scale: 1.08, y: -22}, {scale: 1, y: 20, ease: 'none', scrollTrigger: {trigger: section, start: 'top bottom', end: 'bottom top', scrub: .8}});
          break;
        }
        case 'contact': {
          const links = q<HTMLElement>('a').filter(link => !heading?.contains(link));
          if (links.length) gsap.from(links, {y: 30, stagger: .1, duration: .8, scrollTrigger: {trigger: section, start: 'top 65%', toggleActions: 'play none none reverse'}});
          const stamp = section.querySelector('[data-contact-stamp]');
          const stampMask = stamp?.querySelector('[data-contact-mask]');
          if (stamp && stampMask) {
            const arrival = gsap.timeline({defaults, scrollTrigger: {trigger: stamp, start: 'top 83%', toggleActions: 'play none none reverse'}});
            arrival.addLabel('portrait-stamp').from(stamp, {rotation: -11, scale: .86, y: 24, duration: 1.05}, 'portrait-stamp')
              .from(stampMask, {clipPath: 'inset(0 0 100% 0)', duration: .82}, 'portrait-stamp+=.12');
          }
          break;
        }
      }
      frame.dataset.motionReady = 'true';
      return () => {cancelAnimationFrame(refreshFrame); revertText(); delete frame.dataset.motionReady; delete frame.dataset.motionPinned;};
    });
    return () => {media.revert(); delete frame.dataset.motionReady; delete frame.dataset.motionPinned;};
  }, {scope, dependencies: [kind], revertOnUpdate: true});
  return null;
}
