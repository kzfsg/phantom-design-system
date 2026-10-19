// React Bits Pro: NeuralFloat (Starter, -css variant). Licensed via the project's React Bits Pro key.
"use client";

import "./NeuralFloat.css";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface NeuralFloatProps {
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Additional CSS classes */
  className?: string;
  /** Content rendered above the field */
  children?: React.ReactNode;
  /** Cool end of the strand gradient */
  colorCold?: string;
  /** Warm end of the strand gradient */
  colorHot?: string;
  /** Fill behind the field */
  backgroundColor?: string;
  /** Number of strand pairs woven through the field */
  strands?: number;
  /** How far the strand count breathes above and below its base */
  strandDrift?: number;
  /** Tightness of the bright center of each strand */
  strandWidth?: number;
  /** Spread of the halo around each strand */
  haloWidth?: number;
  /** Brightness of that halo */
  haloStrength?: number;
  /** Global time multiplier */
  speed?: number;
  /** Field magnification, where higher values pull the weave closer */
  zoom?: number;
  /** Rotation of the whole field in degrees */
  rotation?: number;
  /** How far turbulence bends each strand off its axis */
  turbulence?: number;
  /** Frequency of the turbulence that bends the strands */
  turbulenceScale?: number;
  /** Whole-field warp applied before the strands are drawn */
  warp?: number;
  /** Frequency of the light pulses running along each strand */
  pulseFrequency?: number;
  /** Travel speed of those pulses */
  pulseSpeed?: number;
  /** Frequency of the mask that breaks strands into segments */
  segmentFrequency?: number;
  /** Drift speed of that mask */
  segmentSpeed?: number;
  /** Brightness of the plasma core at the center */
  coreIntensity?: number;
  /** How quickly the core falls away from the center */
  coreFalloff?: number;
  /** Number of arms in the core swirl */
  swirlArms?: number;
  /** Rotation speed of the core swirl */
  swirlSpeed?: number;
  /** Lens-style color separation */
  chromaticAberration?: number;
  /** Posterization steps, where lower values band harder */
  posterize?: number;
  /** How much of the posterized image bleeds through */
  dither?: number;
  /** Block size of the posterize sampling grid */
  ditherScale?: number;
  /** Distance at which the field starts fading out */
  fadeStart?: number;
  /** Distance at which the field has fully faded */
  fadeEnd?: number;
  /** Output gamma, where lower values lift the shadows */
  gamma?: number;
  /** Overall brightness multiplier */
  brightness?: number;
  /** Master alpha from 0 to 1 */
  opacity?: number;
  /** Let the field drift toward the cursor */
  cursorInteraction?: boolean;
  /** How far the field drifts toward the cursor */
  cursorParallax?: number;
  /** Turbulence octaves, the main quality and cost dial */
  detail?: number;
  /** Drop resolution automatically to hold the frame rate */
  adaptiveQuality?: boolean;
  /** Frame rate the adaptive scaler aims for */
  targetFps?: number;
  /** Upper bound on device pixel ratio, clamped to the real screen density */
  dpr?: number;
  /** Freeze all motion */
  paused?: boolean;
}

const fieldVertex = `
varying vec2 vScreen;

void main() {
  vScreen = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fieldFragment = `
precision highp float;

varying vec2 vScreen;

uniform vec2 uViewport;
uniform float uClock;
uniform vec3 uCold;
uniform vec3 uHot;
uniform float uStrands;
uniform float uStrandDrift;
uniform float uStrandWidth;
uniform float uHaloWidth;
uniform float uHaloStrength;
uniform float uZoom;
uniform float uSpin;
uniform float uTurbulence;
uniform float uTurbulenceScale;
uniform float uWarp;
uniform float uPulse;
uniform float uPulseSpeed;
uniform float uSegment;
uniform float uSegmentSpeed;
uniform float uCore;
uniform float uCoreFalloff;
uniform float uArms;
uniform float uSwirl;
uniform float uChroma;
uniform float uPosterize;
uniform float uDither;
uniform float uDitherScale;
uniform float uFadeStart;
uniform float uFadeEnd;
uniform float uGamma;
uniform float uGain;
uniform float uOpacity;
uniform vec2 uDrift;
uniform int uOctaves;
uniform sampler2D uNoise;

