'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { readTheme, subscribeTheme } from '@/lib/theme';
import { postRankedScore, startRankedRun, validUsername, type RankedRun } from './leaderboard';
import { createRunner, MAX_RUN_TICKS, RUNNER_UNIT, stepRunner, TICKS_PER_SECOND, type RunnerState } from './runner';
import { drawRunner } from './runner-renderer';
import RunnerLeaderboard, { useRunnerLeaderboard } from './RunnerLeaderboard';
import styles from './SignalRun.module.scss';

type Phase = 'idle' | 'starting' | 'running' | 'paused' | 'over';
type Mode = 'arcade' | 'steps';
const RECORD_KEY = 'piyush-signal-run-endless-best';
const STEP_MS = 1000 / TICKS_PER_SECOND;

function snapshot(state: RunnerState) {
  return {
    score: state.score, distance: Math.floor(state.distance / (RUNNER_UNIT * 10)),
    time: Math.floor(state.tick / TICKS_PER_SECOND), clears: state.clears,
    death: state.death, tick: state.tick,
  };
}

function personalBest() {
  try {
    const score = Number(localStorage.getItem(RECORD_KEY));
    return Number.isSafeInteger(score) && score >= 0 ? score : 0;
  } catch { return 0; }
}

function practiceHint(state: RunnerState) {
  const next = state.obstacles[0];
  const distance = Math.max(0, Math.ceil((next.start - state.distance) / RUNNER_UNIT));
  const obstacle = next.kind === 'pit' ? 'Platform gap' : 'Error Bot';
  return distance <= 60 ? `${obstacle} ahead. Jump forward.` : `${obstacle} ${distance} units ahead. Advance to approach it.`;
}

