import Image from 'next/image';
import Link from 'next/link';
import { profile, projects } from '@/content/portfolio';
import { siteUrl } from '@/lib/site';
import InteractivePortrait from '@/components/portrait/InteractivePortrait';
import EducationChapter from '@/components/chapters/EducationChapter';
import SkillSetChapter from '@/components/chapters/SkillSetChapter';
import { EvidenceChapter } from '@/components/chapters/EvidenceChapter';
import ProjectArtwork from '@/components/ProjectArtwork';
import MindExplorer from '@/components/spatial/MindExplorer';
import GameChapter from '@/components/GameChapter';
import MotionChapter from '@/components/motion/MotionChapter';
import styles from './page.module.scss';

const schema = { '@context':'https://schema.org', '@graph':[
  {'@type':'Person','@id':`${siteUrl}/#person`,name:profile.name,url:siteUrl,image:`${siteUrl}/images/hero-transparent-1080.avif`,description:profile.bio,sameAs:Object.values(profile.links),affiliation:{'@type':'CollegeOrUniversity',name:profile.education.institution},knowsAbout:['Artificial Intelligence','Software Development','Robotics','3D Web']},
  {'@type':'WebSite','@id':`${siteUrl}/#website`,url:siteUrl,name:'Piyush Rajput — The Builder’s Mind',inLanguage:'en',author:{'@id':`${siteUrl}/#person`}},
  {'@type':'ProfilePage','@id':`${siteUrl}/#profile`,url:siteUrl,name:'Piyush Rajput',mainEntity:{'@id':`${siteUrl}/#person`}},
]};