const float TURN = 6.28318530718;
const float HALF_TURN = 3.14159265359;
const float LATTICE = 0.0078125;

float grain(vec2 p) {
  return texture2D(uNoise, p * LATTICE).r;
}

float turbulence(vec2 p) {
  float sum = 0.0;
  float span = 0.0;
  float gain = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= uOctaves) break;
    sum += gain * grain(p);
    span += gain;
    p += p;
    gain *= 0.5;
  }
  return sum / max(span, 0.0001);
}

vec3 tint(float t) {
  float blend = sin(t * HALF_TURN * 0.5) * 0.5 + 0.5;
  float shade = cos(t * TURN) * 0.5 + 0.5;
  return mix(uCold, uHot, blend) * (0.6 + 0.4 * shade);
}

vec2 turn(vec2 p, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

vec3 strand(vec2 p, float s, float c, float t, float split) {
  vec2 q = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

  if (abs(q.y) > 0.34 + uTurbulence * 0.5 + split) return vec3(0.0);

  float gate = smoothstep(
    0.1,
    0.6,
    sin(q.x * uSegment + t * uSegmentSpeed) * cos(t + q.y * 4.0)
  );
  if (gate <= 0.0) return vec3(0.0);

  q.y += (turbulence(q * uTurbulenceScale + t * 0.5) - 0.5) * uTurbulence;

  vec3 reach = abs(q.y + vec3(split * s, 0.0, -split * s));
  vec3 rim = max(1.0 - reach * 3.0, 0.0);
  vec3 spine = exp(-reach * uStrandWidth) * 1.2
    + exp(-reach * uHaloWidth) * uHaloStrength;

  float pulse = sin(q.x * uPulse + t * uPulseSpeed) * 0.5 + 0.5;

  return spine * rim * rim * pulse * gate;
}

vec3 weave(vec2 p, float t, float split) {
  vec3 sum = vec3(0.0);
  float count = max(uStrands + uStrandDrift * sin(t * 0.3), 1.0);

  for (int i = 0; i < 32; i++) {
    float index = float(i);
    if (index > count) break;

    float fade = clamp(count - index, 0.0, 1.0);
    float id = index / count;
    float angle = id * TURN + t * 0.12;
    float s = sin(angle);
    float c = cos(angle);

    vec3 lit = strand(p, s, c, t + index, split)
      + strand(p, c, -s, t * 1.2 + index, split);
    if (lit.r + lit.g + lit.b <= 0.0) continue;

    sum += tint(id + t * 0.05) * lit * (0.6 + 0.4 * sin(index * 3.0 + t)) * fade;
  }

  return sum;
}

void main() {
  vec2 frag = vScreen * uViewport;
  vec2 p = (frag - 0.5 * uViewport) / uViewport.y;
  p = turn(p, uSpin) / max(uZoom, 0.01);

  float t = uClock * 0.6;

  p += turbulence(p * 2.0 + t) * uWarp;
  p -= uDrift;

  float split = uChroma * (1.0 + 0.66 * sin(t * 0.4));
  vec3 col = weave(p, t, split);

  float reach = length(p);
  float swirl = sin(atan(p.y, p.x) * uArms + t * uSwirl);
  col += tint(t * 0.08) * exp(-reach * uCoreFalloff) * (0.7 + 0.3 * swirl) * uCore;

  float block = max(uDitherScale + sin(t * 0.4) * uDitherScale * 0.75, 1.0);
  float mask = grain(floor(frag / block) * block * 0.3 + t) * uDither;
  col = mix(col, floor(col * uPosterize) / uPosterize, mask);

  col *= 1.0 - smoothstep(uFadeStart, uFadeEnd, reach);
  col = pow(max(col, 0.0), vec3(uGamma)) * uGain;

  float cover = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(col, cover) * uOpacity;
}
`;

const readHex = (value: string, fallback: string) => {
  const raw = String(value ?? "").trim();
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
  if (!match) return fallback;
  const body = match[1];
  return `#${
    body.length === 3
      ? body
          .split("")
          .map((part) => part + part)
          .join("")
      : body
  }`;
};

const subscribeToScreen = () => () => {};

const readScreenDpr = () => window.devicePixelRatio || 1;

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

const NOISE_SIZE = 512;
const NOISE_LATTICE = 4;

let sharedNoise: THREE.DataTexture | null = null;

const noiseTexture = () => {
  if (sharedNoise) return sharedNoise;

  const cells = NOISE_SIZE / NOISE_LATTICE;
  const lattice = new Float32Array(cells * cells);
  for (let i = 0; i < lattice.length; i += 1) {
    let bits = Math.imul(i ^ 0x27d4eb2d, 0x165667b1);
    bits ^= bits >>> 15;
    bits = Math.imul(bits, 0x2545f491);
    lattice[i] = ((bits ^ (bits >>> 13)) >>> 0) / 4294967296;
  }

  const at = (x: number, y: number) =>
    lattice[
      (((y % cells) + cells) % cells) * cells + (((x % cells) + cells) % cells)
    ];

  const pixels = new Uint8Array(NOISE_SIZE * NOISE_SIZE);
  for (let row = 0; row < NOISE_SIZE; row += 1) {
    const gy = row / NOISE_LATTICE;
    const y0 = Math.floor(gy);
    const fy = gy - y0;
    const wy = fy * fy * (3 - 2 * fy);
    for (let col = 0; col < NOISE_SIZE; col += 1) {
      const gx = col / NOISE_LATTICE;
      const x0 = Math.floor(gx);
      const fx = gx - x0;
      const wx = fx * fx * (3 - 2 * fx);
      const lo = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * wx;
      const hi = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * wx;
      pixels[row * NOISE_SIZE + col] = (lo + (hi - lo) * wy) * 255;
    }
  }

  const texture = new THREE.DataTexture(
    pixels,
    NOISE_SIZE,
    NOISE_SIZE,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  sharedNoise = texture;
  return texture;
};

type DriftState = { x: number; y: number; targetX: number; targetY: number };

type FieldProps = Required<
  Omit<
    NeuralFloatProps,
    "width" | "height" | "className" | "children" | "backgroundColor" | "dpr"
  >
> & {
  awake: boolean;
  ceiling: number;
  readDrift: () => DriftState;
};

const FloatField = ({
  awake,
  ceiling,
  readDrift,
  colorCold,
  colorHot,
  strands,
  strandDrift,
  strandWidth,
  haloWidth,
  haloStrength,
  speed,
  zoom,
  rotation,
  turbulence,
  turbulenceScale,
  warp,
  pulseFrequency,
  pulseSpeed,
  segmentFrequency,
  segmentSpeed,
  coreIntensity,
  coreFalloff,
  swirlArms,
  swirlSpeed,
  chromaticAberration,
  posterize,
  dither,
  ditherScale,
  fadeStart,
  fadeEnd,
  gamma,
  brightness,
  opacity,
  cursorInteraction,
  cursorParallax,
  detail,
  adaptiveQuality,
  targetFps,
  paused,
}: FieldProps) => {
  const { invalidate, setDpr, size, viewport } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const elapsed = useRef(0);
  const budget = useRef({
    scale: ceiling,
    frames: 0,
    span: 0,
    wins: 0,
    roof: Infinity,
  });
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const meter = budget.current;
    meter.scale = ceiling;
    meter.roof = Infinity;
    meter.wins = 0;
    setDpr(ceiling);
  }, [ceiling, setDpr]);

  const uniforms = useMemo(
    () => ({
      uViewport: { value: new THREE.Vector2(1, 1) },
      uClock: { value: 0 },
      uCold: { value: new THREE.Color("#2659d9") },
      uHot: { value: new THREE.Color("#d966d9") },
      uStrands: { value: 12 },
      uStrandDrift: { value: 6 },
      uStrandWidth: { value: 45 },
      uHaloWidth: { value: 15 },
      uHaloStrength: { value: 0.5 },
      uZoom: { value: 1 },
      uSpin: { value: 0 },
      uTurbulence: { value: 0.15 },
      uTurbulenceScale: { value: 4 },
      uWarp: { value: 0.05 },
      uPulse: { value: 18 },
      uPulseSpeed: { value: 5 },
      uSegment: { value: 6 },
      uSegmentSpeed: { value: 2 },
      uCore: { value: 1.15 },
      uCoreFalloff: { value: 5 },
      uArms: { value: 3 },
      uSwirl: { value: 3 },
      uChroma: { value: 0.006 },
      uPosterize: { value: 6 },
      uDither: { value: 0.3 },
      uDitherScale: { value: 2 },
      uFadeStart: { value: 0.3 },
      uFadeEnd: { value: 1.2 },
      uGamma: { value: 0.9 },
      uGain: { value: 1 },
      uOpacity: { value: 1 },
      uDrift: { value: new THREE.Vector2(0, 0) },
      uOctaves: { value: 3 },
      uNoise: { value: noiseTexture() },
    }),
    [],
  );

  const cold = useMemo(
    () => new THREE.Color(readHex(colorCold, "#2659d9")),
    [colorCold],
  );
  const hot = useMemo(
    () => new THREE.Color(readHex(colorHot, "#d966d9")),
    [colorHot],
  );

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material || !awake) return;

    if (!paused && !calm) elapsed.current += Math.min(delta, 0.05) * speed;

    const drift = readDrift();
    drift.x += (drift.targetX - drift.x) * 0.06;
    drift.y += (drift.targetY - drift.y) * 0.06;

    const u = material.uniforms;
    u.uViewport.value.set(
      Math.max(size.width, 1) * viewport.dpr,
      Math.max(size.height, 1) * viewport.dpr,
    );
    u.uClock.value = elapsed.current;
    u.uCold.value.copy(cold);
    u.uHot.value.copy(hot);
    u.uStrands.value = clamp(strands, 1, 30);
    u.uStrandDrift.value = clamp(strandDrift, 0, 12);
    u.uStrandWidth.value = Math.max(1, 45 / Math.max(strandWidth, 0.05));
    u.uHaloWidth.value = Math.max(1, 15 / Math.max(haloWidth, 0.05));
    u.uHaloStrength.value = Math.max(haloStrength, 0);
    u.uZoom.value = Math.max(zoom, 0.05);
    u.uSpin.value = (rotation * Math.PI) / 180;
    u.uTurbulence.value = turbulence;
    u.uTurbulenceScale.value = Math.max(turbulenceScale, 0);
    u.uWarp.value = warp;
    u.uPulse.value = pulseFrequency;
    u.uPulseSpeed.value = pulseSpeed;
    u.uSegment.value = segmentFrequency;
    u.uSegmentSpeed.value = segmentSpeed;
    u.uCore.value = Math.max(coreIntensity, 0);
    u.uCoreFalloff.value = Math.max(coreFalloff, 0.01);
    u.uArms.value = swirlArms;
    u.uSwirl.value = swirlSpeed;
    u.uChroma.value = Math.max(chromaticAberration, 0);
    u.uPosterize.value = Math.max(Math.round(posterize), 1);
    u.uDither.value = clamp(dither, 0, 1);
    u.uDitherScale.value = Math.max(ditherScale, 1);
    u.uFadeStart.value = fadeStart;
    u.uFadeEnd.value = Math.max(fadeEnd, fadeStart + 0.01);
    u.uGamma.value = Math.max(gamma, 0.05);
    u.uGain.value = Math.max(brightness, 0);
    u.uOpacity.value = clamp(opacity, 0, 1);
    u.uOctaves.value = clamp(Math.round(detail), 1, 5);
    if (cursorInteraction) {
      u.uDrift.value.set(drift.x * cursorParallax, drift.y * cursorParallax);
    } else {
      u.uDrift.value.set(0, 0);
    }

    const meter = budget.current;
    meter.frames += 1;
    meter.span += delta;
    if (meter.span >= 0.75) {
      const fps = meter.frames / meter.span;
      meter.frames = 0;
      meter.span = 0;
      if (adaptiveQuality && elapsed.current > 0.5) {
        if (fps < targetFps * 0.85 && meter.scale > 0.5) {
          meter.roof = meter.scale;
          meter.scale = Math.max(0.5, meter.scale * 0.75);
          meter.wins = 0;
          setDpr(meter.scale);
        } else if (fps >= targetFps * 0.95 && meter.scale < ceiling) {
          meter.wins += 1;
          const next = Math.min(ceiling, meter.scale * 1.25);
          if (meter.wins >= 3 && next < meter.roof * 0.98) {
            meter.scale = next;
            meter.wins = 0;
            setDpr(next);
          }
        } else {
          meter.wins = 0;
        }
      }
    }

    invalidate();
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={fieldVertex}
        fragmentShader={fieldFragment}
        transparent
        premultipliedAlpha
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

const NeuralFloat = ({
  width = "100%",
  height = "100%",
  className,
  children,
  colorCold = "#2659d9",
  colorHot = "#d966d9",
  backgroundColor = "#0a0a0a",
  strands = 12,
  strandDrift = 6,
  strandWidth = 1,
  haloWidth = 1,
  haloStrength = 0.5,
  speed = 1,
  zoom = 1,
  rotation = 0,
  turbulence = 0.15,
  turbulenceScale = 4,
  warp = 0.05,
  pulseFrequency = 18,
  pulseSpeed = 5,
  segmentFrequency = 6,
  segmentSpeed = 2,
  coreIntensity = 1.15,
  coreFalloff = 5,
  swirlArms = 3,
  swirlSpeed = 3,
  chromaticAberration = 0.006,
  posterize = 6,
  dither = 0.3,
  ditherScale = 2,
  fadeStart = 0.3,
  fadeEnd = 1.2,
  gamma = 0.9,
  brightness = 1,
  opacity = 1,
  cursorInteraction = true,
  cursorParallax = 0.12,
  detail = 3,
  adaptiveQuality = true,
  targetFps = 60,
  dpr = 2,
  paused = false,
}: NeuralFloatProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const drift = useRef<DriftState>({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [awake, setAwake] = useState(false);
  const screenDpr = useSyncExternalStore(
    subscribeToScreen,
    readScreenDpr,
    () => 1,
  );

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const watcher = new IntersectionObserver(
      ([entry]) => setAwake(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  const readDrift = useCallback(() => drift.current, []);

  const aimAt = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const node = rootRef.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    if (!box.width || !box.height) return;
    drift.current.targetX = (event.clientX - box.left) / box.width - 0.5;
    drift.current.targetY = 0.5 - (event.clientY - box.top) / box.height;
  }, []);

  const release = useCallback(() => {
    drift.current.targetX = 0;
    drift.current.targetY = 0;
  }, []);

  const ceiling = useMemo(
    () => clamp(Math.min(screenDpr, dpr), 0.5, 2),
    [screenDpr, dpr],
  );

  return (
    <div
      ref={rootRef}
      className={["neural-float", className].filter(Boolean).join(" ")}
      style={{ width, height, backgroundColor }}
      onPointerMove={cursorInteraction ? aimAt : undefined}
      onPointerLeave={cursorInteraction ? release : undefined}
    >
      <Canvas
        className="neural-float-canvas"
        dpr={ceiling}
        frameloop={awake ? "always" : "demand"}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        orthographic
      >
        <FloatField
          awake={awake}
          ceiling={ceiling}
          readDrift={readDrift}
          colorCold={colorCold}
          colorHot={colorHot}
          strands={strands}
          strandDrift={strandDrift}
          strandWidth={strandWidth}
          haloWidth={haloWidth}
          haloStrength={haloStrength}
          speed={speed}
          zoom={zoom}
          rotation={rotation}
          turbulence={turbulence}
          turbulenceScale={turbulenceScale}
          warp={warp}
          pulseFrequency={pulseFrequency}
          pulseSpeed={pulseSpeed}
          segmentFrequency={segmentFrequency}
          segmentSpeed={segmentSpeed}
          coreIntensity={coreIntensity}
          coreFalloff={coreFalloff}
          swirlArms={swirlArms}
          swirlSpeed={swirlSpeed}
          chromaticAberration={chromaticAberration}
          posterize={posterize}
          dither={dither}
          ditherScale={ditherScale}
          fadeStart={fadeStart}
          fadeEnd={fadeEnd}
          gamma={gamma}
          brightness={brightness}
          opacity={opacity}
          cursorInteraction={cursorInteraction}
          cursorParallax={cursorParallax}
          detail={detail}
          adaptiveQuality={adaptiveQuality}
          targetFps={targetFps}
          paused={paused}
        />
      </Canvas>
      {children ? <div className="neural-float-content">{children}</div> : null}
    </div>
  );
};

export default NeuralFloat;
