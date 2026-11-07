import { achievements } from '@/content/portfolio';
import { EvidencePreviews, type Certificate } from './EvidencePreviews';
import styles from './EvidenceChapter.module.scss';

type AchievementId = (typeof achievements)[number]['id'];

const certificates: Partial<Record<AchievementId, Certificate>> = {
  brainwiz: {
    title: 'Brainwiz certificate',
    caption: 'Amalthea ’25 · IIT Gandhinagar · 25th place',
    src: '/certificates/brainwiz.webp',
    preview: '/certificates/brainwiz-preview.webp',
    width: 1440,
    height: 1018,
    alt: 'Brainwiz Certificate of Participation recording Piyush Rajput’s 25th place at Amalthea ’25, IIT Gandhinagar.',
  },
  laserhacks: {
    title: 'LaserHacks certificate',
    caption: 'Certificate of Participation · Team UnfairSphere',
    src: '/certificates/laserhacks.webp',
    preview: '/certificates/laserhacks-preview.webp',
    width: 1019,
    height: 1440,
    alt: 'LaserHacks 2025 Certificate of Participation for team UnfairSphere, listing Piyush Rajput.',
  },
};

export function EvidenceChapter() {
  return (
    <section id="evidence" className={styles.evidence} aria-labelledby="evidence-title">
      <p className="chapter-label"><b>06</b> THE EVIDENCE</p>
      <div className={styles.intro}>
        <h2 id="evidence-title" className="chapter-heading" data-reveal>Small steps.<br/><span className="serif">Real milestones.</span></h2>
        <p>No shortcuts. Just showing up,<br/>working with others, and learning.</p>
      </div>
      <EvidencePreviews certificates={certificates}>
        {achievements.map((item, index) => {
          const certificate = certificates[item.id];
          return (
            <article key={item.id} data-evidence-item={item.id} data-certificate={certificate ? item.id : undefined}>
              <span className={styles.number}>[ 0{index + 1} ]</span>
              <div className={styles.title}>
                <h3>{item.title}</h3>
                <p>{item.context}</p>
              </div>
              <strong>{item.result}</strong>
              <div className={styles.detail}>
                <p>{item.description}</p>
                {certificate && <a href={certificate.src} data-certificate-action aria-haspopup="dialog" aria-label={`View ${certificate.title}`}>
                  Certificate <span aria-hidden="true">↗</span>
                </a>}
              </div>
            </article>
          );
        })}
      </EvidencePreviews>
      <p className={styles.note}>Competition milestones, separate from the achievements inside Signal Run.</p>
    </section>
  );
}
