// React Bits Pro: NeuralFlash (Starter, -css variant). Licensed via the project's React Bits Pro key.
"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import "./NeuralFlash.css";
export interface NeuralFlashProps {
  speed?: number;
  iterations?: number;
  scale?: number;
  radius?: number;
  edgeSoftness?: number;
  intensity?: number;
  contrast?: number;
  flicker?: number;
  complexity?: number;
  turbulence?: number;
  twist?: number;
  density?: number;
  color?: string;
  hotColor?: string;
  backgroundColor?: string;
  opacity?: number;
  cursorInteraction?: boolean;
  cursorStrength?: number;
  paused?: boolean;
  dpr?: number;
  className?: string;
  children?: ReactNode;
}
const MAX_ITERATIONS = 24;
const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;
const fragmentShader = `
precision highp float;

#define MAX_ITERATIONS ${MAX_ITERATIONS}

varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform vec2 uBend;
uniform float uTime;
uniform int uIterations;
uniform float uScale;
uniform float uRadius;
uniform float uEdge;
uniform float uIntensity;
uniform float uContrast;
uniform float uFlicker;
uniform float uComplexity;
uniform float uTurbulence;
uniform float uTwist;
uniform float uDensity;
uniform float uOpacity;
uniform float uBackgroundAlpha;
uniform vec3 uColor;
uniform vec3 uHot;
uniform vec3 uBackground;

mat2 spin(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}


float storm(vec2 p, float t) {
  float charge = 1.0;
  vec2 ring = vec2(1.0);
  float gain = 0.4;

  for (int i = 0; i < MAX_ITERATIONS; i++) {
    if (i >= uIterations) break;
    float pass = float(i);
    float phase = t + pass;


    vec2 lattice = sin(1.5 * uDensity * p / (0.5 - dot(p, p)) - 9.0 * p.yx + phase);
    float weight = 1.0 + pass * dot(ring, ring);
    charge += (1.0 + cos(t) * uFlicker) * 0.2 / length(weight * lattice);


    gain += 0.065 * uComplexity;
    ring = cos(phase + 1.0 - 22.0 * p * pow(gain, pass)) - 5.0 * p;



    float a = pass + 0.02 * t;
    p = mat2(cos(a), cos(a - 11.0), cos(a - 33.0), cos(a)) * p;
    if (uTwist != 0.0) p = spin(uTwist * 0.25 * pass) * p;
    vec2 pull = tanh(40.0 * dot(p, p) * cos(100.0 * p.yx + phase)) / 300.0;
    p += pull * uTurbulence + 0.2 * gain * p;
    p += cos(4.0 / exp(charge * charge / 800.0) + phase) / 900.0;
  }


  return 30.0 / (min(charge, 30.0) + 164.0 / charge) - dot(p, p) / 250.0;
}

void main() {
  vec2 frag = vUv * uResolution;
  vec2 uv = (2.0 * frag - uResolution) / uResolution.y;
  uv -= uCenter;


  vec2 toBend = uv - uBend;
  float lens = exp(-dot(toBend, toBend) * 6.0);
  uv += toBend * lens * 0.35 * length(uBend);

  vec2 p = uv * 0.5 * uScale;

  float mask = smoothstep(0.0, uEdge, 1.0 - length(uv) / max(2.0 * uRadius, 0.001));
  float energy = mask > 0.001 ? storm(p, uTime) * mask : 0.0;


  float bgLum = dot(uBackground, vec3(0.299, 0.587, 0.114));
  float light = uBackgroundAlpha * smoothstep(0.45, 0.75, bgLum);


  energy = pow(max(energy, 0.0), mix(0.7, 1.4, light)) * uIntensity;

  vec3 glow = mix(uColor * energy, uColor, light);
  float bloom = smoothstep(0.7, 1.0 + 1.5 / max(uContrast, 0.05), energy);


  float hotLum = dot(uHot, vec3(0.299, 0.587, 0.114));
  vec3 hot = mix(uHot, uColor * 0.3, light * step(bgLum, hotLum));
  glow = mix(glow, hot * max(energy, 1.0), bloom);

  float cover = clamp(energy, 0.0, 1.0);
  vec3 color = mix(uBackground, glow, cover);
  float alpha = max(uBackgroundAlpha, cover) * uOpacity;
  gl_FragColor = vec4(mix(uBackground, color, uOpacity), alpha);
}
`;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const isTransparent = (value: string) =>
  value === "transparent" || value === "none" || value === "";
