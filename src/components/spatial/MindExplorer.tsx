"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./MindScene.module.scss";

const MindScene = dynamic(() => import("./MindScene"), { ssr: false, loading: () => <OrbitalFallback /> });

const worlds = [
  { number: "01", title: "Intelligence", subtitle: "Making complexity conversational.", body: "I'm curious about AI, Generative AI, and the ways conversational systems can make information more approachable. LegalOne explores that question through Indian legal information and Botpress AI.", stack: "AI / ML · Generative AI · Botpress", project: "LegalOne", href: "/projects/legalone/" },
  { number: "02", title: "Software", subtitle: "An idea, made interactive.", body: "From a 3D physics-learning experience with Tridix to a Python and MySQL bus-route prototype, I learn by connecting interfaces, data, and the people who use them.", stack: "JavaScript · Python · MySQL · Three.js · Blender", project: "Tridix", href: "/projects/tridix/" },
  { number: "03", title: "Physical systems", subtitle: "Beyond the edge of the screen.", body: "Raspberry Pi, ESP32, cameras, and sensors open another kind of possibility. I'm exploring autonomous robot architecture and experimenting with a smart calendar, one system at a time.", stack: "Raspberry Pi · ESP32 · Sensors · Robotics", project: "Smart Calendar", href: "/projects/smart-calendar/" },
] as const;

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function OrbitalFallback() {
  return <div className={styles.fallback} aria-hidden="true"><div className={styles.sphere} /><i /><i /><i /><span className={styles.core}>+</span></div>;
}

export default function MindExplorer() {
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const webglAvailable = useRef<boolean | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const handleReady = useCallback(() => setReady(true), []);
  const handleFailure = useCallback(() => { setFailed(true); setReady(false); }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (!entry.isIntersecting) setReady(false);
    }, { rootMargin: "100px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Even the lightweight capability probe waits until the chapter approaches the viewport.
    if (!visible) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const update = () => {
      if (preference.matches || nav.connection?.saveData || (nav.deviceMemory && nav.deviceMemory <= 2) || navigator.hardwareConcurrency <= 2) {
        setCanRender(false);
        setReady(false);
        return;
      }
      if (webglAvailable.current !== null) {
        setCanRender(webglAvailable.current);
        return;
      }
      const canvas = document.createElement("canvas");
      try {
        const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
        webglAvailable.current = Boolean(context);
        setCanRender(webglAvailable.current);
        context?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch { webglAvailable.current = false; setCanRender(false); }
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, [visible]);

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % worlds.length;
    else if (event.key === "ArrowLeft") next = (index + worlds.length - 1) % worlds.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = worlds.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  const showScene = visible && canRender && !failed;
  return (
    <div ref={root} className={styles.explorer}>
      <div className={styles.visual} data-mind-visual>
        <div className={styles.crosshair} />
        <span className={styles.coordinate}>FIG. 02 / A CONNECTED MIND</span>
        {(!showScene || !ready) && <OrbitalFallback />}
        {showScene && <div className={`${styles.sceneLayer} ${ready ? styles.sceneReady : ""}`}><SceneBoundary onFailure={handleFailure}><MindScene selected={selected} active={visible} onReady={handleReady} onFailure={handleFailure} /></SceneBoundary></div>}
        <span className={`${styles.node} ${styles.nodeOne}`}>X / INTELLIGENCE</span>
        <span className={`${styles.node} ${styles.nodeTwo}`}>Y / SOFTWARE</span>
        <span className={`${styles.node} ${styles.nodeThree}`}>Z / PHYSICAL SYSTEMS</span>
        <span className={styles.diagramNote}>THREE WORLDS. ONE CURIOSITY.</span>
      </div>
      <div className={styles.content} data-mind-content>
        <div role="tablist" aria-label="Explore areas of interest" className={styles.tabs}>
          {worlds.map((item, index) => <button ref={(element) => { tabs.current[index] = element; }} id={`mind-tab-${index}`} key={item.number} type="button" role="tab" aria-selected={selected === index} aria-controls={`mind-panel-${index}`} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={(event) => handleTabKey(event, index)}><span>{item.number}</span>{item.title}<span aria-hidden="true">↗</span></button>)}
        </div>
        {worlds.map((world, index) => <div key={world.number} role="tabpanel" id={`mind-panel-${index}`} aria-labelledby={`mind-tab-${index}`} hidden={selected !== index} tabIndex={0} className={styles.panel}>
          <h3>{world.subtitle}</h3><p>{world.body}</p><div className={styles.stack}>{world.stack}</div><a href={world.href}>Explore {world.project}<span aria-hidden="true">↗</span></a>
        </div>)}
        <noscript><p>Interests include AI and conversational systems; software, 3D web, Python and MySQL; and Raspberry Pi, ESP32, sensors, and robotics exploration.</p></noscript>
      </div>
    </div>
  );
}