export default function Home() {
  return <main id="main">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
    <MotionChapter kind="hero"><section id="human" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.boot}><span><i/> SYSTEM ONLINE <span className={styles.bootExtra}>/ THE BUILDER’S MIND</span></span><span>PORTFOLIO — PLAYABLE EDITION</span></div>
      <div className={styles.heroIntro}><p className="eyebrow">01 / THE HUMAN</p><p>AI × SOFTWARE × PHYSICAL SYSTEMS</p></div>
      <div className={styles.heroComposition}>
        <div className={styles.heroCopy}><h1 id="hero-title"><span data-hero-line>I BUILD</span><span data-hero-line>WHAT I</span><span data-hero-line className={styles.imagine}>IMAGINE<span className={styles.redDot}>.</span></span></h1>
          <div data-hero-note className={styles.heroNote}><span className={styles.noteLine}/><p>From curiosity<br/><em className="serif">to creation.</em></p></div>
        </div>
        <div className={styles.heroPortrait} data-hero-portrait>
          <div className={styles.heroImageLayer}><InteractivePortrait/></div>
          <div className={styles.scanCorner} aria-hidden="true"><span/><span/></div>
          <span className={styles.player}>PLAYER_01 <i/> PIYUSH RAJPUT</span>
        </div>
        <div className={styles.heroMargin}><span>CURIOUS BY DEFAULT.</span><span>ALWAYS IN PROGRESS.</span></div>
        <a href="#mind" className={styles.start}><span className={styles.startBox}>↓</span><span>PRESS START<br/><b>to explore the mind</b></span></a>
      </div>
      <div className={styles.heroFooter}><span>STUDENT. THINKER. BUILDER.</span><p>I make things to understand them.<br/>Sometimes on a screen. Sometimes beyond it.</p><span>SCROLL TO EXPLORE <span aria-hidden="true">↘</span></span></div>
    </section></MotionChapter>

    <div className={styles.ticker} aria-label="From curiosity to creation"><div>CURIOUS MIND <span>/</span> OPEN POSSIBILITIES <span>/</span> ALWAYS BUILDING <span>/</span> FROM CURIOSITY TO CREATION <span>/</span></div></div>

    <MotionChapter kind="mind"><section id="mind" className={styles.mind} aria-labelledby="mind-title"><p className="chapter-label"><b>02</b> INSIDE THE MIND</p>
      <div className={styles.sectionIntro} data-reveal><h2 id="mind-title" className="chapter-heading">One mind.<br/><span className="serif">Many possibilities.</span></h2><p>{profile.bio}<span>My work lives where these three worlds meet.</span></p></div>
      <MindExplorer/>
    </section></MotionChapter>

    <MotionChapter kind="education"><EducationChapter/></MotionChapter>

    <MotionChapter kind="work"><section id="work" className={styles.work} aria-labelledby="work-title"><div className={styles.workHeader} data-work-heading><div><p className="chapter-label"><b>03</b> THINGS I’VE BUILT</p><h2 id="work-title" className="chapter-heading" data-reveal>Ideas, made<br/><span className="serif">tangible.</span></h2></div><div className={styles.workAside}><span>[ SELECTED WORK / 01—06 ]</span><p>Some built. Some prototyped.<br/>Some still asking better questions.</p></div></div>
      <div className={styles.featured} data-work-stage>{projects.slice(0,2).map(project=><article key={project.slug} className={styles.project} data-project-card><Link href={`/projects/${project.slug}/`} className={styles.artLink} data-project-art aria-label={`Read ${project.title} project notes`}><ProjectArtwork kind={project.slug}/><span className={styles.artGuide} data-art-guide aria-hidden="true"/><span className={styles.projectArrow} aria-hidden="true">↗</span></Link><div className={styles.projectMeta} data-project-meta><span>{project.number} / {project.category}</span><span><i/>{project.status}</span></div><div className={styles.projectTitle}><h3><Link href={`/projects/${project.slug}/`}>{project.title}</Link></h3><span data-magnetic aria-hidden="true">↗</span></div><p>{project.summary}</p><div className={styles.tags}>{project.technologies.slice(0,5).map(t=><span key={t}>{t}</span>)}</div></article>)}</div>
      <div className={styles.secondaryWork}>{projects.slice(2).map(project=><article key={project.slug} className={styles.workRow} data-project-row><span data-project-number>{project.number}</span><Link href={`/projects/${project.slug}/`} className={styles.rowTitle}><h3>{project.title}</h3><p>{project.category}</p></Link><span className={styles.rowStatus}>{project.status}</span><Link href={`/projects/${project.slug}/`} aria-label={`Read ${project.title}`} className={styles.rowArrow}>↗</Link></article>)}</div>
      <div className={styles.workFoot}><span>Every project has a story. Including what’s still unfinished.</span><Link href="/projects/" className="text-link">Open the full archive <span aria-hidden="true">↗</span></Link></div>
    </section></MotionChapter>

    <MotionChapter kind="game"><section id="signal-run" className={styles.game} aria-labelledby="game-title"><div className={styles.gameEntry} data-game-entry><p className="chapter-label"><b>04</b> THE PLAYABLE INTERMISSION</p><div className={styles.signalAssembly}><span aria-hidden="true" data-game-trace/><span className={styles.anomaly} data-game-signal><i/> SYSTEM ANOMALY DETECTED</span><span aria-hidden="true" data-game-trace/></div><h2 id="game-title" data-reveal>You’ve seen what I build.<br/><span className="serif">Now it’s your turn to play.</span></h2><p>Collect ideas. Dodge bugs. Build the future.</p></div><GameChapter/><div className={styles.gameExit} data-game-exit><span>AN ORIGINAL PORTFOLIO EXPERIENCE</span><p>Because the best way to understand a system<br/>is to <em className="serif">play with it.</em></p><a href="#skills" aria-label="Continue to the skill set">CONTINUE THE STORY ↓</a></div></section></MotionChapter>

    <MotionChapter kind="skills"><SkillSetChapter/></MotionChapter>

    <MotionChapter kind="evidence"><EvidenceChapter/></MotionChapter>

    <MotionChapter kind="becoming"><section id="becoming" className={styles.becoming} aria-labelledby="becoming-title"><div className={styles.quietPortrait} data-portrait-reveal><Image data-parallax src="/images/cutout.png" alt="Piyush Rajput wearing bold sunglasses in his original black-and-white halftone portrait" width={1274} height={1235} sizes="(max-width:700px) 90vw, 42vw"/><span>THE HUMAN BEHIND THE BUILDS.</span></div><div className={styles.becomingCopy}><p className="chapter-label"><b>07</b> STILL BECOMING</p><h2 id="becoming-title" data-reveal>STILL LEARNING.<br/>STILL <span className="serif">building.</span></h2><p>I’m not at the end of a journey. I’m at the part where every project opens another question.</p><p>I’m pursuing a B.Tech (Hons.) in Computer Science and Engineering, specializing in AI and Machine Learning at Karnavati University. I’m drawn to practical technology — especially the places where intelligent software meets the physical world.</p><div className={styles.personalNote}>More questions. More experiments.<br/><span className="serif">That’s the plan.</span></div></div></section></MotionChapter>

    <MotionChapter kind="contact"><footer id="contact" className={styles.contact}><div className={styles.contactTop}><p className="chapter-label"><b>08</b> OPEN CONNECTION</p><span><i/> A CONVERSATION IS A GOOD START.</span></div><div className={styles.contactStage}><span className={styles.contactPortrait} data-contact-stamp><span className={styles.contactPortraitMask} data-contact-mask><Image src="/images/closing-portrait.png" alt="Piyush Rajput in a black-and-white halftone portrait with sunglasses and a light polo shirt" width={1086} height={1448} sizes="(max-width:700px) 72px, 166px"/></span></span><h2 data-reveal>LET’S BUILD<br/><span className="serif">something.</span><a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Connect with Piyush on LinkedIn"><span aria-hidden="true">↗</span></a></h2></div><div className={styles.contactBottom}><p>Have an idea, a question,<br/>or a shared curiosity? Let’s connect.</p><div><a href={profile.links.github} target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a><a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></div><a href="#human" className={styles.backTop}>BACK TO TOP ↑</a></div><div className={styles.colophon}><span>© {new Date().getFullYear()} PIYUSH RAJPUT</span><span>FROM CURIOSITY TO CREATION.</span><Link href="/llms.txt">THE MACHINE-READABLE EDITION ↗</Link></div></footer></MotionChapter>
  </main>;
}
