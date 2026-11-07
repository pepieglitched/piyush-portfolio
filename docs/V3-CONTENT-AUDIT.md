# V3 education and skills content audit

The uploaded `Piyush_Rajput_Education_and_Skills.txt` is the authority for the education and personal skill content introduced in V3. It is a working source record, so details explicitly marked for confirmation remain unpublished. Existing project and competition records retain their earlier dossier authority and were preserved.

## Preserved completed work

The interrupted V3 session had already added a structured `education` export, nine qualified `skillGroups`, a server-rendered Education chapter, and a keyboard-accessible Skill Set chapter. Those components and their editorial layouts were retained. No dependency reinstall was required.

## Published education

- Higher secondary education completed in the Science stream.
- Currently pursuing a B.Tech. (Honours) in Computer Science and Engineering at Karnavati University, Ahmedabad, Gujarat, India.
- Specialization: Artificial Intelligence and Machine Learning.
- First year, explicitly qualified as last confirmed in November 2026.
- Confirmed coursework: Fundamentals of Artificial Intelligence and FAI Lab; Mathematics; Programming for Problem Solving and PPS Lab; Basic Electrical and Electronics Engineering and BEEE Lab; Design Thinking and Innovation.
- Academic interests use the uploaded document's programming, AI, mathematics, robotics, and hardware-software integration areas.

## Deliberately omitted education details

- The source lists **72%** in its main Class 12 record and draft, but **66%** in its later confirmation question and accuracy notes. Neither percentage is published.
- The school appears as “Airport School, Ahmedabad” with an explicit instruction to confirm its official name. That name is omitted.
- The board, school years, university entry year, graduation year, current semester, grades/CGPA, and Class 10 result are not supplied as confirmed facts.
- Formal IBM / industry-integrated programme wording is marked for confirmation. No IBM qualification, certification, or endorsement is claimed.
- “PDC” is omitted because its official subject title is not confirmed.

These omissions do not block the Education chapter: the confirmed academic stages and coursework form a complete truthful record.

## Personal skills and context

| Category | Scope published |
| --- | --- |
| Frontend | HTML, CSS, JavaScript, GSAP — hands-on experience. |
| Programming | Python project/academic work; C / Turbo C coursework; C++ academic exposure without a proficiency claim. |
| Data and backend | MySQL project use; Flask, SQLite, and EJS exploration; MongoDB limited exposure. |
| AI and GenAI | Coursework and applied experimentation, including documented concepts, Botpress, Gemini, and Nano Banana. No independent model-training/deployment claim. |
| 3D and visualization | Three.js, Blender, and browser model integration in the Tridix context. |
| Robotics | Documented hardware experience and architecture exploration. No claim that the complete robot or every proposed feature worked. |
| Embedded and IoT | Boards, indicators, displays, and connectivity concepts labelled prototyping/experimentation. No completed-device claim. |
| Workflow tools | Documented development tools; Selenium and CSV retain basic-experimentation/data-handling context. |
| Currently learning | React.js, explicitly presented as learning. |

Node.js, Express.js, Git proficiency, Next.js, TypeScript, Sass, React mastery, skill percentages, years of expertise, and star ratings are not added to the personal skill list. A technology used to implement this portfolio does not establish it as Piyush's personal skill. The supplied GitHub profile remains a public contact link, which is separate from a proficiency claim.

## Visible content and public resources

The same `src/content/portfolio.ts` exports drive the Education chapter, Skill Set chapter, and build-time resource generator. The generator writes `/about.md`, `/education.md`, `/projects.md`, `/skills.md`, `/llms.txt`, and `/llms-full.txt`. It includes the skill-category context and item-level qualifications rather than flattening them into an expertise list.

All skill panels remain in server-rendered HTML; interactive categories use labelled tabs, roving focus, arrow/Home/End navigation, and a complete no-JavaScript text equivalent. Anime.js owns only decorative scrambled label copies; their accessible names remain unchanged. Stable data attributes allow GSAP to animate section/timeline/list wrappers without competing for the same text content.

## Verification

Focused ESLint passed for the chapter components, content module, and resource generator. The generator ran successfully and content assertions verified the two academic milestones, five coursework entries, nine qualified skill groups, education-resource link, and absence of the uncertain percentages, school name, IBM wording, and Node.js/Express.js skill claims. Production build, browser, accessibility, scrolling, and performance results belong in the final V3 verification report after the integrated site is tested.
