// React Bits Pro: SignalType (Starter, -css variant). Licensed via the project's React Bits Pro key.
"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type Ref,
} from "react";
import "./SignalType.css";

export type SignalTypeUnlit = "outline" | "dim" | "none";
export type SignalTypeOrder = "random" | "start" | "center" | "end";
export type SignalTypeTrigger = "mount" | "view" | "hover" | "manual";
export type SignalTypeTag = "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface SignalTypeProps {
  text?: string;
  as?: SignalTypeTag;
  color?: string;
  glowColor?: string;
  unlit?: SignalTypeUnlit;
  outlineWidth?: number;
  outlineOpacity?: number;
  glow?: number;
  glowSize?: number;
  flash?: number;
  flickers?: number;
  speed?: number;
  stagger?: number;
  delay?: number;
  order?: SignalTypeOrder;
  trigger?: SignalTypeTrigger;
  interference?: number;
  interferenceRadius?: number;
  clickCycle?: boolean;
  instability?: number;
  loop?: boolean;
  loopDelay?: number;
  seed?: number;
  paused?: boolean;
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

export interface SignalTypeHandle {
  ignite: () => void;
  cycle: () => void;
  powerDown: () => void;
}

interface Step {
  at: number;
  level: number;
  flash?: number;
}

interface Glyph {
  node: HTMLElement;
  base: HTMLElement;
  fill: HTMLElement;
  glow: HTMLElement;
  level: number;
  busyUntil: number;
  x: number;
  y: number;
}

interface Settings {
  glow: number;
  flash: number;
  flickers: number;
  speed: number;
  stagger: number;
  delay: number;
  order: SignalTypeOrder;
  trigger: SignalTypeTrigger;
  interference: number;
  interferenceRadius: number;
  clickCycle: boolean;
  instability: number;
  loop: boolean;
  loopDelay: number;
  seed: number;
  onComplete?: () => void;
}

