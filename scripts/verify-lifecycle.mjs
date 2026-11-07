import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Run against the production static preview: npm run build && npm run preview.
const base = process.env.TEST_URL || 'http://localhost:3000';
const report = { base, timestamp: new Date().toISOString(), checks: [], observations: {}, skipped: [], errors: [], browserErrors: [] };
await mkdir('test-results', { recursive: true });
let currentCheck = '';
const watchPage = page => {page.on('pageerror',error=>report.browserErrors.push({check:currentCheck,message:error.message,stack:error.stack,url:page.url()}));return page;};
const check = async (name, action) => {
  if(process.env.CHECK_PATTERN && !new RegExp(process.env.CHECK_PATTERN,'i').test(name)) {report.skipped.push({check:name,reason:'Excluded by CHECK_PATTERN for focused diagnosis.'});return;}
  currentCheck = name;
  const initialErrors=report.browserErrors.length;
  try { await action(); assert.equal(report.browserErrors.length,initialErrors,`${name}: browser runtime errors were captured; see lifecycle.json`); report.checks.push(name); console.log(`PASS ${name}`); }
  catch (error) { report.errors.push({ name, error: error.stack }); console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
};
const digest = value => createHash('sha256').update(value).digest('hex');
let browser;

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });

  await check('Global animation listeners stay stable across client routes; reduced motion reverts transforms and Locomotive Scroll', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await context.addInitScript(() => {
      // Observe native registrations without changing listener identity or behavior.
      const add = EventTarget.prototype.addEventListener;
      const remove = EventTarget.prototype.removeEventListener;
      const watched = new Set(['scroll', 'wheel', 'touchstart', 'touchmove', 'touchend', 'click', 'keydown', 'popstate', 'hashchange', 'change', 'portfolio:skills-change', 'portfolio:anchor-travel']);
      const records = [];
      const capture = options => typeof options === 'boolean' ? options : Boolean(options?.capture);
      const label = target => target === window ? 'window' : target === document ? 'document' : typeof MediaQueryList !== 'undefined' && target instanceof MediaQueryList ? `media:${target.media}` : null;
      EventTarget.prototype.addEventListener = function (type, callback, options) {
        const targetLabel = label(this);
        if (targetLabel && callback && watched.has(type) && !records.some(record => record.target === this && record.type === type && record.callback === callback && record.capture === capture(options))) {
          records.push({ target: this, targetLabel, type, callback, capture: capture(options) });
        }
        return add.call(this, type, callback, options);
      };
      EventTarget.prototype.removeEventListener = function (type, callback, options) {
        const index = records.findIndex(record => record.target === this && record.type === type && record.callback === callback && record.capture === capture(options));
        if (index >= 0) records.splice(index, 1);
        return remove.call(this, type, callback, options);
      };
      // GSAP intentionally supports older engines through the legacy MQL API.
      if (typeof MediaQueryList !== 'undefined' && MediaQueryList.prototype.addListener) {
        const addMedia = MediaQueryList.prototype.addListener;
        const removeMedia = MediaQueryList.prototype.removeListener;
        MediaQueryList.prototype.addListener = function (callback) {
          if (callback && !records.some(record => record.target === this && record.type === 'change' && record.callback === callback && !record.capture)) records.push({ target: this, targetLabel: label(this), type: 'change', callback, capture: false });
          return addMedia.call(this, callback);
        };
        MediaQueryList.prototype.removeListener = function (callback) {
          const index = records.findIndex(record => record.target === this && record.type === 'change' && record.callback === callback && !record.capture);
          if (index >= 0) records.splice(index, 1);
          return removeMedia.call(this, callback);
        };
      }
      window.__listenerSnapshot = () => records.reduce((counts, record) => {
        const key = `${record.targetLabel}:${record.type}:${record.capture ? 'capture' : 'bubble'}`;
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {});
      window.__lifecycleDocument = crypto.randomUUID();
    });
    const page = watchPage(await context.newPage());
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push({message:error.message,stack:error.stack,url:page.url()}));
    try {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.mouse.move(120, 120); // The production animation engine intentionally loads on visitor intent.
      await page.waitForFunction(() => document.documentElement.dataset.scrollEngine === 'locomotive');
      await page.evaluate(() => {
        if (!window.gsap) return; // Production ESM builds do not generally expose module internals.
        const ticker = window.gsap.ticker;
        const add = ticker.add;
        const remove = ticker.remove;
        const active = new Set();
        ticker.add = function (callback, once, prioritize) {
          const result = add.call(this, callback, once, prioritize);
          if (!once) active.add(result);
          return result;
        };
        ticker.remove = function (callback) { active.delete(callback); return remove.call(this, callback); };
        window.__ownedTickerCount = () => active.size;
      });
      const identity = await page.evaluate(() => window.__lifecycleDocument);
      const snapshot = async label => {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        try {
          await page.waitForFunction(() => {
            const chapters=[...document.querySelectorAll('[data-motion-chapter]')];
            const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
            return chapters.every(chapter => reduced ? !chapter.dataset.motionReady : chapter.dataset.motionReady === 'true');
          });
        } catch(error) {
          report.observations.failedReadiness=await page.evaluate(label=>({label,path:location.pathname,chapters:[...document.querySelectorAll('[data-motion-chapter]')].map(element=>({kind:element.dataset.motionChapter,ready:element.dataset.motionReady,section:element.querySelector('section,footer')?.id,rectCount:element.getClientRects().length,height:element.getBoundingClientRect().height,display:getComputedStyle(element).display})),listeners:window.__listenerSnapshot()}),label);
          report.observations.runtimeErrors=runtimeErrors;
          await page.screenshot({path:'test-results/lifecycle-readiness-failure.png'});
          throw error;
        }
        await page.waitForTimeout(1200);
        return page.evaluate(label => {
          const triggers = window.gsap?.core.globals().ScrollTrigger?.getAll();
          const targets = triggers?.map(trigger => trigger.trigger).filter(Boolean);
          const ownedNodes = [...document.querySelectorAll('[data-reveal], [data-hero-line], [data-hero-note], [data-hero-portrait], [data-parallax], [data-draw], [data-motion-word], [data-education-aside], [data-education-item], [data-project-card], [data-project-art], [data-project-meta], [data-project-row], [data-project-number], [data-evidence-item], [data-skill-item], [data-portrait-reveal], [data-game-signal], [data-game-exit]')];
          return {
            label, path: location.pathname, triggers: triggers?.length ?? null,
            staleTriggers: targets ? targets.filter(target => !document.documentElement.contains(target)).length : null,
            duplicateTargets: targets ? targets.length - new Set(targets).size : null,
            animatedTargets: ownedNodes.filter(node => node._gsap).length,
            inlineTransforms: ownedNodes.filter(node => node.style.transform).length,
            readyChapters: document.querySelectorAll('[data-motion-ready="true"]').length,
            pinSpacers: document.querySelectorAll('.pin-spacer').length,
            nestedPinSpacers: document.querySelectorAll('.pin-spacer .pin-spacer').length,
            locomotiveActive: document.documentElement.dataset.scrollEngine === 'locomotive',
            trackedTickerCallbacks: window.__ownedTickerCount?.() ?? null,
            listeners: window.__listenerSnapshot(),
          };
        }, label);
      };
      const observations = [await snapshot('initial-home')];
      assert.match(await page.evaluate(() => window.locomotiveScrollVersion), /^5\./);
      report.observations.lifecycle = observations;
      if (observations[0].triggers === null) report.skipped.push({ check: 'Direct ScrollTrigger count / ticker callback count', reason: 'Production ESM bundle does not expose GSAP module internals. Observable native listener registrations, live animation targets, and transform reversion are verified instead.' });
      const homes = [];
      const projects = [];
      for (let round = 0; round < 3; round++) {
        await page.getByRole('link', { name: 'Read Tridix project notes', exact: true }).click();
        await page.waitForURL('**/projects/tridix/');
        const project = await snapshot(`project-${round + 1}`);
        projects.push(project); observations.push(project);
        assert.equal(project.pinSpacers, 0, 'Home chapter pins must not outlive navigation to a case study');
        assert.equal(project.readyChapters, 0);
        if (project.triggers !== null) { assert.equal(project.staleTriggers, 0); }
        if (project.trackedTickerCallbacks !== null) assert.equal(project.trackedTickerCallbacks, 1, 'Exactly one app Locomotive callback must be registered');
        assert.equal(project.locomotiveActive, true);
        await page.getByRole('link', { name: 'Home', exact: true }).click();
        await page.waitForURL(url => url.pathname === '/');
        await page.locator('#human').waitFor();
        const home = await snapshot(`home-${round + 1}`);
        homes.push(home); observations.push(home);
        if (home.triggers !== null) { assert.equal(home.staleTriggers, 0); }
        if (home.trackedTickerCallbacks !== null) assert.equal(home.trackedTickerCallbacks, 1);
        assert.equal(home.locomotiveActive, true);
        assert.equal(await page.evaluate(() => window.__lifecycleDocument), identity, 'Next links should retain the same document');
      }
      assert.equal(new Set(homes.map(item => item.pinSpacers)).size, 1, 'Pin spacers must not accumulate through client routes');
      assert.equal(new Set(homes.map(item => item.readyChapters)).size, 1, 'Every return must initialize one driver per existing chapter');
      assert.ok(homes.every(item => item.nestedPinSpacers === 0), 'Pin spacers must not become nested duplicates');
      // GSAP's lazy target cache can initialize at different times on first versus cached visits.
      // It is diagnostic; native listener ownership and transform reversion are the lifecycle assertions.
      if (homes[0].triggers !== null) assert.equal(new Set(homes.map(item => item.triggers)).size, 1);
      if (projects[0].triggers !== null) assert.equal(new Set(projects.map(item => item.triggers)).size, 1);
      assert.deepEqual(homes[2].listeners, homes[0].listeners, 'Global listener registrations must not accumulate across client navigation');

      await page.emulateMedia({ reducedMotion: 'reduce' });
      const reduced = await snapshot('reduced-motion'); observations.push(reduced);
      if (reduced.triggers !== null) assert.equal(reduced.triggers, 0);
      if (reduced.trackedTickerCallbacks !== null) assert.equal(reduced.trackedTickerCallbacks, 0);
      assert.equal(reduced.inlineTransforms, 0, 'GSAP must revert every owned inline transform for reduced motion');
      assert.equal(reduced.locomotiveActive, false);
      assert.equal(reduced.pinSpacers, 0, 'Reduced motion must remove pinned layout wrappers');
      assert.equal(reduced.readyChapters, 0, 'Reduced motion must unmount chapter drivers');
      const registrations = item => Object.values(item.listeners).reduce((sum,count)=>sum+count,0);
      assert.ok(registrations(reduced) < registrations(homes[0]), 'Reduced motion must release animation/controller listeners');
      for (const key of ['window:wheel:bubble','window:hashchange:bubble','document:click:capture']) assert.ok((reduced.listeners[key] || 0) <= (homes[0].listeners[key] || 0), `Reduced motion must not add ${key}`);
      assert.equal(await page.locator('h1').isVisible(), true);

      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const restored = await snapshot('restored-motion'); observations.push(restored);
      if (restored.trackedTickerCallbacks !== null) assert.equal(restored.trackedTickerCallbacks, 1);
      assert.equal(restored.locomotiveActive, true);
      if (restored.triggers !== null) { assert.equal(restored.staleTriggers, 0); assert.equal(restored.triggers, homes[0].triggers); }
      assert.equal(restored.pinSpacers, homes[0].pinSpacers);
      assert.equal(restored.readyChapters, homes[0].readyChapters);
      assert.deepEqual(restored.listeners, homes[0].listeners, 'Changing motion preference must restore one set of global listeners');
      assert.deepEqual(runtimeErrors, []);
    } finally { await context.close(); }
  });

  await check('Cinematic headings and education progression respond to scrolling with one intentional desktop pin', async () => {
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
    const page=watchPage(await context.newPage());
    try {
      await page.goto(base,{waitUntil:'networkidle'});
      await page.mouse.move(3,3);
      await page.waitForFunction(()=>{const chapters=[...document.querySelectorAll('[data-motion-chapter]')];return chapters.length>0 && chapters.every(chapter=>chapter.dataset.motionReady==='true');});
      const before=await page.locator('#education [data-motion-word]').first().evaluate(element=>({transform:getComputedStyle(element).transform,opacity:getComputedStyle(element).opacity}));
      await page.locator('#education h2').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>{
        const word=document.querySelector('#education [data-motion-word]');
        if(!word) return false;
        const style=getComputedStyle(word);
        return parseFloat(style.opacity)>.98 && (style.transform==='none' || Math.abs(new DOMMatrixReadOnly(style.transform).m42)<1);
      });
      const after=await page.locator('#education [data-motion-word]').first().evaluate(element=>({transform:getComputedStyle(element).transform,opacity:getComputedStyle(element).opacity}));
      assert.notDeepEqual(after,before,'Scroll entry must visibly change heading word presentation');
      assert.equal(await page.locator('#education [data-education-aside]').evaluate(element=>element.parentElement.classList.contains('pin-spacer')),true);
      assert.equal(await page.locator('.pin-spacer .pin-spacer').count(),0,'Pinning must not create nested duplicate spacers');
      const line=page.locator('#education [data-timeline-line]');
      const lineBefore=await line.evaluate(element=>getComputedStyle(element).transform);
      await page.locator('[data-education-stage]').evaluate(element=>{const r=element.getBoundingClientRect();window.scrollTo({top:scrollY+r.top+r.height*.5-innerHeight*.4,behavior:'instant'});});
      await page.waitForFunction(previous=>{const line=document.querySelector('#education [data-timeline-line]');return line && getComputedStyle(line).transform!==previous;},lineBefore);
      assert.equal(await page.locator('[data-motion-chapter="education"]').getAttribute('data-motion-pinned'),'true');
      report.observations.cinematicMotion={headingBefore:before,headingAfter:after,timelineChanged:true,educationPin:true,readyChapters:await page.locator('[data-motion-ready="true"]').count()};
      await page.locator('#education').screenshot({path:'test-results/education-motion.png'});
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>!document.querySelector('[data-motion-ready="true"]') && !document.querySelector('.pin-spacer'));
      assert.equal(await page.locator('#education [data-motion-word]').count(),0,'Reduced motion must restore unsplit semantic headings');
      assert.match(await page.locator('#education h2').innerText(),/Learning the rules/);
    } finally {await context.close();}
  });

  await check('Glass navbar responds to wheel direction without jitter and reveals for keyboard focus', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const page = watchPage(await context.newPage());
    const header = page.locator('body > header');
    const navHidden = hidden => page.waitForFunction(hidden => {
      const bar = document.querySelector('body > header');
      const bottom = bar.getBoundingClientRect().bottom;
      return bar.dataset.navHidden === String(hidden) && (hidden ? bottom <= 0 : bottom >= 65);
    }, hidden);
    const settle = () => page.waitForFunction(() => !document.documentElement.classList.contains('lenis-smooth'));
    try {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.mouse.move(5, 5);
      await page.waitForFunction(() => document.documentElement.dataset.scrollEngine === 'locomotive' && document.querySelector('body > header').dataset.navMotion === 'true');
      await navHidden(false);
      const surface = await page.getByRole('navigation', { name: 'Main navigation' }).evaluate(nav => {
        const style = getComputedStyle(nav);
        return { color: style.backgroundColor, blur: style.backdropFilter, radius: parseFloat(style.borderRadius) };
      });
      const alpha = Number(surface.color.match(/^rgba\(.+,\s*([\d.]+)\)$/)?.[1]);
      assert.ok(alpha > .5 && alpha < .82, `Glass must let the backdrop through: ${surface.color}`);
      assert.match(surface.blur, /blur\(.+\).*saturate\(.+\)/);
      assert.ok(surface.radius >= 16);

      await page.mouse.wheel(0, 620);
      await navHidden(true);
      await settle();
      const beforeJitter = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, -6);
      await page.waitForFunction(y => scrollY < y, beforeJitter);
      await settle();
      await navHidden(true);
      await page.mouse.wheel(0, -100);
      await navHidden(false);
      await settle();

      await page.mouse.wheel(0, 160);
      await navHidden(true);
      await page.keyboard.press('Tab'); // Skip link.
      await page.keyboard.press('Tab'); // First header link.
      assert.equal(await header.evaluate(bar => bar.contains(document.activeElement)), true);
      await navHidden(false);
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Home');
      await page.waitForFunction(() => scrollY <= 1);
      await navHidden(false);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => !document.documentElement.dataset.scrollEngine && !document.querySelector('body > header').dataset.navMotion);
      await page.mouse.wheel(0, 240);
      await navHidden(true);
      assert.equal(await header.evaluate(bar => bar.style.transform), '', 'Reduced motion uses a static state without an animation tween');
      await page.mouse.wheel(0, -240);
      await navHidden(false);
      report.observations.navigation = { surface, navHysteresis: true, keyboardReveal: true, reducedMotionWithoutTween: true };
    } finally { await context.close(); }
  });

  await check('Locomotive chapter anchors clear the visible header and preserve browser history and deep links', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = watchPage(await context.newPage());
    const measurements = [];
    report.observations.anchors = measurements;
    try {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.mouse.move(5, 5);
      await page.waitForFunction(() => document.documentElement.dataset.scrollEngine === 'locomotive');
      const landing = id => page.waitForFunction(id => {
        const top = document.getElementById(id).getBoundingClientRect().top;
        const headerBottom = document.querySelector('body > header').getBoundingClientRect().bottom;
        const atEnd = Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 3;
        const gliding = document.documentElement.classList.contains('lenis-smooth');
        return !gliding && headerBottom >= 65 && top >= headerBottom - 3 && (top <= headerBottom + 80 || (atEnd && top < innerHeight));
      }, id, { timeout: 6000 });
      for (const [href, id] of [['/#mind','mind'], ['/#education','education'], ['/#skills','skills'], ['/#work','work'], ['/#signal-run','signal-run'], ['/#contact','contact']]) {
        await page.locator(`header a[href="${href}"]`).click();
        await page.waitForURL(url => url.hash === `#${id}`);
        await landing(id);
        const measurement = await page.locator(`#${id}`).evaluate(element => ({ id: element.id, top: element.getBoundingClientRect().top, headerBottom: document.querySelector('body > header').getBoundingClientRect().bottom, atDocumentEnd: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 3 }));
        measurements.push(measurement);
        assert.ok(measurement.top >= measurement.headerBottom - 3 && (measurement.top <= measurement.headerBottom + 80 || (measurement.atDocumentEnd && measurement.top < 1000)), `#${id} must land below the sticky header or at document end: ${JSON.stringify(measurement)}`);
      }
      await page.goBack();
      await page.waitForURL(url => url.hash === '#signal-run');
      await landing('signal-run');
      await page.goForward();
      await page.waitForURL(url => url.hash === '#contact');
      await landing('contact');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForURL(url => url.hash === '#contact');
      await landing('contact');
      report.observations.anchorHistory = { back: '#signal-run', forward: '#contact', reload: '#contact' };
    } finally { await context.close(); }
  });

  await check('Unavailable WebGL keeps the spatial diagram, text, tabs, and Canvas 2D game usable', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      window.__blockedWebGLRequests = 0;
      HTMLCanvasElement.prototype.getContext = function (type, ...options) {
        if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) { window.__blockedWebGLRequests++; return null; }
        return original.call(this, type, ...options);
      };
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
      Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
    });
    const page = watchPage(await context.newPage());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('#mind').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => window.__blockedWebGLRequests > 0);
      await page.waitForTimeout(300);
      const fallback = page.locator('#mind [class*="sphere"]');
      assert.equal(await fallback.isVisible(), true);
      assert.equal(await page.locator('#mind canvas').count(), 0);
      await page.getByRole('tab', { name: /02 Software/ }).click();
      assert.match(await page.locator('#mind').getByRole('tabpanel', { name: /Software/ }).innerText(), /Python and MySQL/);
      await page.locator('#mind').screenshot({ path: 'test-results/webgl-fallback.png' });
      await page.locator('#signal-run').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'PRESS START →', exact: true }).waitFor();
      assert.equal(await page.locator('#signal-run canvas').evaluate(canvas => Boolean(canvas.getContext('2d'))), true);
      report.observations.webglFallback = { blockedRequests: await page.evaluate(() => window.__blockedWebGLRequests), canvas2dAvailable: true };
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  await check('Mobile game overlay stays inside its stage and first touch press moves then releases the robot', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = watchPage(await context.newPage());
    try {
      await page.goto(base, { waitUntil: 'networkidle' });
      const navigationStarted = Date.now();
      await page.getByRole('button', { name: /^Menu\s*\+?$/ }).tap();
      const selectedWork = page.getByRole('navigation',{name:'Main navigation'}).getByRole('link', { name: /Selected Work/i });
      await selectedWork.waitFor();
      await selectedWork.tap();
      await page.waitForURL(url => url.hash === '#work');
      await page.waitForFunction(() => {
        const top = document.getElementById('work').getBoundingClientRect().top;
        const bottom=document.querySelector('body > header').getBoundingClientRect().bottom;return top >= bottom - 3 && top <= bottom + 80;
      }, undefined, { timeout: 6000 });
      const workTop = await page.locator('#work').evaluate(element => element.getBoundingClientRect().top);
      const nativeTouch = await page.evaluate(() => ({ coarsePointer: matchMedia('(pointer: coarse)').matches, locomotiveActive: document.documentElement.dataset.scrollEngine === 'locomotive' }));
      report.observations.mobileMenu = { navigationMilliseconds: Date.now() - navigationStarted, hash: new URL(page.url()).hash, workTop, ...nativeTouch };
      const headerBottom=await page.locator('body > header').evaluate(element=>element.getBoundingClientRect().bottom);
      assert.ok(workTop >= headerBottom - 3 && workTop <= headerBottom + 80, `Mobile #work must clear the glass navigation: ${workTop}`);
      assert.equal(nativeTouch.coarsePointer, true);
      assert.equal(nativeTouch.locomotiveActive, false, 'Touch devices should use native momentum scrolling');
      await page.locator('#signal-run').scrollIntoViewIfNeeded();
      const start = page.getByRole('button', { name: 'PRESS START →', exact: true });
      await start.waitFor();
      const stage = page.getByRole('application', { name: 'Signal Run play area' });
      const stageBox = await stage.boundingBox();
      const headingBox = await stage.getByRole('heading').boundingBox();
      const startBox = await start.boundingBox();
      assert.ok(stageBox && headingBox && startBox);
      assert.ok(headingBox.y >= stageBox.y && startBox.y + startBox.height <= stageBox.y + stageBox.height, 'Idle game content must be contained by its stage');
      await page.locator('#signal-run').screenshot({ path: 'test-results/mobile-game-contained.png' });
      await start.tap();
      const right = page.getByRole('button', { name: 'Move right', exact: true });
      await right.scrollIntoViewIfNeeded();
      await stage.focus();
      await page.waitForTimeout(200);
      const canvas = page.locator('#signal-run canvas');
      const initial = digest(await canvas.evaluate(canvas => canvas.toDataURL()));
      const point = await right.boundingBox(); assert.ok(point);
      const session = await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x + point.width / 2, y: point.y + point.height / 2, radiusX: 4, radiusY: 4, force: 1, id: 1 }] });
      await page.waitForTimeout(650);
      const moving = digest(await canvas.evaluate(canvas => canvas.toDataURL()));
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.notEqual(moving, initial, 'The first touch press must change the game world pixels');
      await page.waitForTimeout(100);
      const released = digest(await canvas.evaluate(canvas => canvas.toDataURL()));
      await page.waitForTimeout(250);
      assert.equal(digest(await canvas.evaluate(canvas => canvas.toDataURL())), released, 'Robot movement must stop after touch release');
      await stage.press('Escape');
      await page.getByRole('heading', { name: 'PAUSED.', exact: true }).waitFor();
      report.observations.mobileTouch = { stageHeight: stageBox.height, movedOnFirstPress: true, stoppedAfterRelease: true };
      await session.detach();
    } finally { await context.close(); }
  });

  let edge;
  try { edge = await chromium.launch({ channel: 'msedge', headless: true }); }
  catch (error) { report.skipped.push({ check: 'Microsoft Edge smoke', reason: `Installed Edge channel unavailable: ${error.message.split('\n')[0]}` }); console.log('SKIP Microsoft Edge channel unavailable'); }
  if (edge) {
    await check('Installed Microsoft Edge renders the home and navigates a case study', async () => {
      const page = watchPage(await edge.newPage({ viewport: { width: 1366, height: 900 } }));
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.match(await page.locator('h1').innerText(), /I BUILD/);
      await page.getByRole('link', { name: 'Read Tridix project notes', exact: true }).click();
      await page.waitForURL('**/projects/tridix/');
      assert.match(await page.locator('h1').innerText(), /Tridix/);
      assert.deepEqual(errors, []);
    });
    await edge.close();
  }
} catch (error) { report.errors.push({ name: 'Browser setup', error: error.stack }); console.error(error); process.exitCode = 1; }
finally {
  if (browser) await browser.close();
  await writeFile('test-results/lifecycle.json', JSON.stringify(report, null, 2));
}
