"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { readTheme, subscribeTheme } from "@/lib/theme";
import styles from "./MindScene.module.scss";

type SceneProps = { selected: number; active: boolean; onFailure: () => void; onReady: () => void };

const vertexShader = /* glsl */ `
  attribute float aDomain;
  attribute float aSize;
  varying float vDomain;
  uniform float uPixelRatio;
  void main() {
    vDomain = aDomain;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * uPixelRatio * (5.0 / -viewPosition.z), 1.3, 5.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying float vDomain;
  uniform float uSelected;
  uniform float uCyber;
  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point);
    if (radius > 0.5) discard;
    float edge = 1.0 - smoothstep(0.34, 0.5, radius);
    float selected = 1.0 - step(0.15, abs(vDomain - uSelected));
    vec3 carbon = mix(vec3(0.043, 0.047, 0.059), vec3(0.55, 0.70, 0.91), uCyber);
    vec3 signal = mix(vec3(0.929, 0.200, 0.271), vec3(0.25, 0.53, 1.0), uCyber);
    vec3 scanner = mix(vec3(0.271, 0.408, 1.0), vec3(0.56, 0.83, 1.0), uCyber);
    vec3 accent = mix(signal, scanner, step(1.5, vDomain));
    gl_FragColor = vec4(mix(carbon, accent, selected * 0.86), edge * mix(0.24, 0.92, selected));
  }
`;

function Network({ selected, active, onFailure, onReady }: SceneProps) {
  const cyber = useSyncExternalStore(subscribeTheme, readTheme) === "cyber";
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const readySent = useRef(false);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const { invalidate, gl } = useThree();
  const uniforms = useMemo(() => ({
    uSelected: { value: 0 },
    uCyber: { value: 0 },
    uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) },
  }), [gl]);

  const attributes = useMemo(() => {
    // Deterministic Fibonacci distribution: no hydration randomness, textures, or model downloads.
    const count = 1050;
    const positions = new Float32Array(count * 3);
    const domains = new Float32Array(count);
    const sizes = new Float32Array(count);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i += 1) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const shell = 1.3 + Math.sin(i * 1.73) * 0.09;
      positions.set([Math.cos(theta) * r * shell, y * shell, Math.sin(theta) * r * shell], i * 3);
      domains[i] = i % 3;
      sizes[i] = i % 17 === 0 ? 3.8 : 1.8;
    }
    return { positions, domains, sizes };
  }, []);

  useEffect(() => {
    if (material.current) {
      material.current.uniforms.uSelected.value = selected;
      material.current.uniforms.uCyber.value = Number(cyber);
    }
    if (active) invalidate();
  }, [active, cyber, selected, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    let bounds = canvas.getBoundingClientRect();
    const measure = () => { bounds = canvas.getBoundingClientRect(); };
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    const move = (event: PointerEvent) => {
      if (!active) return;
      pointerTarget.current.x = -((event.clientY - bounds.top) / bounds.height * 2 - 1) * 0.17;
      pointerTarget.current.y = ((event.clientX - bounds.left) / bounds.width * 2 - 1) * 0.22;
      invalidate();
    };
    const leave = () => { pointerTarget.current = { x: 0, y: 0 }; if (active) invalidate(); };
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("pointerenter", measure);
    canvas.addEventListener("pointermove", move, { passive: true });
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointerenter", measure);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", lost);
    };
  }, [active, gl, invalidate, onFailure]);

  useFrame(() => {
    if (!group.current || !active) return;
    const distanceX = pointerTarget.current.x + 0.18 - group.current.rotation.x;
    const distanceY = pointerTarget.current.y + selected * 0.24 - group.current.rotation.y;
    group.current.rotation.x += distanceX * 0.085;
    group.current.rotation.y += distanceY * 0.085;
    // Demand rendering settles after interaction; there is no perpetual animation loop.
    if (Math.abs(distanceX) + Math.abs(distanceY) > 0.001) invalidate();
  });

  return (
    <group ref={group} rotation={[0.18, 0, -0.14]}>
      <points onAfterRender={() => {
        if (!readySent.current) {
          readySent.current = true;
          queueMicrotask(onReady);
        }
      }}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
          <bufferAttribute attach="attributes-aDomain" args={[attributes.domains, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[attributes.sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} />
      </points>
      {[0, 1, 2].map((index) => (
        <mesh key={index} rotation={[index * Math.PI / 3, index * 0.46, Math.PI / 4]}>
          <torusGeometry args={[1.55, 0.0025, 3, 100]} />
          <meshBasicMaterial color={index === selected ? (cyber ? "#4187ff" : "#ed3345") : (cyber ? "#8faee0" : "#33343a")} transparent opacity={index === selected ? 0.56 : 0.13} />
        </mesh>
      ))}
    </group>
  );
}

export default function MindScene({ selected, active, onFailure, onReady }: SceneProps) {
  return (
    <Canvas
      className={styles.canvas}
      aria-hidden="true"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.8], fov: 46 }}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power", stencil: false }}
      onCreated={({ gl }) => {
        gl.debug.checkShaderErrors = true;
        gl.debug.onShaderError = () => queueMicrotask(onFailure);
      }}
    >
      <Network selected={selected} active={active} onFailure={onFailure} onReady={onReady} />
    </Canvas>
  );
}