interface Controller {
  ignite: () => void;
  cycle: (x?: number, y?: number) => void;
  powerDown: () => void;
  refresh: () => void;
  destroy: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const segment = (value: string) =>
  typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined"
    ? Array.from(value)
    : Array.from(
        new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
        (part) => part.segment,
      );

const splitWords = (value: string) =>
  value
    .split(/(\s+)/)
    .filter((part) => part.length > 0)
    .map((part) => ({ value: part, space: /^\s+$/.test(part), glyphs: segment(part) }));

const random = (seed: number) => {
  let state = (Math.floor(seed * 7919) ^ 0x5bd1e995) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const steadyGlow = (glow: number) => clamp(glow * 0.45, 0, 1);

const hiddenStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const defsStyle: CSSProperties = {
  position: "absolute",
  width: 0,
  height: 0,
  overflow: "hidden",
  pointerEvents: "none",
};

const spaceStyle: CSSProperties = { whiteSpace: "pre-wrap" };

const wordStyle: CSSProperties = { display: "inline-block", whiteSpace: "nowrap" };

const glyphStyle: CSSProperties = { position: "relative", display: "inline-block" };

const layerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
};

const fillFrames = (from: number, steps: Step[], total: number) => {
  const frames: Keyframe[] = [{ opacity: from, offset: 0 }];
  let level = from;
  for (const step of steps) {
    const offset = clamp(step.at / total, 0, 1);
    frames.push({ opacity: level, offset });
    frames.push({ opacity: step.level, offset });
    level = step.level;
  }
  frames.push({ opacity: level, offset: 1 });
  return frames;
};

const glowFrames = (
  from: number,
  steps: Step[],
  total: number,
  steady: number,
  flash: number,
) => {
  const frames: Keyframe[] = [{ opacity: from, offset: 0 }];
  let current = from;
  steps.forEach((step, index) => {
    const next = index + 1 < steps.length ? steps[index + 1].at : total;
    const offset = clamp(step.at / total, 0, 1);
    frames.push({ opacity: current, offset });
    if (step.level <= 0) {
      frames.push({ opacity: 0, offset });
      current = 0;
      return;
    }
    const rest = step.level * steady;
    const peak = clamp(rest + step.level * flash * 0.55 * (step.flash ?? 1), 0, 1);
    frames.push({ opacity: peak, offset });
    current = peak;
    for (const lag of [0.03, 0.07, 0.13, 0.22, 0.36]) {
      if (step.at + lag >= next) break;
      current = rest + (peak - rest) * Math.exp(-lag / 0.09);
      frames.push({ opacity: current, offset: clamp((step.at + lag) / total, 0, 1) });
    }
  });
  const last = steps[steps.length - 1];
  frames.push({ opacity: last ? last.level * steady : current, offset: 1 });
  return frames;
};

const ignition = (
  next: () => number,
  start: number,
  flickers: number,
  speed: number,
) => {
  const steps: Step[] = [];
  let at = start;
  const count = Math.round(flickers * (0.4 + next() * 0.9));
  for (let k = 0; k < count; k++) {
    const on = (0.02 + next() * 0.06) / speed;
    const gap = (0.035 + next() * 0.13) / speed;
    const level = next() < 0.3 ? 0.28 + next() * 0.32 : 0.7 + next() * 0.3;
    steps.push({ at, level, flash: 0.55 });
    steps.push({ at: at + on, level: 0 });
    at += on + gap;
  }
  steps.push({ at, level: 1, flash: 1 });
  return steps;
};

const stutter = (next: () => number, speed: number, loose: boolean) => {
  const steps: Step[] = [];
  let at = 0;
  const count = loose ? 2 + Math.floor(next() * 3) : 1 + Math.floor(next() * 2);
  for (let k = 0; k < count; k++) {
    const off = ((loose ? 0.04 : 0.025) + next() * (loose ? 0.12 : 0.05)) / speed;
    const on = (0.02 + next() * 0.05) / speed;
    steps.push({ at, level: 0 });
    at += off;
    const final = k === count - 1;
    steps.push({ at, level: final ? 1 : next() < 0.45 ? 0.35 + next() * 0.3 : 1, flash: final ? 0.7 : 0.45 });
    at += on;
  }
  return steps;
};

const createController = (
  root: HTMLElement,
  read: () => Settings,
): Controller => {
  const glyphs: Glyph[] = Array.from(
    root.querySelectorAll<HTMLElement>("[data-signal-glyph]"),
  ).map((node) => ({
    node,
    base: node.querySelector<HTMLElement>("[data-signal-base]") as HTMLElement,
    fill: node.querySelector<HTMLElement>("[data-signal-fill]") as HTMLElement,
    glow: node.querySelector<HTMLElement>("[data-signal-glow]") as HTMLElement,
    level: 0,
    busyUntil: 0,
    x: 0,
    y: 0,
  }));
  const timers = new Set<number>();
  const chance = Math.random;
  let stale = true;
  let visible = false;
  let lit = false;
  let pointerX = 0;
  let pointerY = 0;
  let pointerTime = 0;
  let idleTimer = 0;

  const later = (task: () => void, seconds: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      task();
    }, Math.max(0, seconds * 1000));
    timers.add(id);
  };

  const measure = () => {
    if (!stale) return;
    stale = false;
    for (const glyph of glyphs) {
      const box = glyph.node.getBoundingClientRect();
      glyph.x = box.left + box.width / 2;
      glyph.y = box.top + box.height / 2;
    }
  };

  const play = (glyph: Glyph, steps: Step[], settle = 0.45) => {
    if (steps.length === 0) return 0;
    const settings = read();
    const steady = steadyGlow(settings.glow);
    const flash = clamp(settings.flash, 0, 3);
    const fromFill = Number.parseFloat(getComputedStyle(glyph.fill).opacity) || 0;
    const fromGlow = Number.parseFloat(getComputedStyle(glyph.glow).opacity) || 0;
    for (const layer of [glyph.base, glyph.fill, glyph.glow]) {
      layer.getAnimations().forEach((animation) => animation.cancel());
    }
    const final = steps[steps.length - 1].level;
    const total = Math.max(steps[steps.length - 1].at + (final > 0 ? settle : 0.05), 0.05);
    const frames = fillFrames(fromFill, steps, total);
    glyph.base.style.opacity = String(1 - final);
    glyph.fill.style.opacity = String(final);
    glyph.glow.style.opacity = String(final * steady);
    glyph.base.animate(
      frames.map((frame) => ({ ...frame, opacity: 1 - Number(frame.opacity) })),
      { duration: total * 1000, easing: "linear" },
    );
    glyph.fill.animate(frames, {
      duration: total * 1000,
      easing: "linear",
    });
    glyph.glow.animate(glowFrames(fromGlow, steps, total, steady, flash), {
      duration: total * 1000,
      easing: "linear",
    });
    glyph.level = final;
    glyph.busyUntil = performance.now() + total * 1000;
    return total;
  };

  const ranks = (settings: Settings) => {
    const count = glyphs.length;
    if (settings.order === "random") {
      const next = random(settings.seed + 0.37);
      const order = glyphs.map((_, index) => index);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const rank = new Array<number>(count);
      order.forEach((glyph, position) => {
        rank[glyph] = position;
      });
      return rank;
    }
    return glyphs.map((_, index) =>
      settings.order === "end"
        ? count - 1 - index
        : settings.order === "center"
          ? Math.abs(index - (count - 1) / 2)
          : index,
    );
  };

  const scheduleIdle = () => {
    window.clearTimeout(idleTimer);
    const settings = read();
    if (settings.instability <= 0) return;
    const wait = -Math.log(1 - chance()) * (5 / clamp(settings.instability, 0.05, 3));
    idleTimer = window.setTimeout(() => {
      const now = performance.now();
      if (lit && visible && document.visibilityState === "visible") {
        const candidates = glyphs.filter((glyph) => glyph.level >= 1 && glyph.busyUntil < now);
        const glyph = candidates[Math.floor(chance() * candidates.length)];
        if (glyph) play(glyph, stutter(chance, read().speed, true), 0.3);
      }
      scheduleIdle();
    }, wait * 1000);
  };

  const ignite = () => {
    const settings = read();
    const next = random(settings.seed);
    const rank = ranks(settings);
    const speed = clamp(settings.speed, 0.1, 5);
    const stagger = clamp(settings.stagger, 0, 1);
    let longest = 0;
    lit = true;
    glyphs.forEach((glyph, index) => {
      const start =
        clamp(settings.delay, 0, 30) + rank[index] * stagger + next() * stagger * 0.8;
      longest = Math.max(
        longest,
        play(glyph, ignition(next, start, clamp(settings.flickers, 0, 12), speed)),
      );
    });
    later(() => {
      read().onComplete?.();
      if (read().loop) later(() => cycle(), clamp(read().loopDelay, 0.5, 60));
    }, longest);
  };

  const cycle = (x?: number, y?: number) => {
    const settings = read();
    const next = random(settings.seed + performance.now());
    const speed = clamp(settings.speed, 0.1, 5);
    measure();
    const originX = x ?? (glyphs[0]?.x ?? 0) - 1;
    const originY = y ?? glyphs[0]?.y ?? 0;
    let longest = 0;
    lit = true;
    glyphs.forEach((glyph) => {
      const reach = Math.hypot(glyph.x - originX, glyph.y - originY);
      const off = reach / 1600 / speed;
      const dark = (0.12 + next() * 0.22) / speed;
      const steps = [
        { at: off, level: 0 },
        ...ignition(next, off + dark, clamp(settings.flickers, 0, 12) * 0.7, speed),
      ];
      longest = Math.max(longest, play(glyph, steps));
    });
    later(() => {
      if (read().loop) later(() => cycle(), clamp(read().loopDelay, 0.5, 60));
    }, longest);
  };

  const powerDown = () => {
    const settings = read();
    const next = random(settings.seed + 11.3);
    const rank = ranks(settings);
    const speed = clamp(settings.speed, 0.1, 5);
    const stagger = clamp(settings.stagger, 0, 1) * 0.5;
    lit = false;
    glyphs.forEach((glyph, index) => {
      const at = rank[index] * stagger + next() * stagger;
      const blink = next() < 0.5;
      const steps: Step[] = blink
        ? [
            { at, level: 0 },
            { at: at + 0.05 / speed, level: 0.45, flash: 0.3 },
            { at: at + 0.09 / speed, level: 0 },
          ]
        : [{ at, level: 0 }];
      play(glyph, steps);
    });
  };

  const refresh = () => {
    const steady = steadyGlow(read().glow);
    const now = performance.now();
    for (const glyph of glyphs) {
      if (glyph.busyUntil < now) glyph.glow.style.opacity = String(glyph.level * steady);
    }
  };

  const onMove = (event: PointerEvent) => {
    const settings = read();
    const now = performance.now();
    const elapsed = Math.max((now - pointerTime) / 1000, 1 / 240);
    const velocity =
      pointerTime > 0 ? Math.hypot(event.clientX - pointerX, event.clientY - pointerY) / elapsed : 0;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerTime = now;
    if (!lit || settings.interference <= 0 || event.pointerType === "touch") return;
    measure();
    const radius = Math.max(settings.interferenceRadius, 4);
    for (const glyph of glyphs) {
      if (glyph.level < 1 || glyph.busyUntil > now) continue;
      const reach = Math.hypot(glyph.x - pointerX, glyph.y - pointerY) / radius;
      if (reach >= 1) continue;
      const falloff = (1 - reach) * (1 - reach);
      const odds = settings.interference * falloff * clamp(velocity / 900, 0, 1.6) * 0.35;
      if (chance() < odds) play(glyph, stutter(chance, settings.speed, false), 0.3);
    }
  };

  const onEnter = () => {
    stale = true;
    pointerTime = 0;
    if (read().trigger === "hover") ignite();
  };

  const onLeave = () => {
    pointerTime = 0;
    if (read().trigger === "hover") powerDown();
  };

  const onDown = (event: PointerEvent) => {
    if (!read().clickCycle || !lit) return;
    stale = true;
    cycle(event.clientX, event.clientY);
  };

  const invalidate = () => {
    stale = true;
  };

  const observer =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !lit && read().trigger === "view") ignite();
          },
          { threshold: 0.25 },
        );
  observer?.observe(root);
  if (!observer) visible = true;

  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerenter", onEnter, { passive: true });
  root.addEventListener("pointerleave", onLeave, { passive: true });
  root.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("scroll", invalidate, { passive: true, capture: true });
  window.addEventListener("resize", invalidate, { passive: true });

  const trigger = read().trigger;
  if (trigger === "mount" || (trigger === "view" && !observer)) ignite();
  scheduleIdle();

  return {
    ignite,
    cycle,
    powerDown,
    refresh,
    destroy: () => {
      observer?.disconnect();
      window.clearTimeout(idleTimer);
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", invalidate, { capture: true });
      window.removeEventListener("resize", invalidate);
      for (const glyph of glyphs) {
        for (const layer of [glyph.base, glyph.fill, glyph.glow]) {
          layer.getAnimations().forEach((animation) => animation.cancel());
        }
      }
    },
  };
};

