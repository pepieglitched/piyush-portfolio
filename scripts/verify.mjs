import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Run after npm run build, with npm run preview serving the exported output.
const base = process.env.TEST_URL || 'http://localhost:3000';
await mkdir('test-results', {recursive:true});
const report = {base, timestamp:new Date().toISOString(),checks:[],accessibility:[],observations:{},errors:[]};
const check = name => {report.checks.push(name);console.log(`PASS ${name}`);};
const browser = await chromium.launch({channel:'chrome',headless:true});
const portraitState = (page, state) => page.waitForFunction(expected => document.querySelector('[data-portrait-state]')?.dataset.portraitState === expected, state, {timeout:6000});
async function auditAccessibility(page, label) {
  const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  const violations = result.violations.map(({id,impact,nodes}) => ({id,impact,nodes:nodes.map(n=>({html:n.html,summary:n.failureSummary}))}));
  report.accessibility.push({page:label,violations});
  if(violations.length) console.error(`ACCESSIBILITY ${label}: ${violations.map(item=>`${item.id} (${item.nodes.length} nodes)`).join(', ')}. Full nodes are saved in verification.json.`);
}
try {
  const original = await sharp('assets/source/hero.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
  const extracted = await sharp('assets/source/hero-transparent.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(extracted.info.width,original.info.width); assert.equal(extracted.info.height,original.info.height);
  let foreground=0,fullyOpaque=0,transparent=0,identical=0;
  for(let pixel=0;pixel<extracted.info.width*extracted.info.height;pixel++) {
    const alpha=extracted.data[pixel*4+3];
    if(alpha===0) transparent++;
    if(alpha===255) fullyOpaque++;
    if(alpha>=248) {foreground++;if([0,1,2].every(channel=>original.data[pixel*3+channel]===extracted.data[pixel*4+channel])) identical++;}
  }
  assert.ok(transparent>extracted.info.width*extracted.info.height*.15,'The cutout needs actual transparent background pixels');
  assert.ok(foreground>0,'The cutout needs near-opaque portrait foreground pixels');
  assert.equal(identical,foreground,'Near-opaque face/body pixels must retain exact original RGB');
  report.observations.cutout={width:extracted.info.width,height:extracted.info.height,foregroundPixels:foreground,fullyOpaquePixels:fullyOpaque,transparentPixels:transparent,originalRgbRetention:identical/foreground};
  check('Transparent cutout preserves original portrait RGB and removes the rectangular background');

  const desktopContext = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page = await desktopContext.newPage();
  page.on('pageerror',error=>report.errors.push({message:error.message,stack:error.stack,url:page.url(),lastCheck:report.checks.at(-1)}));
  const response=await page.goto(base,{waitUntil:'networkidle'});
  const serverHtml=await response.text();
  await page.locator('h1').waitFor();
  await page.screenshot({path:'test-results/desktop-hero.png'});
  assert.match(await page.locator('h1').innerText(), /I BUILD/);
  assert.equal(await page.locator('img[fetchpriority="high"]').evaluate(img=>img.complete && img.naturalWidth>0),true);
  assert.match(await page.locator('#human img').getAttribute('src'),/hero-transparent/);
  assert.doesNotMatch(await page.locator('#human').textContent(),/COMPUTER SCIENCE STUDENT|KARNAVATI UNIVERSITY/i);
  check('Server-rendered editorial hero uses the cutout without compact education labels');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);check('Desktop has no horizontal overflow');

  const nav=page.getByRole('navigation',{name:'Main navigation'});
  assert.equal((await nav.getByRole('link',{name:'Piyush Rajput — home'}).innerText()).trim(),'PIYUSH RAJPUT');
  assert.equal(await nav.locator('svg').count(),0);
  for(const id of ['mind','education','skills','work','signal-run','contact']) assert.equal(await nav.locator(`a[href="/#${id}"]`).filter({visible:true}).count(),1);
  const glass=await nav.evaluate(element=>({radius:parseFloat(getComputedStyle(element).borderRadius),color:getComputedStyle(element).backgroundColor,backdrop:getComputedStyle(element).backdropFilter}));
  assert.ok(glass.radius>=16,'The navigation must retain its rounded glass geometry');
  report.observations.navigation=glass;check('Floating navigation has name-only branding and six working chapter links');

  const education=await page.locator('#education').textContent();
  assert.match(education,/Karnavati University/);assert.match(education,/Artificial Intelligence and Machine Learning/);assert.match(education,/First year/);assert.match(education,/Science stream/);
  assert.doesNotMatch(education,/Airport|\bIBM\b|\b(?:66|72)\s*%|\bCGPA\b|GSEB|CBSE/);
  const skills=await page.locator('#skills').textContent();
  assert.match(skills,/GSAP/);assert.match(skills,/React/);assert.match(skills,/learning/i);assert.match(skills,/Python/);
  assert.doesNotMatch(skills,/\bNode\.js\b|\bExpress(?:\.js)?\b|\bGit\b|\d\s*%/);
  assert.match(serverHtml,/id="education"/);assert.match(serverHtml,/id="skills"/);assert.match(serverHtml,/Higher Secondary/);
  assert.equal(await page.locator('#laboratory').count(),0);
  assert.match(await page.locator('#becoming img').getAttribute('alt'),/sunglasses/i);assert.match(await page.locator('#becoming img').getAttribute('src'),/cutout/);
  check('Education, Skill Set, and Page 7 match supplied facts and the sunglasses asset');

  const portrait=page.locator('[data-portrait-state]');
  const hoverPoint=await portrait.evaluate(element=>{
    const r=element.getBoundingClientRect();const image=element.querySelector('img');const fit=Math.min(r.width/image.naturalWidth,r.height/image.naturalHeight);const w=image.naturalWidth*fit,h=image.naturalHeight*fit;
    return {x:r.left+(r.width-w)/2+w*.52,y:r.top+r.height-h+h*.42};
  });
  await page.mouse.move(hoverPoint.x,hoverPoint.y);await portraitState(page,'code');
  const hoverPixels=await portrait.locator('canvas').evaluate(canvas=>{const d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let visible=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)visible++;return visible;});
  assert.ok(hoverPixels>100,'A pointer over the silhouette must produce visible code compositing');
  await page.mouse.move(2,2);await portraitState(page,'photo');check('Pointer code transformation activates on the portrait and returns on leave');
  const toggle=page.getByRole('button',{name:'Explore portrait as code',exact:true});
  await toggle.focus();await toggle.press('Space');await portraitState(page,'code');
  assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  const codePixels=await portrait.locator('canvas').evaluate(canvas=>{
    const ctx=canvas.getContext('2d');return {cornerAlpha:ctx.getImageData(0,0,1,1).data[3],width:canvas.width,height:canvas.height};
  });
  assert.equal(codePixels.cornerAlpha,0,'ASCII must not fill the rectangular background outside the silhouette');
  await portrait.screenshot({path:'test-results/portrait-code.png'});
  await toggle.press('Space');await portraitState(page,'photo');check('Keyboard portrait toggle creates silhouette-only code and restores the photograph');
  await auditAccessibility(page,'home-desktop');

  await page.getByRole('tab',{name:/01 Intelligence/}).focus();await page.keyboard.press('End');
  await expect(page.getByRole('tab',{name:/03 Physical systems/})).toHaveAttribute('aria-selected','true');check('Mind tabs support keyboard selection');
  await page.locator('#mind').screenshot({path:'test-results/mind.png'});
  const skillTabs=page.locator('#skills').getByRole('tab');
  await skillTabs.first().focus();await page.keyboard.press('ArrowDown');await expect(skillTabs.nth(1)).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('End');await expect(skillTabs.last()).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('Home');await expect(skillTabs.first()).toHaveAttribute('aria-selected','true');check('Skill categories support arrow, Home, and End navigation');
  await page.locator('#education').screenshot({path:'test-results/education.png'});await page.locator('#skills').screenshot({path:'test-results/skills.png'});await page.locator('#work').screenshot({path:'test-results/work.png'});

  await page.locator('#signal-run').scrollIntoViewIfNeeded();await page.getByRole('combobox',{name:'PLAY STYLE'}).waitFor();
  await page.getByRole('combobox',{name:'PLAY STYLE'}).selectOption('turns');await page.getByRole('button',{name:'PRESS START →',exact:true}).click();
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'JUMP FORWARD ↑',exact:true}).click();await page.getByRole('button',{name:'MOVE FORWARD →',exact:true}).click();}
  await page.getByRole('heading',{name:/MISSION COMPLETE/}).waitFor();
  assert.match(await page.locator('#signal-run').getByRole('status').innerText(),/Curious Mind/);check('Accessible game completes all three cores');
  await page.locator('#signal-run').screenshot({path:'test-results/game.png'});
  await page.getByRole('combobox',{name:'PLAY STYLE'}).selectOption('arcade');await page.getByRole('button',{name:'PRESS START →',exact:true}).click();
  const stage=page.getByRole('application',{name:'Signal Run play area'});await stage.focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(600);await page.keyboard.up('ArrowRight');await page.keyboard.press('Escape');
  await page.getByRole('heading',{name:'PAUSED.'}).waitFor();check('Arcade keyboard movement and Escape pause');await auditAccessibility(page,'game-paused');
  await page.getByRole('link',{name:'SKIP ↗',exact:true}).click();await page.waitForURL('**/#skills');check('Game skip continues to the Skill Set chapter using native navigation');

  for(const slug of ['tridix','legalone','meghdoot-ai','brts','smart-calendar','autonomous-robot']){
    const response=await page.goto(`${base}/projects/${slug}/`,{waitUntil:'networkidle'});assert.equal(response.status(),200);assert.equal(await page.locator('h1').count(),1);
    (await page.locator('script[type="application/ld+json"]').allTextContents()).forEach(x=>JSON.parse(x));
  }check('All six crawlable case-study pages and JSON-LD parse');await page.screenshot({path:'test-results/project.png'});
  for(const endpoint of ['/projects/','/sitemap.xml','/robots.txt','/llms.txt','/llms-full.txt','/about.md','/projects.md','/skills.md','/education.md','/og.png']) assert.equal((await page.request.get(base+endpoint)).status(),200,endpoint);
  for(const endpoint of ['/education.md','/skills.md','/llms-full.txt']) {
    const text=await(await page.request.get(base+endpoint)).text();assert.match(text,/Karnavati|GSAP|Python/);assert.doesNotMatch(text,/Airport|\bIBM\b|\b(?:66|72)\s*%|\bNode\.js\b|\bExpress(?:\.js)?\b/);
  }check('SEO and AI resources return HTTP 200 and contain consistent verified education and skills');

  const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const mobile=await mobileContext.newPage();mobile.on('pageerror',error=>report.errors.push({message:error.message,stack:error.stack,url:mobile.url(),lastCheck:report.checks.at(-1)}));await mobile.goto(base,{waitUntil:'networkidle'});
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);check('390px mobile layout has no horizontal overflow');await mobile.screenshot({path:'test-results/mobile-hero.png'});
  await mobile.getByRole('button',{name:'Explore portrait as code',exact:true}).tap();await portraitState(mobile,'code');
  assert.equal(await mobile.locator('[data-portrait-full]').getAttribute('data-portrait-full'),'true');
  await mobile.getByRole('button',{name:'Explore portrait as code',exact:true}).tap();await portraitState(mobile,'photo');check('Touch portrait control activates and restores code without hijacking scrolling');
  await mobile.getByRole('button',{name:/^Menu\s*\+?$/}).tap();
  await mobile.getByRole('button',{name:/^Close\s*[−-]?$/}).press('Escape');
  await mobile.waitForFunction(()=>document.querySelector('button[aria-controls="mobile-navigation"]')?.getAttribute('aria-expanded')==='false');
  await mobile.getByRole('button',{name:/^Menu\s*\+?$/}).tap();
  await mobile.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:/Skills/i}).tap();
  await mobile.waitForURL('**/#skills');
  await mobile.getByRole('button',{name:'Menu',exact:true}).waitFor();
  const skillsTop = await mobile.locator('#skills').evaluate(section => section.getBoundingClientRect().top);
  assert.ok(Math.abs(skillsTop - 120) < 6, `Skills must land under the mobile navbar before the game loads, got ${skillsTop}`);
  check('Mobile glass navigation supports Escape and lands at Skills before game initialization');
  await mobile.locator('#signal-run').scrollIntoViewIfNeeded();await mobile.getByRole('button',{name:'PRESS START →',exact:true}).waitFor();await mobile.screenshot({path:'test-results/mobile-game.png'});await auditAccessibility(mobile,'mobile');
  await mobile.emulateMedia({reducedMotion:'reduce'});await mobile.goto(base,{waitUntil:'networkidle'});
  await mobile.getByRole('button',{name:'Explore portrait as code',exact:true}).tap();await portraitState(mobile,'code');
  const staticPortrait=await mobile.locator('[data-portrait-canvas]').evaluate(canvas=>canvas.toDataURL());
  await mobile.waitForTimeout(250);
  const settledPortrait=await mobile.locator('[data-portrait-canvas]').evaluate(canvas=>canvas.toDataURL());
  assert.equal(createHash('sha256').update(settledPortrait).digest('hex'),createHash('sha256').update(staticPortrait).digest('hex'),'Reduced-motion code illustration must settle without animated pixel changes');
  await mobile.getByRole('button',{name:'Explore portrait as code',exact:true}).tap();await portraitState(mobile,'photo');check('Reduced-motion portrait toggle provides a static code illustration');
  await mobile.locator('#mind').scrollIntoViewIfNeeded();
  assert.equal(await mobile.locator('#mind canvas').count(),0);assert.equal(await mobile.locator('h1').isVisible(),true);check('Reduced motion keeps content visible and skips WebGL');
  for(const width of [360,768,1024,1920]){await page.setViewportSize({width,height:900});await page.goto(base,{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);}check('360px, 768px, 1024px, and 1920px layouts avoid overflow');
  const nojs=await browser.newPage({javaScriptEnabled:false});const nojsResponse=await nojs.goto(base);const html=await nojsResponse.text();
  for(const text of ['Tridix','Karnavati','Higher Secondary','GSAP','Python']) assert.ok(html.includes(text),`${text} must exist in server HTML`);
  await nojs.goto(`${base}/#work`);await nojs.getByRole('heading',{name:'Tridix',exact:true}).waitFor();assert.match(await nojs.locator('#work').innerText(),/Tridix/);
  await nojs.goto(`${base}/#skills`);assert.match(await nojs.locator('#skills').innerText(),/complete skill set/i);check('Primary content, education, and complete skills are readable without JavaScript');
  assert.equal(report.errors.length,0,JSON.stringify(report.errors));check('No browser runtime errors during integration');
  const accessibilityFailures=report.accessibility.filter(item=>item.violations.length);
  assert.equal(accessibilityFailures.length,0,`Accessibility scans failed: ${accessibilityFailures.map(item=>item.page).join(', ')}. See test-results/verification.json.`);
  check('Desktop, paused-game, and mobile WCAG scans have zero automated violations');
}catch(error){report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{await writeFile('test-results/verification.json',JSON.stringify(report,null,2));await browser.close();}
