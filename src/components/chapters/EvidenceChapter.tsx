import { achievements, feedbackCourse } from '@/content/portfolio';
import { EvidencePreviews, type Certificate } from './EvidencePreviews';
import styles from './EvidenceChapter.module.scss';

type AchievementId = (typeof achievements)[number]['id'];
const { id: courseId, title: courseTitle, provider: courseProvider, date: courseDate } = feedbackCourse;

const certificates: Partial<Record<AchievementId, Certificate>> & Record<typeof courseId, Certificate> = {
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
  [courseId]: {
    title: `${courseTitle} certificate`,
    caption: `${courseProvider} · ${courseDate} · Certificate ID withheld`,
    src: '/certificates/leadership-feedback.webp',
    preview: '/certificates/leadership-feedback-preview.webp',
    width: 1440,
    height: 1113,
    alt: `${courseProvider} certificate for Piyush Rajput’s completion of ${courseTitle} on ${courseDate}.`,
  },
};

export function EvidenceChapter() {
  return (
    <section id="evidence" className={styles.evidence} aria-labelledby="evidence-title">
      <p className="chapter-label"><b>05</b> THE EVIDENCE</p>
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
        <p className={styles.note}>Competition milestones, separate from the achievements inside Signal Run.</p>
        <section className={styles.learning} aria-labelledby="continuing-learning-title">
          <h3 id="continuing-learning-title" className={styles.learningHeading}>Continuing Learning</h3>
          <article data-course-credential={courseId} data-certificate={courseId}>
            <span className={styles.number} aria-hidden="true">[ C01 ]</span>
            <div className={styles.title}>
              <h4 className={styles.courseTitle}>{courseTitle}</h4>
              <p>{courseProvider} · <time dateTime={feedbackCourse.dateTime}>{courseDate}</time></p>
            </div>
            <strong>Course completed</strong>
            <div className={styles.detail}>
              <p>{feedbackCourse.description}</p>
              <a href={certificates[courseId].src} data-certificate-action aria-haspopup="dialog" aria-label={`View ${certificates[courseId].title}`}>
                Certificate <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
        </section>
      </EvidencePreviews>
    </section>
  );
}