export const SignalType = forwardRef<SignalTypeHandle, SignalTypeProps>(
  function SignalType(
    {
      text = "Open to possibility",
      as: Tag = "span",
      color = "currentColor",
      glowColor = "#8B5CF6",
      unlit = "outline",
      outlineWidth = 1,
      outlineOpacity = 0.28,
      glow = 0.6,
      glowSize = 1,
      flash = 1,
      flickers = 3,
      speed = 1,
      stagger = 0.045,
      delay = 0.15,
      order = "random",
      trigger = "view",
      interference = 1,
      interferenceRadius = 90,
      clickCycle = true,
      instability = 0.3,
      loop = false,
      loopDelay = 6,
      seed = 0,
      paused = false,
      onComplete,
      className,
      style,
    },
    ref,
  ) {
    const rootRef = useRef<HTMLElement>(null);
    const controllerRef = useRef<Controller | null>(null);
    const filterId = `signal-outline-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
    const still = reduced || paused;
    const words = useMemo(() => splitWords(text), [text]);
    const settings: Settings = {
      glow,
      flash,
      flickers,
      speed,
      stagger,
      delay,
      order,
      trigger,
      interference,
      interferenceRadius,
      clickCycle,
      instability,
      loop,
      loopDelay,
      seed,
      onComplete,
    };
    const settingsRef = useRef(settings);

    useEffect(() => {
      settingsRef.current = settings;
    });

    useEffect(() => {
      const root = rootRef.current;
      if (!root || still) return;
      const controller = createController(root, () => settingsRef.current);
      controllerRef.current = controller;
      return () => {
        controller.destroy();
        if (controllerRef.current === controller) controllerRef.current = null;
      };
    }, [text, still, trigger, unlit]);

    useEffect(() => {
      controllerRef.current?.refresh();
    }, [glow]);

    useImperativeHandle(
      ref,
      () => ({
        ignite: () => controllerRef.current?.ignite(),
        cycle: () => controllerRef.current?.cycle(),
        powerDown: () => controllerRef.current?.powerDown(),
      }),
      [],
    );

    const tint = `color-mix(in srgb, ${color} ${Math.round(clamp(outlineOpacity, 0, 1) * 100)}%, transparent)`;
    const size = clamp(glowSize, 0, 4);
    const baseStyle: CSSProperties =
      unlit === "outline"
        ? { WebkitTextFillColor: "#000", filter: `url(#${filterId})`, opacity: still ? 0 : 1 }
        : { WebkitTextFillColor: unlit === "dim" ? tint : "transparent", opacity: still ? 0 : 1 };
    const glowStyle: CSSProperties = {
      ...layerStyle,
      WebkitTextFillColor: "transparent",
      textShadow: `0 0 ${(0.05 * size).toFixed(3)}em ${glowColor}, 0 0 ${(0.24 * size).toFixed(3)}em ${glowColor}`,
      opacity: still ? steadyGlow(glow) : 0,
    };
    const fillStyle: CSSProperties = { ...layerStyle, color, opacity: still ? 1 : 0 };

    return (
      <Tag
        ref={
          rootRef as Ref<
            HTMLSpanElement &
              HTMLDivElement &
              HTMLParagraphElement &
              HTMLHeadingElement
          >
        }
        className={["signal-type", className].filter(Boolean).join(" ")}
        style={style}
      >
        <span style={hiddenStyle}>{text}</span>
        {unlit === "outline" ? (
          <svg
            aria-hidden="true"
            width="0"
            height="0"
            focusable="false"
            style={color === "currentColor" ? defsStyle : { ...defsStyle, color }}
          >
            <filter
              id={filterId}
              x="-25%"
              y="-25%"
              width="150%"
              height="150%"
              colorInterpolationFilters="sRGB"
            >
              <feMorphology
                in="SourceAlpha"
                operator="dilate"
                radius={clamp(outlineWidth, 0, 8)}
                result="grown"
              />
              <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
              <feFlood floodColor="currentColor" floodOpacity={clamp(outlineOpacity, 0, 1)} />
              <feComposite in2="ring" operator="in" />
            </filter>
          </svg>
        ) : null}
        <span aria-hidden="true" key={text}>
          {words.map((word, wordIndex) =>
            word.space ? (
              <span key={wordIndex} style={spaceStyle}>
                {word.value}
              </span>
            ) : (
              <span key={wordIndex} style={wordStyle}>
                {word.glyphs.map((glyph, glyphIndex) => (
                  <span key={glyphIndex} style={glyphStyle} data-signal-glyph="">
                    <span data-signal-base="" style={baseStyle}>
                      {glyph}
                    </span>
                    <span data-signal-glow="" style={glowStyle}>
                      {glyph}
                    </span>
                    <span data-signal-fill="" style={fillStyle}>
                      {glyph}
                    </span>
                  </span>
                ))}
              </span>
            ),
          )}
        </span>
      </Tag>
    );
  },
);

export default SignalType;