const makeColor = (value: string, fallback: string) => {
  const color = new THREE.Color();
  try {
    color.setStyle(value, THREE.LinearSRGBColorSpace);
  } catch {
    color.setStyle(fallback, THREE.LinearSRGBColorSpace);
  }
  return color;
};
const updateColor = (color: THREE.Color, value: string) => {
  try {
    color.setStyle(value, THREE.LinearSRGBColorSpace);
  } catch {
    return;
  }
};
const subscribeToDpr = (notify: () => void) => {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(min-resolution: 2dppx)");
  media.addEventListener("change", notify);
  window.addEventListener("resize", notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener("resize", notify);
  };
};
const readDpr = () =>
  typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
interface StormProps {
  speed: number;
  iterations: number;
  scale: number;
  radius: number;
  edgeSoftness: number;
  intensity: number;
  contrast: number;
  flicker: number;
  complexity: number;
  turbulence: number;
  twist: number;
  density: number;
  color: string;
  hotColor: string;
  backgroundColor: string;
  opacity: number;
  cursorInteraction: boolean;
  cursorStrength: number;
  paused: boolean;
  readPointer: () => {
    x: number;
    y: number;
    active: boolean;
  };
}
const Storm = ({
  speed,
  iterations,
  scale,
  radius,
  edgeSoftness,
  intensity,
  contrast,
  flicker,
  complexity,
  turbulence,
  twist,
  density,
  color,
  hotColor,
  backgroundColor,
  opacity,
  cursorInteraction,
  cursorStrength,
  paused,
  readPointer,
}: StormProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const center = useRef({ x: 0, y: 0 });
  const bend = useRef({ x: 0, y: 0 });
  const { gl, size, invalidate } = useThree();
  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: new THREE.Vector2(0, 0) },
      uBend: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uIterations: { value: 14 },
      uScale: { value: 1 },
      uRadius: { value: 1 },
      uEdge: { value: 1 },
      uIntensity: { value: 1 },
      uContrast: { value: 1 },
      uFlicker: { value: 0.1 },
      uComplexity: { value: 1 },
      uTurbulence: { value: 1 },
      uTwist: { value: 1 },
      uDensity: { value: 1 },
      uOpacity: { value: 1 },
      uBackgroundAlpha: { value: 1 },
      uColor: { value: makeColor("#475eff", "#475eff") },
      uHot: { value: makeColor("#ffffff", "#ffffff") },
      uBackground: { value: makeColor("#000000", "#000000") },
    }),
    [],
  );
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    const values = material.uniforms;
    updateColor(values.uColor.value, color);
    updateColor(values.uHot.value, hotColor);
    const transparent = isTransparent(backgroundColor);
    values.uBackgroundAlpha.value = transparent ? 0 : 1;
    if (!transparent) updateColor(values.uBackground.value, backgroundColor);
    invalidate();
  }, [color, hotColor, backgroundColor, invalidate]);
  useEffect(() => {
    invalidate();
  }, [
    iterations,
    scale,
    radius,
    edgeSoftness,
    intensity,
    contrast,
    flicker,
    complexity,
    turbulence,
    twist,
    density,
    opacity,
    invalidate,
  ]);
  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const frame = Math.min(delta, 0.05);
    if (!paused) elapsed.current += frame * speed;
    const target = readPointer();
    const reach = cursorInteraction && target.active ? cursorStrength : 0;
    const follow = 1 - Math.exp(-frame * 5);
    const centerX = target.x * 0.25 * reach;
    const centerY = target.y * 0.25 * reach;
    center.current.x += (centerX - center.current.x) * follow;
    center.current.y += (centerY - center.current.y) * follow;
    bend.current.x += (target.x * 0.6 * reach - bend.current.x) * follow;
    bend.current.y += (target.y * 0.6 * reach - bend.current.y) * follow;
    if (
      paused &&
      Math.hypot(centerX - center.current.x, centerY - center.current.y) > 0.001
    ) {
      invalidate();
    }
    const pixelRatio = gl.getPixelRatio();
    const values = material.uniforms;
    values.uResolution.value.set(
      size.width * pixelRatio,
      size.height * pixelRatio,
    );
    values.uCenter.value.set(center.current.x, center.current.y);
    values.uBend.value.set(bend.current.x, bend.current.y);
    values.uTime.value = elapsed.current;
    values.uIterations.value = Math.round(clamp(iterations, 2, MAX_ITERATIONS));
    values.uScale.value = Math.max(scale, 0.05);
    values.uRadius.value = Math.max(radius, 0.05);
    values.uEdge.value = clamp(edgeSoftness, 0.01, 1);
    values.uIntensity.value = Math.max(intensity, 0);
    values.uContrast.value = Math.max(contrast, 0);
    values.uFlicker.value = clamp(flicker, 0, 1);
    values.uComplexity.value = Math.max(complexity, 0);
    values.uTurbulence.value = Math.max(turbulence, 0);
    values.uTwist.value = twist;
    values.uDensity.value = Math.max(density, 0.05);
    values.uOpacity.value = clamp(opacity, 0, 1);
  });
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};
export const NeuralFlash = ({
  speed = 0.6,
  iterations = 12,
  scale = 1,
  radius = 0.9,
  edgeSoftness = 1,
  intensity = 1.1,
  contrast = 2,
  flicker = 0.6,
  complexity = 1,
  turbulence = 2,
  twist = 0,
  density = 1.5,
  color = "#475eff",
  hotColor = "#ffffff",
  backgroundColor = "#000000",
  opacity = 1,
  cursorInteraction = true,
  cursorStrength = 0.5,
  paused = false,
  dpr = 1.25,
  className,
  children,
}: NeuralFlashProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const [visible, setVisible] = useState(true);
  const reducedMotion = useReducedMotion();
  const deviceDpr = useSyncExternalStore(subscribeToDpr, readDpr, () => 1);
  const pixelRatio = Math.min(deviceDpr, Math.max(dpr, 0.5));
  const readPointer = useCallback(() => pointerRef.current, []);
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const node = rootRef.current;
    if (!node || !cursorInteraction) return;
    const handlePointerMove = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      pointerRef.current.x =
        ((event.clientX - bounds.left) * 2 - bounds.width) / bounds.height;
      pointerRef.current.y =
        (bounds.height - (event.clientY - bounds.top) * 2) / bounds.height;
      pointerRef.current.active = true;
    };
    const resetPointer = () => {
      pointerRef.current.active = false;
    };
    node.addEventListener("pointermove", handlePointerMove);
    node.addEventListener("pointerleave", resetPointer);
    return () => {
      node.removeEventListener("pointermove", handlePointerMove);
      node.removeEventListener("pointerleave", resetPointer);
    };
  }, [cursorInteraction]);
  const still = paused || Boolean(reducedMotion);
  return (
    <div
      ref={rootRef}
      className={["neural-flash", className].filter(Boolean).join(" ")}
    >
      <div className="neural-flash-canvas">
        <Canvas
          orthographic
          dpr={pixelRatio}
          frameloop={visible && !still ? "always" : "demand"}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <Storm
            speed={speed}
            iterations={iterations}
            scale={scale}
            radius={radius}
            edgeSoftness={edgeSoftness}
            intensity={intensity}
            contrast={contrast}
            flicker={flicker}
            complexity={complexity}
            turbulence={turbulence}
            twist={twist}
            density={density}
            color={color}
            hotColor={hotColor}
            backgroundColor={backgroundColor}
            opacity={opacity}
            cursorInteraction={cursorInteraction}
            cursorStrength={cursorStrength}
            paused={still}
            readPointer={readPointer}
          />
        </Canvas>
      </div>
      {children ? <div className="neural-flash-content">{children}</div> : null}
    </div>
  );
};
export default NeuralFlash;
