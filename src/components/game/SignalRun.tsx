'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './SignalRun.module.scss';

type Phase = 'idle' | 'running' | 'paused' | 'won' | 'lost';
type Mode = 'arcade' | 'turns';
type Snapshot = { score: number; lives: number; cores: boolean[]; seconds: number; turn: number };
type World = Snapshot & { x: number; y: number; vy: number; invulnerable: number; camera: number };

const CORE_NAMES = ['AI', 'SOFTWARE', 'ROBOTICS'];
const CORE_X = [1150, 2700, 4400];
const BUGS = [620, 1780, 3300, 3960];
const FLOOR = 310;
const freshWorld = (): World => ({ x: 110, y: FLOOR, vy: 0, score: 0, lives: 3, cores: [false, false, false], seconds: 0, invulnerable: 0, camera: 0, turn: 0 });
const turnPositions = [620, 1150, 1780, 2700, 3960, 4400];
const snap = (world: World): Snapshot => ({ score: world.score, lives: world.lives, cores: [...world.cores], seconds: Math.floor(world.seconds), turn: world.turn });

/** A self-contained, opt-in game. Canvas owns pixels; React owns controls and accessible state. */
export default function SignalRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World>(freshWorld());
  const viewWidthRef = useRef(960);
  const keysRef = useRef({ left: false, right: false, jump: false });
  const drawRef = useRef<() => void>(() => {});
  const audioRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(true);
  const phaseRef = useRef<Phase>('idle');
  const modeRef = useRef<Mode>('arcade');
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<Mode>('arcade');
  const [hud, setHud] = useState<Snapshot>(() => snap(freshWorld()));
  const [muted, setMuted] = useState(true);
  const [best, setBest] = useState(0);
  const [message, setMessage] = useState('Ready when you are. Collect three ideas.');

  const transition = useCallback((next: Phase) => {
    phaseRef.current = next;
    keysRef.current = { left: false, right: false, jump: false };
    setPhase(next);
  }, []);

  const beep = useCallback((frequency: number) => {
    if (mutedRef.current) return;
    const context = audioRef.current;
    if (!context || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + .1);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + .11);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }, []);

  const finish = useCallback((won: boolean) => {
    const world = worldRef.current;
    const score = world.score + (won ? world.lives * 50 : 0);
    world.score = score;
    setHud(snap(world));
    transition(won ? 'won' : 'lost');
    setMessage(won ? 'Mission complete. Achievement unlocked: Curious Mind. Three ideas collected.' : 'Signal lost. You can restart or continue to the skill set.');
    if (won) beep(880);
    setBest(previous => {
      const value = Math.max(previous, score);
      try { sessionStorage.setItem('piyush-signal-run-best', String(value)); } catch { /* Storage is optional. */ }
      return value;
    });
  }, [beep, transition]);

  const collect = useCallback((index: number) => {
    const world = worldRef.current;
    if (world.cores[index]) return;
    world.cores[index] = true;
    world.score += 100;
    beep(440 + index * 110);
    setMessage(`${CORE_NAMES[index]} core collected. ${world.cores.filter(Boolean).length} of three ideas found.`);
    setHud(snap(world));
    if (world.cores.every(Boolean)) finish(true);
  }, [beep, finish]);

  useEffect(() => {
    return () => { void audioRef.current?.close(); };
  }, []);

  // Resize only changes the backing store; logical physics are stable across devices.
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    let viewWidth = 960;
    let scale = 1;
    const draw = () => {
      const world = worldRef.current;
      const w = viewWidth;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.fillStyle = '#101216'; context.fillRect(0, 0, w, 400);
      context.strokeStyle = '#23262d'; context.lineWidth = 1;
      for (let x = -(world.camera * .18 % 60); x < w; x += 60) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, FLOOR); context.stroke();
      }
      for (let y = 10; y < FLOOR; y += 60) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke();
      }
      // A quiet circuit skyline provides scale without an ambient animation loop.
      context.fillStyle = '#1c2028';
      for (let i = -1; i < 10; i++) {
        const x = i * 170 - world.camera * .12 % 170;
        context.fillRect(x, 190 - (i % 3) * 28, 90, 120 + (i % 3) * 28);
        context.fillStyle = '#4568ff'; context.fillRect(x + 12, 215 - (i % 3) * 28, 4, 4); context.fillStyle = '#1c2028';
      }
      context.save(); context.translate(-world.camera, 0);
      context.fillStyle = '#292d35'; context.fillRect(world.camera, FLOOR, w, 90);
      context.fillStyle = '#f3f0e8'; context.fillRect(world.camera, FLOOR, w, 2);
      context.fillStyle = '#171a20';
      for (let x = Math.floor(world.camera / 48) * 48; x < world.camera + w; x += 48) {
        context.fillRect(x, FLOOR + 14, 34, 6); context.fillRect(x + 16, FLOOR + 40, 30, 4);
      }
      CORE_X.forEach((x, i) => {
        if (world.cores[i]) return;
        context.strokeStyle = '#f5d547'; context.strokeRect(x - 18, 250, 36, 36);
        context.fillStyle = '#f5d547'; context.fillRect(x - 8, 260, 16, 16);
        context.fillStyle = '#0b0c0f'; context.fillRect(x - 2, 264, 4, 8);
        context.font = '10px monospace'; context.textAlign = 'center'; context.fillStyle = '#f3f0e8';
        context.fillText(CORE_NAMES[i], x, 235);
        context.fillStyle = '#4568ff'; context.fillRect(x - 1, 294, 2, 10);
      });
      BUGS.forEach(x => {
        context.fillStyle = '#ed3345'; context.fillRect(x - 13, FLOOR - 20, 26, 18);
        context.fillRect(x - 19, FLOOR - 25, 5, 5); context.fillRect(x + 14, FLOOR - 25, 5, 5);
        context.fillRect(x - 19, FLOOR - 8, 5, 8); context.fillRect(x + 14, FLOOR - 8, 5, 8);
        context.fillStyle = '#0b0c0f'; context.fillRect(x - 8, FLOOR - 16, 5, 5); context.fillRect(x + 3, FLOOR - 16, 5, 5);
      });
      // Original 24 × 36 robot, rendered with rectangles rather than licensed sprites.
      const px = Math.round(world.x), py = Math.round(world.y);
      context.fillStyle = world.invulnerable > 0 ? '#a9b6ff' : '#f3f0e8';
      context.fillRect(px - 10, py - 36, 20, 16); context.fillRect(px - 8, py - 18, 16, 13);
      context.fillRect(px - 15, py - 17, 5, 12); context.fillRect(px + 10, py - 17, 5, 12);
      context.fillRect(px - 8, py - 4, 5, 4); context.fillRect(px + 3, py - 4, 5, 4);
      context.fillRect(px - 2, py - 42, 4, 6);
      context.fillStyle = '#ed3345'; context.fillRect(px - 3, py - 45, 6, 4);
      context.fillStyle = '#0b0c0f'; context.fillRect(px - 7, py - 31, 14, 7);
      context.fillStyle = '#4568ff'; context.fillRect(px - 5, py - 29, 3, 3); context.fillRect(px + 2, py - 29, 3, 3);
      context.fillStyle = '#ed3345'; context.fillRect(px - 3, py - 15, 6, 5);
      context.restore();
      context.font = '10px monospace'; context.textAlign = 'left'; context.fillStyle = '#a5a7ae';
      context.fillText('SECTOR 04 / THE BUILDER\'S MIND', 24, 28);
      context.fillStyle = '#4568ff'; context.fillText(`X:${String(Math.floor(world.x)).padStart(4, '0')}`, 24, 46);
      context.fillStyle = '#64666e'; context.fillRect(24, 370, w - 48, 2);
      context.fillStyle = '#ed3345'; context.fillRect(24, 370, (w - 48) * Math.min(world.x / 4400, 1), 2);
      context.fillStyle = '#a5a7ae'; context.textAlign = 'right'; context.fillText('COLLECT IDEAS. KEEP BUILDING.', w - 24, 350);
    };
    drawRef.current = draw;
    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
      viewWidth = 400 * rect.width / Math.max(rect.height, 1);
      viewWidthRef.current = viewWidth;
      scale = canvas.height / 400;
      draw();
    };
    const observer = new ResizeObserver(resize); observer.observe(stage); resize();
    return () => { observer.disconnect(); drawRef.current = () => {}; };
  }, []);

  useEffect(() => {
    if (phase !== 'running' || mode !== 'arcade') { drawRef.current(); return; }
    let frame = 0;
    let previous = 0;
    let lastSecond = -1;
    const update = (now: number) => {
      if (phaseRef.current !== 'running') return;
      const dt = previous ? Math.min((now - previous) / 1000, .035) : 0;
      previous = now;
      const world = worldRef.current;
      const keys = keysRef.current;
      world.seconds += dt;
      world.invulnerable = Math.max(0, world.invulnerable - dt);
      world.x = Math.max(30, Math.min(4650, world.x + (Number(keys.right) - Number(keys.left)) * 140 * dt));
      if (keys.jump && world.y >= FLOOR) { world.vy = -475; keys.jump = false; beep(200); }
      world.vy += 1300 * dt;
      world.y = Math.min(FLOOR, world.y + world.vy * dt);
      if (world.y === FLOOR) world.vy = 0;
      const viewWidth = viewWidthRef.current;
      world.camera = Math.max(0, Math.min(4750 - viewWidth, world.x - viewWidth * .28));
      for (let i = 0; i < CORE_X.length; i++) {
        if (!world.cores[i] && Math.abs(world.x - CORE_X[i]) < 35 && world.y > 225) collect(i);
      }
      if (world.invulnerable === 0 && BUGS.some(x => Math.abs(world.x - x) < 23 && world.y > FLOOR - 22)) {
        world.lives--; world.invulnerable = 2; beep(90); setHud(snap(world));
        setMessage(`Bug encountered. ${world.lives} shields remaining. Jump over red bugs.`);
        if (world.lives <= 0) finish(false);
      }
      if (Math.floor(world.seconds) !== lastSecond) { lastSecond = Math.floor(world.seconds); setHud(snap(world)); }
      drawRef.current();
      if (phaseRef.current === 'running') frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [phase, mode, beep, collect, finish]);

  useEffect(() => {
    const pause = () => {
      if (phaseRef.current === 'running') { transition('paused'); setMessage('Paused. Your progress is saved for this round.'); }
    };
    const visibility = () => { if (document.hidden) pause(); };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); }, { threshold: 0 });
    if (rootRef.current) observer.observe(rootRef.current);
    window.addEventListener('blur', pause); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', visibility); };
  }, [transition]);

  const start = (reset = true) => {
    try { setBest(Number(sessionStorage.getItem('piyush-signal-run-best')) || 0); } catch { /* Storage is optional. */ }
    if (reset) { worldRef.current = freshWorld(); setHud(snap(worldRef.current)); }
    transition('running');
    setMessage(mode === 'turns' ? 'Turn-based mode. A red bug is ahead. Choose jump forward.' : 'Game started. Hold right to move. Jump over red bugs. Collect three yellow cores.');
    stageRef.current?.focus({ preventScroll: true });
    drawRef.current();
  };

  const toggleAudio = async () => {
    const next = !muted;
    mutedRef.current = next; setMuted(next);
    if (!next) {
      try { audioRef.current ??= new AudioContext(); await audioRef.current.resume(); beep(440); } catch { mutedRef.current = true; setMuted(true); }
    }
  };

  const turn = (jump: boolean) => {
    if (phaseRef.current !== 'running') return;
    const world = worldRef.current;
    const index = world.turn;
    world.x = turnPositions[index]; world.camera = Math.max(0, world.x - 170);
    if (index % 2 === 0) {
      if (jump) { world.score += 25; setMessage('Bug cleared. A yellow core is ahead. Move forward to collect it.'); beep(220); }
      else { world.lives--; setMessage(`${world.lives} shields remaining. A yellow core is ahead.`); beep(90); }
    } else {
      collect(Math.floor(index / 2));
      if (index < 5) setMessage(`${CORE_NAMES[Math.floor(index / 2)]} collected. A red bug is next. Jump forward to clear it.`);
    }
    world.turn++; world.seconds++;
    if (world.lives <= 0) finish(false);
    setHud(snap(world)); drawRef.current();
  };

  return (
    <div className={styles.game} ref={rootRef} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null) && phaseRef.current === 'running') {
        transition('paused'); setMessage('Paused after leaving the game.');
      }
    }}>
      <div className={styles.topbar}>
        <span className={styles.eyebrow}><span className={styles.led} />SIGNAL RUN / PLAYER_01</span>
        <div className={styles.stats} aria-label="Game statistics">
          <span>SCORE <strong className={styles.score}>{String(hud.score).padStart(4, '0')}</strong></span>
          <span>SHIELDS <strong>{hud.lives}/3</strong></span>
          <span>BEST <strong>{String(best).padStart(4, '0')}</strong></span>
        </div>
      </div>
      <div ref={stageRef} className={styles.stage} tabIndex={0} role={mode === 'arcade' ? 'application' : 'group'} aria-label="Signal Run play area" aria-describedby="signal-instructions" data-lenis-prevent={phase === 'running' ? true : undefined}
        onBlur={() => { keysRef.current = { left: false, right: false, jump: false }; }}
        onKeyDown={event => {
          if (phaseRef.current !== 'running' || modeRef.current !== 'arcade') return;
          const key = event.key.toLowerCase();
          if (['arrowleft', 'arrowright', 'arrowup', 'a', 'd', 'w', ' '].includes(key)) event.preventDefault();
          if (key === 'arrowleft' || key === 'a') keysRef.current.left = true;
          if (key === 'arrowright' || key === 'd') keysRef.current.right = true;
          if (['arrowup', 'w', ' '].includes(key) && !event.repeat) keysRef.current.jump = true;
          if (key === 'escape' || key === 'p') { event.preventDefault(); transition('paused'); setMessage('Game paused.'); }
        }}
        onKeyUp={event => {
          const key = event.key.toLowerCase();
          if (key === 'arrowleft' || key === 'a') keysRef.current.left = false;
          if (key === 'arrowright' || key === 'd') keysRef.current.right = false;
          if (['arrowup', 'w', ' '].includes(key)) keysRef.current.jump = false;
        }}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        {phase !== 'running' && <div className={styles.overlay}><div>
          <span className={styles.eyebrow}>{phase === 'won' ? 'ACHIEVEMENT UNLOCKED: CURIOUS MIND' : phase === 'lost' ? 'A BUG IS JUST ANOTHER LESSON' : phase === 'paused' ? 'TAKE YOUR TIME' : 'AN ORIGINAL PLAYABLE INTERMISSION'}</span>
          <h3>{phase === 'won' ? <>MISSION<br />COMPLETE.</> : phase === 'lost' ? <>SIGNAL<br />LOST.</> : phase === 'paused' ? 'PAUSED.' : <>IDEAS DON’T<br />COLLECT THEMSELVES.</>}</h3>
          <p>{phase === 'won' ? 'Three cores. One curious mind. Keep exploring the skills behind the experience.' : phase === 'lost' ? 'Debug, retry, repeat. Every builder knows the process.' : phase === 'paused' ? 'Your ideas are right where you left them.' : 'A tiny robot. Three energy cores. A few bugs along the way. Sound familiar?'}</p>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={() => start(phase !== 'paused')}>{phase === 'paused' ? 'RESUME →' : phase === 'won' || phase === 'lost' ? 'PLAY AGAIN ↻' : 'PRESS START →'}</button>
            {(phase === 'won' || phase === 'lost') && <a href="#skills">TO THE SKILLS ↗</a>}
          </div>
        </div></div>}
      </div>
      <div className={styles.bottom}>
        <div className={styles.cores} aria-label={`${hud.cores.filter(Boolean).length} of 3 energy cores collected`}>
          {CORE_NAMES.map((name, index) => <span key={name} className={`${styles.core} ${hud.cores[index] ? styles.collected : ''}`}>{name}<span className={styles.srOnly}>{hud.cores[index] ? ' collected' : ' not yet collected'}</span></span>)}
        </div>
        <div className={styles.toolbar}>
          <button onClick={() => { if (phase === 'running') { transition('paused'); setMessage('Game paused.'); } else if (phase === 'paused') start(false); }} disabled={phase !== 'running' && phase !== 'paused'}>{phase === 'paused' ? 'RESUME' : 'PAUSE'}</button>
          <button onClick={() => start()}>RESTART</button>
          <button onClick={() => { void toggleAudio(); }} aria-pressed={!muted} aria-label={muted ? 'Enable game sounds' : 'Mute game sounds'}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button>
          <a href="#skills" onClick={() => { if (phase === 'running') transition('paused'); }}>SKIP ↗</a>
        </div>
      </div>
      <div className={styles.playControls}>
        {mode === 'arcade' ? <div className={styles.touch} aria-label="Touch movement controls">
          {(['left', 'right'] as const).map(direction => <button key={direction} aria-label={`Move ${direction}`} disabled={phase !== 'running'} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); keysRef.current[direction] = true; }} onPointerUp={() => { keysRef.current[direction] = false; }} onPointerCancel={() => { keysRef.current[direction] = false; }} onLostPointerCapture={() => { keysRef.current[direction] = false; }} onClick={event => { if (event.detail === 0) { worldRef.current.x = Math.max(30, Math.min(4650, worldRef.current.x + (direction === 'left' ? -35 : 35))); drawRef.current(); } }}>{direction === 'left' ? '←' : '→'}</button>)}
          <button disabled={phase !== 'running'} onPointerDown={event => { event.preventDefault(); keysRef.current.jump = true; }} onPointerUp={() => { keysRef.current.jump = false; }} onPointerCancel={() => { keysRef.current.jump = false; }} onClick={event => { if (event.detail === 0) keysRef.current.jump = true; }}>JUMP ↑</button>
        </div> : <div>
          <p className={styles.turnHint}>{phase === 'running' ? hud.turn % 2 === 0 ? 'Next: a red bug. Jump forward to clear it.' : 'Next: a yellow energy core. Move forward to collect it.' : 'Turn-based mode gives you unlimited time for every move.'}</p>
          <div className={styles.actions} style={{ marginTop: 0 }}><button disabled={phase !== 'running'} onClick={() => turn(false)}>MOVE FORWARD →</button><button disabled={phase !== 'running'} onClick={() => turn(true)}>JUMP FORWARD ↑</button></div>
        </div>}
      </div>
      <div className={styles.instructions} id="signal-instructions">
        <span>← → / A D move · SPACE / ↑ jump · ESC pause<br />Play only when focused. Tab leaves the game. Best score is for this browser session.</span>
        <label className={styles.mode}>PLAY STYLE <select value={mode} onChange={event => { const next = event.target.value as Mode; modeRef.current = next; setMode(next); worldRef.current = freshWorld(); setHud(snap(worldRef.current)); transition('idle'); setMessage(next === 'turns' ? 'Turn-based mode selected. No timer or reflexes required.' : 'Arcade mode selected. Press start when ready.'); drawRef.current(); }}><option value="arcade">Arcade</option><option value="turns">Turn-based / accessible</option></select></label>
      </div>
      <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{message}</p>
    </div>
  );
}
