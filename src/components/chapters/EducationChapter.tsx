import { education } from '@/content/portfolio';
import styles from './EducationChapter.module.scss';

export default function EducationChapter() {
  return (
    <section id="education" className={styles.education} aria-labelledby="education-title" data-chapter="education">
      <header className={styles.intro}>
        <div>
          <p className="chapter-label"><b>ED</b> THE FOUNDATIONS</p>
          <h2 id="education-title" className="chapter-heading" data-word-reveal>Learning the rules.<br /><span className="serif">Finding the possibilities.</span></h2>
        </div>
        <p className={styles.introduction}>{education.introduction}</p>
      </header>

      <div className={styles.body} data-education-stage>
        <aside className={styles.marginNote} aria-label="Academic focus" data-education-aside>
          <span className={styles.marginLabel}>EDUCATION / IN PROGRESS</span>
          <p>A foundation<br />for <em className="serif">what comes next.</em></p>
          <span className={styles.currentMark}><i aria-hidden="true" /> CURRENTLY PURSUING</span>
          <div className={styles.focus}>
            <span>ACADEMIC INTERESTS</span>
            <ul>{education.interests.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </aside>

        <div className={styles.timeline} data-education-timeline>
          <div className={styles.track} aria-hidden="true"><span data-timeline-line /></div>
          <ol>
            {education.milestones.map(item => (
              <li key={item.number} className={styles.milestone} data-education-item>
                <span className={styles.marker} aria-hidden="true" data-education-marker />
                <div className={styles.meta}><span>{item.number} / {item.stage}</span><span>{item.status}</span></div>
                <h3>{item.qualification}</h3>
                <p className={styles.discipline}>{item.discipline}</p>
                {item.institution && <p className={styles.institution}>{item.institution}<span>{item.location}</span></p>}
                {item.specialization && <div className={styles.specialization}><span>SPECIALIZATION</span><p>{item.specialization}</p></div>}
                {item.phase && <p className={styles.phase}>{item.phase}<span>{item.confirmed}</span></p>}
                <p className={styles.summary}>{item.summary}</p>
                {item.institution && <div className={styles.coursework}><span>THE CURRENT FOUNDATIONS</span><ul>{education.coursework.map(subject => <li key={subject} data-education-subject>{subject}</li>)}</ul></div>}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className={styles.footer}><span>LEARNING IS PART OF THE BUILD.</span><a href="/education.md" className="text-link">Read the academic record <span aria-hidden="true">↗</span></a></div>
    </section>
  );
}
