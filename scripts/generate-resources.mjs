import ts from 'typescript';
import { readFile, writeFile } from 'node:fs/promises';

// One typed content module drives the visible portfolio and every public text file.
const source = new URL('../src/content/portfolio.ts', import.meta.url);
const { outputText } = ts.transpileModule(await readFile(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { profile, education, projects, skillGroups, achievements } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

const list = items => items.map(item => `- ${item}`).join('\n');
const nest = content => content.replace(/^(#+) /gm, '$1# ');
const publicProfiles = `- [GitHub](${profile.links.github})\n- [LinkedIn](${profile.links.linkedin})`;

const educationText = `# Education\n\n${education.introduction}\n\n${education.milestones.map(item => {
  const record = [
    `## ${item.qualification}`,
    `**Discipline / stream:** ${item.discipline}`,
    `**Status:** ${item.status}`,
    item.institution && `**Institution:** ${item.institution}`,
    item.location && `**Location:** ${item.location}`,
    item.specialization && `**Specialization:** ${item.specialization}`,
    item.phase && `**Academic stage:** ${item.phase}`,
    item.confirmed,
    item.summary,
  ].filter(Boolean);
  return record.join('\n\n');
}).join('\n\n')}\n\n## Current coursework\n\n${list(education.coursework)}\n\n## Academic interests\n\n${list(education.interests)}\n`;

const about = `# ${profile.name}\n\n${profile.bio}\n\n${nest(educationText)}\n## Interests\n\n${profile.interests.join(', ')}.\n\n## Public profiles\n\n${publicProfiles}\n`;

const projectText = '# Projects\n\n' + projects.map(project => `## ${project.title}\n\n[Project notes](/projects/${project.slug}/)\n\n**Status:** ${project.status}\n\n${project.summary}\n\n**Purpose:** ${project.problem}\n\n**Technologies / scope:** ${project.technologies.join(', ')}\n\n### Approach\n\n${list(project.approach)}\n\n### Outcome\n\n${project.outcome}\n\n### Documented limits\n\n${list(project.limitations)}\n`).join('\n');

const skills = '# Skills and areas of exploration\n\nExperience is presented in context: hands-on work, coursework, practical exploration, limited exposure, and current learning are distinct.\n\n' + skillGroups.map(group => `## ${group.title}\n\n**Context:** ${group.level}\n\n${group.introduction}\n\n${list(group.items)}\n`).join('\n');

const milestones = '## Competition milestones\n\n' + achievements.map(item => `### ${item.title} — ${item.result}\n\n${item.context}\n\n${item.description}\n`).join('\n');

const overview = `# ${profile.name}\n\n> Computer Science and Engineering student at Karnavati University in Ahmedabad, specializing in AI/ML. Exploring AI, interactive software, browser-based 3D, robotics, and embedded systems.\n\nFrom curiosity to creation. This portfolio distinguishes built work, prototypes, proposed architecture, coursework, exploration, and current learning. Signal Run is an optional original portfolio interaction.\n\n## Public information\n\n- [Portfolio](/): The Builder's Mind, an editorial portfolio with a playable intermission.\n- [About](/about.md): Biography, verified education, interests, and public profiles.\n- [Education](/education.md): Academic stages, confirmed programme details, coursework, and interests.\n- [Projects](/projects.md): Accurate project records and development status.\n- [Skills](/skills.md): Hands-on experience distinguished from learning and exploration.\n- [Full public portfolio](/llms-full.txt): Detailed text representation.\n\n## Project resources\n\n${projects.map(project => `- [${project.title}](/projects/${project.slug}/): ${project.status}. ${project.summary}`).join('\n')}\n\n## Public profiles\n\n${publicProfiles}\n`;

const full = `${about}\n${nest(projectText)}\n${nest(skills)}\n${milestones}\n## Portfolio interaction\n\nSignal Run is an original playable feature of this portfolio, not a historical project or competition achievement. Essential project and contact information is never gated behind game completion.\n`;

const resources = {
  'about.md': about,
  'education.md': educationText,
  'projects.md': projectText,
  'skills.md': skills,
  'llms.txt': overview,
  'llms-full.txt': full,
};
for (const [name, content] of Object.entries(resources)) {
  await writeFile(new URL(`../public/${name}`, import.meta.url), content);
}
console.log(`Generated ${Object.keys(resources).length} AI-readable resources from the public content module.`);