export default function SignalRun() {
  const [initialRunner] = useState(() => createRunner(1));
  const runner = useRef(initialRunner);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const usernameInput = useRef<HTMLInputElement>(null);
  const postButton = useRef<HTMLButtonElement>(null);
  const draw = useRef(() => {});
  const audio = useRef<AudioContext | null>(null);
  const mutedRef = useRef(true);
  const jumpQueued = useRef(false);
  const phaseRef = useRef<Phase>('idle');
  const modeRef = useRef<Mode>('arcade');
  const launch = useRef(0);
  const run = useRef<RankedRun | null>(null);
  const jumps = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<Mode>('arcade');
  const [hud, setHud] = useState(() => snapshot(initialRunner));
  const [best, setBest] = useState(personalBest);
  const bestInSession = useRef(best);
  const [muted, setMuted] = useState(true);
  const [ranked, setRanked] = useState(false);
  const [record, setRecord] = useState(false);
  const [message, setMessage] = useState('Ready when you are.');
  const [username, setUsername] = useState('');
  const [postStatus, setPostStatus] = useState<'idle' | 'posting' | 'posted'>('idle');
  const [postError, setPostError] = useState('');
  const leaderboard = useRunnerLeaderboard();
  const eligible = ranked && hud.tick <= MAX_RUN_TICKS;

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    jumpQueued.current = false;
    setPhase(next);
  }, []);

  const beep = useCallback((frequency: number, offset = 0) => {
    const context = audio.current;
    if (mutedRef.current || !context || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + offset;
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.028, start);
    gain.gain.exponentialRampToValueAtTime(.001, start + .10);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + .11);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }, []);

  const finish = useCallback(() => {
    const state = runner.current;
    const previousBest = Math.max(bestInSession.current, personalBest());
    const newRecord = modeRef.current === 'arcade' && state.score > previousBest;
    setHud(snapshot(state));
    setRecord(newRecord);
    if (newRecord) {
      bestInSession.current = state.score;
      setBest(state.score);
      try { localStorage.setItem(RECORD_KEY, String(state.score)); } catch { /* Optional storage. */ }
      [392, 523, 659, 784].forEach((note, index) => beep(note, index * .095));
    } else beep(98);
    changePhase('over');
    setMessage(`${state.death === 'pit' ? 'Life is unfair.' : 'Game over.'} Final score ${state.score}.${newRecord ? ' New personal best.' : ''}`);
  }, [beep, changePhase]);

  const advance = useCallback((jump: boolean) => {
    const state = runner.current;
    const before = state.clears;
    if (stepRunner(state, jump)) {
      if (run.current && state.tick <= MAX_RUN_TICKS) jumps.current.push(state.tick);
      beep(240);
    }
    if (state.death) finish();
    else if (state.clears !== before) {
      beep(565);
      setHud(snapshot(state));
    } else if (state.tick % 6 === 0) setHud(snapshot(state));
  }, [beep, finish]);

  useEffect(() => {
    const target = canvas.current;
    const viewport = stage.current;
    const context = target?.getContext('2d', { alpha: false });
    if (!target || !viewport || !context) return;
    let width = 960;
    let scale = 1;
    let cyber = readTheme() === 'cyber';
    draw.current = () => drawRunner(context, runner.current, width, scale, cyber);
    const resize = () => {
      const rect = viewport.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      target.width = Math.max(1, Math.round(rect.width * dpr));
      target.height = Math.max(1, Math.round(rect.height * dpr));
      scale = target.height / 400;
      width = target.width / scale;
      draw.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    resize();
    const unsubscribe = subscribeTheme(() => { cyber = readTheme() === 'cyber'; draw.current(); });
    return () => { observer.disconnect(); unsubscribe(); draw.current = () => {}; };
  }, []);

  useEffect(() => {
    if (phase !== 'running' || mode !== 'arcade') { draw.current(); return; }
    let frame = 0;
    let previous = 0;
    let accrued = 0;
    const update = (now: number) => {
      if (phaseRef.current !== 'running') return;
      if (previous) accrued += Math.min(now - previous, 100);
      previous = now;
      while (accrued >= STEP_MS && phaseRef.current === 'running') {
        const jump = jumpQueued.current;
        jumpQueued.current = false;
        advance(jump);
        accrued -= STEP_MS;
      }
      draw.current();
      if (phaseRef.current === 'running') frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [advance, mode, phase]);

  const pause = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    changePhase('paused');
    setMessage('Paused. Your run is right where you left it.');
  }, [changePhase]);

  useEffect(() => {
    const visibility = () => { if (document.hidden) pause(); };
    const cancelLaunch = () => { launch.current++; };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); });
    if (stage.current) observer.observe(stage.current);
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelLaunch();
      observer.disconnect();
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
      void audio.current?.close();
      audio.current = null;
    };
  }, [pause]);

  async function start() {
    const current = ++launch.current;
    const currentMode = modeRef.current;
    changePhase('starting');
    setMessage('Preparing a new run.');
    setRecord(false);
    setPostStatus('idle');
    setPostError('');
    const session = currentMode === 'arcade' ? await startRankedRun().catch(() => null) : null;
    if (current !== launch.current) return;
    const seed = session?.seed ?? crypto.getRandomValues(new Uint32Array(1))[0];
    runner.current = createRunner(seed);
    run.current = session;
    jumps.current = [];
    setRanked(Boolean(session));
    setHud(snapshot(runner.current));
    if (document.hidden || (document.activeElement !== document.body && !root.current?.contains(document.activeElement))) {
      changePhase('paused');
      setMessage('Run ready. Resume when you want to play.');
    } else {
      changePhase('running');
      setMessage(currentMode === 'arcade' ? 'Run started. Jump over Error Bots and gaps.' : practiceHint(runner.current));
      stage.current?.focus({ preventScroll: true });
    }
    draw.current();
  }

  function resume() {
    changePhase('running');
    setMessage(modeRef.current === 'steps' ? practiceHint(runner.current) : 'Run resumed.');
    stage.current?.focus({ preventScroll: true });
  }

  function changeMode(next: Mode) {
    launch.current++;
    modeRef.current = next;
    setMode(next);
    runner.current = createRunner(1);
    run.current = null;
    jumps.current = [];
    setRanked(false);
    setHud(snapshot(runner.current));
    setMessage(next === 'steps' ? 'Step practice selected. The robot waits for each command.' : 'Arcade selected. Press Start when ready.');
    changePhase('idle');
    draw.current();
  }

  function practice(jump: boolean) {
    if (phaseRef.current !== 'running') return;
    const state = runner.current;
    advance(jump);
    for (let count = 1; count < (jump ? 64 : 12) && !state.death; count++) {
      if (jump && state.altitude === 0) break;
      if (!jump && state.obstacles[0].start - state.distance < 58 * RUNNER_UNIT) break;
      advance(false);
    }
    if (!state.death) setMessage(practiceHint(state));
    setHud(snapshot(state));
    draw.current();
  }

  async function toggleAudio() {
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    if (next) return;
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      beep(440);
    } catch {
      mutedRef.current = true;
      setMuted(true);
    }
  }

  function openPost() {
    if (!dialog.current || dialog.current.open) return;
    setPostError('');
    dialog.current.showModal();
    usernameInput.current?.focus({ preventScroll: true });
  }

  async function submitScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!run.current || !eligible || postStatus !== 'idle') return;
    const name = username.trim();
    if (!validUsername(name)) {
      setPostError('Use 3–20 characters, including a letter or number. Spaces, underscores, and hyphens are allowed.');
      usernameInput.current?.focus();
      return;
    }
    setPostError('');
    setPostStatus('posting');
    try {
      const result = await postRankedScore(name, run.current.token, jumps.current, hud.tick);
      leaderboard.update(result.entries);
      setPostStatus('posted');
      setMessage(`Your score of ${result.score} is on the leaderboard.`);
    } catch (error) {
      setPostStatus('idle');
      setPostError(error instanceof Error ? error.message : 'The score could not be posted.');
    }
  }

  return (
    <div className={styles.experience}>
      <div ref={root} className={styles.game} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) pause();
      }}>
        <div className={styles.topbar}>
          <span className={styles.eyebrow}><i className={styles.led} /> SIGNAL RUN / PLAYER_01</span>
          <div className={styles.stats} aria-label="Run statistics">
            <span>SCORE <strong className={styles.score} data-runner-score>{String(hud.score).padStart(4, '0')}</strong></span>
            <span>DISTANCE <strong>{hud.distance}m</strong></span>
            <span>TIME <strong>{hud.time}s</strong></span>
          </div>
        </div>
        <div
          ref={stage} className={styles.stage} tabIndex={0} role={mode === 'arcade' ? 'application' : 'group'}
          aria-label="Signal Run play area" aria-describedby="signal-instructions"
          data-runner-phase={phase} data-lenis-prevent={phase === 'running' ? true : undefined}
          onPointerDown={event => {
            if (phaseRef.current !== 'running' || modeRef.current !== 'arcade' || event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
            jumpQueued.current = true;
          }}
          onKeyDown={event => {
            if (phaseRef.current !== 'running') return;
            const key = event.key.toLowerCase();
            if (key === 'escape' || key === 'p') { event.preventDefault(); pause(); }
            if (modeRef.current === 'arcade' && ['arrowup', 'w', ' '].includes(key)) {
              event.preventDefault();
              if (!event.repeat) jumpQueued.current = true;
            }
          }}
        >
          <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
          {phase !== 'running' && <div className={styles.overlay}><div>
            <p className={styles.eyebrow} data-record={record || undefined}>{record ? 'NEW PERSONAL BEST' : phase === 'over' ? 'TRANSMISSION ENDED' : 'ENDLESS ARCADE / READY'}</p>
            <h2>{phase === 'over' ? hud.death === 'pit' ? 'LIFE IS UNFAIR.' : 'GAME OVER.' :
              phase === 'paused' ? 'PAUSED.' : phase === 'starting' ? 'GET READY.' : 'KEEP RUNNING.'}</h2>
            {phase === 'over' ? <p className={styles.finalScore}>FINAL SCORE <strong>{hud.score.toLocaleString('en-IN')}</strong></p> :
              <p>{phase === 'paused' ? 'Your run is right where you left it.' : phase === 'starting' ? 'Preparing a fresh track.' :
                'The robot runs on its own. Jump over Error Bots and platform gaps as the pace picks up.'}</p>}
            <div className={styles.actions}>
              {phase === 'over' ? <>
                <button ref={postButton} type="button" className={styles.primary} onClick={openPost}>
                  {postStatus === 'posted' ? 'SCORE POSTED' : 'POST MY SCORE'}
                </button>
                <button type="button" onClick={() => { void start(); }}>PLAY AGAIN <span aria-hidden="true">↻</span></button>
                <Link href="/">EXIT GAME <span aria-hidden="true">↗</span></Link>
              </> : <button type="button" className={styles.primary} disabled={phase === 'starting'}
                onClick={() => { if (phase === 'paused') resume(); else void start(); }}>
                {phase === 'paused' ? 'RESUME →' : phase === 'starting' ? 'READYING RUN…' : 'PRESS START →'}
              </button>}
            </div>
          </div></div>}
        </div>
        <div className={styles.bottom}>
          <div className={styles.stats}>
            <span>CLEARED <strong>{hud.clears}</strong></span>
            <span>BEST <strong>{best.toLocaleString('en-IN')}</strong></span>
          </div>
          <div className={styles.toolbar}>
            <button type="button" onClick={() => { if (phase === 'paused') resume(); else pause(); }}
              disabled={phase !== 'running' && phase !== 'paused'}>{phase === 'paused' ? 'RESUME' : 'PAUSE'}</button>
            <button type="button" onClick={() => { void toggleAudio(); }} aria-pressed={!muted}
              aria-label={muted ? 'Enable game sounds' : 'Mute game sounds'}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button>
          </div>
        </div>
        <div className={styles.playControls}>
          {mode === 'arcade' ?
            <button type="button" className={styles.jump} disabled={phase !== 'running'}
              onPointerDown={event => { if (event.button === 0) jumpQueued.current = true; }}
              onClick={event => { if (event.detail === 0) jumpQueued.current = true; }}>JUMP ↑</button> :
            <div>
              <p className={styles.turnHint}>{phase === 'running' ? message : 'The robot waits for each command. Practice runs are unranked.'}</p>
              <div className={styles.actions}>
                <button type="button" disabled={phase !== 'running'} onClick={() => practice(false)}>ADVANCE →</button>
                <button type="button" disabled={phase !== 'running'} onClick={() => practice(true)}>JUMP FORWARD ↑</button>
              </div>
            </div>}
        </div>
        <div className={styles.instructions} id="signal-instructions">
          <span>SPACE / ↑ / W or tap the field to jump · ESC / P pauses<br />
            {mode === 'steps' ? 'STEP PRACTICE / UNRANKED' : ranked ? 'RANKED RUN' : phase === 'idle' ? 'ARCADE / AUTO RUN' : 'OFFLINE RUN / PERSONAL BEST ONLY'}
          </span>
          <label className={styles.mode}>PLAY STYLE
            <select value={mode} onChange={event => changeMode(event.target.value as Mode)}>
              <option value="arcade">Endless arcade</option>
              <option value="steps">Step practice (unranked)</option>
            </select>
          </label>
        </div>
        <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{message}</p>
      </div>
      <RunnerLeaderboard {...leaderboard} />
      <dialog ref={dialog} className={styles.scoreDialog} data-score-dialog data-lenis-prevent
        aria-labelledby="score-dialog-title" onClose={() => postButton.current?.focus({ preventScroll: true })}>
        <form onSubmit={event => { void submitScore(event); }}>
          <p className={styles.eyebrow}>SIGNAL RUN / {hud.score.toLocaleString('en-IN')} POINTS</p>
          <h2 id="score-dialog-title">Want to put your name on the leaderboard?</h2>
          {postStatus === 'posted' ? <p role="status">Score posted. The leaderboard shows the ten highest runs.</p> :
            eligible ? <>
              <label htmlFor="runner-username">Username</label>
              <input ref={usernameInput} id="runner-username" value={username} onChange={event => setUsername(event.target.value)}
                autoComplete="nickname" minLength={3} maxLength={20} required aria-describedby="runner-name-rules"
                aria-invalid={postError ? true : undefined} />
              <p id="runner-name-rules">3–20 characters. Use letters, numbers, spaces, underscores, or hyphens.</p>
            </> : <p>{mode === 'steps' ? 'Step practice is unranked. Choose endless arcade to post a score.' :
              ranked ? 'This run exceeded the ranked replay limit. Your personal best is still saved.' :
                'This run started offline. Start a new run while the leaderboard is online to post a score.'}</p>}
          {postError && <p className={styles.postError} role="alert">{postError}</p>}
          <div className={styles.actions}>
            {eligible && postStatus !== 'posted' &&
              <button type="submit" className={styles.primary} disabled={postStatus === 'posting'}>
                {postStatus === 'posting' ? 'POSTING…' : 'POST SCORE'}
              </button>}
            <button type="button" onClick={() => dialog.current?.close()}>{postStatus === 'posted' ? 'DONE' : 'MAYBE LATER'}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
