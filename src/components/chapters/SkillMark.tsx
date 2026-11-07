import Image from 'next/image';
import type { skillGroups } from '@/content/portfolio';
import styles from './SkillSetChapter.module.scss';

type SkillGroup = (typeof skillGroups)[number];
type SkillItem = SkillGroup['items'][number];

const logos: Partial<Record<SkillItem, string>> = {
  HTML: 'html5.svg',
  CSS: 'css3.svg',
  JavaScript: 'javascript.svg',
  GSAP: 'gsap.svg',
  'Python — project and academic work': 'python.svg',
  'C / Turbo C — PPS coursework': 'c.svg',
  'C++ — academic exposure': 'cplusplus.svg',
  'MySQL — project use': 'mysql.svg',
  'Flask — exploration': 'flask.svg',
  'SQLite — exploration': 'sqlite.svg',
  'EJS — exploration': 'ejs.svg',
  'MongoDB — limited exposure': 'mongodb.svg',
  Botpress: 'botpress.png',
  Gemini: 'googlegemini.svg',
  'Three.js': 'threejs.svg',
  Blender: 'blender.svg',
  'Raspberry Pi 3 & Raspberry Pi 4': 'raspberrypi.svg',
  'ESP32 & ESP32-S3': 'espressif.svg',
  'Visual Studio Code': 'vscode.svg',
  'Raspberry Pi Imager': 'raspberrypi.svg',
  'Balena Etcher': 'etcher.png',
  'Selenium — basic experimentation': 'selenium.svg',
  'React.js': 'react.svg',
};

// Abstract tools and concepts use category glyphs instead of borrowed brand marks.
const codeGlyph = 'M8 7l-5 5 5 5m8-10 5 5-5 5m-2-13-4 16';
const chipGlyph = 'M6 6h12v12H6zm4 4h4v4h-4zM9 3v3m6-3v3m-6 12v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3';
const glyphs: Partial<Record<SkillGroup['id'], string>> = {
  intelligence: 'M12 3l9 9-9 9-9-9zM12 8v8m-4-4h8',
  'three-dimensional': 'M12 3l8 4.5v9L12 21l-8-4.5v-9zm0 9 8-4.5m-8 4.5L4 7.5m8 4.5v9',
  robotics: chipGlyph,
  embedded: chipGlyph,
  workflow: 'M4 5h16v14H4zm0 5h16m-11 0v9m4-5h4',
};

export function SkillMark({ item, group }: { item: SkillItem; group: SkillGroup['id'] }) {
  const logo = logos[item];
  return (
    <span className={styles.skillMark} aria-hidden="true" data-skill-mark={logo ? 'brand' : 'concept'}>
      {logo ? (
        <Image className={styles.skillIcon} src={`/icons/skills/${logo}`} alt="" width={18} height={18} unoptimized />
      ) : (
        <svg className={styles.skillIcon} width="18" height="18" viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={glyphs[group] ?? codeGlyph} />
        </svg>
      )}
    </span>
  );
}
